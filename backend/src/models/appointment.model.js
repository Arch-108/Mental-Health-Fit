const { pool } = require('../config/db');

// MySQL's DATETIME column rejects the ISO format the browser sends
// (e.g. "2026-09-15T23:00:00.000Z") - it needs "2026-09-15 23:00:00".
function toMysqlDatetime(isoString) {
  return new Date(isoString).toISOString().slice(0, 19).replace('T', ' ');
}

async function create({ patientId, doctorId, scheduledAt, reason }) {
  const [result] = await pool.query(
    `INSERT INTO appointments (patient_id, doctor_id, scheduled_at, reason, status)
     VALUES (?, ?, ?, ?, 'confirmed')`,
    [patientId, doctorId, toMysqlDatetime(scheduledAt), reason || null]
  );
  return result.insertId;
}
async function findById(id) {
  const [rows] = await pool.query(
    `SELECT a.*, 
            pu.full_name AS patient_name, du.full_name AS doctor_name, d.specialty
     FROM appointments a
     JOIN patients p ON p.id = a.patient_id
     JOIN users pu ON pu.id = p.user_id
     JOIN doctors d ON d.id = a.doctor_id
     JOIN users du ON du.id = d.user_id
     WHERE a.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function listForPatient(patientId) {
  const [rows] = await pool.query(
    `SELECT a.*, du.full_name AS doctor_name, d.specialty
     FROM appointments a
     JOIN doctors d ON d.id = a.doctor_id
     JOIN users du ON du.id = d.user_id
     WHERE a.patient_id = ?
     ORDER BY a.scheduled_at DESC`,
    [patientId]
  );
  return rows;
}

async function listForDoctor(doctorId) {
  const [rows] = await pool.query(
    `SELECT a.*, pu.full_name AS patient_name
     FROM appointments a
     JOIN patients p ON p.id = a.patient_id
     JOIN users pu ON pu.id = p.user_id
     WHERE a.doctor_id = ?
     ORDER BY a.scheduled_at DESC`,
    [doctorId]
  );
  return rows;
}

async function updateStatus(id, status) {
  await pool.query('UPDATE appointments SET status = ? WHERE id = ?', [status, id]);
}

module.exports = { create, findById, listForPatient, listForDoctor, updateStatus };
