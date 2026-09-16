const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const ctrl = require('../controllers/analytics.controller');

const router = express.Router();

router.get('/doctor', requireAuth, requireRole('doctor'), ctrl.doctorAnalytics);
router.get('/patient', requireAuth, requireRole('patient'), ctrl.patientAnalytics);
router.get('/admin/overview', requireAuth, requireRole('admin'), ctrl.platformOverview);

module.exports = router;
