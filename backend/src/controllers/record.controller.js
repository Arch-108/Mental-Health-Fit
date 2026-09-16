const { pool } = require('../config/db');
const recordModel = require('../models/record.model');

async function getPatientId(userId) {
  const [rows] = await pool.query('SELECT id FROM patients WHERE user_id = ?', [userId]);
  return rows[0]?.id || null;
}

// My Health Journey - a patient's own timeline. Doctors can view a
// specific patient's timeline (clinical context); patients can only ever
// view their own.
async function getTimeline(req, res) {
  try {
    let patientId;
    if (req.params.patientId) {
      if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Not authorized to view this record.' });
      }
      patientId = req.params.patientId;
    } else {
      patientId = await getPatientId(req.user.id);
    }
    if (!patientId) return res.json({ timeline: [] });
    const timeline = await recordModel.timelineForPatient(patientId);
    return res.json({ timeline });
  } catch (err) {
    console.error('getTimeline error:', err);
    return res.status(500).json({ error: 'Could not fetch the health journey.' });
  }
}

// Only doctors/admins can write clinical entries onto a patient's timeline.
async function addEntry(req, res) {
  try {
    const { patientId, entryType, title, content } = req.body;
    if (!patientId || !entryType || !title) {
      return res.status(400).json({ error: 'patientId, entryType, and title are required.' });
    }
    const id = await recordModel.addEntry({ patientId, entryType, title, content, createdBy: req.user.id });
    return res.status(201).json({ id });
  } catch (err) {
    console.error('addEntry error:', err);
    return res.status(500).json({ error: 'Could not add the record entry.' });
  }
}

module.exports = { getTimeline, addEntry };
