const { pool } = require('../config/db');
const vitalsModel = require('../models/vitals.model');

async function getPatientId(userId) {
  const [rows] = await pool.query('SELECT id FROM patients WHERE user_id = ?', [userId]);
  return rows[0]?.id || null;
}

async function addLog(req, res) {
  try {
    const patientId = await getPatientId(req.user.id);
    if (!patientId) return res.status(404).json({ error: 'Patient profile not found.' });
    const { heartRate, spo2, steps, sleepHours } = req.body;
    const result = await vitalsModel.addLog(patientId, { heartRate, spo2, steps, sleepHours });
    return res.status(201).json(result);
  } catch (err) {
    console.error('addLog (vitals) error:', err);
    return res.status(500).json({ error: 'Could not save this reading.' });
  }
}

async function listMine(req, res) {
  try {
    // Doctors/caregivers viewing a specific patient's vitals pass ?patientId;
    // patients themselves default to their own record.
    let patientId = req.query.patientId;
    if (!patientId) patientId = await getPatientId(req.user.id);
    if (!patientId) return res.json({ logs: [] });
    const logs = await vitalsModel.listForPatient(patientId);
    return res.json({ logs });
  } catch (err) {
    console.error('listMine (vitals) error:', err);
    return res.status(500).json({ error: 'Could not fetch vitals history.' });
  }
}

module.exports = { addLog, listMine };
