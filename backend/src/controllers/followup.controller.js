const followupModel = require('../models/followup.model');
const aiService = require('../services/ai.service');
const { pool } = require('../config/db');

async function listMine(req, res) {
  try {
    const rows =
      req.user.role === 'doctor'
        ? await followupModel.listForDoctor(req.user.id)
        : await followupModel.listForPatient(req.user.id);
    return res.json({ followUps: rows });
  } catch (err) {
    console.error('listMine (followup) error:', err);
    return res.status(500).json({ error: 'Could not fetch follow-ups.' });
  }
}

// AI Follow-up Summary: patient submits a free-text update, AI structures
// it for the clinician. Emergency phrases short-circuit into an advisory
// instead of a normal summary - the doctor still sees the raw response.
async function respond(req, res) {
  try {
    const { patientResponse } = req.body;
    if (!patientResponse) return res.status(400).json({ error: 'patientResponse is required.' });

    const result = await aiService.summarizeFollowup(patientResponse);
    await followupModel.submitResponse(req.params.id, { patientResponse, aiSummary: result.text });

    return res.json({ message: 'Follow-up submitted.', ...result });
  } catch (err) {
    console.error('respond (followup) error:', err);
    return res.status(500).json({ error: 'Could not submit your follow-up.' });
  }
}

async function review(req, res) {
  try {
    await followupModel.markReviewed(req.params.id);
    return res.json({ message: 'Marked as reviewed.' });
  } catch (err) {
    console.error('review (followup) error:', err);
    return res.status(500).json({ error: 'Could not update the follow-up.' });
  }
}

module.exports = { listMine, respond, review };
