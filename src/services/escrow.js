const { v4: uuid } = require('uuid');
const prisma  = require('../config/database');
const logger  = require('../utils/logger');

/**
 * Initiate payment hold via Telebirr or CBE Birr.
 * Marks payment as HELD_IN_ESCROW once confirmed by gateway.
 */
const initiateHold = async (payment, method) => {
  try {
    logger.info(`[Escrow] Initiating ${method} hold for payment ${payment.id} — ETB ${payment.amount}`);

    // TODO: real Telebirr / CBE API call here
    // const ref = await telebirrService.charge({ amount: payment.amount, ... });

    await prisma.payment.update({
      where: { id: payment.id },
      data:  {
        status:  'HELD_IN_ESCROW',
        heldAt:  new Date(),
        externalRef: `MOCK-${Date.now()}`, // replace with real ref
      },
    });

    logger.info(`[Escrow] Hold confirmed for payment ${payment.id}`);
  } catch (err) {
    logger.error(`[Escrow] Hold failed for ${payment.id}: ${err.message}`);
    throw err;
  }
};

/**
 * Release escrow to vet wallet after booking is completed.
 * Deducts platform commission, credits net amount to vet.
 */
const releaseToVet = async (bookingId, vetId) => {
  try {
    const payment = await prisma.payment.findUnique({ where: { bookingId } });
    if (!payment || payment.status !== 'HELD_IN_ESCROW') {
      logger.warn(`[Escrow] No held payment for booking ${bookingId}`);
      return;
    }

    // Upsert vet wallet
    let wallet = await prisma.vetWallet.findUnique({ where: { vetId } });
    if (!wallet) {
      wallet = await prisma.vetWallet.create({
        data: { id: uuid(), vetId, availableBalance: 0, pendingEscrow: 0, totalEarned: 0 },
      });
    }

    await prisma.$transaction([
      // Mark payment released
      prisma.payment.update({
        where: { id: payment.id },
        data:  { status: 'RELEASED', releasedAt: new Date() },
      }),
      // Credit vet wallet
      prisma.vetWallet.update({
        where: { vetId },
        data:  {
          availableBalance: { increment: payment.netToVet },
          totalEarned:      { increment: payment.netToVet },
        },
      }),
      // Log transaction
      prisma.vetWalletTx.create({
        data: {
          id:        uuid(),
          vetId,
          walletId:  wallet.id,
          amount:    payment.netToVet,
          type:      'credit',
          bookingId,
          note:      `Booking payment released. Commission: ETB ${payment.platformFee}`,
        },
      }),
    ]);

    logger.info(`[Escrow] Released ETB ${payment.netToVet} to vet ${vetId} for booking ${bookingId}`);
  } catch (err) {
    logger.error(`[Escrow] Release failed for booking ${bookingId}: ${err.message}`);
    throw err;
  }
};

/**
 * Refund escrow to owner on booking cancellation.
 */
const refund = async (bookingId) => {
  try {
    const payment = await prisma.payment.findUnique({ where: { bookingId } });
    if (!payment || !['HELD_IN_ESCROW','PENDING'].includes(payment.status)) return;

    // TODO: real Telebirr/CBE refund API call
    await prisma.payment.update({
      where: { id: payment.id },
      data:  { status: 'REFUNDED', refundedAt: new Date() },
    });

    logger.info(`[Escrow] Refunded ETB ${payment.amount} for booking ${bookingId}`);
  } catch (err) {
    logger.error(`[Escrow] Refund failed for booking ${bookingId}: ${err.message}`);
  }
};

module.exports = { initiateHold, releaseToVet, refund };
