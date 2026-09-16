const { pool } = require('../config/db');

async function setWeeklyAvailability(doctorId, slots) {
  // slots: [{ dayOfWeek, startTime, endTime, slotMinutes }]
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM doctor_availability WHERE doctor_id = ?', [doctorId]);
    for (const s of slots) {
      await conn.query(
        `INSERT INTO doctor_availability (doctor_id, day_of_week, start_time, end_time, slot_minutes)
         VALUES (?, ?, ?, ?, ?)`,
        [doctorId, s.dayOfWeek, s.startTime, s.endTime, s.slotMinutes || 30]
      );
    }
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

async function getWeeklyAvailability(doctorId) {
  const [rows] = await pool.query(
    'SELECT * FROM doctor_availability WHERE doctor_id = ? ORDER BY day_of_week, start_time',
    [doctorId]
  );
  return rows;
}

async function getBookedSlots(doctorId, fromDate, toDate) {
  const [rows] = await pool.query(
    `SELECT scheduled_at FROM appointments
     WHERE doctor_id = ? AND scheduled_at BETWEEN ? AND ? AND status != 'cancelled'`,
    [doctorId, fromDate, toDate]
  );
  return rows.map((r) => r.scheduled_at);
}

module.exports = { setWeeklyAvailability, getWeeklyAvailability, getBookedSlots };
