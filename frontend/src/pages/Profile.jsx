import { useState } from 'react';
import AppShell from '../components/AppShell';
import { useAuth } from '../context/AuthContext';
import { updateProfile, changePassword } from '../services/api';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const isDoctor = user?.role === 'doctor';

  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [specialty, setSpecialty] = useState(user?.specialty || '');
  const [licenseNumber, setLicenseNumber] = useState(user?.license_number || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profileMessage, setProfileMessage] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  async function saveProfile(e) {
    e.preventDefault();
    setProfileMessage('');
    setSavingProfile(true);
    try {
      const { user: updated } = await updateProfile({ fullName, phone, specialty, licenseNumber, bio });
      updateUser(updated);
      setProfileMessage('Profile updated.');
    } catch (err) {
      setProfileMessage(err?.response?.data?.error || 'Could not update your profile.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function submitPasswordChange(e) {
    e.preventDefault();
    setPasswordMessage('');
    if (newPassword !== confirmPassword) {
      setPasswordMessage("New password and confirmation don't match.");
      return;
    }
    setChangingPassword(true);
    try {
      await changePassword({ currentPassword, newPassword });
      setPasswordMessage('Password updated.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMessage(err?.response?.data?.error || 'Could not change your password.');
    } finally {
      setChangingPassword(false);
    }
  }

  return (
    <AppShell>
      <h1>Profile</h1>
      <p>Your account details and sign-in security.</p>

      <div className="grid-2">
        <form className="card" onSubmit={saveProfile}>
          <h3>Your details</h3>
          {profileMessage && <div className={profileMessage === 'Profile updated.' ? 'card' : 'error-banner'} style={profileMessage === 'Profile updated.' ? { background: 'color-mix(in srgb, var(--color-success) 10%, var(--color-surface))', marginBottom: '1rem' } : { marginBottom: '1rem' }}>{profileMessage}</div>}

          <label htmlFor="fullName">Full name</label>
          <input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={{ marginBottom: '1rem' }} />

          <label htmlFor="phone">Phone</label>
          <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} style={{ marginBottom: '1rem' }} />

          <label>Email</label>
          <input value={user?.email || ''} disabled style={{ marginBottom: '1rem', opacity: 0.65 }} />

          {isDoctor && (
            <>
              <label htmlFor="specialty">Specialty</label>
              <input id="specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)} style={{ marginBottom: '1rem' }} />

              <label htmlFor="licenseNumber">License number</label>
              <input id="licenseNumber" value={licenseNumber} onChange={(e) => setLicenseNumber(e.target.value)} style={{ marginBottom: '1rem' }} />

              <label htmlFor="bio">Bio (shown to patients when they browse doctors)</label>
              <textarea id="bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} style={{ marginBottom: '1rem' }} />
            </>
          )}

          <button className="btn btn-primary" type="submit" disabled={savingProfile}>
            {savingProfile ? 'Saving…' : 'Save changes'}
          </button>
        </form>

        <form className="card" onSubmit={submitPasswordChange}>
          <h3>Change password</h3>
          {passwordMessage && <div className={passwordMessage === 'Password updated.' ? 'card' : 'error-banner'} style={passwordMessage === 'Password updated.' ? { background: 'color-mix(in srgb, var(--color-success) 10%, var(--color-surface))', marginBottom: '1rem' } : { marginBottom: '1rem' }}>{passwordMessage}</div>}

          <label htmlFor="currentPassword">Current password</label>
          <input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required autoComplete="current-password" style={{ marginBottom: '1rem' }} />

          <label htmlFor="newPassword">New password</label>
          <input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required minLength={8} autoComplete="new-password" style={{ marginBottom: '1rem' }} />

          <label htmlFor="confirmPassword">Confirm new password</label>
          <input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={8} autoComplete="new-password" style={{ marginBottom: '1rem' }} />

          <button className="btn btn-primary" type="submit" disabled={changingPassword}>
            {changingPassword ? 'Updating…' : 'Update password'}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
