const { pool } = require('../config/db');

async function upsert(appointmentId, { structuredIntake, aiSummary }) {
  await pool.query(
    `INSERT INTO consultation_briefs (appointment_id, structured_intake, ai_summary)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE structured_intake = VALUES(structured_intake), ai_summary = VALUES(ai_summary)`,
    [appointmentId, JSON.stringify(structuredIntake), aiSummary]
  );
}

async function findByAppointmentId(appointmentId) {
  const [rows] = await pool.query('SELECT * FROM consultation_briefs WHERE appointment_id = ?', [appointmentId]);
  return rows[0] || null;
}

module.exports = { upsert, findByAppointmentId };
