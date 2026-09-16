import { useState } from 'react';
import { generateConsultationBrief } from '../services/api';

// Structured intake (Step 8 of the research doc) - deliberately NOT a free
// text box asking "describe your symptoms", because that's what produces
// the unstructured wall of text doctors struggle to use quickly.
export default function ConsultationBriefForm({ appointmentId, onGenerated }) {
  const [intake, setIntake] = useState({
    onset: '', severity: '', frequency: '', associatedSymptoms: '', medicationsTaken: '', relevantHistory: '',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function update(field, value) {
    setIntake((i) => ({ ...i, [field]: value }));
  }

  async function generate(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await generateConsultationBrief(appointmentId, intake);
      setResult(res);
      onGenerated?.(res);
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not generate the brief right now.');
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="card">
        <h3>Your Consultation Brief</h3>
        {result.emergency && (
          <div className="error-banner">{result.text}</div>
        )}
        {!result.emergency && <p>{result.text}</p>}
        <p style={{ fontSize: '0.82rem' }}>
          This is patient-reported and organized to help your consultation start faster — it is not a diagnosis,
          and you can still explain anything further to your doctor directly.
        </p>
        <button className="btn" style={{ background: '#FBEFD7', color: '#12253F' }} onClick={() => setResult(null)}>
          Edit intake
        </button>
      </div>
    );
  }

  return (
    <form className="card" onSubmit={generate}>
      <h3>Prepare for your consultation</h3>
      <p>A few quick questions help your doctor get to the point faster.</p>
      {error && <div className="error-banner">{error}</div>}

      <label>When did this start?</label>
      <input value={intake.onset} onChange={(e) => update('onset', e.target.value)} placeholder="e.g. 3 days ago" style={{ marginBottom: '0.8rem' }} />

      <label>How severe is it? (describe or rate out of 10)</label>
      <input value={intake.severity} onChange={(e) => update('severity', e.target.value)} placeholder="e.g. 6/10, worse at night" style={{ marginBottom: '0.8rem' }} />

      <label>How often does it happen?</label>
      <input value={intake.frequency} onChange={(e) => update('frequency', e.target.value)} placeholder="e.g. constant, comes and goes" style={{ marginBottom: '0.8rem' }} />

      <label>Any other symptoms alongside it?</label>
      <input value={intake.associatedSymptoms} onChange={(e) => update('associatedSymptoms', e.target.value)} style={{ marginBottom: '0.8rem' }} />

      <label>Any medication already taken for it?</label>
      <input value={intake.medicationsTaken} onChange={(e) => update('medicationsTaken', e.target.value)} style={{ marginBottom: '0.8rem' }} />

      <label>Anything from your medical history that seems relevant?</label>
      <input value={intake.relevantHistory} onChange={(e) => update('relevantHistory', e.target.value)} style={{ marginBottom: '1rem' }} />

      <button className="btn btn-primary" type="submit" disabled={loading}>
        {loading ? 'Generating…' : 'Generate my brief'}
      </button>
    </form>
  );
}
