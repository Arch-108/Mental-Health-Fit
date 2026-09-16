const { pool } = require('../config/db');
const careCircleModel = require('../models/carecircle.model');
const notificationModel = require('../models/notification.model');

async function getPatientId(userId) {
  const [rows] = await pool.query('SELECT id FROM patients WHERE user_id = ?', [userId]);
  return rows[0]?.id || null;
}

const VALID_SCOPES = ['appointments', 'followups', 'medications'];

async function invite(req, res) {
  try {
    const { caregiverEmail, scopes } = req.body;
    if (!caregiverEmail || !Array.isArray(scopes) || scopes.length === 0) {
      return res.status(400).json({ error: 'caregiverEmail and at least one scope are required.' });
    }
    const safeScopes = scopes.filter((s) => VALID_SCOPES.includes(s));
    if (safeScopes.length === 0) {
      return res.status(400).json({ error: 'No valid scopes provided.' });
    }
    const patientId = await getPatientId(req.user.id);
    const id = await careCircleModel.invite(patientId, { caregiverEmail, scopes: safeScopes });

    // If the caregiver already has an account, notify them; otherwise
    // they'll see nothing until they register with this email and the
    // grant is activated on next login (kept simple for MVP scope).
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [caregiverEmail]);
    if (existing[0]) {
      await notificationModel.create(existing[0].id, 'care_circle_invite', 'You were invited to a Care Circle. Log in to accept.');
    }
    return res.status(201).json({ id });
  } catch (err) {
    console.error('invite (care circle) error:', err);
    return res.status(500).json({ error: 'Could not send the invite.' });
  }
}

async function listMine(req, res) {
  try {
    const patientId = await getPatientId(req.user.id);
    const members = patientId ? await careCircleModel.listForPatient(patientId) : [];
    const asCaregiver = await careCircleModel.listForCaregiver(req.user.id);
    return res.json({ members, asCaregiver });
  } catch (err) {
    console.error('listMine (care circle) error:', err);
    return res.status(500).json({ error: 'Could not fetch Care Circle.' });
  }
}

async function accept(req, res) {
  try {
    await careCircleModel.activateForCaregiverEmail(req.user.email, req.user.id);
    return res.json({ message: 'Care Circle invitation accepted.' });
  } catch (err) {
    console.error('accept (care circle) error:', err);
    return res.status(500).json({ error: 'Could not accept the invitation.' });
  }
}

async function revoke(req, res) {
  try {
    const patientId = await getPatientId(req.user.id);
    await careCircleModel.revoke(req.params.id, patientId);
    return res.json({ message: 'Access revoked.' });
  } catch (err) {
    console.error('revoke (care circle) error:', err);
    return res.status(500).json({ error: 'Could not revoke access.' });
  }
}

module.exports = { invite, listMine, accept, revoke };
