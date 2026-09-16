const aiService = require('../services/ai.service');
const briefModel = require('../models/brief.model');
const analyticsModel = require('../models/analytics.model');
const { pool } = require('../config/db');

// AI Health Navigator - structured, menu-driven, non-diagnostic.
async function navigate(req, res) {
  try {
    const { task, message } = req.body;
    if (!task || !message) {
      return res.status(400).json({ error: 'task and message are required.' });
    }
    const result = await aiService.navigatorReply(task, message);
    return res.json(result);
  } catch (err) {
    console.error('navigate error:', err);
    return res.status(500).json({ error: 'The AI Navigator is temporarily unavailable.' });
  }
}

// AI Consultation Brief - structures a guided intake into a clinician-
// readable summary. Always saved as patient-editable; never overwrites
// the doctor's own clinical notes (those live separately on the
// consultation record).
async function generateBrief(req, res) {
  try {
    const { appointmentId, intake } = req.body;
    if (!appointmentId || !intake) {
      return res.status(400).json({ error: 'appointmentId and intake are required.' });
    }
    const result = await aiService.generateBrief(intake);
    await briefModel.upsert(appointmentId, { structuredIntake: intake, aiSummary: result.text });
    return res.json(result);
  } catch (err) {
    console.error('generateBrief error:', err);
    return res.status(500).json({ error: 'Could not generate the consultation brief.' });
  }
}

async function getBrief(req, res) {
  try {
    const brief = await briefModel.findByAppointmentId(req.params.appointmentId);
    return res.json({ brief });
  } catch (err) {
    console.error('getBrief error:', err);
    return res.status(500).json({ error: 'Could not fetch the brief.' });
  }
}

// Medical Language Translator - explains clinician text in plain language
// WITHOUT altering the original record (frontend keeps both visible).
async function translate(req, res) {
  try {
    const { clinicalText } = req.body;
    if (!clinicalText) return res.status(400).json({ error: 'clinicalText is required.' });
    const result = await aiService.navigatorReply(
      'explain medical terminology',
      `Explain this in plain, simple language for a patient, without adding new clinical claims: "${clinicalText}"`
    );
    return res.json(result);
  } catch (err) {
    console.error('translate error:', err);
    return res.status(500).json({ error: 'Could not translate this text right now.' });
  }
}

// Doctor-facing note drafting - a starting point the doctor edits, never
// auto-saved as the real consultation note.
async function draftNote(req, res) {
  try {
    const { reason, briefSummary } = req.body;
    const result = await aiService.draftClinicalNote({ reason, briefSummary });
    return res.json(result);
  } catch (err) {
    console.error('draftNote error:', err);
    return res.status(500).json({ error: 'Could not draft a note right now.' });
  }
}

// Admin-facing schedule suggestion - text advice only, never mutates the
// route itself (see ai.service.js for why).
async function suggestSchedule(req, res) {
  try {
    const { stops, coldChainLimitHours } = req.body;
    if (!Array.isArray(stops) || stops.length === 0) {
      return res.status(400).json({ error: 'stops is required.' });
    }
    const result = await aiService.suggestRouteOrder({ stops, coldChainLimitHours: coldChainLimitHours || 8 });
    return res.json(result);
  } catch (err) {
    console.error('suggestSchedule error:', err);
    return res.status(500).json({ error: 'Could not generate a suggestion right now.' });
  }
}

// General "hover to ask" assistant for doctors/admins - see ai.service.js
// staffAssist for scope/safety notes. Pulls the requester's OWN real
// aggregate numbers (never another user's, never individual patient
// records - see analytics.model.js) so it can answer performance questions
// with real data instead of deflecting to "go check the dashboard."
async function staffAssist(req, res) {
  try {
    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'message is required.' });

    let context = null;
    if (req.user.role === 'doctor') {
      context = await analyticsModel.getDoctorPerformance(req.user.id);
    } else if (req.user.role === 'admin') {
      context = await analyticsModel.getAdminSummary();
    }

    const result = await aiService.staffAssist(req.user.role, message.trim(), context);
    return res.json(result);
  } catch (err) {
    console.error('staffAssist error:', err);
    return res.status(500).json({ error: 'The assistant is temporarily unavailable.' });
  }
}

module.exports = { navigate, generateBrief, getBrief, translate, draftNote, suggestSchedule, staffAssist };
