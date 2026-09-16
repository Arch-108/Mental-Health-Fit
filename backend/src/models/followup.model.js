const { pool } = require('../config/db');

async function schedule(consultationId, dueDate) {
  const [result] = await pool.query(
    `INSERT INTO follow_ups (consultation_id, due_date, status) VALUES (?, ?, 'pending')`,
    [consultationId, dueDate]
  );
  return result.insertId;
}

async function submitResponse(id, { patientResponse, aiSummary }) {
  await pool.query(
    `UPDATE follow_ups SET patient_response = ?, ai_summary = ?, status = 'submitted' WHERE id = ?`,
    [patientResponse, aiSummary, id]
  );
}

async function markReviewed(id) {
  await pool.query(`UPDATE follow_ups SET status = 'reviewed', doctor_reviewed_at = NOW() WHERE id = ?`, [id]);
}

async function listForPatient(patientId) {
  const [rows] = await pool.query(
    `SELECT f.*, c.appointment_id, a.doctor_id, du.full_name AS doctor_name
     FROM follow_ups f
     JOIN consultations c ON c.id = f.consultation_id
     JOIN appointments a ON a.id = c.appointment_id
     JOIN doctors d ON d.id = a.doctor_id
     JOIN users du ON du.id = d.user_id
     WHERE a.patient_id = (SELECT id FROM patients WHERE user_id = ?)
     ORDER BY f.due_date DESC`,
    [patientId]
  );
  return rows;
}

async function listForDoctor(doctorUserId) {
  const [rows] = await pool.query(
    `SELECT f.*, a.id AS appointment_id, pu.full_name AS patient_name
     FROM follow_ups f
     JOIN consultations c ON c.id = f.consultation_id
     JOIN appointments a ON a.id = c.appointment_id
     JOIN doctors d ON d.id = a.doctor_id
     JOIN patients p ON p.id = a.patient_id
     JOIN users pu ON pu.id = p.user_id
     WHERE d.user_id = ?
     ORDER BY f.due_date DESC`,
    [doctorUserId]
  );
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM follow_ups WHERE id = ?', [id]);
  return rows[0] || null;
}

module.exports = { schedule, submitResponse, markReviewed, listForPatient, listForDoctor, findById };
