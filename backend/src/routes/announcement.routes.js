const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const ctrl = require('../controllers/announcement.controller');

const router = express.Router();

// Staff-only, same audience as internal messaging - not shown to patients.
router.use(requireAuth, requireRole('doctor', 'admin'));

router.get('/', ctrl.list);
router.post('/', requireRole('admin'), ctrl.create);

module.exports = router;
