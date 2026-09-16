const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const ctrl = require('../controllers/maternal.controller');

const router = express.Router();

router.post('/', requireAuth, requireRole('patient'), ctrl.addCheckin);
router.get('/mine', requireAuth, requireRole('patient'), ctrl.listMine);

module.exports = router;
