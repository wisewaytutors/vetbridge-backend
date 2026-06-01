const prisma  = require('../config/prisma');
const logger  = require('../utils/logger');
const { calculateFees } = require('./commission.service');
const notificationService = require('./notification.service');

/**
 * Hold funds in escrow when booking is created / payment confirmed.
 */
async function holdInEscrow(bookingId, amount, method) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { vet: true },
  });
  if (!booking) throw new Error('Booking not found');

  const { platformFee, netToVet } = await calculateFees(booking.vetId, amount);

  const payment = await prisma.payment.upsert({
    where:  { bookingId },
    update: { status: 'HELD_IN_ESCROW', paidAt: new Date() },
    create: {
      bookingId,
      amount,
      platformFee,
      netToVet,
      method,
      status: 'HELD_IN_ESCROW',
      paidAt: new Date(),
    },
  });

  // Increment vet's pending escrow balance
  await ensureWallet(booking.vetId);
  await prisma.vetWallet.update({
    where: { vetId: booking.vetId },
    data:  { pendingEscrow: { increment: netToVet } },
  });

  logger.info(`Escrow held: booking=${bookingId} amount=${amount} net=${netToVet}`);
  return payment;
}

/**
 * Release escrow to vet wallet after booking is completed.
 * Called automatically when booking.status → COMPLETED.
 */
async function releaseEscrow(bookingId) {
  const payment = await prisma.payment.findUnique({ where: { bookingId } });
  if (!payment || payment.status !== 'HELD_IN_ESCROW') return;

  const booking = await prisma.booking.findUnique({
    where:   { id: bookingId },
    include: { vet: { include: { user: true } }, owner: true },
  });

  await prisma.$transaction([
    prisma.payment.update({
      where: { bookingId },
      data:  { status: 'RELEASED', releasedAt: new Date() },
    }),
    prisma.vetWallet.update({
      where: { vetId: booking.vetId },
      data: {
        availableBalance: { increment: payment.netToVet },
        pendingEscrow:    { decrement: payment.netToVet },
        totalEarned:      { increment: payment.netToVet },
      },
    }),
    prisma.walletTransaction.create({
      data: {
        walletId:    (await prisma.vetWallet.findUnique({ where: { vetId: booking.vetId } })).id,
        amount:      payment.netToVet,
        type:        'credit',
        bookingId,
        description: `Payment released for booking ${bookingId}`,
      },
    }),
    prisma.vetProfile.update({
      where: { id: booking.vetId },
      data:  { completedBookings: { increment: 1 } },
    }),
  ]);

  // Notify vet
  await notificationService.send(booking.vet.userId, {
    type:  'payment',
    title: 'Payment released 💰',
    body:  `ETB ${payment.netToVet} has been credited to your VetBridge wallet.`,
    data:  { bookingId },
  });

  logger.info(`Escrow released: booking=${bookingId} net=${payment.netToVet}`);
}

/**
 * Refund escrow to owner if booking is cancelled before completion.
 */
async function refundEscrow(bookingId) {
  const payment = await prisma.payment.findUnique({ where: { bookingId } });
  if (!payment || payment.status !== 'HELD_IN_ESCROW') return;

  const booking = await prisma.booking.findUnique({
    where:   { id: bookingId },
    include: { vet: true },
  });

  await prisma.$transaction([
    prisma.payment.update({
      where: { bookingId },
      data:  { status: 'REFUNDED' },
    }),
    prisma.vetWallet.update({
      where: { vetId: booking.vetId },
      data:  { pendingEscrow: { decrement: payment.netToVet } },
    }),
  ]);

  logger.info(`Escrow refunded: booking=${bookingId}`);
}

async function ensureWallet(vetId) {
  await prisma.vetWallet.upsert({
    where:  { vetId },
    update: {},
    create: { vetId, availableBalance: 0, pendingEscrow: 0, totalEarned: 0 },
  });
}

module.exports = { holdInEscrow, releaseEscrow, refundEscrow };
