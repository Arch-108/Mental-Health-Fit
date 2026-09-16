const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const ctrl = require('../controllers/ai.controller');

const router = express.Router();

router.post('/navigate', requireAuth, ctrl.navigate);
router.post('/brief', requireAuth, ctrl.generateBrief);
router.get('/brief/:appointmentId', requireAuth, ctrl.getBrief);
router.post('/translate', requireAuth, ctrl.translate);
router.post('/draft-note', requireAuth, requireRole('doctor'), ctrl.draftNote);
router.post('/suggest-schedule', requireAuth, requireRole('doctor', 'admin'), ctrl.suggestSchedule);
router.post('/staff-assist', requireAuth, requireRole('doctor', 'admin'), ctrl.staffAssist);

module.exports = router;
