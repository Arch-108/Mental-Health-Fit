require('dotenv').config();
const fs = require('fs');
const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const { testConnection } = require('./config/db');
const authRoutes = require('./routes/auth.routes');
const availabilityRoutes = require('./routes/availability.routes');
const doctorRoutes = require('./routes/doctor.routes');
const appointmentRoutes = require('./routes/appointment.routes');
const consultationRoutes = require('./routes/consultation.routes');
const aiRoutes = require('./routes/ai.routes');
const recordRoutes = require('./routes/record.routes');
const followupRoutes = require('./routes/followup.routes');
const carecircleRoutes = require('./routes/carecircle.routes');
const facilityRoutes = require('./routes/facility.routes');
const notificationRoutes = require('./routes/notification.routes');
const adminRoutes = require('./routes/admin.routes');
const vitalsRoutes = require('./routes/vitals.routes');
const maternalRoutes = require('./routes/maternal.routes');
const vaccinationRouteRoutes = require('./routes/vaccinationRoute.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const messageRoutes = require('./routes/message.routes');
const announcementRoutes = require('./routes/announcement.routes');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const app = express();
// Supports a comma-separated list (e.g. "http://localhost:5173,http://192.168.1.102:5173")
// for any origin you want to allow explicitly. On top of that, any origin
// on a private LAN IP (192.168.x.x, 10.x.x.x, 172.16-31.x.x) or localhost is
// accepted automatically - this machine's LAN IP changes on every different
// WiFi network (home vs. a classroom), and forgetting to update this list
// at the venue would otherwise silently break the app for every device that
// isn't this laptop.
const allowedOrigins = (process.env.FRONTEND_URL || '*').split(',').map((o) => o.trim());
const isPrivateNetworkOrigin = (origin) => {
  try {
    const { hostname } = new URL(origin);
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/.test(hostname)
    );
  } catch {
    return false;
  }
};
const corsOptions = {
  origin: allowedOrigins.includes('*')
    ? '*'
    : (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || isPrivateNetworkOrigin(origin)) {
          callback(null, true);
        } else {
          callback(new Error('Not allowed by CORS'));
        }
      },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/consultations', consultationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/followups', followupRoutes);
app.use('/api/care-circle', carecircleRoutes);
app.use('/api/facilities', facilityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/vitals', vitalsRoutes);
app.use('/api/maternal-checkins', maternalRoutes);
app.use('/api/vaccination-routes', vaccinationRouteRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/announcements', announcementRoutes);

// In production this single process serves the built frontend too, rather
// than assuming a separate static host - the shared hosting here gives one
// Node process/port per site. Any route that isn't /api or /uploads falls
// through to the SPA's index.html so React Router's client-side routes
// (e.g. /dashboard on a hard refresh) resolve instead of 404ing.
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (process.env.NODE_ENV === 'production' && fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// Centralized error handler - keeps stack traces out of API responses.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our end.' });
});

const PORT = process.env.PORT || 5000;

// Wrap the Express app in a plain http server so Socket.io can share the
// same port - this is the signaling channel for WebRTC video/audio
// consultations (Adaptive Mode). Signaling only ever carries connection
// metadata (SDP offers/answers, ICE candidates, mode-change events) -
// never medical content, which stays in the REST API + MySQL.
const server = http.createServer(app);
const io = new Server(server, { cors: corsOptions });

io.on('connection', (socket) => {
  socket.on('join-room', (roomCode) => {
    socket.join(roomCode);
    socket.to(roomCode).emit('peer-joined');
  });

  socket.on('signal', ({ roomCode, data }) => {
    // Relay WebRTC offer/answer/ICE candidates to the other participant
    // in the room only - never broadcast beyond the two-person room.
    socket.to(roomCode).emit('signal', data);
  });

  socket.on('mode-change', ({ roomCode, mode, reason }) => {
    // Lets the other participant's UI reflect "they switched to audio"
    // in real time, not just the sender's own screen.
    socket.to(roomCode).emit('peer-mode-change', { mode, reason });
  });

  socket.on('chat-message', ({ roomCode, message, sender }) => {
    // Lightweight in-call text channel, distinct from the persisted
    // store-and-forward async_submissions used when the call can't
    // connect at all.
    socket.to(roomCode).emit('chat-message', { message, sender, at: Date.now() });
  });

  socket.on('leave-room', (roomCode) => {
    socket.leave(roomCode);
    socket.to(roomCode).emit('peer-left');
  });
});

async function start() {
  try {
    await testConnection();
    console.log('Database connection OK');
  } catch (err) {
    console.error('Could not connect to the database:', err.message);
    console.error('Server will still start, but auth routes will fail until DB is reachable.');
  }

  server.listen(PORT, () => {
    console.log(`Telemedicine backend (HTTP + Socket.io) running on port ${PORT}`);
  });
}

start();

module.exports = app;
