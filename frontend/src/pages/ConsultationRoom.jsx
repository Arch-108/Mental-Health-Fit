import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AppShell from '../components/AppShell';
import VideoCall from '../components/VideoCall';
import ConsultationBriefForm from '../components/ConsultationBriefForm';
import { useAuth } from '../context/AuthContext';
import {
  getAppointment, getConsultationBrief, submitAsyncUpdate, listAsyncUpdates, endConsultation, draftClinicalNote, API_ORIGIN,
} from '../services/api';

export default function ConsultationRoom() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [brief, setBrief] = useState(null);
  const [asyncMessage, setAsyncMessage] = useState('');
  const [asyncImage, setAsyncImage] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [chatLog, setChatLog] = useState([]);
  const [notes, setNotes] = useState('');
  const [medication, setMedication] = useState('');
  const [instructions, setInstructions] = useState('');
  const [followUpDays, setFollowUpDays] = useState('');
  const [endMessage, setEndMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [drafting, setDrafting] = useState(false);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function load() {
    setLoading(true);
    try {
      const appt = await getAppointment(id);
      setData(appt);
      if (appt.consultation) {
        getConsultationBrief(id).then(setBrief).catch(() => {});
        listAsyncUpdates(appt.consultation.room_code).then(setSubmissions).catch(() => {});
      }
    } catch {
      // handled by loading state below
    } finally {
      setLoading(false);
    }
  }

  async function submitUpdate(e) {
    e.preventDefault();
    const form = new FormData();
    form.append('message', asyncMessage);
    if (asyncImage) form.append('image', asyncImage);
    try {
      await submitAsyncUpdate(data.consultation.room_code, form);
      setAsyncMessage('');
      setAsyncImage(null);
      const updated = await listAsyncUpdates(data.consultation.room_code);
      setSubmissions(updated);
    } catch (err) {
      // keep it simple - a failed async submit is rare and the user can retry
    }
  }

  async function handleDraftNote() {
    setDrafting(true);
    try {
      const result = await draftClinicalNote({
        reason: data?.appointment?.reason,
        briefSummary: brief?.ai_summary,
      });
      setNotes(result.text);
    } catch {
      setEndMessage('Could not draft a note right now — you can still write it yourself below.');
    } finally {
      setDrafting(false);
    }
  }

  async function handleEndConsultation(e) {
    e.preventDefault();
    try {
      const res = await endConsultation(data.consultation.room_code, {
        notes,
        prescription: medication ? { medication, instructions } : undefined,
        followUpInDays: followUpDays || undefined,
      });
      setEndMessage('Consultation ended and saved to the patient\u2019s Health Journey.' + (res.followUp ? ' Follow-up scheduled.' : ''));
    } catch (err) {
      setEndMessage(err?.response?.data?.error || 'Could not end the consultation.');
    }
  }

  if (loading) return <AppShell><p>Loading…</p></AppShell>;
  if (!data?.appointment) return <AppShell><p>Appointment not found.</p></AppShell>;

  const { appointment, consultation } = data;
  const isDoctor = user?.role === 'doctor';
  const otherPartyName = isDoctor ? appointment.patient_name : `Dr. ${appointment.doctor_name}`;

  return (
    <AppShell>
      <h1>Consultation with {otherPartyName}</h1>
      <p>{new Date(appointment.scheduled_at).toLocaleString()} · {appointment.status}</p>

      {!isDoctor && !brief && (
        <ConsultationBriefForm appointmentId={id} onGenerated={setBrief} />
      )}
      {brief && (
        <div className="card" style={{ marginBottom: '1.2rem' }}>
          <h3>Consultation Brief</h3>
          <p>{brief.ai_summary}</p>
        </div>
      )}

      {consultation && (
        <div className="card" style={{ marginBottom: '1.2rem' }}>
          <h3>Video / audio / text consultation</h3>
          <VideoCall
            roomCode={consultation.room_code}
            onChatMessage={(msg) => setChatLog((l) => [...l, msg])}
          />
          {chatLog.length > 0 && (
            <div style={{ marginTop: '1rem', maxHeight: 160, overflowY: 'auto' }}>
              {chatLog.map((m, i) => (
                <div key={i} style={{ fontSize: '0.85rem', padding: '0.3rem 0' }}>
                  <strong>{m.sender}:</strong> {m.message}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {consultation && (
        <div className="card" style={{ marginBottom: '1.2rem' }}>
          <h3>Async update (store-and-forward)</h3>
          <p>If the connection drops entirely, submit an update here — it's saved immediately and the other party is notified. No message is ever lost.</p>
          <form onSubmit={submitUpdate}>
            <textarea
              rows={3}
              value={asyncMessage}
              onChange={(e) => setAsyncMessage(e.target.value)}
              placeholder="Describe what's happening…"
              style={{ marginBottom: '0.6rem' }}
            />
            <input type="file" accept="image/*" onChange={(e) => setAsyncImage(e.target.files[0])} style={{ marginBottom: '0.8rem' }} />
            <div>
              <button className="btn btn-primary" type="submit" disabled={!asyncMessage}>Submit update</button>
            </div>
          </form>
          {submissions.length > 0 && (
            <div style={{ marginTop: '1rem' }}>
              {submissions.map((s) => (
                <div key={s.id} style={{ borderTop: '1px solid #F1EEE4', padding: '0.6rem 0' }}>
                  <strong>{s.sender_role}</strong> · {new Date(s.created_at).toLocaleString()}
                  <p style={{ margin: '0.2rem 0 0' }}>{s.message}</p>
                  {s.image_path && <img src={`${API_ORIGIN}${s.image_path}`} alt="Attached" style={{ maxWidth: 200, borderRadius: 8, marginTop: '0.4rem' }} />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {isDoctor && appointment.status !== 'completed' && (
        <div className="card">
          <h3>End consultation</h3>
          {endMessage && <div className="card" style={{ marginBottom: '0.8rem' }}>{endMessage}</div>}
          <form onSubmit={handleEndConsultation}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
              <label style={{ marginBottom: 0 }}>Consultation notes (added to patient's Health Journey)</label>
              <button
                type="button"
                className="btn"
                style={{ background: 'var(--color-accent-tint)', color: 'var(--color-primary-dark)', fontSize: '0.82rem', padding: '0.4rem 0.8rem' }}
                onClick={handleDraftNote}
                disabled={drafting}
              >
                {drafting ? 'Drafting…' : 'Draft with AI'}
              </button>
            </div>
            <p style={{ fontSize: '0.78rem', marginTop: '0.3rem' }}>
              Drafts a starting point from the reason for visit and consultation brief — always review and edit before saving.
            </p>
            <textarea rows={5} value={notes} onChange={(e) => setNotes(e.target.value)} style={{ marginBottom: '0.8rem' }} />

            <label>Prescription — medication (optional)</label>
            <input value={medication} onChange={(e) => setMedication(e.target.value)} style={{ marginBottom: '0.6rem' }} />
            <label>Instructions</label>
            <input value={instructions} onChange={(e) => setInstructions(e.target.value)} style={{ marginBottom: '0.8rem' }} />

            <label>Schedule a follow-up in (days, optional)</label>
            <input type="number" min="1" value={followUpDays} onChange={(e) => setFollowUpDays(e.target.value)} style={{ marginBottom: '1rem', maxWidth: 140 }} />

            <button className="btn btn-primary" type="submit">End consultation & save</button>
          </form>
        </div>
      )}
    </AppShell>
  );
}
