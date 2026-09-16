import { useEffect, useRef, useState } from 'react';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { listStaffDirectory, listMessageThreads, getConversation, sendStaffMessage } from '../services/api';

function initials(name) {
  if (!name) return '?';
  return name.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

export default function Messages() {
  const { user } = useAuth();
  const [threads, setThreads] = useState([]);
  const [staff, setStaff] = useState([]);
  const [activeUserId, setActiveUserId] = useState(null);
  const [conversation, setConversation] = useState([]);
  const [body, setBody] = useState('');
  const [composing, setComposing] = useState(false);
  const [composeRecipient, setComposeRecipient] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => { loadThreads(); loadStaff(); }, []);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [conversation]);

  async function loadThreads() {
    setLoading(true);
    const rows = await listMessageThreads().catch(() => []);
    setThreads(rows);
    setLoading(false);
  }

  async function loadStaff() {
    const rows = await listStaffDirectory().catch(() => []);
    setStaff(rows);
  }

  async function openThread(userId) {
    setActiveUserId(userId);
    setComposing(false);
    const rows = await getConversation(userId).catch(() => []);
    setConversation(rows);
    loadThreads(); // refresh unread counts now that this thread is marked read
  }

  async function startCompose() {
    setComposing(true);
    setActiveUserId(null);
    setConversation([]);
  }

  async function send(e) {
    e.preventDefault();
    const recipientId = composing ? Number(composeRecipient) : activeUserId;
    if (!recipientId || !body.trim()) return;
    setSending(true);
    try {
      await sendStaffMessage({ recipientId, body: body.trim() });
      setBody('');
      setComposing(false);
      await openThread(recipientId);
    } catch {
      // conversation view stays as-is; the input keeps the drafted text so nothing is lost
    } finally {
      setSending(false);
    }
  }

  const activeThread = threads.find((t) => t.userId === activeUserId);

  return (
    <AppShell>
      <h1>Messages</h1>
      <p>Internal messages between doctors and admins — patients never see this.</p>

      <div className="grid-2">
        <div className="list-section">
          <div className="list-section-header">
            <h3>Conversations</h3>
            <button className="btn" style={{ background: 'var(--color-accent-tint)', color: 'var(--color-primary-dark)', fontSize: '0.82rem' }} onClick={startCompose}>
              New message
            </button>
          </div>
          {loading && <p className="list-empty">Loading…</p>}
          {!loading && threads.length === 0 && <p className="list-empty">No conversations yet.</p>}
          {threads.map((t) => (
            <div
              key={t.userId}
              className={`list-row clickable ${activeUserId === t.userId ? 'active' : ''}`}
              onClick={() => openThread(t.userId)}
            >
              <span className="list-row-icon">{initials(t.fullName)}</span>
              <span className="list-row-body">
                <span className="list-row-title">{t.fullName} <span style={{ fontWeight: 400, color: 'var(--color-text-muted)', fontSize: '0.78rem' }}>· {t.role}</span></span>
                <span className="list-row-meta">{t.lastMessage}</span>
              </span>
              {t.unreadCount > 0 && <span className="pill-badge">{t.unreadCount}</span>}
            </div>
          ))}
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', minHeight: 420 }}>
          {composing ? (
            <>
              <h3>New message</h3>
              <label htmlFor="recipient">To</label>
              <select id="recipient" value={composeRecipient} onChange={(e) => setComposeRecipient(e.target.value)} style={{ marginBottom: '1rem' }}>
                <option value="">Select a colleague…</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>{s.fullName} ({s.role}{s.specialty ? ` · ${s.specialty}` : ''})</option>
                ))}
              </select>
            </>
          ) : activeThread ? (
            <h3 style={{ marginBottom: '0.8rem' }}>{activeThread.fullName}</h3>
          ) : (
            <p>Select a conversation, or start a new message.</p>
          )}

          {(activeUserId || composing) && (
            <>
              <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', marginBottom: '0.8rem', maxHeight: 320 }}>
                {conversation.map((m) => (
                  <div
                    key={m.id}
                    style={{
                      maxWidth: '80%',
                      marginBottom: '0.5rem',
                      marginLeft: m.sender_id === user.id ? 'auto' : 0,
                      background: m.sender_id === user.id ? 'var(--color-primary)' : 'var(--color-bg)',
                      color: m.sender_id === user.id ? 'white' : 'var(--color-text)',
                      padding: '0.55rem 0.8rem',
                      borderRadius: 12,
                      fontSize: '0.9rem',
                    }}
                  >
                    {m.body}
                  </div>
                ))}
              </div>
              <form onSubmit={send} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Type a message…"
                  style={{ marginBottom: 0 }}
                  aria-label="Message"
                />
                <button className="btn btn-primary" type="submit" disabled={sending || !body.trim() || (composing && !composeRecipient)}>
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
