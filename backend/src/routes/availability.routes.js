const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const ctrl = require('../controllers/availability.controller');

const router = express.Router();

router.put('/', requireAuth, requireRole('doctor'), ctrl.setAvailability);
router.get('/:doctorId', ctrl.getAvailability);
router.get('/:doctorId/open-slots', ctrl.getOpenSlots);

module.exports = router;
