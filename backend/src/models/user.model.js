// Thin data-access layer over the `users` table (+ role-specific profile
// tables). Kept as plain SQL via mysql2 rather than a full ORM to stay
// within capstone scope - easy to read, easy to defend in a viva.

const { pool } = require('../config/db');

async function findByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] || null;
}

// Like findById, but also brings in doctor-only profile fields (specialty,
// license number, bio, verification status) via a LEFT JOIN - null for
// patients/admins. Used wherever the client needs to see/edit those fields
// (GET/PUT /auth/me), so a profile save never has to guess at values it
// was never shown and risk overwriting them with blanks.
async function findByIdWithProfile(id) {
  const [rows] = await pool.query(
    `SELECT u.*, d.specialty, d.license_number, d.bio, d.verification_status
     FROM users u
     LEFT JOIN doctors d ON d.user_id = u.id
     WHERE u.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function createUser({ email, passwordHash, role, fullName, phone }) {
  const [result] = await pool.query(
    `INSERT INTO users (email, password_hash, role, full_name, phone)
     VALUES (?, ?, ?, ?, ?)`,
    [email, passwordHash, role, fullName, phone || null]
  );
  return result.insertId;
}

async function createPatientProfile(userId) {
  await pool.query('INSERT INTO patients (user_id) VALUES (?)', [userId]);
}

async function createDoctorProfile(userId, { specialty, licenseNumber }) {
  await pool.query(
    `INSERT INTO doctors (user_id, specialty, license_number, verification_status)
     VALUES (?, ?, ?, 'pending')`,
    [userId, specialty || null, licenseNumber || null]
  );
}

async function updateProfile(userId, { fullName, phone }) {
  await pool.query('UPDATE users SET full_name = ?, phone = ? WHERE id = ?', [fullName, phone || null, userId]);
}

// Doctor-only fields - a no-op (0 rows affected) for non-doctor users,
// since there's no doctors row to update for them.
async function updateDoctorProfile(userId, { specialty, licenseNumber, bio }) {
  await pool.query(
    'UPDATE doctors SET specialty = ?, license_number = ?, bio = ? WHERE user_id = ?',
    [specialty || null, licenseNumber || null, bio || null, userId]
  );
}

async function updatePasswordHash(userId, passwordHash) {
  await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
}

// Only ever stores a HASH of the reset token (never the raw token that
// goes in the email link) - same principle as password_hash never storing
// the real password. If someone reads the DB, they still can't reset a
// user's password with what they find.
async function setResetToken(userId, tokenHash, expiresAt) {
  await pool.query(
    'UPDATE users SET reset_token_hash = ?, reset_token_expires = ? WHERE id = ?',
    [tokenHash, expiresAt, userId]
  );
}

async function findByResetTokenHash(tokenHash) {
  const [rows] = await pool.query(
    'SELECT * FROM users WHERE reset_token_hash = ? AND reset_token_expires > NOW()',
    [tokenHash]
  );
  return rows[0] || null;
}

async function clearResetToken(userId) {
  await pool.query('UPDATE users SET reset_token_hash = NULL, reset_token_expires = NULL WHERE id = ?', [userId]);
}

module.exports = {
  findByEmail,
  findById,
  findByIdWithProfile,
  createUser,
  createPatientProfile,
  createDoctorProfile,
  updateProfile,
  updateDoctorProfile,
  updatePasswordHash,
  setResetToken,
  findByResetTokenHash,
  clearResetToken,
};
