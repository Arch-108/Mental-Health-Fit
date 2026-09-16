import { useEffect, useState } from 'react';
import AppShell from '../components/AppShell';
import PageBanner from '../components/PageBanner';
import { getMyTimeline, translateMedicalText } from '../services/api';

const TYPE_LABEL = {
  consultation: 'Consultation', diagnosis: 'Diagnosis', note: 'Note', goal: 'Health goal', event: 'Event',
};

export default function HealthJourney() {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [translations, setTranslations] = useState({});

  useEffect(() => {
    getMyTimeline().then(setTimeline).catch(() => setTimeline([])).finally(() => setLoading(false));
  }, []);

  async function explainSimply(entry) {
    if (translations[entry.id]) return;
    try {
      const res = await translateMedicalText(entry.content || entry.title);
      setTranslations((t) => ({ ...t, [entry.id]: res.text }));
    } catch {
      setTranslations((t) => ({ ...t, [entry.id]: 'Could not simplify this right now.' }));
    }
  }

  return (
    <AppShell>
      <PageBanner
        image="/images/healthy-food.jpg"
        title="My Health Journey"
        subtitle="A timeline of your care — consultations, notes, and goals in one place."
      />

      {loading && <p>Loading…</p>}
      {!loading && timeline.length === 0 && <p>Nothing recorded yet — it will fill in after your first consultation.</p>}

      <div style={{ borderLeft: '2px solid #E3DFD3', paddingLeft: '1.2rem' }}>
        {timeline.map((entry) => (
          <div key={entry.id} style={{ marginBottom: '1.4rem', position: 'relative' }}>
            <div style={{ position: 'absolute', left: '-1.55rem', top: 4, width: 10, height: 10, borderRadius: '50%', background: '#1B3A63' }} />
            <div style={{ fontSize: '0.78rem', color: '#5B6472' }}>
              {new Date(entry.created_at).toLocaleDateString()} · {TYPE_LABEL[entry.entry_type] || entry.entry_type}
              {entry.created_by_name ? ` · ${entry.created_by_name}` : ''}
            </div>
            <div className="card" style={{ marginTop: '0.4rem' }}>
              <h3 style={{ marginBottom: '0.3rem' }}>{entry.title}</h3>
              {entry.content && <p>{entry.content}</p>}
              {entry.content && (
                <button className="btn" style={{ background: '#FBEFD7', color: '#12253F', fontSize: '0.8rem' }} onClick={() => explainSimply(entry)}>
                  Explain this simply
                </button>
              )}
              {translations[entry.id] && (
                <p style={{ marginTop: '0.6rem', background: '#F7F4EC', padding: '0.6rem', borderRadius: 8, fontSize: '0.9rem' }}>
                  {translations[entry.id]}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
