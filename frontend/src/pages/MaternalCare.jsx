import { useEffect, useState } from 'react';
import AppShell from '../components/AppShell';
import PageBanner from '../components/PageBanner';
import { addMaternalCheckin, listMaternalCheckins } from '../services/api';

export default function MaternalCare() {
  const [checkins, setCheckins] = useState([]);
  const [gestationalWeek, setGestationalWeek] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const data = await listMaternalCheckins().catch(() => []);
    setCheckins(data);
    setLoading(false);
  }

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const res = await addMaternalCheckin({ gestationalWeek: gestationalWeek || undefined, symptoms });
      setResult(res);
      setSymptoms('');
      load();
    } catch (err) {
      setResult({ error: err?.response?.data?.error || 'Could not save this check-in.' });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <PageBanner
        image="/images/maternal-care.jpg"
        title="Maternal Care Check-in"
        subtitle="A simple way to note how you're feeling during pregnancy — not a diagnosis, just a prompt to reach out when something's worth a closer look."
      />
      <p>
        This checks what you describe against widely-used public health guidance on symptoms worth prompt clinical
        review — it does not diagnose anything, and a "no flag" result is not a clean bill of health. When in doubt,
        contact your doctor or midwife directly.
      </p>

      <div className="grid-2">
        <form className="card" onSubmit={submit}>
          <h3>New check-in</h3>
          <label>Gestational week (optional)</label>
          <input type="number" min="1" max="45" value={gestationalWeek} onChange={(e) => setGestationalWeek(e.target.value)} style={{ marginBottom: '0.8rem' }} />
          <label>How are you feeling? Any symptoms?</label>
          <textarea
            rows={4}
            value={symptoms}
            onChange={(e) => setSymptoms(e.target.value)}
            placeholder="e.g. Feeling tired but otherwise fine, or describe anything unusual…"
            style={{ marginBottom: '1rem' }}
          />
          <button className="btn btn-primary" type="submit" disabled={submitting || !symptoms.trim()}>
            {submitting ? 'Checking…' : 'Submit check-in'}
          </button>

          {result && !result.error && (
            <div style={{ marginTop: '1rem' }}>
              {result.redFlag ? (
                <div className="error-banner">
                  <strong>Please contact your doctor or midwife promptly.</strong>
                  <p style={{ margin: '0.4rem 0 0' }}>{result.redFlagReason} If symptoms are severe or worsening, seek urgent care rather than waiting.</p>
                </div>
              ) : (
                <div className="card" style={{ background: 'color-mix(in srgb, var(--color-success) 10%, var(--color-surface))' }}>
                  Nothing you described matched our common review-worthy symptom list — but this isn't a clean bill
                  of health. Keep an eye on how you feel and check in again anytime.
                </div>
              )}
            </div>
          )}
          {result?.error && <div className="error-banner" style={{ marginTop: '1rem' }}>{result.error}</div>}
        </form>

        <div className="card">
          <h3>Your check-in history</h3>
          {loading && <p>Loading…</p>}
          {!loading && checkins.length === 0 && <p>No check-ins yet.</p>}
          {!loading && checkins.map((c) => (
            <div key={c.id} style={{ padding: '0.6rem 0', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                  {new Date(c.created_at).toLocaleDateString()}{c.gestational_week ? ` · Week ${c.gestational_week}` : ''}
                </span>
                {c.red_flag ? <span className="pill-badge warn">Flagged</span> : <span className="pill-badge">Reviewed</span>}
              </div>
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.9rem' }}>{c.symptoms}</p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
