const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const ctrl = require('../controllers/admin.controller');

const router = express.Router();

router.use(requireAuth, requireRole('admin'));
router.get('/doctors/pending', ctrl.listPendingDoctors);
router.post('/doctors/:id/verify', ctrl.setVerification);
router.get('/stats', ctrl.stats);

module.exports = router;
