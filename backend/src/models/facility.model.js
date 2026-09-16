const { pool } = require('../config/db');

async function search({ type, telehealthOnly }) {
  let sql = 'SELECT * FROM healthcare_facilities WHERE 1=1';
  const params = [];
  if (type) {
    sql += ' AND type = ?';
    params.push(type);
  }
  if (telehealthOnly === 'true' || telehealthOnly === true) {
    sql += ' AND telehealth_available = TRUE';
  }
  sql += ' ORDER BY name ASC';
  const [rows] = await pool.query(sql, params);
  return rows;
}

module.exports = { search };
