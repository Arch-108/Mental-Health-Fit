const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const ctrl = require('../controllers/vitals.controller');

const router = express.Router();

router.post('/', requireAuth, requireRole('patient'), ctrl.addLog);
router.get('/mine', requireAuth, ctrl.listMine);

module.exports = router;
