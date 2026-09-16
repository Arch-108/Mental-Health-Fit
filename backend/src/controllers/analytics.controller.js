const { pool } = require('../config/db');

async function getDoctorId(userId) {
  const [rows] = await pool.query('SELECT id FROM doctors WHERE user_id = ?', [userId]);
  return rows[0]?.id || null;
}
async function getPatientId(userId) {
  const [rows] = await pool.query('SELECT id FROM patients WHERE user_id = ?', [userId]);
  return rows[0]?.id || null;
}

// Doctor performance tracking - consultation volume over time, follow-up
// completion rate, and patient load. All computed from real appointment/
// follow-up rows, not fabricated - if there's no data yet, the doctor
// simply sees an empty chart rather than placeholder numbers.
async function doctorAnalytics(req, res) {
  try {
    const doctorId = await getDoctorId(req.user.id);
    if (!doctorId) return res.json({ weeklyConsultations: [], followUpRate: null, totalPatients: 0, completionRate: null });

    // Consultations completed per week, last 8 weeks.
    const [weekly] = await pool.query(
      `SELECT YEARWEEK(scheduled_at, 1) AS yw, MIN(DATE(scheduled_at)) AS weekStart, COUNT(*) AS count
       FROM appointments
       WHERE doctor_id = ? AND status = 'completed' AND scheduled_at >= DATE_SUB(NOW(), INTERVAL 8 WEEK)
       GROUP BY yw ORDER BY yw ASC`,
      [doctorId]
    );

    // Overall completion rate (completed vs. total non-cancelled).
    const [[completion]] = await pool.query(
      `SELECT
         SUM(status = 'completed') AS completed,
         SUM(status != 'cancelled') AS total
       FROM appointments WHERE doctor_id = ?`,
      [doctorId]
    );

    // Follow-up review rate - how many scheduled follow-ups actually get
    // reviewed by this doctor, a genuine continuity-of-care metric.
    const [[followUp]] = await pool.query(
      `SELECT
         SUM(f.status = 'reviewed') AS reviewed,
         COUNT(*) AS total
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

    return res.json({
      weeklyConsultations: weekly.map((w) => ({ week: w.weekStart, count: w.count })),
      completionRate: completion.total ? Math.round((completion.completed / completion.total) * 100) : null,
      followUpRate: followUp.total ? Math.round((followUp.reviewed / followUp.total) * 100) : null,
      totalPatients: patientCount.count,
    });
  } catch (err) {
    console.error('doctorAnalytics error:', err);
    return res.status(500).json({ error: 'Could not load analytics.' });
  }
}

// Patient activity view - care engagement over time. Intentionally NOT a
// clinical vitals dashboard (this platform doesn't collect wearable data
// in the MVP) - it's a transparency view of the patient's own usage.
async function patientAnalytics(req, res) {
  try {
    const patientId = await getPatientId(req.user.id);
    if (!patientId) return res.json({ monthlyActivity: [], totalConsultations: 0, followUpsCompleted: 0 });

    const [monthly] = await pool.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COUNT(*) AS count
       FROM medical_records WHERE patient_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY month ORDER BY month ASC`,
      [patientId]
    );

    const [[consultCount]] = await pool.query(
      "SELECT COUNT(*) AS count FROM appointments WHERE patient_id = ? AND status = 'completed'",
      [patientId]
    );

    const [[followUpCount]] = await pool.query(
      `SELECT SUM(f.status IN ('submitted','reviewed')) AS count
       FROM follow_ups f
       JOIN consultations c ON c.id = f.consultation_id
       JOIN appointments a ON a.id = c.appointment_id
       WHERE a.patient_id = ?`,
      [patientId]
    );

    return res.json({
      monthlyActivity: monthly.map((m) => ({ month: m.month, count: m.count })),
      totalConsultations: consultCount.count,
      followUpsCompleted: followUpCount.count || 0,
    });
  } catch (err) {
    console.error('patientAnalytics error:', err);
    return res.status(500).json({ error: 'Could not load your activity.' });
  }
}

module.exports = { doctorAnalytics, patientAnalytics, platformOverview };

// Admin-only: cross-doctor performance and availability overview. This is
// the data behind the graphs on the admin's Doctor Verification / Overview
// page - genuinely computed from appointments/availability, not estimated.
async function platformOverview(req, res) {
  try {
    // Platform-wide appointment volume per week, last 8 weeks - shows
    // overall demand/activity trend regardless of which doctor.
    const [weekly] = await pool.query(
      `SELECT YEARWEEK(scheduled_at, 1) AS yw, MIN(DATE(scheduled_at)) AS weekStart, COUNT(*) AS count
       FROM appointments
       WHERE scheduled_at >= DATE_SUB(NOW(), INTERVAL 8 WEEK) AND status != 'cancelled'
       GROUP BY yw ORDER BY yw ASC`
    );

    // Per-doctor performance: volume, completion rate, patient load.
    const [doctorStats] = await pool.query(
      `SELECT d.id AS doctorId, u.full_name AS name, d.specialty, d.verification_status,
              COUNT(a.id) AS totalAppointments,
              SUM(a.status = 'completed') AS completedAppointments,
              COUNT(DISTINCT a.patient_id) AS totalPatients
       FROM doctors d
       JOIN users u ON u.id = d.user_id
       LEFT JOIN appointments a ON a.doctor_id = d.id
       GROUP BY d.id, u.full_name, d.specialty, d.verification_status
       ORDER BY totalAppointments DESC`
    );

    // Weekly published availability hours per doctor, from their
    // recurring windows - a genuine "how much time are they offering"
    // figure, not appointment count.
    const [availabilityHours] = await pool.query(
      `SELECT doctor_id, SUM(TIME_TO_SEC(TIMEDIFF(end_time, start_time))) / 3600 AS hours
       FROM doctor_availability GROUP BY doctor_id`
    );
    const hoursByDoctor = Object.fromEntries(availabilityHours.map((r) => [r.doctor_id, Math.round(r.hours * 10) / 10]));

    const doctors = doctorStats.map((d) => ({
      doctorId: d.doctorId,
      name: d.name,
      specialty: d.specialty,
      verificationStatus: d.verification_status,
      totalAppointments: d.totalAppointments,
      completedAppointments: d.completedAppointments || 0,
      completionRate: d.totalAppointments ? Math.round(((d.completedAppointments || 0) / d.totalAppointments) * 100) : null,
      totalPatients: d.totalPatients,
      weeklyAvailabilityHours: hoursByDoctor[d.doctorId] || 0,
    }));

    return res.json({
      weeklyAppointments: weekly.map((w) => ({ week: w.weekStart, count: w.count })),
      doctors,
    });
  } catch (err) {
    console.error('platformOverview error:', err);
    return res.status(500).json({ error: 'Could not load the platform overview.' });
  }
}
