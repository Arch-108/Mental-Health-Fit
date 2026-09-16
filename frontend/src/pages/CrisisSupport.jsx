import AppShell from '../components/AppShell';
import PageBanner from '../components/PageBanner';

// Informational only - deliberately NOT a simulated "call queue" or
// counselor-routing tool. Presenting fabricated crisis-response
// infrastructure as if it were real and functional could mislead someone
// in a genuine crisis into thinking help is being dispatched when it
// isn't. Real numbers, clearly labeled, with a note to verify/localize.
const RESOURCES = [
  {
    region: 'Australia',
    items: [
      { name: 'Lifeline Australia', contact: '13 11 14', desc: '24/7 crisis support and suicide prevention.' },
      { name: 'Beyond Blue', contact: '1300 22 4636', desc: 'Anxiety, depression, and general mental health support.' },
      { name: '13YARN', contact: '13 92 76', desc: '24/7 crisis support line for Aboriginal and Torres Strait Islander people.' },
      { name: 'Emergency services', contact: '000', desc: 'For immediate, life-threatening danger.' },
    ],
  },
  {
    region: 'United States',
    items: [
      { name: '988 Suicide & Crisis Lifeline', contact: '988', desc: 'Call or text, 24/7.' },
      { name: 'Crisis Text Line', contact: 'Text HOME to 741741', desc: '24/7 text-based crisis support.' },
      { name: 'Emergency services', contact: '911', desc: 'For immediate, life-threatening danger.' },
    ],
  },
];

export default function CrisisSupport() {
  return (
    <AppShell>
      <PageBanner
        image="/images/crisis-support.jpg"
        title="Crisis Support"
        subtitle="If you or someone else is in immediate physical danger, call your local emergency number right now."
      />
      <p>
        This page lists real, verified support lines — it doesn't connect you to anyone directly, since we don't
        want to imply a live queue that this prototype doesn't actually have.
      </p>

      <div className="card" style={{ marginBottom: '1.2rem', background: 'color-mix(in srgb, var(--color-danger) 10%, var(--color-surface))', borderColor: 'var(--color-danger)' }}>
        <p style={{ margin: 0, color: 'var(--color-danger)', fontWeight: 600 }}>
          In an emergency, don't wait for this platform — call your local emergency number immediately.
        </p>
      </div>

      {RESOURCES.map((group) => (
        <div key={group.region} className="card" style={{ marginBottom: '1rem' }}>
          <h3>{group.region}</h3>
          {group.items.map((item) => (
            <div key={item.name} style={{ padding: '0.6rem 0', borderBottom: '1px solid var(--color-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
                <strong>{item.name}</strong>
                <span className="pill-badge">{item.contact}</span>
              </div>
              <p style={{ margin: '0.3rem 0 0', fontSize: '0.9rem' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      ))}

      <p style={{ fontSize: '0.82rem' }}>
        These numbers are provided as a starting point and should be verified and localized for your deployment
        region before real-world use. Consider this a sensitive topic: if you're personally struggling right now,
        please reach out to one of the lines above — you don't have to handle it alone.
      </p>
    </AppShell>
  );
}
