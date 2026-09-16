const express = require('express');
const ctrl = require('../controllers/facility.controller');
const router = express.Router();

router.get('/', ctrl.search);

module.exports = router;
