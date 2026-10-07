import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppShell from '../components/AppShell';
import PageBanner from '../components/PageBanner';
import { listDoctors, getOpenSlots, bookAppointment } from '../services/api';
import BookingCalendar from '../components/BookingCalendar';

export default function FindDoctors() {
  const [doctors, setDoctors] = useState([]);
  const [specialty, setSpecialty] = useState('');
  const [selected, setSelected] = useState(null);
  const [slots, setSlots] = useState([]);
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [booking, setBooking] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    listDoctors(specialty).then(setDoctors).catch(() => setDoctors([]));
  }, [specialty]);

  async function selectDoctor(doctor) {
    setSelected(doctor);
    setMessage('');
    try {
      const openSlots = await getOpenSlots(doctor.id);
      setSlots(openSlots);
    } catch {
      setSlots([]);
    }
  }

  async function book(slot) {
    setBooking(true);
    setMessage('');
    try {
      const { appointment } = await bookAppointment({ doctorId: selected.id, scheduledAt: slot, reason });
      navigate(`/consultation/${appointment.id}`);
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Could not book this slot — it may already be taken.');
    } finally {
      setBooking(false);
    }
  }

  return (
    <AppShell>
      <PageBanner
        image="/images/find-doctors.jpg"
        title="Find & Book Care"
        subtitle="Only admin-verified doctors appear here."
      />

      <input
        placeholder="Filter by specialty (e.g. general practice, dermatology)"
        value={specialty}
        onChange={(e) => setSpecialty(e.target.value)}
        style={{ maxWidth: 420, marginBottom: '1.2rem' }}
      />

      <div className="grid-2">
        <div className="list-section">
          {doctors.length === 0 && <p className="list-empty">No verified doctors match yet — check back soon.</p>}
          {doctors.map((d) => (
            <div
              key={d.id}
              className={`list-row clickable ${selected?.id === d.id ? 'active' : ''}`}
              onClick={() => selectDoctor(d)}
            >
              <span className="list-row-icon">{d.full_name?.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]).join('').toUpperCase()}</span>
              <span className="list-row-body">
                <span className="list-row-title">Dr. {d.full_name}</span>
                <span className="list-row-meta">{d.specialty || 'General practice'}{d.bio ? ` — ${d.bio}` : ''}</span>
              </span>
            </div>
          ))}
        </div>

        <div>
          {selected && (
            <div className="card">
              <h3>Book with Dr. {selected.full_name}</h3>
              <label htmlFor="reason">Reason for visit (optional)</label>
              <input id="reason" value={reason} onChange={(e) => setReason(e.target.value)} style={{ marginBottom: '1rem' }} />
              {message && <div className="error-banner">{message}</div>}
              <BookingCalendar slots={slots} onBook={book} booking={booking} />
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
