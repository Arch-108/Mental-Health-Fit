import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';
import { IconMenu, IconClose, IconChevronDown } from './Icons';

const SERVICES = [
  { href: '#how-it-works', label: 'How Forever Fit works' },
  { href: '#wellbeing', label: 'Ongoing & maternal care' },
  { href: '#navigator', label: 'AI Health Navigator' },
  { href: '/crisis-support', label: 'Crisis support', route: true },
];

function ServiceLink({ href, label, route, onClick }) {
  return route ? (
    <Link to={href} onClick={onClick}>{label}</Link>
  ) : (
    <a href={href} onClick={onClick}>{label}</a>
  );
}

export default function PublicNav() {
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setServicesOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <header className="app-topnav">
      <div className="app-topnav-inner">
        <Link to="/" className="app-brand">
          <Logo size={26} />
        </Link>

        <nav className="app-nav-desktop" aria-label="Main navigation">
          <a className="app-nav-link" href="#how-it-works">How it works</a>
          <div className="app-nav-dropdown" ref={ref}>
            <button
              type="button"
              className={`app-nav-dropdown-trigger ${servicesOpen ? 'open' : ''}`}
              onClick={() => setServicesOpen((o) => !o)}
              aria-expanded={servicesOpen}
              aria-haspopup="true"
            >
              Services <IconChevronDown size={13} />
            </button>
            {servicesOpen && (
              <div className="app-nav-dropdown-menu" role="menu">
                {SERVICES.map((s) => (
                  <ServiceLink key={s.href} {...s} onClick={() => setServicesOpen(false)} />
                ))}
              </div>
            )}
          </div>
          <a className="app-nav-link" href="#faqs">FAQs</a>
        </nav>

        <div className="app-topnav-right">
          <Link to="/login" className="btn public-nav-cta-top" style={{ background: 'transparent', border: '1px solid var(--color-border)' }}>
            Sign in
          </Link>
          <Link to="/register" className="btn btn-primary public-nav-cta-top">
            Get started
          </Link>
          <button
            className="hamburger-btn"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <IconClose size={22} /> : <IconMenu size={22} />}
          </button>
        </div>
      </div>

      <nav className={`app-nav-mobile ${mobileOpen ? 'open' : ''}`} aria-label="Mobile navigation">
        <a href="#how-it-works" onClick={() => setMobileOpen(false)}>How it works</a>
        <div className="app-nav-mobile-group-label">Services</div>
        {SERVICES.map((s) => (
          <ServiceLink key={s.href} {...s} onClick={() => setMobileOpen(false)} />
        ))}
        <a href="#faqs" onClick={() => setMobileOpen(false)}>FAQs</a>
        <div style={{ display: 'flex', gap: '0.6rem', marginTop: '0.8rem' }}>
          <Link to="/login" className="btn" style={{ flex: 1, background: 'var(--color-bg)' }} onClick={() => setMobileOpen(false)}>
            Sign in
          </Link>
          <Link to="/register" className="btn btn-primary" style={{ flex: 1 }} onClick={() => setMobileOpen(false)}>
            Get started
          </Link>
        </div>
      </nav>
    </header>
  );
}
