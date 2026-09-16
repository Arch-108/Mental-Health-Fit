const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const ctrl = require('../controllers/vaccinationRoute.controller');

const router = express.Router();

router.post('/', requireAuth, requireRole('doctor', 'admin'), ctrl.create);
router.get('/mine', requireAuth, requireRole('doctor', 'admin'), ctrl.listMine);
router.get('/:id', requireAuth, requireRole('doctor', 'admin'), ctrl.getOne);

module.exports = router;
