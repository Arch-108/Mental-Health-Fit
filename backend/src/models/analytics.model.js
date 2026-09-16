// Lean, purpose-built aggregates for the staff AI assistant - intentionally
// separate from analytics.controller.js's chart-shaped queries (which
// return full weekly time series for the Analytics page). This only ever
// returns small, already-aggregated numbers (never individual patient
// records), scoped to the requesting user's own doctor_id for doctors, or
// platform-wide totals for admins - the same boundary the Analytics page
// itself enforces.
const { pool } = require('../config/db');

async function getDoctorIdForUser(userId) {
  const [rows] = await pool.query('SELECT id FROM doctors WHERE user_id = ?', [userId]);
  return rows[0]?.id || null;
}

async function getDoctorPerformance(doctorUserId) {
  const doctorId = await getDoctorIdForUser(doctorUserId);
  if (!doctorId) return null;

  const [[completion]] = await pool.query(
    `SELECT SUM(status = 'completed') AS completed, SUM(status != 'cancelled') AS total
     FROM appointments WHERE doctor_id = ?`,
    [doctorId]
  );
  const [[followUp]] = await pool.query(
    `SELECT SUM(f.status = 'reviewed') AS reviewed, COUNT(*) AS total
     FROM follow_ups f
     JOIN consultations c ON c.id = f.consultation_id
     JOIN appointments a ON a.id = c.appointment_id
     WHERE a.doctor_id = ?`,
    [doctorId]
  );
  const [[patientCount]] = await pool.query(
    'SELECT COUNT(DISTINCT patient_id) AS count FROM appointments WHERE doctor_id = ?',
    [doctorId]
  );
  const [[recent]] = await pool.query(
    `SELECT COUNT(*) AS count FROM appointments
     WHERE doctor_id = ? AND status = 'completed' AND scheduled_at >= DATE_SUB(NOW(), INTERVAL 8 WEEK)`,
    [doctorId]
  );
  const [[upcoming]] = await pool.query(
    `SELECT COUNT(*) AS count FROM appointments
     WHERE doctor_id = ? AND status IN ('confirmed','pending') AND scheduled_at >= NOW()`,
    [doctorId]
  );

  return {
    totalPatients: patientCount.count,
    completionRatePercent: completion.total ? Math.round((completion.completed / completion.total) * 100) : null,
    followUpReviewRatePercent: followUp.total ? Math.round((followUp.reviewed / followUp.total) * 100) : null,
    completedConsultationsLast8Weeks: recent.count,
    upcomingAppointments: upcoming.count,
  };
}

async function getAdminSummary() {
  const [[users]] = await pool.query('SELECT COUNT(*) AS count FROM users');
  const [[appointments]] = await pool.query('SELECT COUNT(*) AS count FROM appointments');
  const [[pendingDocs]] = await pool.query("SELECT COUNT(*) AS count FROM doctors WHERE verification_status = 'pending'");
  const [[verifiedDocs]] = await pool.query("SELECT COUNT(*) AS count FROM doctors WHERE verification_status = 'verified'");
  const [[completedRecent]] = await pool.query(
    `SELECT COUNT(*) AS count FROM appointments
     WHERE status = 'completed' AND scheduled_at >= DATE_SUB(NOW(), INTERVAL 8 WEEK)`
  );

  return {
    totalUsers: users.count,
    totalAppointments: appointments.count,
    pendingDoctorVerifications: pendingDocs.count,
    verifiedDoctors: verifiedDocs.count,
    completedConsultationsLast8Weeks: completedRecent.count,
  };
}

module.exports = { getDoctorPerformance, getAdminSummary };
