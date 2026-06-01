const router = require('express').Router();
const prisma = require('../config/prisma');
const auth   = require('../middleware/authenticate');
const { ok, err } = require('../utils/response');

// GET /marketplace — browse listings (public)
router.get('/', async (req, res, next) => {
  try {
    const { category, location, q } = req.query;
    const where = { status: 'ACTIVE' };
    if (category) where.category = category.toUpperCase();
    if (location) where.location = { contains: location, mode: 'insensitive' };
    if (q)        where.title    = { contains: q, mode: 'insensitive' };

    const listings = await prisma.listing.findMany({
      where, orderBy: { createdAt: 'desc' },
      include: { sellerUser: { select: { id: true, name: true, role: true } } },
    });
    return ok(res, listings);
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const listing = await prisma.listing.findUnique({
      where:   { id: req.params.id },
      include: { sellerUser: { select: { id: true, name: true, role: true } }, offers: true },
    });
    if (!listing) return err(res, 'Listing not found', 404);
    await prisma.listing.update({ where: { id: req.params.id }, data: { viewsCount: { increment: 1 } } });
    return ok(res, listing);
  } catch (e) { next(e); }
});

router.post('/', auth, async (req, res, next) => {
  try {
    const listing = await prisma.listing.create({ data: { ...req.body, sellerId: req.user.id } });
    return ok(res, listing, 'Listing created', 201);
  } catch (e) { next(e); }
});

router.post('/:id/offer', auth, async (req, res, next) => {
  try {
    const { offerAmount, message, paymentMethod } = req.body;
    const offer = await prisma.listingOffer.create({
      data: { listingId: req.params.id, buyerId: req.user.id, offerAmount, message, paymentMethod },
    });
    return ok(res, offer, 'Offer sent', 201);
  } catch (e) { next(e); }
});

module.exports = router;
