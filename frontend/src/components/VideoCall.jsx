import { useEffect, useRef, useState, useCallback } from 'react';
import { getSocket } from '../services/socket';
import { logConnectionMode } from '../services/api';

const ICE_SERVERS = [{ urls: 'stun:stun.l.google.com:19302' }];
const STATS_INTERVAL_MS = 5000;
const PACKET_LOSS_DOWNGRADE_THRESHOLD = 0.08; // 8% loss -> step down

// Adaptive Mode is the platform's core differentiator: instead of a call
// simply freezing or failing on a poor connection, it steps down through
// video -> audio -> text automatically, always tells the user WHY, and
// lets them override manually at any time.
export default function VideoCall({ roomCode, onModeChange, onChatMessage }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const pcRef = useRef(null);
  const localStreamRef = useRef(null);
  const socketRef = useRef(null);

  const [mode, setModeState] = useState('video'); // 'video' | 'audio' | 'text'
  const [peerMode, setPeerMode] = useState(null);
  const [joined, setJoined] = useState(false);
  const [connectionNote, setConnectionNote] = useState('');
  const [error, setError] = useState('');
  
  // The <video> element only exists in the DOM once `joined` becomes true,
  // but getUserMedia() runs before that render happens - so attaching the
  // stream immediately after getUserMedia would target a ref that's still
  // null. This effect re-attaches the stream once the element has mounted.
  useEffect(() => {
    if (joined && localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [joined]);

  const setMode = useCallback(
    (newMode, reason) => {
      setModeState(newMode);
      setConnectionNote(reason);
      onModeChange?.(newMode, reason);
      logConnectionMode(roomCode, newMode).catch(() => {});
      socketRef.current?.emit('mode-change', { roomCode, mode: newMode, reason });
    },
    [roomCode, onModeChange]
  );

  const applyModeToTracks = useCallback((newMode) => {
    const stream = localStreamRef.current;
    if (!stream) return;
    stream.getVideoTracks().forEach((t) => (t.enabled = newMode === 'video'));
    stream.getAudioTracks().forEach((t) => (t.enabled = newMode !== 'text'));
  }, []);

  function manualSetMode(newMode) {
    applyModeToTracks(newMode);
    setMode(newMode, 'Manually changed by you.');
  }

  async function joinCall() {
    setError('');
    const socket = getSocket();
    socketRef.current = socket;

    // Detect starting mode from the browser's own network hint, if
    // available, so we don't even attempt video on a connection that
    // clearly can't sustain it.
    const conn = navigator.connection || navigator.webkitConnection;
    let startMode = 'video';
    if (conn) {
      if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') startMode = 'text';
      else if (conn.effectiveType === '3g') startMode = 'audio';
    }

    try {
      if (startMode !== 'text') {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: startMode === 'video',
          audio: true,
        });
              localStreamRef.current = stream;
      }
    } catch (err) {
      setError('Could not access camera/microphone. Continuing in text mode.');
      startMode = 'text';
    }

    setModeState(startMode);
    if (startMode !== 'text') {
      setupPeerConnection(socket);
    }

    socket.emit('join-room', roomCode);
    setJoined(true);

    socket.on('peer-joined', async () => {
      if (pcRef.current && startMode !== 'text') {
        const offer = await pcRef.current.createOffer();
        await pcRef.current.setLocalDescription(offer);
        socket.emit('signal', { roomCode, data: pcRef.current.localDescription });
      }
    });

    socket.on('signal', async (data) => {
      if (!pcRef.current) return;
      if (data.type === 'offer') {
        await pcRef.current.setRemoteDescription(data);
        const answer = await pcRef.current.createAnswer();
        await pcRef.current.setLocalDescription(answer);
        socket.emit('signal', { roomCode, data: pcRef.current.localDescription });
      } else if (data.type === 'answer') {
        await pcRef.current.setRemoteDescription(data);
      } else if (data.candidate) {
        try {
          await pcRef.current.addIceCandidate(data);
        } catch (e) { /* benign if candidate arrives after teardown */ }
      }
    });

    socket.on('peer-mode-change', ({ mode: pMode }) => setPeerMode(pMode));
    socket.on('chat-message', (msg) => onChatMessage?.(msg));
    socket.on('peer-left', () => setPeerMode('left'));

    if (startMode !== 'text') startStatsMonitor();
  }

  function setupPeerConnection(socket) {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });
    pcRef.current = pc;

    localStreamRef.current?.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current));

    pc.onicecandidate = (e) => {
      if (e.candidate) socket.emit('signal', { roomCode, data: e.candidate });
    };
    pc.ontrack = (e) => {
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = e.streams[0];
    };
  }

  // Polls WebRTC stats every few seconds and steps the mode down if packet
  // loss is high - this is the "automatic quality adaptation" behaviour
  // from the research doc, not just a one-time check at join.
  function startStatsMonitor() {
    const interval = setInterval(async () => {
      const pc = pcRef.current;
      if (!pc || mode === 'text') return;
      try {
        const stats = await pc.getStats();
        let lost = 0, received = 0;
        stats.forEach((report) => {
          if (report.type === 'inbound-rtp' && !report.isRemote) {
            lost += report.packetsLost || 0;
            received += report.packetsReceived || 0;
          }
        });
        const total = lost + received;
        if (total > 20) {
          const lossRatio = lost / total;
          if (lossRatio > PACKET_LOSS_DOWNGRADE_THRESHOLD && mode === 'video') {
            applyModeToTracks('audio');
            setMode('audio', `Switched to audio to keep the call stable (${Math.round(lossRatio * 100)}% packet loss detected).`);
          } else if (lossRatio > PACKET_LOSS_DOWNGRADE_THRESHOLD * 2 && mode === 'audio') {
            setMode('text', 'Connection too unstable for audio — switched to text so you can keep communicating.');
            clearInterval(interval);
          }
        }
      } catch { /* stats not available yet, skip this tick */ }
    }, STATS_INTERVAL_MS);
    return () => clearInterval(interval);
  }

  function leaveCall() {
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    pcRef.current?.close();
    socketRef.current?.emit('leave-room', roomCode);
    setJoined(false);
  }

  useEffect(() => {
    return () => leaveCall();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      {error && <div className="error-banner">{error}</div>}

      {!joined ? (
        <button className="btn btn-primary" onClick={joinCall}>Join consultation</button>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap' }}>
            <ModePill mode={mode} note={connectionNote} />
            {peerMode && peerMode !== 'left' && (
              <span style={{ fontSize: '0.8rem', color: '#5B6472' }}>The other participant is in {peerMode} mode.</span>
            )}
            {peerMode === 'left' && <span style={{ fontSize: '0.8rem', color: '#B3432B' }}>The other participant left the call.</span>}
          </div>

          {mode !== 'text' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '1rem' }}>
              <video ref={localVideoRef} autoPlay playsInline muted style={styles.video} />
              <video ref={remoteVideoRef} autoPlay playsInline style={styles.video} />
            </div>
          )}
          {mode === 'text' && (
            <div className="card" style={{ marginBottom: '1rem', background: '#F7F4EC' }}>
              <p style={{ margin: 0 }}>
                In text mode — video/audio paused to protect the connection. Use the async update panel below to
                keep communicating; it will sync as soon as the connection improves.
              </p>
            </div>
          )}

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn" style={{ background: '#FBEFD7', color: '#12253F' }} onClick={() => manualSetMode('video')} disabled={mode === 'video'}>Video</button>
            <button className="btn" style={{ background: '#FBEFD7', color: '#12253F' }} onClick={() => manualSetMode('audio')} disabled={mode === 'audio'}>Audio only</button>
            <button className="btn" style={{ background: '#FBEFD7', color: '#12253F' }} onClick={() => manualSetMode('text')} disabled={mode === 'text'}>Text only</button>
            <button className="btn" style={{ background: '#FBEAE5', color: '#B3432B' }} onClick={leaveCall}>Leave</button>
          </div>
        </>
      )}
    </div>
  );
}

function ModePill({ mode, note }) {
  const label = mode === 'video' ? 'Video mode' : mode === 'audio' ? 'Audio mode' : 'Text mode';
  return (
    <span title={note} style={styles.pill}>
      <span style={styles.dot} /> {label}{note ? ` — ${note}` : ''}
    </span>
  );
}

const styles = {
  video: { width: '100%', borderRadius: 14, background: '#12253F', aspectRatio: '4/3', objectFit: 'cover' },
  pill: {
    display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.82rem', fontWeight: 500,
    color: '#1B3A63', background: '#FBEFD7', border: '1px solid #F0D9A0', borderRadius: 999, padding: '0.35rem 0.8rem',
  },
  dot: { width: 7, height: 7, borderRadius: '50%', background: '#2E7D5B', display: 'inline-block' },
};
