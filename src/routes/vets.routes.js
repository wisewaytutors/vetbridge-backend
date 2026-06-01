const router = require('express').Router();
const prisma = require('../config/prisma');
const auth   = require('../middleware/authenticate');
const { ok, err } = require('../utils/response');
const { getCommissionTier } = require('../services/commission.service');

// GET /vets — browse marketplace (public)
router.get('/', async (req, res, next) => {
  try {
    const { area, specialization, online } = req.query;
    const where = { isVerified: true };
    if (area)           where.primaryArea       = { contains: area, mode: 'insensitive' };
    if (specialization) where.specializations   = { has: specialization };
    if (online === 'true') where.isOnline        = true;

    const vets = await prisma.vetProfile.findMany({
      where,
      include: { user: { select: { id: true, name: true, avatarUrl: true, language: true } } },
      orderBy: [{ ratingAvg: 'desc' }, { completedBookings: 'desc' }],
    });
    return ok(res, vets);
  } catch (e) { next(e); }
});

// GET /vets/:id — vet profile detail (public)
router.get('/:id', async (req, res, next) => {
  try {
    const vet = await prisma.vetProfile.findUnique({
      where:   { id: req.params.id },
      include: {
        user:    { select: { id: true, name: true, avatarUrl: true } },
        wallet:  false, // never expose wallet to public
      },
    });
    if (!vet) return err(res, 'Vet not found', 404);
    return ok(res, vet);
  } catch (e) { next(e); }
});

// PUT /vets/me/online — toggle online status
router.put('/me/online', auth, async (req, res, next) => {
  try {
    const vet = await prisma.vetProfile.findUnique({ where: { userId: req.user.id } });
    if (!vet) return err(res, 'Vet profile not found', 404);
    const updated = await prisma.vetProfile.update({
      where: { id: vet.id },
      data:  { isOnline: !vet.isOnline },
    });
    return ok(res, { isOnline: updated.isOnline });
  } catch (e) { next(e); }
});

// GET /vets/me/earnings — vet earnings summary
router.get('/me/earnings', auth, async (req, res, next) => {
  try {
    const vet    = await prisma.vetProfile.findUnique({ where: { userId: req.user.id } });
    if (!vet) return err(res, 'Vet not found', 404);
    const wallet = await prisma.vetWallet.findUnique({
      where:   { vetId: vet.id },
      include: { transactions: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    const tier = await getCommissionTier(vet.id);
    return ok(res, { wallet, tier, completedBookings: vet.completedBookings });
  } catch (e) { next(e); }
});

module.exports = router;
