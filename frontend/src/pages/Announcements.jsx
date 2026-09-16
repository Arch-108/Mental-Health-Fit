import { useEffect, useState } from 'react';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { listAnnouncements, createAnnouncement } from '../services/api';

export default function Announcements() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const rows = await listAnnouncements().catch(() => []);
    setAnnouncements(rows);
    setLoading(false);
  }

  async function submit(e) {
    e.preventDefault();
    setMessage('');
    setPosting(true);
    try {
      await createAnnouncement({ title, body });
      setTitle('');
      setBody('');
      load();
    } catch (err) {
      setMessage(err?.response?.data?.error || 'Could not post this announcement.');
    } finally {
      setPosting(false);
    }
  }

  return (
    <AppShell>
      <h1>Announcements</h1>
      <p>Platform-wide updates from admin, visible to every doctor and admin.</p>

      {user?.role === 'admin' && (
        <form className="card" onSubmit={submit} style={{ marginBottom: '1.2rem' }}>
          <h3>Post an announcement</h3>
          {message && <div className="error-banner">{message}</div>}
          <label htmlFor="title">Title</label>
          <input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ marginBottom: '0.8rem' }} />
          <label htmlFor="body">Message</label>
          <textarea id="body" rows={3} value={body} onChange={(e) => setBody(e.target.value)} required style={{ marginBottom: '1rem' }} />
          <button className="btn btn-primary" type="submit" disabled={posting || !title.trim() || !body.trim()}>
            {posting ? 'Posting…' : 'Post announcement'}
          </button>
        </form>
      )}

      {loading && <p>Loading…</p>}
      {!loading && announcements.length === 0 && <p>No announcements yet.</p>}
      {announcements.map((a) => (
        <div key={a.id} className="card" style={{ marginBottom: '0.9rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.4rem' }}>
            <h3 style={{ margin: 0 }}>{a.title}</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
              {a.authorName} · {new Date(a.created_at).toLocaleString()}
            </span>
          </div>
          <p style={{ margin: '0.5rem 0 0' }}>{a.body}</p>
        </div>
      ))}
    </AppShell>
  );
}
