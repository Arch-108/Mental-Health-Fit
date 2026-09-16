import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import AppShell from '../components/AppShell';
import PageBanner from '../components/PageBanner';
import { addVitalsLog, listVitalsLogs } from '../services/api';

// This is a MANUAL entry log, not a real wearable/device integration -
// that's explicitly future work per the original research doc. It's
// framed honestly here rather than implying live device syncing.
export default function VitalsMonitoring() {
  const [logs, setLogs] = useState([]);
  const [form, setForm] = useState({ heartRate: '', spo2: '', steps: '', sleepHours: '' });
  const [message, setMessage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const data = await listVitalsLogs().catch(() => []);
    setLogs(data);
    setLoading(false);
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setMessage(null);
    try {
      const res = await addVitalsLog({
        heartRate: form.heartRate ? Number(form.heartRate) : undefined,
        spo2: form.spo2 ? Number(form.spo2) : undefined,
        steps: form.steps ? Number(form.steps) : undefined,
        sleepHours: form.sleepHours ? Number(form.sleepHours) : undefined,
      });
      setMessage(res.flagged
        ? { type: 'warn', text: `Reading saved. ${res.flagReason} You may want to mention this to your doctor.` }
        : { type: 'ok', text: 'Reading saved.' });
      setForm({ heartRate: '', spo2: '', steps: '', sleepHours: '' });
      load();
    } catch (err) {
      setMessage({ type: 'warn', text: err?.response?.data?.error || 'Could not save this reading.' });
    }
  }

  const chartData = [...logs].reverse().map((l) => ({
    date: new Date(l.recorded_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    heartRate: l.heart_rate,
    spo2: l.spo2,
  }));

  return (
    <AppShell>
      <PageBanner
        image="/images/exam-room.jpg"
        title="Vitals Monitoring"
        subtitle="Log your own readings (from a home device or how you're feeling) to track trends over time. This is manual entry, not an automatic wearable sync."
      />

      <div className="grid-2">
        <div className="card">
          <h3>Log a reading</h3>
          {message && (
            <div className={message.type === 'warn' ? 'error-banner' : 'card'} style={message.type === 'ok' ? { background: 'color-mix(in srgb, var(--color-success) 10%, var(--color-surface))', marginBottom: '1rem' } : {}}>
              {message.text}
            </div>
          )}
          <form onSubmit={submit}>
            <label>Heart rate (bpm)</label>
            <input type="number" value={form.heartRate} onChange={(e) => update('heartRate', e.target.value)} style={{ marginBottom: '0.8rem' }} />
            <label>Blood oxygen (SpO2 %)</label>
            <input type="number" value={form.spo2} onChange={(e) => update('spo2', e.target.value)} style={{ marginBottom: '0.8rem' }} />
            <label>Steps today</label>
            <input type="number" value={form.steps} onChange={(e) => update('steps', e.target.value)} style={{ marginBottom: '0.8rem' }} />
            <label>Sleep last night (hours)</label>
            <input type="number" step="0.5" value={form.sleepHours} onChange={(e) => update('sleepHours', e.target.value)} style={{ marginBottom: '1rem' }} />
            <button className="btn btn-primary" type="submit">Save reading</button>
          </form>
        </div>

        <div className="card">
          <h3>Trend (heart rate & SpO2)</h3>
          {loading && <p>Loading…</p>}
          {!loading && chartData.length === 0 && <p>No readings yet — log your first one to see a trend.</p>}
          {!loading && chartData.length > 0 && (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="heartRate" stroke="#1B3A63" strokeWidth={2} dot={{ r: 3 }} name="Heart rate" />
                <Line type="monotone" dataKey="spo2" stroke="#1B6E3C" strokeWidth={2} dot={{ r: 3 }} name="SpO2" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: '1.2rem' }}>
        <h3>Recent readings</h3>
        {logs.slice(0, 10).map((l) => (
          <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)', fontSize: '0.9rem' }}>
            <span>{new Date(l.recorded_at).toLocaleString()}</span>
            <span>{l.heart_rate ? `${l.heart_rate} bpm` : '—'} · {l.spo2 ? `${l.spo2}% SpO2` : '—'} · {l.steps ? `${l.steps} steps` : '—'}</span>
            {l.flagged ? <span className="pill-badge warn">Flagged</span> : <span />}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
