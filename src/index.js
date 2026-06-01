require('dotenv').config();
const express      = require('express');
const http         = require('http');
const { Server }   = require('socket.io');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const rateLimit    = require('express-rate-limit');

const logger       = require('./utils/logger');
const { initTracking } = require('./sockets/tracking');
const { startJobs }    = require('./jobs');

// ─── Routes ───────────────────────────────────────────────────────────────────
const authRoutes         = require('./routes/auth');
const userRoutes         = require('./routes/users');
const vetRoutes          = require('./routes/vets');
const petRoutes          = require('./routes/pets');
const clinicRoutes       = require('./routes/clinics');
const bookingRoutes      = require('./routes/bookings');
const paymentRoutes      = require('./routes/payments');
const medicalRoutes      = require('./routes/medical');
const marketplaceRoutes  = require('./routes/marketplace');
const reviewRoutes       = require('./routes/reviews');
const notifRoutes        = require('./routes/notifications');
const aiRoutes           = require('./routes/ai');
const sosRoutes          = require('./routes/sos');
const adminRoutes        = require('./routes/admin');

// ─── App setup ────────────────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);
const io     = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || '*', methods: ['GET','POST'] },
  pingTimeout: 60000,
});

// ─── Global middleware ────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

// Rate limiting
app.use('/api/', rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, slow down.' },
}));

// Auth routes get tighter limit (OTP abuse prevention)
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts. Try again in 15 minutes.' },
}));

// ─── Health check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'PawCare API', version: '1.0.0', ts: new Date() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/users',       userRoutes);
app.use('/api/vets',        vetRoutes);
app.use('/api/pets',        petRoutes);
app.use('/api/clinics',     clinicRoutes);
app.use('/api/bookings',    bookingRoutes);
app.use('/api/payments',    paymentRoutes);
app.use('/api/medical',     medicalRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/reviews',     reviewRoutes);
app.use('/api/notifications', notifRoutes);
app.use('/api/ai',          aiRoutes);
app.use('/api/sos',         sosRoutes);
app.use('/api/admin',       adminRoutes);

// ─── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`${err.message} — ${req.method} ${req.url}`, { stack: err.stack });
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ─── WebSocket: live tracking ─────────────────────────────────────────────────
initTracking(io);

// ─── Background jobs (cron + bull queues) ─────────────────────────────────────
startJobs();

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`🐾 PawCare API running on port ${PORT} [${process.env.NODE_ENV}]`);
});

module.exports = { app, io };
