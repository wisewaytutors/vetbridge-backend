const router = require('express').Router();

router.use('/auth',          require('./auth.routes'));
router.use('/vets',          require('./vets.routes'));
router.use('/pets',          require('./pets.routes'));
router.use('/bookings',      require('./bookings.routes'));
router.use('/records',       require('./records.routes'));
router.use('/reviews',       require('./reviews.routes'));
router.use('/marketplace',   require('./marketplace.routes'));
router.use('/notifications', require('./notifications.routes'));
router.use('/payments',      require('./payments.routes'));
router.use('/sos',           require('./sos.routes'));
router.use('/ai',            require('./ai.routes'));

module.exports = router;
