import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AppShell from '../components/AppShell';
import { listPendingDoctors, setDoctorVerification, getAdminStats, getAdminOverview } from '../services/api';

export default function AdminPanel() {
  const [pendingDoctors, setPendingDoctors] = useState([]);
  const [stats, setStats] = useState(null);
  const [overview, setOverview] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const [d, s, o] = await Promise.all([
      listPendingDoctors().catch(() => []),
      getAdminStats().catch(() => null),
      getAdminOverview().catch(() => null),
    ]);
    setPendingDoctors(d);
    setStats(s);
    setOverview(o);
    setLoading(false);
  }

  async function decide(id, status) {
    await setDoctorVerification(id, status).catch(() => {});
    setMessage(`Doctor ${status}.`);
    load();
  }

  return (
    <AppShell>
      <h1>Admin Overview</h1>
      <p>Platform activity, doctor performance, and verification in one place.</p>

      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.8rem', marginBottom: '1.2rem' }}>
          <StatCard label="Total users" value={stats.totalUsers} />
          <StatCard label="Total appointments" value={stats.totalAppointments} />
          <StatCard label="Pending verifications" value={stats.pendingDoctorVerifications} />
          <StatCard label="Active doctors" value={overview?.doctors?.filter((d) => d.verificationStatus === 'verified').length ?? '—'} />
        </div>
      )}

      {message && <div className="card" style={{ marginBottom: '1rem' }}>{message}</div>}

      {/* --- Platform activity chart --- */}
      <div className="card" style={{ marginBottom: '1.2rem' }}>
        <h3>Platform-wide appointments per week (last 8 weeks)</h3>
        {loading && <p>Loading…</p>}
        {!loading && (!overview?.weeklyAppointments || overview.weeklyAppointments.length === 0) && (
          <p>No appointment activity in this window yet.</p>
        )}
        {!loading && overview?.weeklyAppointments?.length > 0 && (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={overview.weeklyAppointments}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#1B3A63" radius={[6, 6, 0, 0]} name="Appointments" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* --- Doctor performance comparison chart --- */}
      <div className="card" style={{ marginBottom: '1.2rem' }}>
        <h3>Completed consultations by doctor</h3>
        {!loading && (!overview?.doctors || overview.doctors.length === 0) && <p>No doctors yet.</p>}
        {!loading && overview?.doctors?.length > 0 && (
          <ResponsiveContainer width="100%" height={Math.max(200, overview.doctors.length * 50)}>
            <BarChart data={overview.doctors} layout="vertical" margin={{ left: 40 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={120} />
              <Tooltip />
              <Bar dataKey="completedAppointments" fill="#1B3A63" radius={[0, 6, 6, 0]} name="Completed" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* --- Doctor performance & availability table --- */}
      <div className="card" style={{ marginBottom: '1.2rem', overflowX: 'auto' }}>
        <h3>Doctor performance & availability</h3>
        {!loading && overview?.doctors?.length > 0 && (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--color-border)' }}>
                <th style={{ padding: '0.5rem' }}>Doctor</th>
                <th style={{ padding: '0.5rem' }}>Specialty</th>
                <th style={{ padding: '0.5rem' }}>Status</th>
                <th style={{ padding: '0.5rem' }}>Appointments</th>
                <th style={{ padding: '0.5rem' }}>Completion rate</th>
                <th style={{ padding: '0.5rem' }}>Patients</th>
                <th style={{ padding: '0.5rem' }}>Weekly availability</th>
              </tr>
            </thead>
            <tbody>
              {overview.doctors.map((d) => (
                <tr key={d.doctorId} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '0.5rem' }}>Dr. {d.name}</td>
                  <td style={{ padding: '0.5rem' }}>{d.specialty || '—'}</td>
                  <td style={{ padding: '0.5rem' }}>
                    <span className={`pill-badge ${d.verificationStatus !== 'verified' ? 'warn' : ''}`}>{d.verificationStatus}</span>
                  </td>
                  <td style={{ padding: '0.5rem' }}>{d.totalAppointments}</td>
                  <td style={{ padding: '0.5rem' }}>{d.completionRate !== null ? `${d.completionRate}%` : '—'}</td>
                  <td style={{ padding: '0.5rem' }}>{d.totalPatients}</td>
                  <td style={{ padding: '0.5rem' }}>{d.weeklyAvailabilityHours}h / week</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* --- Pending doctor verification --- */}
      <div className="card">
        <h3>Doctor Verification</h3>
        <p>Doctors cannot accept bookings until verified.</p>
        {pendingDoctors.length === 0 && <p>No pending doctor verifications.</p>}
        {pendingDoctors.map((d) => (
          <div key={d.id} style={{ borderTop: '1px solid var(--color-border)', padding: '0.8rem 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.6rem' }}>
              <div>
                <strong>Dr. {d.full_name}</strong>
                <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{d.email} · {d.specialty || 'No specialty listed'} · License: {d.license_number || 'n/a'}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="btn btn-primary" onClick={() => decide(d.id, 'verified')}>Approve</button>
                <button className="btn" style={{ background: 'color-mix(in srgb, var(--color-danger) 12%, var(--color-surface))', color: 'var(--color-danger)' }} onClick={() => decide(d.id, 'rejected')}>Reject</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="card">
      <div style={{ fontSize: '1.8rem', fontFamily: 'Manrope, sans-serif', fontWeight: 700, color: 'var(--color-primary)' }}>{value}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{label}</div>
    </div>
  );
}