const express = require('express');
const ctrl = require('../controllers/doctor.controller');
const router = express.Router();

router.get('/', ctrl.listVerified);
router.get('/:id', ctrl.getOne);

module.exports = router;
