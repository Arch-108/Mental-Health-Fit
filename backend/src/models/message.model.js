const { pool } = require('../config/db');

async function send({ senderId, recipientId, body, relatedPatientId }) {
  const [result] = await pool.query(
    `INSERT INTO staff_messages (sender_id, recipient_id, body, related_patient_id)
     VALUES (?, ?, ?, ?)`,
    [senderId, recipientId, body, relatedPatientId || null]
  );
  return result.insertId;
}

// One row per conversation partner, with the most recent message and an
// unread count - built as a self-union so a partner appears whether the
// current user sent or received the latest message.
async function listThreads(userId) {
  const [rows] = await pool.query(
    `SELECT
       other.id AS userId, other.full_name AS fullName, other.role,
       m.body AS lastMessage, m.created_at AS lastMessageAt, m.sender_id AS lastSenderId,
       (SELECT COUNT(*) FROM staff_messages
          WHERE sender_id = other.id AND recipient_id = ? AND is_read = FALSE) AS unreadCount
     FROM (
       SELECT CASE WHEN sender_id = ? THEN recipient_id ELSE sender_id END AS partnerId,
              MAX(id) AS lastMsgId
       FROM staff_messages
       WHERE sender_id = ? OR recipient_id = ?
       GROUP BY partnerId
     ) t
     JOIN staff_messages m ON m.id = t.lastMsgId
     JOIN users other ON other.id = t.partnerId
     ORDER BY m.created_at DESC`,
    [userId, userId, userId, userId]
  );
  return rows;
}

async function listConversation(userId, otherUserId) {
  const [rows] = await pool.query(
    `SELECT * FROM staff_messages
     WHERE (sender_id = ? AND recipient_id = ?) OR (sender_id = ? AND recipient_id = ?)
     ORDER BY created_at ASC`,
    [userId, otherUserId, otherUserId, userId]
  );
  return rows;
}

async function markThreadRead(userId, otherUserId) {
  await pool.query(
    'UPDATE staff_messages SET is_read = TRUE WHERE sender_id = ? AND recipient_id = ? AND is_read = FALSE',
    [otherUserId, userId]
  );
}

// Staff directory for composing a new message - every other doctor/admin.
async function listStaffDirectory(excludeUserId) {
  const [rows] = await pool.query(
    `SELECT u.id, u.full_name AS fullName, u.role, d.specialty
     FROM users u
     LEFT JOIN doctors d ON d.user_id = u.id
     WHERE u.role IN ('doctor','admin') AND u.id != ?
     ORDER BY u.role, u.full_name`,
    [excludeUserId]
  );
  return rows;
}

module.exports = { send, listThreads, listConversation, markThreadRead, listStaffDirectory };
