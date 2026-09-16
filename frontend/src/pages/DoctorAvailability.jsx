import { useState } from 'react';
import AppShell from '../components/AppShell';
import PageBanner from '../components/PageBanner';
import { setMyAvailability } from '../services/api';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DoctorAvailability() {
  const [rows, setRows] = useState([{ dayOfWeek: 1, startTime: '09:00', endTime: '12:00', slotMinutes: 30 }]);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  function updateRow(i, field, value) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));
  }

  function addRow() {
    setRows((r) => [...r, { dayOfWeek: 1, startTime: '09:00', endTime: '12:00', slotMinutes: 30 }]);
  }

  function removeRow(i) {
    setRows((r) => r.filter((_, idx) => idx !== i));
  }

  async function save() {
    setSaving(true);
    setMessage('');
    try {
      await setMyAvailability(rows.map((r) => ({ ...r, slotMinutes: Number(r.slotMinutes) })));
      setMessage('Availability saved. Patients can now book against these windows.');
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Could not save availability.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <PageBanner
        image="/images/surgical-team.jpg"
        title="My Availability"
        subtitle="Define your weekly windows — the system generates individual bookable slots automatically."
      />

      {message && <div className="card" style={{ marginBottom: '1rem' }}>{message}</div>}

      <div className="card">
        {rows.map((row, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr 0.8fr auto', gap: '0.6rem', marginBottom: '0.8rem', alignItems: 'end' }}>
            <div>
              <label>Day</label>
              <select value={row.dayOfWeek} onChange={(e) => updateRow(i, 'dayOfWeek', Number(e.target.value))}>
                {DAYS.map((d, idx) => <option key={idx} value={idx}>{d}</option>)}
              </select>
            </div>
            <div>
              <label>Start</label>
              <input type="time" value={row.startTime} onChange={(e) => updateRow(i, 'startTime', e.target.value)} />
            </div>
            <div>
              <label>End</label>
              <input type="time" value={row.endTime} onChange={(e) => updateRow(i, 'endTime', e.target.value)} />
            </div>
            <div>
              <label>Slot (min)</label>
              <input type="number" min="10" step="5" value={row.slotMinutes} onChange={(e) => updateRow(i, 'slotMinutes', e.target.value)} />
            </div>
            <button className="btn" style={{ background: '#FBEAE5', color: '#B3432B' }} onClick={() => removeRow(i)}>Remove</button>
          </div>
        ))}
        <button className="btn" style={{ background: '#FBEFD7', color: '#12253F' }} onClick={addRow}>+ Add window</button>
        <div style={{ marginTop: '1.2rem' }}>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save availability'}
          </button>
        </div>
      </div>
    </AppShell>
  );
}
