const prisma = require('../config/database');
const redis  = require('../config/redis');
const logger = require('../utils/logger');
const jwt    = require('jsonwebtoken');

/**
 * Socket.io rooms: one room per booking.
 * Room ID = `tracking:${bookingId}`
 *
 * Events emitted by vet:    update_location  { lat, lng }
 * Events received by owner: location_update  { lat, lng, etaMinutes, distanceKm }
 * Events:                   tracking_ended   when booking completed/cancelled
 */
const initTracking = (io) => {
  // Auth middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await prisma.user.findUnique({
        where:  { id: decoded.userId },
        select: { id: true, name: true, role: true },
      });
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.debug(`[Socket] Connected: ${socket.user.name} (${socket.user.role})`);

    // ── Join tracking room ──────────────────────────────────────────────────
    socket.on('join_tracking', async ({ bookingId }) => {
      try {
        const booking = await prisma.booking.findUnique({
          where: { id: bookingId },
          include: { vet: { select: { userId: true } } },
        });
        if (!booking) return socket.emit('error', { message: 'Booking not found' });

        // Only vet or owner of this booking can join
        const isOwner = booking.ownerId === socket.user.id;
        const isVet   = booking.vet.userId === socket.user.id;
        if (!isOwner && !isVet) return socket.emit('error', { message: 'Access denied' });

        const room = `tracking:${bookingId}`;
        socket.join(room);
        socket.currentBookingId = bookingId;

        // Send last known position from Redis cache
        const cached = await redis.get(`location:${bookingId}`);
        if (cached) socket.emit('location_update', JSON.parse(cached));

        logger.debug(`[Tracking] ${socket.user.role} joined room ${room}`);
        socket.emit('joined', { room, bookingId });
      } catch (err) {
        logger.error(`[Tracking] join_tracking error: ${err.message}`);
      }
    });

    // ── Vet pushes GPS update ───────────────────────────────────────────────
    socket.on('update_location', async ({ bookingId, lat, lng }) => {
      try {
        if (socket.user.role !== 'VET') return;

        const payload = { lat, lng, updatedAt: new Date().toISOString() };

        // Cache in Redis (TTL: 30s)
        await redis.set(`location:${bookingId}`, JSON.stringify(payload), 'EX', 30);

        // Persist to tracking_sessions (upsert)
        await prisma.trackingSession.upsert({
          where:  { bookingId },
          update: { vetLat: lat, vetLng: lng, updatedAt: new Date() },
          create: { bookingId, vetLat: lat, vetLng: lng },
        });

        // Broadcast to room (owner receives this)
        const room = `tracking:${bookingId}`;
        socket.to(room).emit('location_update', payload);
      } catch (err) {
        logger.error(`[Tracking] update_location error: ${err.message}`);
      }
    });

    // ── Mark arrived ────────────────────────────────────────────────────────
    socket.on('mark_arrived', async ({ bookingId }) => {
      try {
        await prisma.booking.update({
          where: { id: bookingId },
          data:  { status: 'IN_PROGRESS' },
        });
        io.to(`tracking:${bookingId}`).emit('vet_arrived', { bookingId });
      } catch (err) {
        logger.error(`[Tracking] mark_arrived error: ${err.message}`);
      }
    });

    // ── Leave room ──────────────────────────────────────────────────────────
    socket.on('leave_tracking', ({ bookingId }) => {
      socket.leave(`tracking:${bookingId}`);
    });

    socket.on('disconnect', () => {
      logger.debug(`[Socket] Disconnected: ${socket.user?.name}`);
    });
  });

  logger.info('[Socket] Live tracking initialised');
};

module.exports = { initTracking };
