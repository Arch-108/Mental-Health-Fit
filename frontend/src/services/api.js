import axios from 'axios';

// Backend origin (no /api suffix) - set VITE_API_ORIGIN explicitly for a
// real deployment (e.g. a Render URL) where the API lives on a different
// host than the frontend. Left unset, this falls back to whatever
// hostname the browser actually used to load the page - so it's
// "localhost" for you on this machine, and automatically the right LAN IP
// for anyone else loading the app from your machine's network address,
// with no manual .env edits every time that IP changes (e.g. a different
// WiFi network).
export const API_ORIGIN = import.meta.env.VITE_API_ORIGIN || `http://${window.location.hostname}:5000`;

// Single axios instance for the whole app. Later features (AI Navigator,
// appointments, etc.) should import THIS rather than creating their own
// axios calls, so auth headers and base URL stay consistent everywhere.
const api = axios.create({
  baseURL: `${API_ORIGIN}/api`,
});

// Attach the JWT to every request automatically, if we have one.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function register(payload) {
  const { data } = await api.post('/auth/register', payload);
  return data;
}

export async function login(payload) {
  const { data } = await api.post('/auth/login', payload);
  return data;
}

export async function getCurrentUser() {
  const { data } = await api.get('/auth/me');
  return data;
}

export async function forgotPassword(email) {
  const { data } = await api.post('/auth/forgot-password', { email });
  return data;
}

export async function resetPassword(payload) {
  const { data } = await api.post('/auth/reset-password', payload);
  return data;
}

export async function updateProfile(payload) {
  const { data } = await api.put('/auth/me', payload);
  return data;
}

export async function changePassword(payload) {
  const { data } = await api.post('/auth/change-password', payload);
  return data;
}

// --- Doctors & Availability ---
export async function listDoctors(specialty) {
  const { data } = await api.get('/doctors', { params: { specialty } });
  return data.doctors;
}
export async function setMyAvailability(slots) {
  const { data } = await api.put('/availability', { slots });
  return data;
}
export async function getOpenSlots(doctorId) {
  const { data } = await api.get(`/availability/${doctorId}/open-slots`);
  return data.slots;
}

// --- Appointments ---
export async function bookAppointment(payload) {
  const { data } = await api.post('/appointments', payload);
  return data;
}
export async function listMyAppointments() {
  const { data } = await api.get('/appointments/mine');
  return data.appointments;
}
export async function getAppointment(id) {
  const { data } = await api.get(`/appointments/${id}`);
  return data;
}
export async function cancelAppointment(id) {
  const { data } = await api.post(`/appointments/${id}/cancel`);
  return data;
}

// --- AI features ---
export async function askNavigator(task, message) {
  const { data } = await api.post('/ai/navigate', { task, message });
  return data;
}
export async function generateConsultationBrief(appointmentId, intake) {
  const { data } = await api.post('/ai/brief', { appointmentId, intake });
  return data;
}
export async function getConsultationBrief(appointmentId) {
  const { data } = await api.get(`/ai/brief/${appointmentId}`);
  return data.brief;
}
export async function translateMedicalText(clinicalText) {
  const { data } = await api.post('/ai/translate', { clinicalText });
  return data;
}

// --- My Health Journey ---
export async function getMyTimeline(patientId) {
  const url = patientId ? `/records/timeline/${patientId}` : '/records/timeline';
  const { data } = await api.get(url);
  return data.timeline;
}
export async function addRecordEntry(payload) {
  const { data } = await api.post('/records', payload);
  return data;
}

// --- Consultations ---
export async function getConsultationByRoom(roomCode) {
  const { data } = await api.get(`/consultations/${roomCode}`);
  return data;
}
export async function logConnectionMode(roomCode, mode) {
  return api.post(`/consultations/${roomCode}/mode`, { mode });
}
export async function submitAsyncUpdate(roomCode, formData) {
  const { data } = await api.post(`/consultations/${roomCode}/async`, formData);
  return data;
}

export async function listAsyncUpdates(roomCode) {
  const { data } = await api.get(`/consultations/${roomCode}/async`);
  return data.submissions;
}
export async function endConsultation(roomCode, payload) {
  const { data } = await api.post(`/consultations/${roomCode}/end`, payload);
  return data;
}

// --- Follow-ups (Care Continuity Engine) ---
export async function listMyFollowUps() {
  const { data } = await api.get('/followups/mine');
  return data.followUps;
}
export async function respondToFollowUp(id, patientResponse) {
  const { data } = await api.post(`/followups/${id}/respond`, { patientResponse });
  return data;
}
export async function reviewFollowUp(id) {
  const { data } = await api.post(`/followups/${id}/review`);
  return data;
}

// --- Care Circle ---
export async function inviteCaregiver(caregiverEmail, scopes) {
  const { data } = await api.post('/care-circle/invite', { caregiverEmail, scopes });
  return data;
}
export async function listMyCareCircle() {
  const { data } = await api.get('/care-circle/mine');
  return data;
}
export async function acceptCareCircleInvite() {
  const { data } = await api.post('/care-circle/accept');
  return data;
}
export async function revokeCareCircleAccess(id) {
  const { data } = await api.post(`/care-circle/${id}/revoke`);
  return data;
}

// --- Healthcare Resource Map ---
export async function searchFacilities(params) {
  const { data } = await api.get('/facilities', { params });
  return data.facilities;
}

// --- Notifications ---
export async function listMyNotifications() {
  const { data } = await api.get('/notifications/mine');
  return data.notifications;
}
export async function markNotificationRead(id) {
  return api.post(`/notifications/${id}/read`);
}

// --- Admin ---
export async function listPendingDoctors() {
  const { data } = await api.get('/admin/doctors/pending');
  return data.doctors;
}
export async function setDoctorVerification(id, status) {
  const { data } = await api.post(`/admin/doctors/${id}/verify`, { status });
  return data;
}
export async function getAdminStats() {
  const { data } = await api.get('/admin/stats');
  return data;
}

// --- Analytics ---
export async function getDoctorAnalytics() {
  const { data } = await api.get('/analytics/doctor');
  return data;
}
export async function getPatientAnalytics() {
  const { data } = await api.get('/analytics/patient');
  return data;
}
export async function getAdminOverview() {
  const { data } = await api.get('/analytics/admin/overview');
  return data;
}

// --- Vitals Monitoring ---
export async function addVitalsLog(payload) {
  const { data } = await api.post('/vitals', payload);
  return data;
}
export async function listVitalsLogs(patientId) {
  const { data } = await api.get('/vitals/mine', { params: patientId ? { patientId } : {} });
  return data.logs;
}

// --- Maternal Care Check-ins ---
export async function addMaternalCheckin(payload) {
  const { data } = await api.post('/maternal-checkins', payload);
  return data;
}
export async function listMaternalCheckins() {
  const { data } = await api.get('/maternal-checkins/mine');
  return data.checkins;
}

// --- Vaccination Outreach Routes ---
export async function createVaccinationRoute(payload) {
  const { data } = await api.post('/vaccination-routes', payload);
  return data;
}
export async function listMyVaccinationRoutes() {
  const { data } = await api.get('/vaccination-routes/mine');
  return data.routes;
}
export async function getVaccinationRoute(id) {
  const { data } = await api.get(`/vaccination-routes/${id}`);
  return data;
}

// --- Staff messaging (doctor/admin only) ---
export async function listStaffDirectory() {
  const { data } = await api.get('/messages/staff');
  return data.staff;
}
export async function listMessageThreads() {
  const { data } = await api.get('/messages/threads');
  return data.threads;
}
export async function getConversation(userId) {
  const { data } = await api.get(`/messages/threads/${userId}`);
  return data.messages;
}
export async function sendStaffMessage(payload) {
  const { data } = await api.post('/messages', payload);
  return data;
}

// --- Announcements (doctor/admin only) ---
export async function listAnnouncements() {
  const { data } = await api.get('/announcements');
  return data.announcements;
}
export async function createAnnouncement(payload) {
  const { data } = await api.post('/announcements', payload);
  return data;
}

// --- AI assist: doctor notes, admin scheduling ---
export async function draftClinicalNote(payload) {
  const { data } = await api.post('/ai/draft-note', payload);
  return data;
}
export async function suggestScheduleOrder(payload) {
  const { data } = await api.post('/ai/suggest-schedule', payload);
  return data;
}
export async function askStaffAssistant(message) {
  const { data } = await api.post('/ai/staff-assist', { message });
  return data;
}

export default api;
