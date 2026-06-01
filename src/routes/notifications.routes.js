const router = require('express').Router();
const prisma = require('../config/prisma');
const auth   = require('../middleware/authenticate');
const { ok } = require('../utils/response');

router.use(auth);

router.get('/', async (req, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 50,
    });
    return ok(res, notifications);
  } catch (e) { next(e); }
});

router.put('/read-all', async (req, res, next) => {
  try {
    await prisma.notification.updateMany({ where: { userId: req.user.id, isRead: false }, data: { isRead: true } });
    return ok(res, {}, 'All notifications marked read');
  } catch (e) { next(e); }
});

module.exports = router;
