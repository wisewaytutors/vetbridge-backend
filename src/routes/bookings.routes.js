const router = require('express').Router();
const prisma = require('../config/prisma');
const auth   = require('../middleware/authenticate');
const { ok, err } = require('../utils/response');
const { maskBookingDetails } = require('../utils/mask');
const { holdInEscrow, refundEscrow } = require('../services/escrow.service');
const notificationService = require('../services/notification.service');

router.use(auth);

// POST /bookings — create booking
router.post('/', async (req, res, next) => {
  try {
    const { vetId, petId, type, ownerLat, ownerLng, ownerAddress,
            ownerNeighbourhood, ownerPhone, notes, scheduledAt, paymentMethod, amount } = req.body;

    const booking = await prisma.booking.create({
      data: { ownerId: req.user.id, vetId, petId, type: type || 'HOME_VISIT',
              ownerLat, ownerLng, ownerAddress, ownerNeighbourhood, ownerPhone, notes,
              scheduledAt: scheduledAt ? new Date(scheduledAt) : null },
      include: { vet: { include: { user: true } }, pet: true },
    });

    // Hold funds in escrow
    if (paymentMethod && paymentMethod !== 'CASH' && amount) {
      await holdInEscrow(booking.id, amount, paymentMethod);
    }

    // Notify vet
    await notificationService.send(booking.vet.userId, {
      type: 'booking', title: '📅 New booking request',
      body: `${req.user.name} has booked you for ${booking.pet.name}`,
      data: { bookingId: booking.id },
    });

    return ok(res, booking, 'Booking created', 201);
  } catch (e) { next(e); }
});

// GET /bookings — list my bookings
router.get('/', async (req, res, next) => {
  try {
    const { role, id } = req.user;
    const where = role === 'OWNER'
      ? { ownerId: id }
      : { vet: { userId: id } };

    const bookings = await prisma.booking.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: { pet: true, vet: { include: { user: { select: { name: true } } } } },
    });

    const masked = bookings.map((b) => maskBookingDetails(b, id));
    return ok(res, masked);
  } catch (e) { next(e); }
});

// GET /bookings/:id
router.get('/:id', async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: { pet: true, payment: true, trackingSession: true,
                 vet: { include: { user: { select: { name: true, phone: true } } } } },
    });
    if (!booking) return err(res, 'Not found', 404);
    return ok(res, maskBookingDetails(booking, req.user.id));
  } catch (e) { next(e); }
});

// PUT /bookings/:id/accept — vet accepts
router.put('/:id/accept', async (req, res, next) => {
  try {
    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data:  { status: 'CONFIRMED', confirmedAt: new Date() },
      include: { owner: true },
    });
    await notificationService.send(booking.ownerId, {
      type: 'booking', title: '✅ Vet is on the way!',
      body: 'Your vet has confirmed. Live tracking will begin shortly.',
      data: { bookingId: booking.id },
    });
    return ok(res, booking);
  } catch (e) { next(e); }
});

// PUT /bookings/:id/cancel
router.put('/:id/cancel', async (req, res, next) => {
  try {
    const booking = await prisma.booking.update({
      where: { id: req.params.id },
      data:  { status: 'CANCELLED', cancelledAt: new Date() },
    });
    await refundEscrow(booking.id);
    return ok(res, booking);
  } catch (e) { next(e); }
});

module.exports = router;
