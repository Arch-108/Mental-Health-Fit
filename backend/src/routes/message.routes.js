const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const ctrl = require('../controllers/message.controller');

const router = express.Router();

// Staff-only - internal messaging between doctors and admins about
// patients/shifts, never exposed to patients.
router.use(requireAuth, requireRole('doctor', 'admin'));

router.get('/staff', ctrl.listStaff);
router.get('/threads', ctrl.listThreads);
router.get('/threads/:userId', ctrl.listConversation);
router.post('/', ctrl.send);

module.exports = router;
