import { useEffect, useState } from 'react';
import AppShell from '../components/AppShell';
import PageBanner from '../components/PageBanner';
import { useAuth } from '../context/AuthContext';
import { listMyFollowUps, respondToFollowUp, reviewFollowUp } from '../services/api';

export default function FollowUps() {
  const { user } = useAuth();
  const [followUps, setFollowUps] = useState([]);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const rows = await listMyFollowUps().catch(() => []);
    setFollowUps(rows);
    setLoading(false);
  }

  async function submit(id) {
    const text = responses[id];
    if (!text) return;
    await respondToFollowUp(id, text).catch(() => {});
    load();
  }

  async function markReviewed(id) {
    await reviewFollowUp(id).catch(() => {});
    load();
  }

  return (
    <AppShell>
      <PageBanner
        image="/images/how-are-you-really.jpg"
        title="Follow-ups"
        subtitle="Continuity of care beyond the consultation itself."
      />
      {loading && <p>Loading…</p>}
      {!loading && followUps.length === 0 && <p>No follow-ups scheduled.</p>}

      {followUps.length > 0 && (
      <div className="list-section">
      {followUps.map((f) => {
        const name = user?.role === 'doctor' ? f.patient_name : `Dr. ${f.doctor_name}`;
        return (
        <div key={f.id} className="list-row-block">
          <div className="list-row-header">
            <span className="list-row-icon">{name?.replace(/^Dr\.\s*/, '').split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()}</span>
            <span className="list-row-body">
              <span className="list-row-title">{name}</span>
              <span className="list-row-meta">Due {new Date(f.due_date).toDateString()} · {f.status}</span>
            </span>
          </div>

          {user?.role === 'patient' && f.status === 'pending' && (
            <div style={{ marginTop: '0.8rem' }}>
              <label>How are things going?</label>
              <textarea
                rows={2}
                value={responses[f.id] || ''}
                onChange={(e) => setResponses((r) => ({ ...r, [f.id]: e.target.value }))}
                placeholder="e.g. My fever is gone but the cough is still there."
                style={{ marginBottom: '0.6rem' }}
              />
              <button className="btn btn-primary" onClick={() => submit(f.id)} disabled={!responses[f.id]}>Submit update</button>
            </div>
          )}

          {f.patient_response && (
            <div style={{ marginTop: '0.8rem', background: '#F7F4EC', padding: '0.6rem', borderRadius: 8 }}>
              <div style={{ fontSize: '0.78rem', color: '#5B6472' }}>Patient update</div>
              <p style={{ margin: '0.2rem 0' }}>{f.patient_response}</p>
              {f.ai_summary && (
                <>
                  <div style={{ fontSize: '0.78rem', color: '#5B6472' }}>Structured summary</div>
                  <p style={{ margin: '0.2rem 0' }}>{f.ai_summary}</p>
                </>
              )}
            </div>
          )}

          {user?.role === 'doctor' && f.status === 'submitted' && (
            <button className="btn" style={{ background: '#FBEFD7', color: '#12253F', marginTop: '0.8rem' }} onClick={() => markReviewed(f.id)}>
              Mark as reviewed
            </button>
          )}
        </div>
        );
      })}
      </div>
      )}
    </AppShell>
  );
}
