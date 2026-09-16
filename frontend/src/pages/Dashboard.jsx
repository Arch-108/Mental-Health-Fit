import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppShell from '../components/AppShell';
import { listMyAppointments, listMyFollowUps, listAnnouncements } from '../services/api';
import { IconArrowRight, IconChat, IconPulse, IconMapPin, IconBell, IconUsers } from '../components/Icons';

function timeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function initials(name) {
  if (!name) return '?';
  const clean = name.replace(/^Dr\.\s*/, '');
  return clean.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

const DASHBOARD_TIPS = {
  patient: {
    image: '/images/yoga-sunset.jpg',
    title: 'Small steps, steady care.',
    body: "Care doesn't only happen in appointments. Log a vital in Vitals Monitoring, jot a quick note in your Health Journey, or invite someone you trust into your Care Circle.",
  },
  doctor: {
    image: '/images/exam-room.jpg',
    title: 'Continuity matters as much as the visit.',
    body: 'A quick follow-up review or an updated availability slot can be as valuable to a patient as the consultation itself.',
  },
  admin: {
    image: '/images/surgical-team.jpg',
    title: 'Trust starts with verification.',
    body: "Every doctor on Forever Fit is reviewed before they can accept a booking — that's what keeps patients confident in who they're seeing.",
  },
};

export default function Dashboard() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [latestAnnouncement, setLatestAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([listMyAppointments().catch(() => []), listMyFollowUps().catch(() => [])]).then(
      ([a, f]) => {
        setAppointments(a);
        setFollowUps(f);
        setLoading(false);
      }
    );
  }, []);

  useEffect(() => {
    if (user?.role !== 'doctor' && user?.role !== 'admin') return;
    listAnnouncements().then((rows) => setLatestAnnouncement(rows[0] || null)).catch(() => {});
  }, [user?.role]);

  const upcoming = appointments.filter((a) => a.status === 'confirmed' || a.status === 'pending');
  const pendingFollowUps = followUps.filter((f) => f.status === 'pending');
  const firstName = user?.full_name?.split(' ')[0] || '';
  const tip = DASHBOARD_TIPS[user?.role] || DASHBOARD_TIPS.patient;

  return (
    <AppShell>
      <h1>{timeGreeting()}, {firstName}.</h1>
      <p>
        {user?.role === 'doctor'
          ? "Here's today's care at a glance."
          : user?.role === 'admin'
          ? 'Platform overview.'
          : "Here's your care at a glance."}
      </p>

      {user?.role === 'doctor' && !loading && (
        <div className="card" style={{ marginBottom: '1.2rem', background: '#FFF9EE', borderColor: '#F0DBA6' }}>
          <p style={{ margin: 0 }}>
            Note: newly registered doctor accounts require admin verification before patients can book you.
            Check your dashboard again once approved.
          </p>
        </div>
      )}

      {latestAnnouncement && (
        <div className="card" style={{ marginBottom: '1.2rem', background: 'var(--color-accent-tint)', borderColor: 'var(--color-accent-tint-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
            <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
              <IconBell size={16} /> {latestAnnouncement.title}
            </strong>
            <Link to="/announcements" style={{ fontSize: '0.82rem' }}>View all →</Link>
          </div>
          <p style={{ margin: '0.4rem 0 0' }}>{latestAnnouncement.body}</p>
        </div>
      )}

      {user?.role !== 'admin' && (
      <div className="grid-2">
        <div className="list-section">
          <div className="list-section-header">
            <h3>{user?.role === 'doctor' ? 'Upcoming appointments' : 'Your upcoming care'}</h3>
          </div>
          {loading && <p className="list-empty">Loading…</p>}
          {!loading && upcoming.length === 0 && <p className="list-empty">Nothing scheduled yet.</p>}
          {!loading && upcoming.slice(0, 5).map((a) => {
            const name = user?.role === 'doctor' ? a.patient_name : `Dr. ${a.doctor_name}`;
            return (
              <Link key={a.id} to={`/consultation/${a.id}`} className="list-row">
                <span className="list-row-icon">{initials(name)}</span>
                <span className="list-row-body">
                  <span className="list-row-title">{name}</span>
                  <span className="list-row-meta">{new Date(a.scheduled_at).toLocaleString()}</span>
                </span>
                <span className="list-row-trail">
                  {a.status} <IconArrowRight size={14} />
                </span>
              </Link>
            );
          })}
          {user?.role === 'patient' && (
            <div style={{ padding: '1rem 1.3rem' }}>
              <Link to="/find-doctors" className="btn btn-primary">Book a consultation</Link>
            </div>
          )}
        </div>

        <div className="list-section">
          <div className="list-section-header">
            <h3>Follow-ups needing attention</h3>
          </div>
          {!loading && pendingFollowUps.length === 0 && <p className="list-empty">All caught up.</p>}
          {!loading && pendingFollowUps.slice(0, 5).map((f) => {
            const name = user?.role === 'doctor' ? f.patient_name : `Dr. ${f.doctor_name}`;
            return (
              <div key={f.id} className="list-row">
                <span className="list-row-icon">{initials(name)}</span>
                <span className="list-row-body">
                  <span className="list-row-title">{name}</span>
                  <span className="list-row-meta">Due {new Date(f.due_date).toDateString()}</span>
                </span>
              </div>
            );
          })}
          <div style={{ padding: '1rem 1.3rem' }}>
            <Link to="/followups" style={{ fontSize: '0.85rem' }}>View all follow-ups →</Link>
          </div>
        </div>
      </div>
      )}

      {user?.role === 'admin' && (
        <div className="card" style={{ marginTop: '1.2rem' }}>
          <h3>Quick actions</h3>
          <div className="quick-actions-grid">
            <Link className="quick-action-tile" to="/admin">
              <span className="qa-icon"><IconUsers size={20} /></span>
              Doctor Verification
            </Link>
            <Link className="quick-action-tile" to="/vaccination-routes">
              <span className="qa-icon"><IconMapPin size={20} /></span>
              Vaccination Outreach
            </Link>
            <Link className="quick-action-tile" to="/announcements">
              <span className="qa-icon"><IconBell size={20} /></span>
              Announcements
            </Link>
          </div>
        </div>
      )}

      {user?.role === 'patient' && (
        <div className="card" style={{ marginTop: '1.2rem' }}>
          <h3>Quick actions</h3>
          <div className="quick-actions-grid">
            <Link className="quick-action-tile" to="/navigator">
              <span className="qa-icon"><IconChat size={20} /></span>
              Ask the AI Navigator
            </Link>
            <Link className="quick-action-tile" to="/journey">
              <span className="qa-icon"><IconPulse size={20} /></span>
              My Health Journey
            </Link>
            <Link className="quick-action-tile" to="/resource-map">
              <span className="qa-icon"><IconMapPin size={20} /></span>
              Find nearby care
            </Link>
          </div>
        </div>
      )}

      <div className="card dashboard-tip" style={{ marginTop: '1.2rem' }}>
        <img src={tip.image} alt="" className="dashboard-tip-image" />
        <div>
          <h3 style={{ marginTop: 0 }}>{tip.title}</h3>
          <p style={{ margin: 0 }}>{tip.body}</p>
        </div>
      </div>
    </AppShell>
  );
}
