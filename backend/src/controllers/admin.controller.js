const { pool } = require('../config/db');

async function listPendingDoctors(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT d.id, d.specialty, d.license_number, u.full_name, u.email, u.created_at
       FROM doctors d JOIN users u ON u.id = d.user_id
       WHERE d.verification_status = 'pending'
       ORDER BY u.created_at ASC`
    );
    return res.json({ doctors: rows });
  } catch (err) {
    console.error('listPendingDoctors error:', err);
    return res.status(500).json({ error: 'Could not fetch pending doctors.' });
  }
}

async function setVerification(req, res) {
  try {
    const { status } = req.body; // 'verified' | 'rejected'
    if (!['verified', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'status must be verified or rejected.' });
    }
    await pool.query('UPDATE doctors SET verification_status = ? WHERE id = ?', [status, req.params.id]);
    return res.json({ message: `Doctor ${status}.` });
  } catch (err) {
    console.error('setVerification error:', err);
    return res.status(500).json({ error: 'Could not update verification status.' });
  }
}

async function stats(req, res) {
  try {
    const [[users]] = await pool.query('SELECT COUNT(*) AS count FROM users');
    const [[appointments]] = await pool.query('SELECT COUNT(*) AS count FROM appointments');
    const [[pendingDocs]] = await pool.query(
      "SELECT COUNT(*) AS count FROM doctors WHERE verification_status = 'pending'"
    );
    return res.json({
      totalUsers: users.count,
      totalAppointments: appointments.count,
      pendingDoctorVerifications: pendingDocs.count,
    });
  } catch (err) {
    console.error('stats (admin) error:', err);
    return res.status(500).json({ error: 'Could not fetch stats.' });
  }
}

module.exports = { listPendingDoctors, setVerification, stats };
