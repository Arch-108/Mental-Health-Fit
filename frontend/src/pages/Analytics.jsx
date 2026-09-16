import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AppShell from '../components/AppShell';
import PageBanner from '../components/PageBanner';
import { useAuth } from '../context/AuthContext';
import { getDoctorAnalytics, getPatientAnalytics } from '../services/api';

export default function Analytics() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loader = user?.role === 'doctor' ? getDoctorAnalytics : getPatientAnalytics;
    loader().then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [user]);

  if (loading) return <AppShell><p>Loading analytics…</p></AppShell>;

  return (
    <AppShell>
      {user?.role === 'doctor' ? (
        <>
          <h1>Your Performance</h1>
          <p>Real, computed metrics from your appointments and follow-ups — not estimates.</p>
        </>
      ) : (
        <PageBanner
          image="/images/yoga-sunset.jpg"
          title="Your Care Activity"
          subtitle="A transparency view of your own engagement with the platform over time."
        />
      )}

      {user?.role === 'doctor' ? <DoctorView data={data} /> : <PatientView data={data} />}
    </AppShell>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="card">
      <div style={{ fontSize: '1.8rem', fontFamily: 'Manrope, sans-serif', color: '#1B3A63' }}>{value}</div>
      <div style={{ fontSize: '0.85rem', color: '#5B6472' }}>{label}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: '#8992A0', marginTop: '0.2rem' }}>{sub}</div>}
    </div>
  );
}

function DoctorView({ data }) {
  if (!data) return <p>Could not load your analytics right now.</p>;
  const { weeklyConsultations, completionRate, followUpRate, totalPatients } = data;

  return (
    <>
      <div style={styles.statGrid}>
        <StatCard label="Total patients" value={totalPatients} />
        <StatCard label="Appointment completion rate" value={completionRate !== null ? `${completionRate}%` : '—'} sub="Completed vs. total non-cancelled" />
        <StatCard label="Follow-up review rate" value={followUpRate !== null ? `${followUpRate}%` : '—'} sub="Continuity of care indicator" />
      </div>

      <div className="card" style={{ marginTop: '1.2rem' }}>
        <h3>Consultations completed per week (last 8 weeks)</h3>
        {weeklyConsultations.length === 0 ? (
          <p>No completed consultations yet — this fills in as you see patients.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weeklyConsultations}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E3DFD3" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#1B3A63" radius={[6, 6, 0, 0]} name="Consultations" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </>
  );
}

function PatientView({ data }) {
  if (!data) return <p>Could not load your activity right now.</p>;
  const { monthlyActivity, totalConsultations, followUpsCompleted } = data;

  return (
    <>
      <div style={styles.statGrid}>
        <StatCard label="Completed consultations" value={totalConsultations} />
        <StatCard label="Follow-ups completed" value={followUpsCompleted} />
      </div>

      <div className="card" style={{ marginTop: '1.2rem' }}>
        <h3>Health record activity (last 6 months)</h3>
        {monthlyActivity.length === 0 ? (
          <p>Nothing recorded yet — this fills in after your first consultation.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={monthlyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E3DFD3" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#16233A" strokeWidth={2.5} dot={{ r: 4 }} name="Entries" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </>
  );
}

const styles = {
  statGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem' },
};
