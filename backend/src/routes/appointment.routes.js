const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const ctrl = require('../controllers/appointment.controller');

const router = express.Router();

router.post('/', requireAuth, requireRole('patient'), ctrl.book);
router.get('/mine', requireAuth, ctrl.listMine);
router.get('/:id', requireAuth, ctrl.getOne);
router.post('/:id/cancel', requireAuth, ctrl.cancel);

module.exports = router;
