import { useState } from 'react';
import AppShell from '../components/AppShell';
import PageBanner from '../components/PageBanner';
import { askNavigator } from '../services/api';

const TASKS = [
  { id: 'understand-symptoms', label: 'Understand my symptoms' },
  { id: 'prepare-consultation', label: 'Prepare for a consultation' },
  { id: 'find-service', label: 'Find the right healthcare service' },
  { id: 'questions-for-doctor', label: 'Prepare questions for my doctor' },
];

export default function HealthNavigator() {
  const [task, setTask] = useState(null);
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [loading, setLoading] = useState(false);

  async function send(e) {
    e.preventDefault();
    if (!message.trim()) return;
    const userMsg = message;
    setConversation((c) => [...c, { role: 'user', text: userMsg }]);
    setMessage('');
    setLoading(true);
    try {
      const res = await askNavigator(task.id, userMsg);
      setConversation((c) => [...c, { role: 'assistant', text: res.text, emergency: res.emergency }]);
    } catch (err) {
      setConversation((c) => [...c, { role: 'assistant', text: 'Sorry, the Navigator is unavailable right now.', emergency: false }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <PageBanner
        image="/images/mental-health-matters.jpg"
        title="AI Health Navigator"
        subtitle="This helps you find your way through the healthcare system — it does not diagnose. If you describe an emergency, you'll be told to seek emergency care immediately."
      />

      {!task && (
        <div className="card">
          <h3>What can I help you with?</h3>
          <div style={{ display: 'grid', gap: '0.6rem' }}>
            {TASKS.map((t) => (
              <button key={t.id} className="btn" style={{ background: '#FBEFD7', color: '#12253F', justifyContent: 'flex-start' }} onClick={() => setTask(t)}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {task && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>{task.label}</h3>
            <button className="btn" style={{ background: 'transparent', color: '#5B6472' }} onClick={() => { setTask(null); setConversation([]); }}>
              Change topic
            </button>
          </div>

          <div style={{ maxHeight: 360, overflowY: 'auto', marginBottom: '1rem' }}>
            {conversation.map((m, i) => (
              <div key={i} style={{ marginBottom: '0.8rem' }}>
                <div style={{ fontSize: '0.78rem', color: '#5B6472', marginBottom: '0.15rem' }}>{m.role === 'user' ? 'You' : 'Navigator'}</div>
                <div style={m.emergency ? { color: '#B3432B', fontWeight: 600 } : {}}>{m.text}</div>
              </div>
            ))}
            {loading && <p>Thinking…</p>}
          </div>

          <form onSubmit={send} style={{ display: 'flex', gap: '0.6rem' }}>
            <input value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Describe what's going on…" />
            <button className="btn btn-primary" type="submit" disabled={loading}>Send</button>
          </form>
        </div>
      )}
    </AppShell>
  );
}
