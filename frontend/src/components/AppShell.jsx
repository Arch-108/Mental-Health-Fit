import { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ConnectionStatus from './ConnectionStatus';
import NotificationBell from './NotificationBell';
import ThemeToggle from './ThemeToggle';
import { Logo } from './Logo';
import { IconMenu, IconClose, IconChevronDown, IconLogout } from './Icons';

const NAV_CONFIG = {
  patient: [
    { type: 'link', to: '/dashboard', label: 'Your Care Today' },
    { type: 'link', to: '/find-doctors', label: 'Find & Book' },
    { type: 'link', to: '/navigator', label: 'AI Health Navigator' },
    {
      type: 'dropdown',
      label: 'My Health',
      items: [
        { to: '/journey', label: 'My Health Journey' },
        { to: '/vitals', label: 'Vitals Monitoring' },
        { to: '/maternal-care', label: 'Maternal Care' },
        { to: '/analytics', label: 'My Activity' },
      ],
    },
    {
      type: 'dropdown',
      label: 'Support',
      items: [
        { to: '/followups', label: 'Follow-ups' },
        { to: '/care-circle', label: 'Care Circle' },
        { to: '/resource-map', label: 'Resource Map' },
        { to: '/crisis-support', label: 'Crisis Support' },
        { to: '/profile', label: 'Profile' },
      ],
    },
  ],
  doctor: [
    { type: 'link', to: '/dashboard', label: "Today's Care" },
    { type: 'link', to: '/availability', label: 'My Availability' },
    { type: 'link', to: '/followups', label: 'Follow-ups' },
    {
      type: 'dropdown',
      label: 'More',
      items: [
        { to: '/resource-map', label: 'Resource Map' },
        { to: '/analytics', label: 'My Performance' },
        { to: '/vaccination-routes', label: 'Vaccination Outreach' },
        { to: '/crisis-support', label: 'Crisis Support' },
      ],
    },
    {
      type: 'dropdown',
      label: 'Team',
      items: [
        { to: '/messages', label: 'Messages' },
        { to: '/announcements', label: 'Announcements' },
        { to: '/profile', label: 'Profile' },
      ],
    },
  ],
  admin: [
    { type: 'link', to: '/dashboard', label: 'Overview' },
    { type: 'link', to: '/admin', label: 'Doctor Verification' },
    { type: 'link', to: '/vaccination-routes', label: 'Vaccination Outreach' },
    {
      type: 'dropdown',
      label: 'Team',
      items: [
        { to: '/messages', label: 'Messages' },
        { to: '/announcements', label: 'Announcements' },
        { to: '/profile', label: 'Profile' },
      ],
    },
  ],
};

// Desktop dropdown for a group of secondary links - click to open, closes on
// outside click or on navigating to one of its items.
function NavDropdown({ label, items, pathname }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const isActive = items.some((i) => i.to === pathname);

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  return (
    <div className="app-nav-dropdown" ref={ref}>
      <button
        type="button"
        className={`app-nav-dropdown-trigger ${open ? 'open' : ''} ${isActive ? 'active' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {label} <IconChevronDown size={13} className="app-nav-dropdown-caret" />
      </button>
      {open && (
        <div className="app-nav-dropdown-menu" role="menu">
          {items.map((i) => (
            <Link key={i.to} to={i.to} className={pathname === i.to ? 'active' : ''} onClick={() => setOpen(false)}>
              {i.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AppShell({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const groups = NAV_CONFIG[user?.role] || NAV_CONFIG.patient;

  // Close the mobile menu automatically whenever the route changes, whether
  // that came from a nav click or elsewhere (e.g. a redirect after login).
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-shell" data-role={user?.role || 'patient'}>
      <header className="app-topnav">
        <div className="app-topnav-inner">
          <Link to="/dashboard" className="app-brand">
            <Logo size={26} />
          </Link>

          <nav className="app-nav-desktop" aria-label="Main navigation">
            {groups.map((g) =>
              g.type === 'dropdown' ? (
                <NavDropdown key={g.label} label={g.label} items={g.items} pathname={location.pathname} />
              ) : (
                <Link
                  key={g.to}
                  to={g.to}
                  className={`app-nav-link ${location.pathname === g.to ? 'active' : ''}`}
                >
                  {g.label}
                </Link>
              )
            )}
          </nav>

          <div className="app-topnav-right">
            <span className="app-conn-status-top">
              <ConnectionStatus />
            </span>
            <NotificationBell />
            <ThemeToggle />
            <span className="app-user-label">
              {user?.full_name} · {user?.role}
            </span>
            <button className="btn app-logout-btn app-logout-btn-top" onClick={logout}>
              <IconLogout size={16} /> Log out
            </button>
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
          {groups.map((g) =>
            g.type === 'dropdown' ? (
              <div key={g.label}>
                <div className="app-nav-mobile-group-label">{g.label}</div>
                {g.items.map((i) => (
                  <Link key={i.to} to={i.to} className={location.pathname === i.to ? 'active' : ''}>
                    {i.label}
                  </Link>
                ))}
              </div>
            ) : (
              <Link key={g.to} to={g.to} className={location.pathname === g.to ? 'active' : ''}>
                {g.label}
              </Link>
            )
          )}
          <button className="btn app-logout-btn" style={{ marginTop: '0.8rem', width: '100%' }} onClick={logout}>
            <IconLogout size={16} /> Log out
          </button>
        </nav>
      </header>

      <main className="app-main">
        <div className="app-content">{children}</div>
      </main>
    </div>
  );
}
