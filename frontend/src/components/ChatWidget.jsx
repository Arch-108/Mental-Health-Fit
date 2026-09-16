import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { askNavigator } from '../services/api';
import { IconChat, IconClose } from './Icons';

const STARTER_QUESTIONS = [
  "What's bothering you today?",
  'Do you need help finding the right type of care?',
  'Want help preparing for an upcoming visit?',
];

// A lightweight, always-available entry point to the same safe AI Gateway
// used by the full Navigator page - this is the "guide through simple
// questions" surface, reachable from anywhere rather than only from a
// dedicated page. It reuses /api/ai/navigate under a general task, so
// emergency detection and the non-diagnostic disclaimer apply identically.
export default function ChatWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hi, I'm your Forever Fit assistant. I can help you figure out what kind of care you might need — I don't diagnose, just guide. What's going on?" },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  // Only patients get proactive symptom-navigation framing - doctors/admins
  // who open it get a lighter "how can I help you use the platform" framing.
  if (user?.role !== 'patient') return null;

  async function send(text) {
    if (!text.trim()) return;
    setMessages((m) => [...m, { role: 'user', text }]);
    setInput('');
    setLoading(true);
    try {
      const res = await askNavigator('quick-question', text);
      setMessages((m) => [...m, { role: 'assistant', text: res.text, emergency: res.emergency }]);
    } catch {
      setMessages((m) => [...m, { role: 'assistant', text: "Sorry, I'm having trouble right now. Try the full AI Health Navigator page instead." }]);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    send(input);
  }

  return (
    <div style={styles.wrapper}>
      {open && (
        <div className="card" style={styles.panel} role="dialog" aria-label="AI assistant chat">
          <div style={styles.header}>
            <div>
              <strong style={{ color: 'white' }}>Forever Fit Assistant</strong>
              <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.8)' }}>Guidance only — not a diagnosis</div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" style={styles.closeBtn}><IconClose size={16} /></button>
          </div>

          <div ref={scrollRef} style={styles.messages}>
            {messages.map((m, i) => (
              <div key={i} style={{ ...styles.bubble, ...(m.role === 'user' ? styles.userBubble : styles.assistantBubble), ...(m.emergency ? styles.emergencyBubble : {}) }}>
                {m.text}
              </div>
            ))}
            {loading && <div style={{ ...styles.bubble, ...styles.assistantBubble }}>…</div>}
          </div>

          {messages.length === 1 && (
            <div style={{ padding: '0 0.9rem 0.6rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {STARTER_QUESTIONS.map((q) => (
                <button key={q} onClick={() => send(q)} style={styles.chip}>{q}</button>
              ))}
            </div>
          )}

          <form onSubmit={handleSubmit} style={styles.inputRow}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message…"
              style={{ marginBottom: 0 }}
              aria-label="Message"
            />
            <button className="btn btn-primary" type="submit" disabled={loading || !input.trim()}>Send</button>
          </form>
        </div>
      )}

      <button onClick={() => setOpen((o) => !o)} style={styles.fab} aria-label="Open AI assistant" title="Ask the Forever Fit Assistant">
        <IconChat size={23} />
      </button>
    </div>
  );
}

const styles = {
  wrapper: { position: 'fixed', bottom: '1.5rem', right: '5.5rem', zIndex: 50 },
  fab: {
    width: 52, height: 52, borderRadius: '50%', border: 'none',
    background: '#16233A', color: 'white', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 4px 14px rgba(23,36,31,0.25)',
  },
  panel: {
    position: 'absolute', bottom: '4rem', right: 0, width: 320, padding: 0, overflow: 'hidden',
    boxShadow: '0 8px 28px rgba(23,36,31,0.18)', display: 'flex', flexDirection: 'column', maxHeight: 480,
  },
  header: {
    background: '#1B3A63', padding: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
  },
  closeBtn: { background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', fontSize: '1rem' },
  messages: { padding: '0.9rem', overflowY: 'auto', flex: 1, minHeight: 180 },
  bubble: { padding: '0.55rem 0.8rem', borderRadius: 12, marginBottom: '0.5rem', fontSize: '0.88rem', maxWidth: '85%', lineHeight: 1.4 },
  userBubble: { background: '#1B3A63', color: 'white', marginLeft: 'auto' },
  assistantBubble: { background: '#F7F4EC', color: '#16233A' },
  emergencyBubble: { background: '#FBEAE5', color: '#B3432B', fontWeight: 600, maxWidth: '100%' },
  chip: { fontSize: '0.78rem', background: '#FBEFD7', color: '#12253F', border: '1px solid #F0D9A0', borderRadius: 999, padding: '0.3rem 0.7rem', cursor: 'pointer' },
  inputRow: { display: 'flex', gap: '0.5rem', padding: '0.8rem', borderTop: '1px solid #F1EEE4' },
};
