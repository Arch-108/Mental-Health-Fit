const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const userModel = require('../models/user.model');
const emailService = require('../services/email.service');
const { pool } = require('../config/db');

const SALT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashResetToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// Never send the password hash back to the client, ever.
function sanitizeUser(user) {
  const { password_hash, ...safe } = user;
  return safe;
}

async function writeAuditLog(userId, action, resource) {
  try {
    await pool.query(
      'INSERT INTO audit_logs (user_id, action, resource) VALUES (?, ?, ?)',
      [userId, action, resource]
    );
  } catch (err) {
    // Audit logging must never crash the primary request flow -
    // log and continue.
    console.error('Audit log write failed:', err.message);
  }
}

async function register(req, res) {
  try {
    const { email, password, role, fullName, phone, specialty, licenseNumber } = req.body;

    if (!email || !password || !fullName) {
      return res.status(400).json({ error: 'email, password, and fullName are required.' });
    }

    // Role defaults to 'patient'. Doctor registrations should require an
    // admin verification step before they can accept bookings - that
    // workflow is built in the Appointments sprint, not here.
    const safeRole = role === 'doctor' ? 'doctor' : 'patient';

    const existing = await userModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const userId = await userModel.createUser({
      email,
      passwordHash,
      role: safeRole,
      fullName,
      phone,
    });

    if (safeRole === 'doctor') {
      await userModel.createDoctorProfile(userId, { specialty, licenseNumber });
    } else {
      await userModel.createPatientProfile(userId);
    }

    const user = await userModel.findById(userId);
    await writeAuditLog(userId, 'REGISTER', 'users');

    const token = signToken(user);
    return res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required.' });
    }

    const user = await userModel.findByEmail(email);
    // Deliberately identical error for "no such user" and "wrong password"
    // so login attempts can't be used to enumerate registered emails.
    if (!user || !user.is_active) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    await writeAuditLog(user.id, 'LOGIN', 'users');
    const token = signToken(user);
    return res.json({ token, user: sanitizeUser(user) });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
}

async function me(req, res) {
  // req.user is populated by the auth middleware after verifying the JWT
  const user = await userModel.findByIdWithProfile(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found.' });
  return res.json({ user: sanitizeUser(user) });
}

async function updateMe(req, res) {
  try {
    const { fullName, phone, specialty, licenseNumber, bio } = req.body;
    if (!fullName) return res.status(400).json({ error: 'fullName is required.' });

    await userModel.updateProfile(req.user.id, { fullName, phone });
    if (req.user.role === 'doctor') {
      // Fall back to the doctor's current values for any field the client
      // didn't send, so an edit to just one field can't blank the others.
      const current = await userModel.findByIdWithProfile(req.user.id);
      await userModel.updateDoctorProfile(req.user.id, {
        specialty: specialty ?? current.specialty,
        licenseNumber: licenseNumber ?? current.license_number,
        bio: bio ?? current.bio,
      });
    }

    const user = await userModel.findByIdWithProfile(req.user.id);
    await writeAuditLog(req.user.id, 'UPDATE_PROFILE', 'users');
    return res.json({ user: sanitizeUser(user) });
  } catch (err) {
    console.error('updateMe error:', err);
    return res.status(500).json({ error: 'Could not update your profile.' });
  }
}

async function changePassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword and newPassword are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }

    const user = await userModel.findById(req.user.id);
    const match = await bcrypt.compare(currentPassword, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Current password is incorrect.' });

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await userModel.updatePasswordHash(req.user.id, passwordHash);
    await writeAuditLog(req.user.id, 'CHANGE_PASSWORD', 'users');
    return res.json({ message: 'Password updated.' });
  } catch (err) {
    console.error('changePassword error:', err);
    return res.status(500).json({ error: 'Could not change your password.' });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'email is required.' });

    const user = await userModel.findByEmail(email);
    // Always return the same generic success response whether or not the
    // account exists - otherwise this endpoint could be used to check
    // which emails are registered. The email (or dev-mode link, see
    // below) is the only place a real difference shows up.
    const genericResponse = { message: "If an account with that email exists, we've sent password reset instructions." };

    if (!user || !user.is_active) {
      return res.json(genericResponse);
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = hashResetToken(rawToken);
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);
    await userModel.setResetToken(user.id, tokenHash, expiresAt);
    await writeAuditLog(user.id, 'FORGOT_PASSWORD_REQUEST', 'users');

    // FRONTEND_URL may be a comma-separated list (see server.js CORS) -
    // the first entry is treated as the canonical public URL for links.
    const frontendBase = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',')[0].trim();
    const resetLink = `${frontendBase}/reset-password?token=${rawToken}`;

    const result = await emailService.sendPasswordResetEmail(user.email, resetLink);

    // Only ever include the raw link in the API response when nothing was
    // actually emailed (no SMTP configured) - a real deployment with email
    // configured never leaks reset links over the API, only to the inbox.
    if (!result.sent) {
      return res.json({ ...genericResponse, devPreviewLink: result.previewLink });
    }
    return res.json(genericResponse);
  } catch (err) {
    console.error('forgotPassword error:', err);
    return res.status(500).json({ error: 'Could not process that request right now.' });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'token and newPassword are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }

    const tokenHash = hashResetToken(token);
    const user = await userModel.findByResetTokenHash(tokenHash);
    if (!user) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired. Request a new one.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await userModel.updatePasswordHash(user.id, passwordHash);
    await userModel.clearResetToken(user.id); // single-use
    await writeAuditLog(user.id, 'RESET_PASSWORD', 'users');

    return res.json({ message: 'Password updated. You can now sign in with your new password.' });
  } catch (err) {
    console.error('resetPassword error:', err);
    return res.status(500).json({ error: 'Could not reset your password right now.' });
  }
}

module.exports = { register, login, me, updateMe, changePassword, forgotPassword, resetPassword };
