const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const ctrl = require('../controllers/notification.controller');

const router = express.Router();

router.get('/mine', requireAuth, ctrl.listMine);
router.post('/:id/read', requireAuth, ctrl.markRead);

module.exports = router;
