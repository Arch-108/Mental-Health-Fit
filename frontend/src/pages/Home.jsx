import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PublicNav from '../components/PublicNav';
import LogoMark, { Logo } from '../components/Logo';
import { IconChevronDown } from '../components/Icons';

const WELLBEING_ITEMS = [
  'Health Journey — one running timeline of your visits and records',
  'Follow-ups — your doctor checks back in after a consultation',
  'Maternal Care check-ins — symptom review during pregnancy',
  'Vitals Monitoring — log readings between appointments',
  'Care Circle — invite a family member or caregiver in, on your terms',
];

const STEPS = [
  { n: '1', title: 'Create your account', body: "Sign up as a patient or a doctor. Doctor accounts are reviewed by an admin before they can accept bookings." },
  { n: '2', title: 'Get matched to care', body: "Browse admin-verified doctors yourself, or ask the AI Health Navigator to help point you to the right kind of care." },
  { n: '3', title: 'Connect, your way', body: "Video, audio, or text — the platform adapts to your connection automatically, so a weak signal never locks you out of care." },
];

const FAQS = [
  { q: 'Does the AI Health Navigator diagnose me?', a: "No. It asks guided questions and points you toward the right kind of care — it never diagnoses. If it detects a possible emergency, it tells you to contact local emergency services immediately." },
  { q: 'What if my internet connection is poor?', a: "The platform detects your connection quality and adapts consultations automatically — standard, audio-friendly, or text-only — and always tells you which mode you're in and why." },
  { q: 'Are the doctors on Forever Fit verified?', a: 'Yes. Every doctor account is reviewed by an admin before that doctor can accept bookings from patients.' },
  { q: 'Can family or a caregiver help manage my care?', a: "Yes — Care Circle lets you invite someone in with scoped access, and you can revoke it at any time." },
  { q: "What if I'm in crisis right now?", a: "Don't wait on this platform — call your local emergency number immediately. Our Crisis Support page also lists real, verified support lines by region." },
  { q: 'Do you support pregnancy check-ins?', a: "Yes. Maternal Care check-ins compare what you describe against widely-used public health guidance and flag anything worth prompt clinical review." },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="faq-item">
      <button type="button" className="faq-question" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span>{q}</span>
        <IconChevronDown size={16} style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease', flexShrink: 0 }} />
      </button>
      {open && <p className="faq-answer">{a}</p>}
    </div>
  );
}

export default function Home() {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/dashboard" replace />;

  return (
    <div>
      <PublicNav />

      <section
        className="hero-marketing"
        style={{ backgroundImage: `linear-gradient(100deg, rgba(15,24,38,0.90) 0%, rgba(27,58,99,0.72) 55%, rgba(27,58,99,0.35) 100%), url('/images/auth-hero.jpg')` }}
      >
        <div className="hero-marketing-inner">
          <h1>Healthcare that reaches you — wherever you are.</h1>
          <p>Candid, guided telehealth for communities where the connection isn't always strong, but the need for care always is.</p>
          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap', marginTop: '1.4rem' }}>
            <Link to="/register" className="btn btn-primary" style={{ padding: '0.85rem 1.7rem' }}>Get started</Link>
            <Link to="/login" className="btn" style={{ padding: '0.85rem 1.7rem', background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.3)', color: 'white' }}>Sign in</Link>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '1.6rem' }}>
            <span className="hero-pill"><span style={{ color: '#E8A83C' }}>●</span> Adapts to your connection</span>
            <span className="hero-pill"><span style={{ color: '#E8A83C' }}>●</span> Guided, not generic</span>
          </div>
        </div>
      </section>

      <section className="marketing-section" id="how-it-works">
        <div className="marketing-section-inner feature-split">
          <img src="/images/surgical-team.jpg" alt="" className="feature-image" />
          <div>
            <h2>A different approach to healthcare</h2>
            <p>
              Forever Fit pairs you with admin-verified doctors and a guided AI Health Navigator that helps you figure
              out what kind of care you actually need — never a diagnosis, just direction. Every consultation adapts
              to your connection instead of assuming you have a fast, stable one.
            </p>
          </div>
        </div>
      </section>

      <section className="marketing-section" id="wellbeing" style={{ background: 'var(--color-surface)' }}>
        <div className="marketing-section-inner feature-split">
          <img src="/images/crisis-support.jpg" alt="" className="feature-image" />
          <div>
            <h2>Supporting your ongoing care</h2>
            <p>Not just a one-off video call — a running relationship with your care.</p>
            <ul className="feature-list">
              {WELLBEING_ITEMS.map((item) => <li key={item}>{item}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="marketing-section" id="steps">
        <div className="marketing-section-inner">
          <h2 style={{ textAlign: 'center' }}>How it works</h2>
          <div className="steps-grid">
            {STEPS.map((s) => (
              <div key={s.n} className="card step-card">
                <div className="step-number">{s.n}</div>
                <h3>{s.title}</h3>
                <p style={{ margin: 0 }}>{s.body}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: '1.6rem' }}>
            <Link to="/register" className="btn btn-primary" style={{ padding: '0.85rem 1.7rem' }}>Get started</Link>
          </div>
        </div>
      </section>

      <section className="marketing-section" style={{ background: 'var(--color-surface)' }}>
        <div className="marketing-section-inner grid-2">
          <div>
            <h2>Follow-up consults</h2>
            <p>
              After a consultation, your doctor can schedule a follow-up — a lightweight check-in rather than a full
              new booking, so continuity of care doesn't depend on you remembering to re-book.
            </p>
          </div>
          <div>
            <h2>Ongoing care, together</h2>
            <p>Invite a family member or caregiver into your Care Circle so they can help you stay on top of care.</p>
          </div>
        </div>
        <div style={{ textAlign: 'center', marginTop: '1.4rem' }}>
          <Link to="/login" className="btn" style={{ background: 'var(--color-bg)' }}>Sign in</Link>
        </div>
      </section>

      <section className="marketing-section" id="navigator">
        <div className="marketing-section-inner feature-split">
          <div className="feature-icon-block">
            <LogoMark size={64} />
          </div>
          <div>
            <h2>Not sure where to start?</h2>
            <p>
              The AI Health Navigator asks a few simple questions and helps point you toward the right kind of care.
              It's guidance, not a diagnosis — and if it detects a possible emergency, it tells you to contact local
              emergency services right away rather than continuing the conversation.
            </p>
            <Link to="/register" className="btn btn-primary" style={{ marginTop: '0.4rem' }}>Ask the Navigator</Link>
          </div>
        </div>
      </section>

      <section className="marketing-section" id="faqs" style={{ background: 'var(--color-surface)' }}>
        <div className="marketing-section-inner" style={{ maxWidth: 760 }}>
          <h2 style={{ textAlign: 'center' }}>Frequently asked questions</h2>
          <div>
            {FAQS.map((f) => <FaqItem key={f.q} {...f} />)}
          </div>
        </div>
      </section>

      <section className="marketing-section">
        <div className="marketing-section-inner" style={{ textAlign: 'center' }}>
          <h2>Ready to get started?</h2>
          <p>Create an account and get matched to care in a few minutes.</p>
          <Link to="/register" className="btn btn-primary" style={{ padding: '0.85rem 1.7rem' }}>Create an account</Link>
        </div>
      </section>

      <footer className="footer-marketing">
        <div className="footer-marketing-inner">
          <div>
            <Logo size={24} dark />
            <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '0.8rem', maxWidth: 260 }}>
              Telehealth built for communities where the connection isn't always strong.
            </p>
          </div>
          <div>
            <h4>For patients</h4>
            <Link to="/login">Find & book care</Link>
            <Link to="/register">AI Health Navigator</Link>
            <Link to="/crisis-support">Crisis support</Link>
            <Link to="/login">Sign in</Link>
          </div>
          <div>
            <h4>For doctors</h4>
            <Link to="/register">Register as a doctor</Link>
            <Link to="/login">Doctor sign in</Link>
          </div>
          <div>
            <h4>Learn more</h4>
            <a href="#how-it-works">How it works</a>
            <a href="#faqs">FAQs</a>
          </div>
        </div>
        <div className="footer-marketing-bottom">© {new Date().getFullYear()} Forever Fit.</div>
      </footer>
    </div>
  );
}
