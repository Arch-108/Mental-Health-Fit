const { pool } = require('../config/db');

// Simple, transparent range check - NOT a clinical algorithm. Flags a log
// for the patient's own awareness and suggests contacting their care team;
// it never diagnoses and never contacts anyone automatically.
function evaluateFlag({ heartRate, spo2 }) {
  if (spo2 && spo2 < 92) return 'Oxygen saturation reading was below 92%.';
  if (heartRate && (heartRate > 120 || heartRate < 45)) return 'Heart rate reading was outside the typical resting range.';
  return null;
}

async function addLog(patientId, { heartRate, spo2, steps, sleepHours }) {
  const flagReason = evaluateFlag({ heartRate, spo2 });
  const [result] = await pool.query(
    `INSERT INTO vitals_logs (patient_id, heart_rate, spo2, steps, sleep_hours, flagged, flag_reason)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [patientId, heartRate || null, spo2 || null, steps || null, sleepHours || null, !!flagReason, flagReason]
  );
  return { id: result.insertId, flagged: !!flagReason, flagReason };
}

async function listForPatient(patientId, limit = 60) {
  const [rows] = await pool.query(
    'SELECT * FROM vitals_logs WHERE patient_id = ? ORDER BY recorded_at DESC LIMIT ?',
    [patientId, limit]
  );
  return rows;
}

module.exports = { addLog, listForPatient };
