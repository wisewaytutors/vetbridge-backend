const router  = require('express').Router();
const { z }   = require('zod');
const { v4: uuid } = require('uuid');
const prisma  = require('../config/database');
const { auth, requireRole } = require('../middleware/auth');
const { maskBookingForUser } = require('../middleware/maskContacts');
const escrowService  = require('../services/escrow');
const notifService   = require('../services/notifications');
const commissionSvc  = require('../services/commission');

// ─── POST /bookings — create booking ─────────────────────────────────────────
router.post('/', auth, requireRole('OWNER'), async (req, res, next) => {
  try {
    const schema = z.object({
      vetId:      z.string().uuid(),
      petId:      z.string().uuid(),
      type:       z.enum(['HOME_VISIT','CLINIC','EMERGENCY']).default('HOME_VISIT'),
      ownerLat:   z.number(),
      ownerLng:   z.number(),
      ownerAddress:      z.string(),
      ownerNeighbourhood: z.string(),
      ownerPhone: z.string(),
      notes:      z.string().optional(),
      scheduledAt: z.string().optional(),
      paymentMethod: z.enum(['TELEBIRR','CBE_BIRR','CASH']),
      amount:     z.number().positive(),
    });

    const data = schema.parse(req.body);

    // Verify vet exists and is online
    const vet = await prisma.vetProfile.findUnique({
      where: { id: data.vetId },
      include: { user: true },
    });
    if (!vet || !vet.isVerified) return res.status(404).json({ error: 'Vet not found or not verified' });

    // Verify pet belongs to owner
    const pet = await prisma.pet.findFirst({ where: { id: data.petId, ownerId: req.user.id } });
    if (!pet) return res.status(404).json({ error: 'Pet not found' });

    // Calculate commission
    const commissionRate = await commissionSvc.getRate(data.vetId);
    const platformFee    = parseFloat((data.amount * commissionRate).toFixed(2));
    const netToVet       = parseFloat((data.amount - platformFee).toFixed(2));

    // Create booking + payment (escrow hold) in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          id: uuid(),
          ownerId:    req.user.id,
          vetId:      data.vetId,
          petId:      data.petId,
          type:       data.type,
          status:     'PENDING',
          ownerLat:   data.ownerLat,
          ownerLng:   data.ownerLng,
          ownerAddress:       data.ownerAddress,
          ownerNeighbourhood: data.ownerNeighbourhood,
          ownerPhone: data.ownerPhone,
          notes:      data.notes,
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        },
      });

      const payment = await tx.payment.create({
        data: {
          id:          uuid(),
          bookingId:   booking.id,
          amount:      data.amount,
          platformFee,
          netToVet,
          method:      data.paymentMethod,
          status:      'PENDING',
        },
      });

      return { booking, payment };
    });

    // Initiate payment hold (Telebirr/CBE)
    if (data.paymentMethod !== 'CASH') {
      await escrowService.initiateHold(result.payment, data.paymentMethod);
    }

    // Notify vet of new booking request
    await notifService.send(vet.user.id, {
      type:  'NEW_BOOKING',
      title: `New booking request`,
      body:  `${req.user.name}'s ${pet.name} needs a ${data.type.replace('_',' ').toLowerCase()}`,
      data:  { bookingId: result.booking.id },
    });

    res.status(201).json(maskBookingForUser(result.booking, req.user.id));
  } catch (err) { next(err); }
});

// ─── GET /bookings — list my bookings ────────────────────────────────────────
router.get('/', auth, async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const isVet = req.user.role === 'VET';

    const vetProfile = isVet
      ? await prisma.vetProfile.findUnique({ where: { userId: req.user.id } })
      : null;

    const where = {
      ...(isVet   ? { vetId: vetProfile?.id } : { ownerId: req.user.id }),
      ...(status  ? { status } : {}),
    };

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: { pet: true, payment: { select: { status:true, method:true, amount:true } } },
        orderBy: { createdAt: 'desc' },
        skip:  (parseInt(page) - 1) * parseInt(limit),
        take:  parseInt(limit),
      }),
      prisma.booking.count({ where }),
    ]);

    const masked = bookings.map(b => maskBookingForUser(b, req.user.id));
    res.json({ data: masked, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) { next(err); }
});

// ─── GET /bookings/:id ────────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({
      where: { id: req.params.id },
      include: {
        pet: true,
        vet: { include: { user: { select: { name:true, phone:true } } } },
        payment: true,
        trackingSession: true,
        chatMessages: { orderBy: { createdAt: 'asc' }, take: 50 },
      },
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    res.json(maskBookingForUser(booking, req.user.id));
  } catch (err) { next(err); }
});

// ─── PUT /bookings/:id/accept ─────────────────────────────────────────────────
router.put('/:id/accept', auth, requireRole('VET'), async (req, res, next) => {
  try {
    const vetProfile = await prisma.vetProfile.findUnique({ where: { userId: req.user.id } });

    const booking = await prisma.booking.findFirst({
      where: { id: req.params.id, vetId: vetProfile.id, status: 'PENDING' },
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found or already handled' });

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data:  { status: 'CONFIRMED', confirmedAt: new Date() },
    });

    // Notify owner — also unlocks contact details
    await notifService.send(booking.ownerId, {
      type:  'BOOKING_CONFIRMED',
      title: 'Vet confirmed! 🐾',
      body:  `Dr. ${req.user.name} accepted your booking. Track them live now.`,
      data:  { bookingId: booking.id },
    });

    res.json(maskBookingForUser(updated, req.user.id));
  } catch (err) { next(err); }
});

// ─── PUT /bookings/:id/complete ───────────────────────────────────────────────
router.put('/:id/complete', auth, requireRole('VET'), async (req, res, next) => {
  try {
    const vetProfile = await prisma.vetProfile.findUnique({ where: { userId: req.user.id } });
    const booking    = await prisma.booking.findFirst({
      where: { id: req.params.id, vetId: vetProfile.id, status: { in: ['EN_ROUTE','IN_PROGRESS'] } },
    });
    if (!booking) return res.status(404).json({ error: 'Booking not found or not in progress' });

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data:  { status: 'COMPLETED', completedAt: new Date() },
    });

    // Release escrow → credit vet wallet
    await escrowService.releaseToVet(booking.id, vetProfile.id);

    // Increment vet's completed count → recalculate tier
    await prisma.vetProfile.update({
      where: { id: vetProfile.id },
      data:  { completedCount: { increment: 1 } },
    });
    await commissionSvc.recalculateTier(vetProfile.id);

    // Prompt owner to leave review
    await notifService.send(booking.ownerId, {
      type:  'REVIEW_REQUEST',
      title: 'How was the visit? ⭐',
      body:  `Rate your experience with Dr. ${req.user.name}`,
      data:  { bookingId: booking.id },
    });

    res.json(updated);
  } catch (err) { next(err); }
});

// ─── PUT /bookings/:id/cancel ─────────────────────────────────────────────────
router.put('/:id/cancel', auth, async (req, res, next) => {
  try {
    const { reason } = req.body;
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    const isOwner = booking.ownerId === req.user.id;
    const isVetProfile = req.user.role === 'VET';
    if (!isOwner && !isVetProfile) return res.status(403).json({ error: 'Forbidden' });

    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data:  { status: 'CANCELLED', cancelledAt: new Date(), cancellationReason: reason },
    });

    // Refund escrow if payment was held
    await escrowService.refund(booking.id);

    res.json(updated);
  } catch (err) { next(err); }
});

module.exports = router;
