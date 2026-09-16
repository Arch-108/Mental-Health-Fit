const { pool } = require('../config/db');
const maternalModel = require('../models/maternal.model');
const notificationModel = require('../models/notification.model');

async function getPatientId(userId) {
  const [rows] = await pool.query('SELECT id FROM patients WHERE user_id = ?', [userId]);
  return rows[0]?.id || null;
}

async function addCheckin(req, res) {
  try {
    const patientId = await getPatientId(req.user.id);
    if (!patientId) return res.status(404).json({ error: 'Patient profile not found.' });
    const { gestationalWeek, symptoms } = req.body;
    const result = await maternalModel.addCheckin(patientId, { gestationalWeek, symptoms });

    // A red flag doesn't page anyone automatically (no real clinical
    // triage infrastructure sits behind this) - it tells the patient
    // clearly and consistently to seek care themselves, same principle
    // as the AI Navigator's emergency detection.
    return res.status(201).json(result);
  } catch (err) {
    console.error('addCheckin (maternal) error:', err);
    return res.status(500).json({ error: 'Could not save this check-in.' });
  }
}

async function listMine(req, res) {
  try {
    const patientId = await getPatientId(req.user.id);
    if (!patientId) return res.json({ checkins: [] });
    const checkins = await maternalModel.listForPatient(patientId);
    return res.json({ checkins });
  } catch (err) {
    console.error('listMine (maternal) error:', err);
    return res.status(500).json({ error: 'Could not fetch check-in history.' });
  }
}

module.exports = { addCheckin, listMine };
