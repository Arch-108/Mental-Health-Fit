const { pool } = require('../config/db');

// Red-flag symptom keywords used in real public maternal-health guidance
// (e.g. severe headache, vision changes, reduced fetal movement, bleeding)
// as a prompt to seek timely clinical review - this is a checklist, not a
// diagnostic score, and never replaces professional assessment.
const RED_FLAG_PATTERNS = [
  /severe headache/i, /blurred vision|vision change|seeing spots/i,
  /severe swelling|sudden swelling/i, /reduced (fetal|baby) movement|baby (isn'?t|is not) moving/i,
  /vaginal bleeding|heavy bleeding/i, /severe (abdominal|stomach) pain/i,
  /fever/i, /can'?t breathe|difficulty breathing/i, /fainting|fainted|dizzy/i,
];

function detectRedFlag(symptoms = '') {
  const match = RED_FLAG_PATTERNS.find((re) => re.test(symptoms));
  return match ? 'One or more reported symptoms are commonly flagged for prompt clinical review in pregnancy.' : null;
}

async function addCheckin(patientId, { gestationalWeek, symptoms }) {
  const redFlagReason = detectRedFlag(symptoms);
  const [result] = await pool.query(
    `INSERT INTO maternal_checkins (patient_id, gestational_week, symptoms, red_flag, red_flag_reason)
     VALUES (?, ?, ?, ?, ?)`,
    [patientId, gestationalWeek || null, symptoms || null, !!redFlagReason, redFlagReason]
  );
  return { id: result.insertId, redFlag: !!redFlagReason, redFlagReason };
}

async function listForPatient(patientId) {
  const [rows] = await pool.query(
    'SELECT * FROM maternal_checkins WHERE patient_id = ? ORDER BY created_at DESC',
    [patientId]
  );
  return rows;
}

module.exports = { addCheckin, listForPatient, detectRedFlag };
