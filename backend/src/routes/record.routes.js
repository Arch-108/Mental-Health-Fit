const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const ctrl = require('../controllers/record.controller');

const router = express.Router();

router.get('/timeline', requireAuth, ctrl.getTimeline);
router.get('/timeline/:patientId', requireAuth, ctrl.getTimeline);
router.post('/', requireAuth, requireRole('doctor', 'admin'), ctrl.addEntry);

module.exports = router;
