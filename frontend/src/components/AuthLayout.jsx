import { Link } from 'react-router-dom';
import { Logo } from './Logo';

// Shared shell for Login/Register. The left panel carries the brand
// narrative (location -> connection -> healthcare) referenced in the
// design concept; the right panel holds the actual form. The logo links
// back to the marketing homepage - otherwise there's no way out of the
// auth screens back to "/" once you're here (or once you've logged out
// and landed back on /login).
export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="auth-wrapper">
      <div className="auth-brand-panel">
        <Link to="/" style={{ display: 'inline-block', marginBottom: '2.5rem' }}>
          <Logo size={30} dark />
        </Link>
        <h1 style={styles.brandHeadline}>
          Healthcare that reaches you — wherever you are.
        </h1>
        <p style={styles.brandSub}>
          Built for places where the connection isn't always strong, but the
          need for care always is.
        </p>
        <div style={styles.pillRow}>
          <span style={styles.pill}><span style={{ color: '#E8A83C' }}>●</span> Adapts to your connection</span>
          <span style={styles.pill}><span style={{ color: '#E8A83C' }}>●</span> Guided, not generic</span>
        </div>
      </div>

      <div className="auth-form-panel">
        <div className="card" style={{ width: '100%', maxWidth: 420 }}>
          <Link to="/" style={{ display: 'inline-block', marginBottom: '1.6rem' }}>
            <Logo size={24} />
          </Link>
          <h2>{title}</h2>
          {subtitle && <p>{subtitle}</p>}
          {children}
        </div>
      </div>
    </div>
  );
}

const styles = {
  brandHeadline: {
    fontFamily: 'Manrope, sans-serif',
    fontSize: '2.3rem',
    fontWeight: 700,
    color: 'white',
    maxWidth: 440,
  },
  brandSub: {
    color: 'rgba(255,255,255,0.85)',
    maxWidth: 400,
  },
  pillRow: { display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '1rem' },
  pill: {
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.25)',
    borderRadius: 999,
    padding: '0.4rem 0.9rem',
    fontSize: '0.85rem',
  },
};
