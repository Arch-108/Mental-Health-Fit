const { pool } = require('../config/db');

async function addEntry({ patientId, entryType, title, content, createdBy }) {
  const [result] = await pool.query(
    `INSERT INTO medical_records (patient_id, entry_type, title, content, created_by)
     VALUES (?, ?, ?, ?, ?)`,
    [patientId, entryType, title, content || null, createdBy || null]
  );
  return result.insertId;
}

async function timelineForPatient(patientId) {
  const [rows] = await pool.query(
    `SELECT r.*, u.full_name AS created_by_name
     FROM medical_records r
     LEFT JOIN users u ON u.id = r.created_by
     WHERE r.patient_id = ?
     ORDER BY r.created_at DESC`,
    [patientId]
  );
  return rows;
}

module.exports = { addEntry, timelineForPatient };
