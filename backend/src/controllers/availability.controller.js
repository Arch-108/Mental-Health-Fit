const { pool } = require('../config/db');
const availabilityModel = require('../models/availability.model');

async function getDoctorRecordForUser(userId) {
  const [rows] = await pool.query('SELECT * FROM doctors WHERE user_id = ?', [userId]);
  return rows[0] || null;
}

async function setAvailability(req, res) {
  try {
    const doctor = await getDoctorRecordForUser(req.user.id);
    if (!doctor) return res.status(404).json({ error: 'Doctor profile not found.' });

    const { slots } = req.body;
    if (!Array.isArray(slots)) {
      return res.status(400).json({ error: 'slots must be an array.' });
    }
    await availabilityModel.setWeeklyAvailability(doctor.id, slots);
    return res.json({ message: 'Availability updated.' });
  } catch (err) {
    console.error('setAvailability error:', err);
    return res.status(500).json({ error: 'Could not update availability.' });
  }
}

async function getAvailability(req, res) {
  try {
    const doctorId = req.params.doctorId;
    const slots = await availabilityModel.getWeeklyAvailability(doctorId);
    return res.json({ slots });
  } catch (err) {
    console.error('getAvailability error:', err);
    return res.status(500).json({ error: 'Could not fetch availability.' });
  }
}

// Computes actual bookable slot datetimes for the next N days, based on
// weekly availability minus already-booked appointments.
async function getOpenSlots(req, res) {
  try {
    const doctorId = req.params.doctorId;
    const days = Math.min(parseInt(req.query.days || '14', 10), 30);

    const weekly = await availabilityModel.getWeeklyAvailability(doctorId);
    if (weekly.length === 0) return res.json({ slots: [] });

    const now = new Date();
    const rangeEnd = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    const booked = await availabilityModel.getBookedSlots(doctorId, now, rangeEnd);
    const bookedSet = new Set(booked.map((d) => new Date(d).getTime()));

    const openSlots = [];
    for (let d = 0; d < days; d++) {
      const day = new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
      const dow = day.getDay();
      const windows = weekly.filter((w) => w.day_of_week === dow);
      for (const w of windows) {
        const [sh, sm] = w.start_time.split(':').map(Number);
        const [eh, em] = w.end_time.split(':').map(Number);
        let cursor = new Date(day);
        cursor.setHours(sh, sm, 0, 0);
        const end = new Date(day);
        end.setHours(eh, em, 0, 0);
        while (cursor < end) {
          if (cursor > now && !bookedSet.has(cursor.getTime())) {
            openSlots.push(new Date(cursor).toISOString());
          }
          cursor = new Date(cursor.getTime() + w.slot_minutes * 60000);
        }
      }
    }
    openSlots.sort();
    return res.json({ slots: openSlots.slice(0, 100) });
  } catch (err) {
    console.error('getOpenSlots error:', err);
    return res.status(500).json({ error: 'Could not compute open slots.' });
  }
}

module.exports = { setAvailability, getAvailability, getOpenSlots };
