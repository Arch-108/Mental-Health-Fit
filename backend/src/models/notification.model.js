const { pool } = require('../config/db');

async function create(userId, type, message) {
  await pool.query(
    'INSERT INTO notifications (user_id, type, message) VALUES (?, ?, ?)',
    [userId, type, message]
  );
}

async function listForUser(userId) {
  const [rows] = await pool.query(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
    [userId]
  );
  return rows;
}

async function markRead(id, userId) {
  await pool.query('UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?', [id, userId]);
}

module.exports = { create, listForUser, markRead };
