const router = require('express').Router();
const prisma = require('../config/prisma');
const auth   = require('../middleware/authenticate');
const { ok, err } = require('../utils/response');

router.use(auth);

router.get('/', async (req, res, next) => {
  try {
    const pets = await prisma.pet.findMany({
      where: { ownerId: req.user.id },
      include: { vaccinations: true },
    });
    return ok(res, pets);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const pet = await prisma.pet.create({ data: { ...req.body, ownerId: req.user.id } });
    return ok(res, pet, 'Pet added', 201);
  } catch (e) { next(e); }
});

router.get('/:id/passport', async (req, res, next) => {
  try {
    const pet = await prisma.pet.findFirst({
      where:   { id: req.params.id, ownerId: req.user.id },
      include: {
        vaccinations:  { orderBy: { givenAt: 'desc' } },
        medicalRecords: {
          orderBy:  { createdAt: 'desc' },
          take:     10,
          include:  { medications: true, vaccinations: true },
        },
      },
    });
    if (!pet) return err(res, 'Pet not found', 404);
    return ok(res, pet);
  } catch (e) { next(e); }
});

module.exports = router;
