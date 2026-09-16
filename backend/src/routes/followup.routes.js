const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const ctrl = require('../controllers/followup.controller');

const router = express.Router();

router.get('/mine', requireAuth, ctrl.listMine);
router.post('/:id/respond', requireAuth, requireRole('patient'), ctrl.respond);
router.post('/:id/review', requireAuth, requireRole('doctor'), ctrl.review);

module.exports = router;
