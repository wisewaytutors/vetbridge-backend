const prisma = require('../config/prisma');
const { verify } = require('../utils/jwt');
const logger = require('../utils/logger');

module.exports = function initTracking(io) {
  const ns = io.of('/tracking');

  ns.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token'));
      const payload = verify(token);
      const user = await prisma.user.findUnique({ where: { id: payload.userId }, select: { id: true, role: true } });
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch { next(new Error('Invalid token')); }
  });

  ns.on('connection', (socket) => {
    logger.info(`Tracking connected: user=${socket.user.id}`);

    socket.on('join_room', async ({ bookingId }) => {
      const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
      if (!booking) return socket.emit('error', 'Booking not found');
      socket.join(bookingId);
      socket.bookingId = bookingId;
      socket.emit('room_joined', { bookingId });
    });

    // Vet pushes GPS every ~4 seconds
    socket.on('update_location', async ({ lat, lng, etaMinutes }) => {
      const { bookingId } = socket;
      if (!bookingId) return;
      await prisma.trackingSession.upsert({
        where:  { bookingId },
        update: { vetLat: lat, vetLng: lng, etaMinutes: etaMinutes ?? null },
        create: { bookingId, vetLat: lat, vetLng: lng, etaMinutes: etaMinutes ?? null },
      });
      socket.to(bookingId).emit('location_update', { lat, lng, etaMinutes });
    });

    socket.on('mark_arrived', async () => {
      const { bookingId } = socket;
      if (!bookingId) return;
      await prisma.booking.update({ where: { id: bookingId }, data: { status: 'IN_PROGRESS' } });
      ns.to(bookingId).emit('status_update', { status: 'IN_PROGRESS' });
    });

    socket.on('complete_visit', async () => {
      const { bookingId } = socket;
      if (!bookingId) return;
      await prisma.booking.update({ where: { id: bookingId }, data: { status: 'COMPLETED', completedAt: new Date() } });
      const { releaseEscrow } = require('../services/escrow.service');
      await releaseEscrow(bookingId);
      ns.to(bookingId).emit('status_update', { status: 'COMPLETED' });
      ns.to(bookingId).emit('tracking_ended', { bookingId });
    });

    socket.on('disconnect', () => logger.info(`Tracking disconnected: user=${socket.user.id}`));
  });
};
