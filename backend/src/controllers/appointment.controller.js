const { pool } = require('../config/db');
const appointmentModel = require('../models/appointment.model');
const consultationModel = require('../models/consultation.model');
const notificationModel = require('../models/notification.model');

async function getPatientId(userId) {
  const [rows] = await pool.query('SELECT id FROM patients WHERE user_id = ?', [userId]);
  return rows[0]?.id || null;
}
async function getDoctorRecord(userId) {
  const [rows] = await pool.query('SELECT * FROM doctors WHERE user_id = ?', [userId]);
  return rows[0] || null;
}
async function getDoctorUserId(doctorId) {
  const [rows] = await pool.query(
    'SELECT u.id FROM doctors d JOIN users u ON u.id = d.user_id WHERE d.id = ?',
    [doctorId]
  );
  return rows[0]?.id || null;
}

async function book(req, res) {
  try {
    const { doctorId, scheduledAt, reason } = req.body;
    if (!doctorId || !scheduledAt) {
      return res.status(400).json({ error: 'doctorId and scheduledAt are required.' });
    }
    const patientId = await getPatientId(req.user.id);
    if (!patientId) return res.status(404).json({ error: 'Patient profile not found.' });

    const appointmentId = await appointmentModel.create({ patientId, doctorId, scheduledAt, reason });
    // A consultation room is created immediately so the booking, the
    // Consultation Brief, and the video room all key off the same
    // appointment id from day one.
    const { roomCode } = await consultationModel.createForAppointment(appointmentId);

    const doctorUserId = await getDoctorUserId(doctorId);
    if (doctorUserId) {
      await notificationModel.create(doctorUserId, 'appointment_booked', 'A new appointment has been booked.');
    }

    const appointment = await appointmentModel.findById(appointmentId);
    return res.status(201).json({ appointment, roomCode });
  } catch (err) {
    console.error('book error:', err);
    return res.status(500).json({ error: 'Could not book the appointment.' });
  }
}

async function listMine(req, res) {
  try {
    if (req.user.role === 'doctor') {
      const doctor = await getDoctorRecord(req.user.id);
      if (!doctor) return res.json({ appointments: [] });
      const appointments = await appointmentModel.listForDoctor(doctor.id);
      return res.json({ appointments });
    }
    const patientId = await getPatientId(req.user.id);
    if (!patientId) return res.json({ appointments: [] });
    const appointments = await appointmentModel.listForPatient(patientId);
    return res.json({ appointments });
  } catch (err) {
    console.error('listMine error:', err);
    return res.status(500).json({ error: 'Could not fetch appointments.' });
  }
}

async function cancel(req, res) {
  try {
    const appointment = await appointmentModel.findById(req.params.id);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found.' });

    // Ownership check: only the booking patient, the assigned doctor, or an
    // admin can cancel.
    const patientId = await getPatientId(req.user.id);
    const doctor = await getDoctorRecord(req.user.id);
    const owns =
      req.user.role === 'admin' ||
      (patientId && patientId === appointment.patient_id) ||
      (doctor && doctor.id === appointment.doctor_id);
    if (!owns) return res.status(403).json({ error: 'You cannot modify this appointment.' });

    await appointmentModel.updateStatus(req.params.id, 'cancelled');
    return res.json({ message: 'Appointment cancelled.' });
  } catch (err) {
    console.error('cancel error:', err);
    return res.status(500).json({ error: 'Could not cancel the appointment.' });
  }
}

async function getOne(req, res) {
  try {
    const appointment = await appointmentModel.findById(req.params.id);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found.' });
    const consultation = await consultationModel.findByAppointmentId(appointment.id);
    return res.json({ appointment, consultation });
  } catch (err) {
    console.error('getOne error:', err);
    return res.status(500).json({ error: 'Could not fetch appointment.' });
  }
}

module.exports = { book, listMine, cancel, getOne };
