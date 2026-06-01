require('dotenv').config();
const http   = require('http');
const { Server } = require('socket.io');
const app    = require('./app');
const config = require('./config');
const logger = require('./utils/logger');
const prisma = require('./config/prisma');
const initTracking    = require('./socket/tracking.socket');
const startReminderJob = require('./jobs/reminderJob');
const startLeakageJob  = require('./jobs/leakageJob');

async function main() {
  // ── Test DB connection ──────────────────────────────────────────────────────
  try {
    await prisma.$connect();
    logger.info('✅ PostgreSQL connected');
  } catch (e) {
    logger.error('❌ Database connection failed', e);
    process.exit(1);
  }

  // ── HTTP server ─────────────────────────────────────────────────────────────
  const server = http.createServer(app);

  // ── Socket.io ───────────────────────────────────────────────────────────────
  const io = new Server(server, {
    cors: { origin: config.frontendUrl, methods: ['GET', 'POST'] },
  });
  initTracking(io);
  logger.info('✅ Socket.io tracking namespace ready');

  // ── Cron jobs ────────────────────────────────────────────────────────────────
  startReminderJob();
  startLeakageJob();

  // ── Listen ───────────────────────────────────────────────────────────────────
  server.listen(config.port, () => {
    logger.info(`🚀 VetBridge API running on port ${config.port} [${config.env}]`);
    logger.info(`📡 WebSocket tracking: ws://localhost:${config.port}/tracking`);
    logger.info(`❤️  Health: http://localhost:${config.port}/health`);
  });

  // ── Graceful shutdown ────────────────────────────────────────────────────────
  const shutdown = async (signal) => {
    logger.info(`${signal} received — shutting down`);
    server.close(async () => {
      await prisma.$disconnect();
      logger.info('Server and DB closed');
      process.exit(0);
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));
}

main().catch((e) => { logger.error('Fatal startup error', e); process.exit(1); });
