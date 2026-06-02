const express     = require('express');
const cors        = require('cors');
const helmet      = require('helmet');
const morgan      = require('morgan');
const rateLimit   = require('express-rate-limit');
const config      = require('./config');
const routes      = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const logger      = require('./utils/logger');

const app = express();

// ── Security ──────────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: config.frontendUrl, credentials: true }));

// ── Rate limiting ─────────────────────────────────────────────────────────────
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: 'Too many auth requests' }));
app.use('/api',      rateLimit({ windowMs: 60 * 1000,      max: 200 }));

// ── Parsing ───────────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logging ───────────────────────────────────────────────────────────────────
if (config.env !== 'test') {
  app.use(morgan('combined', { stream: { write: (m) => logger.info(m.trim()) } }));
}

// ── Root + health ─────────────────────────────────────────────────────────────
app.get('/', (_req, res) =>
  res.json({
    success: true,
    name:    'VetBridge API',
    version: '1.0.0',
    health:  '/health',
    api:     '/api',
  })
);

app.get('/health', (_req, res) =>
  res.json({ status: 'ok', platform: 'VetBridge', version: '1.0.0', ts: new Date().toISOString() })
);

// ── API routes ────────────────────────────────────────────────────────────────
app.use('/api', routes);

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
