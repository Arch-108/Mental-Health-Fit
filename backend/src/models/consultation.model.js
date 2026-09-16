const crypto = require('crypto');
const { pool } = require('../config/db');

async function createForAppointment(appointmentId) {
  const roomCode = crypto.randomBytes(9).toString('hex');
  const [result] = await pool.query(
    `INSERT INTO consultations (appointment_id, room_code, connection_mode_log)
     VALUES (?, ?, JSON_ARRAY())`,
    [appointmentId, roomCode]
  );
  return { id: result.insertId, roomCode };
}

async function findByAppointmentId(appointmentId) {
  const [rows] = await pool.query('SELECT * FROM consultations WHERE appointment_id = ?', [appointmentId]);
  return rows[0] || null;
}

async function findByRoomCode(roomCode) {
  const [rows] = await pool.query('SELECT * FROM consultations WHERE room_code = ?', [roomCode]);
  return rows[0] || null;
}

async function markStarted(id) {
  await pool.query('UPDATE consultations SET started_at = NOW() WHERE id = ? AND started_at IS NULL', [id]);
}

async function markEnded(id, notes) {
  await pool.query('UPDATE consultations SET ended_at = NOW(), notes = COALESCE(?, notes) WHERE id = ?', [notes || null, id]);
}

async function logModeChange(id, mode) {
  await pool.query(
    `UPDATE consultations
     SET connection_mode_log = JSON_ARRAY_APPEND(connection_mode_log, '$', JSON_OBJECT('mode', ?, 'at', NOW()))
     WHERE id = ?`,
    [mode, id]
  );
}

async function addAsyncSubmission({ consultationId, senderRole, message, imagePath }) {
  const [result] = await pool.query(
    `INSERT INTO async_submissions (consultation_id, sender_role, message, image_path)
     VALUES (?, ?, ?, ?)`,
    [consultationId, senderRole, message || null, imagePath || null]
  );
  return result.insertId;
}

async function listAsyncSubmissions(consultationId) {
  const [rows] = await pool.query(
    'SELECT * FROM async_submissions WHERE consultation_id = ? ORDER BY created_at ASC',
    [consultationId]
  );
  return rows;
}

async function addPrescription(consultationId, { medication, instructions }) {
  await pool.query(
    'INSERT INTO prescriptions (consultation_id, medication, instructions) VALUES (?, ?, ?)',
    [consultationId, medication, instructions || null]
  );
}

async function listPrescriptions(consultationId) {
  const [rows] = await pool.query('SELECT * FROM prescriptions WHERE consultation_id = ?', [consultationId]);
  return rows;
}

module.exports = {
  createForAppointment,
  findByAppointmentId,
  findByRoomCode,
  markStarted,
  markEnded,
  logModeChange,
  addAsyncSubmission,
  listAsyncSubmissions,
  addPrescription,
  listPrescriptions,
};
