import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { forgotPassword } from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await forgotPassword(email);
      setResult(data);
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not process that request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Forgot your password?" subtitle="Enter your email and we'll send you a link to reset it.">
      {error && <div className="error-banner">{error}</div>}

      {result ? (
        <div>
          <p>{result.message}</p>
          {/* devPreviewLink only ever appears when no email service is configured on the
              backend (see backend/src/services/email.service.js) - it's how this feature
              stays fully testable before you've set up real SMTP credentials. */}
          {result.devPreviewLink && (
            <div className="card" style={{ background: 'var(--color-accent-tint)', marginTop: '1rem' }}>
              <p style={{ margin: '0 0 0.6rem', fontWeight: 600 }}>
                No email service is configured yet, so here's your reset link directly:
              </p>
              <a href={result.devPreviewLink} style={{ wordBreak: 'break-all', fontSize: '0.85rem' }}>
                {result.devPreviewLink}
              </a>
            </div>
          )}
          <p style={{ marginTop: '1.2rem', textAlign: 'center' }}>
            <Link to="/login">Back to sign in</Link>
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            style={{ marginBottom: '1.4rem' }}
          />
          <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
            {submitting ? 'Sending…' : 'Send reset link'}
          </button>
          <p style={{ marginTop: '1.2rem', textAlign: 'center' }}>
            <Link to="/login">Back to sign in</Link>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}
