const router = require('express').Router();
const prisma = require('../config/prisma');
const auth   = require('../middleware/authenticate');
const { ok, err } = require('../utils/response');
const logger = require('../utils/logger');

router.use(auth);

// POST /payments/payout — vet requests withdrawal
router.post('/payout', async (req, res, next) => {
  try {
    const { amount, method, accountNo } = req.body;
    const vet    = await prisma.vetProfile.findUnique({ where: { userId: req.user.id } });
    const wallet = await prisma.vetWallet.findUnique({ where: { vetId: vet.id } });
    if (!wallet || wallet.availableBalance < amount)
      return err(res, 'Insufficient balance', 400);

    const payout = await prisma.$transaction([
      prisma.payoutRequest.create({ data: { walletId: wallet.id, amount, method, accountNo } }),
      prisma.vetWallet.update({ where: { id: wallet.id }, data: { availableBalance: { decrement: amount } } }),
      prisma.walletTransaction.create({ data: { walletId: wallet.id, amount, type: 'debit', description: `Payout to ${method}` } }),
    ]);

    // TODO: initiate real Telebirr/CBE transfer
    logger.info(`Payout requested: vet=${vet.id} amount=${amount} method=${method}`);
    return ok(res, payout[0], 'Payout initiated');
  } catch (e) { next(e); }
});

// POST /payments/telebirr/webhook — Telebirr payment confirmation
router.post('/telebirr/webhook', async (req, res, next) => {
  try {
    // TODO: verify Telebirr signature
    const { bookingId, status, reference } = req.body;
    if (status === 'SUCCESS') {
      await prisma.payment.update({
        where: { bookingId },
        data:  { status: 'HELD_IN_ESCROW', telebirrRef: reference, paidAt: new Date() },
      });
    }
    return res.json({ success: true });
  } catch (e) { next(e); }
});

module.exports = router;
