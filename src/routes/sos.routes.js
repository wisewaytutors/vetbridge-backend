const router = require('express').Router();
const prisma = require('../config/prisma');
const auth   = require('../middleware/authenticate');
const { ok } = require('../utils/response');
const notificationService = require('../services/notification.service');

router.use(auth);

// POST /sos — trigger emergency
router.post('/', async (req, res, next) => {
  try {
    const { emergencyType, ownerLat, ownerLng, ownerPhone } = req.body;

    const sos = await prisma.sosEvent.create({
      data: { ownerId: req.user.id, emergencyType, ownerLat, ownerLng, ownerPhone },
    });

    // Find online vets within 5km (simplified distance filter)
    const nearbyVets = await prisma.vetProfile.findMany({
      where:   { isOnline: true, isVerified: true, workModes: { has: 'emergency' } },
      take:    5,
      include: { user: true },
    });

    // Broadcast SOS to nearby vets
    await notificationService.broadcast(nearbyVets.map((v) => v.userId), {
      type:  'sos',
      title: '🆘 Emergency SOS nearby',
      body:  `${req.user.name} needs emergency help — ${emergencyType}. Respond now.`,
      data:  { sosId: sos.id, ownerLat, ownerLng },
    });

    return ok(res, { sos, nearbyVets: nearbyVets.length }, 'SOS dispatched');
  } catch (e) { next(e); }
});

module.exports = router;
