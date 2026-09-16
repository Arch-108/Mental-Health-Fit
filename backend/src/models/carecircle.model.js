const { pool } = require('../config/db');

async function invite(patientId, { caregiverEmail, scopes }) {
  const [result] = await pool.query(
    `INSERT INTO care_circle_members (patient_id, caregiver_email, scopes, status)
     VALUES (?, ?, ?, 'pending')`,
    [patientId, caregiverEmail, JSON.stringify(scopes)]
  );
  return result.insertId;
}

async function listForPatient(patientId) {
  const [rows] = await pool.query(
    'SELECT * FROM care_circle_members WHERE patient_id = ? ORDER BY created_at DESC',
    [patientId]
  );
  return rows;
}

// Caregivers accept using the email they registered with - this links
// their user_id and activates the grant. Deliberately does NOT
// auto-activate on invite; the caregiver must have an account and accept.
async function activateForCaregiverEmail(email, caregiverUserId) {
  await pool.query(
    `UPDATE care_circle_members SET status = 'active', caregiver_user_id = ?
     WHERE caregiver_email = ? AND status = 'pending'`,
    [caregiverUserId, email]
  );
}

async function revoke(id, patientId) {
  await pool.query(
    `UPDATE care_circle_members SET status = 'revoked' WHERE id = ? AND patient_id = ?`,
    [id, patientId]
  );
}

async function listForCaregiver(caregiverUserId) {
  const [rows] = await pool.query(
    `SELECT cc.*, pu.full_name AS patient_name
     FROM care_circle_members cc
     JOIN patients p ON p.id = cc.patient_id
     JOIN users pu ON pu.id = p.user_id
     WHERE cc.caregiver_user_id = ? AND cc.status = 'active'`,
    [caregiverUserId]
  );
  return rows;
}

module.exports = { invite, listForPatient, activateForCaregiverEmail, revoke, listForCaregiver };
