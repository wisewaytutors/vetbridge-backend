const router = require('express').Router();
const prisma = require('../config/prisma');
const auth   = require('../middleware/authenticate');
const authorize = require('../middleware/authorize');
const { ok, err } = require('../utils/response');

router.use(auth);

// POST /records — vet submits post-visit notes
router.post('/', authorize('VET'), async (req, res, next) => {
  try {
    const vet = await prisma.vetProfile.findUnique({ where: { userId: req.user.id } });
    const { bookingId, petId, chiefComplaint, examNotes, diagnosis,
            followupInstructions, nextVisitRecommended, vaccinations, medications } = req.body;

    const record = await prisma.medicalRecord.create({
      data: {
        petId, vetId: vet.id, bookingId, chiefComplaint, examNotes, diagnosis,
        followupInstructions, nextVisitRecommended,
        vaccinations: vaccinations?.length ? { createMany: { data: vaccinations } } : undefined,
        medications:  medications?.length  ? { createMany: { data: medications  } } : undefined,
      },
      include: { vaccinations: true, medications: true },
    });

    // Update vet-patient relationship
    await prisma.vetPatientRelationship.upsert({
      where:  { vetId_petId: { vetId: vet.id, petId } },
      update: { totalVisits: { increment: 1 } },
      create: { vetId: vet.id, petId, firstBookingAt: new Date() },
    });

    return ok(res, record, 'Medical record saved', 201);
  } catch (e) { next(e); }
});

// GET /records/session/:bookingId — vet reads AI triage log
router.get('/session/:bookingId', authorize('VET'), async (req, res, next) => {
  try {
    const session = await prisma.aiSession.findFirst({ where: { bookingId: req.params.bookingId } });
    return ok(res, session);
  } catch (e) { next(e); }
});

module.exports = router;
