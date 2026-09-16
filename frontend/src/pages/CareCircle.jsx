import { useEffect, useState } from 'react';
import AppShell from '../components/AppShell';
import PageBanner from '../components/PageBanner';
import { inviteCaregiver, listMyCareCircle, acceptCareCircleInvite, revokeCareCircleAccess } from '../services/api';

const SCOPE_OPTIONS = [
  { id: 'appointments', label: 'Appointment reminders' },
  { id: 'followups', label: 'Follow-up reminders' },
  { id: 'medications', label: 'Medication reminders' },
];

export default function CareCircle() {
  const [email, setEmail] = useState('');
  const [scopes, setScopes] = useState([]);
  const [members, setMembers] = useState([]);
  const [asCaregiver, setAsCaregiver] = useState([]);
  const [message, setMessage] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    const data = await listMyCareCircle().catch(() => ({ members: [], asCaregiver: [] }));
    setMembers(data.members || []);
    setAsCaregiver(data.asCaregiver || []);
  }

  function toggleScope(id) {
    setScopes((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async function invite(e) {
    e.preventDefault();
    setMessage('');
    try {
      await inviteCaregiver(email, scopes);
      setMessage(`Invite sent to ${email}. They will see it once they log in with this email.`);
      setEmail('');
      setScopes([]);
      load();
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Could not send the invite.');
    }
  }

  async function accept() {
    await acceptCareCircleInvite().catch(() => {});
    load();
  }

  async function revoke(id) {
    await revokeCareCircleAccess(id).catch(() => {});
    load();
  }

  return (
    <AppShell>
      <PageBanner
        image="/images/care-hands.jpg"
        title="Care Circle"
        subtitle="Share only what you choose, with people you trust — nothing is shared by default, and you can revoke access at any time."
      />

      {message && <div className="card" style={{ marginBottom: '1rem' }}>{message}</div>}

      <div className="card" style={{ marginBottom: '1.2rem' }}>
        <h3>Invite a caregiver</h3>
        <form onSubmit={invite}>
          <label>Caregiver's email (they need a Forever Fit account)</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={{ marginBottom: '0.8rem' }} />
          <label>What can they see?</label>
          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {SCOPE_OPTIONS.map((s) => (
              <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 400 }}>
                <input type="checkbox" checked={scopes.includes(s.id)} onChange={() => toggleScope(s.id)} style={{ width: 'auto' }} />
                {s.label}
              </label>
            ))}
          </div>
          <button className="btn btn-primary" type="submit" disabled={scopes.length === 0}>Send invite</button>
        </form>
      </div>

      <div className="list-section" style={{ marginBottom: '1.2rem' }}>
        <div className="list-section-header"><h3>People in your Care Circle</h3></div>
        {members.length === 0 && <p className="list-empty">No one added yet.</p>}
        {members.map((m) => (
          <div key={m.id} className="list-row">
            <span className="list-row-icon">{m.caregiver_email[0]?.toUpperCase()}</span>
            <span className="list-row-body">
              <span className="list-row-title">{m.caregiver_email}</span>
              <span className="list-row-meta">{JSON.parse(m.scopes).join(', ')} · {m.status}</span>
            </span>
            {m.status !== 'revoked' && (
              <button className="btn" style={{ background: '#FBEAE5', color: '#B3432B' }} onClick={() => revoke(m.id)}>Revoke</button>
            )}
          </div>
        ))}
      </div>

      <div className="list-section">
        <div className="list-section-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.6rem' }}>
          <h3>Circles you're part of as a caregiver</h3>
          <p style={{ margin: 0 }}>If someone invited you, log in with the email they used, then accept below.</p>
          <button className="btn" style={{ background: '#FBEFD7', color: '#12253F' }} onClick={accept}>
            Check for & accept pending invites
          </button>
        </div>
        {asCaregiver.length === 0 && <p className="list-empty">You're not currently supporting anyone's care.</p>}
        {asCaregiver.map((c) => (
          <div key={c.id} className="list-row">
            <span className="list-row-icon">{c.patient_name?.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()}</span>
            <span className="list-row-body">
              <span className="list-row-title">{c.patient_name}</span>
              <span className="list-row-meta">{JSON.parse(c.scopes).join(', ')}</span>
            </span>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
