import { useEffect, useState } from 'react';
import { listMyNotifications, markNotificationRead } from '../services/api';
import { IconBell } from './Icons';

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    listMyNotifications()
      .then((n) => mounted && setNotifications(n))
      .catch(() => {}); // silent - notifications are non-critical
    return () => { mounted = false; };
  }, []);

  const unread = notifications.filter((n) => !n.is_read).length;

  async function handleOpen() {
    setOpen((o) => !o);
  }

  async function handleRead(id) {
    await markNotificationRead(id).catch(() => {});
    setNotifications((list) => list.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }

  return (
    <div style={{ position: 'relative' }}>
      <button className="btn" style={styles.bellBtn} onClick={handleOpen} aria-label="Notifications">
        <IconBell size={19} /> {unread > 0 && <span style={styles.badge}>{unread}</span>}
      </button>
      {open && (
        <div style={styles.dropdown}>
          {notifications.length === 0 && <p style={{ margin: 0 }}>No notifications yet.</p>}
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleRead(n.id)}
              style={{ ...styles.item, opacity: n.is_read ? 0.55 : 1 }}
            >
              {n.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const styles = {
  bellBtn: { background: 'transparent', position: 'relative', color: 'var(--color-text-muted)' },
  badge: {
    position: 'absolute', top: -2, right: -2, background: '#B3432B', color: 'white',
    borderRadius: 999, fontSize: '0.65rem', padding: '1px 5px',
  },
  dropdown: {
    position: 'absolute', right: 0, top: '2.4rem', width: 280, background: 'var(--color-surface)',
    border: '1px solid var(--color-border)', borderRadius: 12, boxShadow: 'var(--shadow-card)',
    padding: '0.6rem', zIndex: 20, maxHeight: 320, overflowY: 'auto',
  },
  item: { padding: '0.6rem', fontSize: '0.85rem', borderBottom: '1px solid var(--color-border)', cursor: 'pointer', color: 'var(--color-text)' },
};
