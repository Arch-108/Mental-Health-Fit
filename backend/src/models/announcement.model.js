const { pool } = require('../config/db');

async function create(authorId, { title, body }) {
  const [result] = await pool.query(
    'INSERT INTO announcements (author_id, title, body) VALUES (?, ?, ?)',
    [authorId, title, body]
  );
  return result.insertId;
}

async function listRecent(limit = 20) {
  // mysql2 can be finicky binding LIMIT as a placeholder - it's not
  // user-supplied here, so a validated-integer template literal is safe.
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const [rows] = await pool.query(
    `SELECT a.id, a.title, a.body, a.created_at, u.full_name AS authorName
     FROM announcements a JOIN users u ON u.id = a.author_id
     ORDER BY a.created_at DESC LIMIT ${safeLimit}`
  );
  return rows;
}

module.exports = { create, listRecent };
