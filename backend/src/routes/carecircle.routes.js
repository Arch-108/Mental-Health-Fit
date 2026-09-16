const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const ctrl = require('../controllers/carecircle.controller');

const router = express.Router();

router.post('/invite', requireAuth, requireRole('patient'), ctrl.invite);
router.get('/mine', requireAuth, ctrl.listMine);
router.post('/accept', requireAuth, ctrl.accept);
router.post('/:id/revoke', requireAuth, requireRole('patient'), ctrl.revoke);

module.exports = router;
