const router = require('express').Router();
const prisma = require('../config/prisma');
const auth   = require('../middleware/authenticate');
const { ok, err } = require('../utils/response');

router.use(auth);

// POST /reviews — verified review (transaction-gated)
router.post('/', async (req, res, next) => {
  try {
    const { bookingId, rating, tags, comment } = req.body;

    // Guard: booking must be completed + paid + no existing review + within 7 days
    const booking = await prisma.booking.findUnique({
      where:   { id: bookingId },
      include: { payment: true, review: true },
    });

    if (!booking)                        return err(res, 'Booking not found', 404);
    if (booking.ownerId !== req.user.id) return err(res, 'Not your booking', 403);
    if (booking.status !== 'COMPLETED')  return err(res, 'Booking not completed', 400);
    if (booking.payment?.status !== 'RELEASED') return err(res, 'Payment not confirmed', 400);
    if (booking.review)                  return err(res, 'Review already submitted', 409);

    const daysSince = (Date.now() - new Date(booking.completedAt)) / 86400000;
    if (daysSince > 7) return err(res, 'Review window (7 days) has expired', 400);

    const review = await prisma.review.create({
      data: { bookingId, reviewerId: req.user.id, revieweeId: booking.vetId, rating, tags: tags || [], comment },
    });

    // Update vet average rating
    const { _avg, _count } = await prisma.review.aggregate({
      where: { revieweeId: booking.vetId },
      _avg:  { rating: true },
      _count: true,
    });
    await prisma.vetProfile.update({
      where: { id: booking.vetId },
      data:  { ratingAvg: _avg.rating, totalReviews: _count },
    });

    return ok(res, review, 'Review submitted', 201);
  } catch (e) { next(e); }
});

module.exports = router;
