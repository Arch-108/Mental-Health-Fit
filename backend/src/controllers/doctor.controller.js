const { pool } = require('../config/db');

// Patients should only ever see admin-verified doctors when searching/booking.
async function listVerified(req, res) {
  try {
    const { specialty } = req.query;
    let sql = `
      SELECT d.id, d.specialty, d.bio, u.full_name
      FROM doctors d JOIN users u ON u.id = d.user_id
      WHERE d.verification_status = 'verified' AND u.is_active = TRUE`;
    const params = [];
    if (specialty) {
      sql += ' AND d.specialty LIKE ?';
      params.push(`%${specialty}%`);
    }
    sql += ' ORDER BY u.full_name ASC';
    const [rows] = await pool.query(sql, params);
    return res.json({ doctors: rows });
  } catch (err) {
    console.error('listVerified error:', err);
    return res.status(500).json({ error: 'Could not fetch doctors.' });
  }
}

async function getOne(req, res) {
  try {
    const [rows] = await pool.query(
      `SELECT d.id, d.specialty, d.bio, d.verification_status, u.full_name
       FROM doctors d JOIN users u ON u.id = d.user_id WHERE d.id = ?`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Doctor not found.' });
    return res.json({ doctor: rows[0] });
  } catch (err) {
    console.error('getOne (doctor) error:', err);
    return res.status(500).json({ error: 'Could not fetch doctor.' });
  }
}

module.exports = { listVerified, getOne };
