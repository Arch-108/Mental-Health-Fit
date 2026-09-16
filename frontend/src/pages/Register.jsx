import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthLayout from '../components/AuthLayout';
import { register } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [form, setForm] = useState({
    fullName: '',
    email: '',
    password: '',
    role: 'patient',
    specialty: '',
    licenseNumber: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { loginSuccess } = useAuth();
  const navigate = useNavigate();

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const data = await register(form);
      loginSuccess(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err?.response?.data?.error || 'Could not create your account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="It only takes a minute.">
      {error && <div className="error-banner">{error}</div>}
      <form onSubmit={handleSubmit}>
        <label htmlFor="fullName">Full name</label>
        <input
          id="fullName"
          value={form.fullName}
          onChange={(e) => update('fullName', e.target.value)}
          required
          style={{ marginBottom: '1rem' }}
        />

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          required
          style={{ marginBottom: '1rem' }}
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={form.password}
          onChange={(e) => update('password', e.target.value)}
          required
          minLength={8}
          style={{ marginBottom: '1rem' }}
        />
        <p style={{ marginTop: '-0.6rem', fontSize: '0.82rem' }}>At least 8 characters.</p>

        <label htmlFor="role">I am a</label>
        <select
          id="role"
          value={form.role}
          onChange={(e) => update('role', e.target.value)}
          style={{ marginBottom: '1rem' }}
        >
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
        </select>

        {form.role === 'doctor' && (
          <>
            <label htmlFor="specialty">Specialty</label>
            <input
              id="specialty"
              value={form.specialty}
              onChange={(e) => update('specialty', e.target.value)}
              style={{ marginBottom: '1rem' }}
            />
            <label htmlFor="licenseNumber">License number</label>
            <input
              id="licenseNumber"
              value={form.licenseNumber}
              onChange={(e) => update('licenseNumber', e.target.value)}
              style={{ marginBottom: '1rem' }}
            />
            <p style={{ marginTop: '-0.6rem', fontSize: '0.82rem' }}>
              Doctor accounts are reviewed before they can accept bookings.
            </p>
          </>
        )}

        <button className="btn btn-primary btn-block" type="submit" disabled={submitting} style={{ marginTop: '0.4rem' }}>
          {submitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>
      <p style={{ marginTop: '1.2rem', textAlign: 'center' }}>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  );
}
