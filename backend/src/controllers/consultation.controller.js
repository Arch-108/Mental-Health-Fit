const { pool } = require('../config/db');
const consultationModel = require('../models/consultation.model');
const followupModel = require('../models/followup.model');
const recordModel = require('../models/record.model');
const notificationModel = require('../models/notification.model');
const appointmentModel = require('../models/appointment.model');

async function getByRoomCode(req, res) {
  try {
    const consultation = await consultationModel.findByRoomCode(req.params.roomCode);
    if (!consultation) return res.status(404).json({ error: 'Consultation room not found.' });

    // Confirm the requester is actually part of this appointment.
    const appointment = await appointmentModel.findById(consultation.appointment_id);
    const [patientRow] = await pool.query('SELECT user_id FROM patients WHERE id = ?', [appointment.patient_id]);
    const [doctorRow] = await pool.query('SELECT user_id FROM doctors WHERE id = ?', [appointment.doctor_id]);
    const allowed =
      req.user.id === patientRow[0]?.user_id ||
      req.user.id === doctorRow[0]?.user_id ||
      req.user.role === 'admin';
    if (!allowed) return res.status(403).json({ error: 'You are not part of this consultation.' });

    return res.json({ consultation, appointment });
  } catch (err) {
    console.error('getByRoomCode error:', err);
    return res.status(500).json({ error: 'Could not load the consultation.' });
  }
}

async function logMode(req, res) {
  try {
    const { mode } = req.body;
    const consultation = await consultationModel.findByRoomCode(req.params.roomCode);
    if (!consultation) return res.status(404).json({ error: 'Consultation not found.' });
    await consultationModel.logModeChange(consultation.id, mode);
    return res.json({ message: 'Mode logged.' });
  } catch (err) {
    console.error('logMode error:', err);
    return res.status(500).json({ error: 'Could not log mode change.' });
  }
}

// Store-and-forward async submission - used automatically when the
// connection can't sustain even audio, or when the patient explicitly
// chooses async mode.
async function submitAsync(req, res) {
  try {
    const { message } = req.body;
    const consultation = await consultationModel.findByRoomCode(req.params.roomCode);
    if (!consultation) return res.status(404).json({ error: 'Consultation not found.' });

    const senderRole = req.user.role === 'doctor' ? 'doctor' : 'patient';
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
    await consultationModel.addAsyncSubmission({
      consultationId: consultation.id,
      senderRole,
      message,
      imagePath,
    });
    return res.status(201).json({ message: 'Submitted. The other party will be notified.' });
  } catch (err) {
    console.error('submitAsync error:', err);
    return res.status(500).json({ error: 'Could not submit.' });
  }
}

async function listAsync(req, res) {
  try {
    const consultation = await consultationModel.findByRoomCode(req.params.roomCode);
    if (!consultation) return res.status(404).json({ error: 'Consultation not found.' });
    const submissions = await consultationModel.listAsyncSubmissions(consultation.id);
    return res.json({ submissions });
  } catch (err) {
    console.error('listAsync error:', err);
    return res.status(500).json({ error: 'Could not fetch submissions.' });
  }
}

// Doctor ends the consultation: saves notes, optional prescription, writes
// a My Health Journey entry, and optionally schedules a follow-up
// (Care Continuity Engine) - all in one action, matching the demo scenario.
async function endConsultation(req, res) {
  try {
    const { notes, prescription, followUpInDays } = req.body;
    const consultation = await consultationModel.findByRoomCode(req.params.roomCode);
    if (!consultation) return res.status(404).json({ error: 'Consultation not found.' });

    await consultationModel.markEnded(consultation.id, notes);

    if (prescription?.medication) {
      await consultationModel.addPrescription(consultation.id, prescription);
    }

    const appointment = await appointmentModel.findById(consultation.appointment_id);
    await appointmentModel.updateStatus(appointment.id, 'completed');

    if (notes) {
      await recordModel.addEntry({
        patientId: appointment.patient_id,
        entryType: 'consultation',
        title: `Consultation with Dr. ${appointment.doctor_name}`,
        content: notes,
        createdBy: req.user.id,
      });
    }

    let followUp = null;
    if (followUpInDays) {
      const dueDate = new Date(Date.now() + Number(followUpInDays) * 86400000);
      const id = await followupModel.schedule(consultation.id, dueDate.toISOString().slice(0, 10));
      followUp = { id, dueDate };

      const [patientRow] = await pool.query('SELECT user_id FROM patients WHERE id = ?', [appointment.patient_id]);
      if (patientRow[0]) {
        await notificationModel.create(
          patientRow[0].user_id,
          'followup_scheduled',
          `Your doctor scheduled a follow-up check-in for ${dueDate.toDateString()}.`
        );
      }
    }

    return res.json({ message: 'Consultation ended.', followUp });
  } catch (err) {
    console.error('endConsultation error:', err);
    return res.status(500).json({ error: 'Could not end the consultation.' });
  }
}

module.exports = { getByRoomCode, logMode, submitAsync, listAsync, endConsultation };
