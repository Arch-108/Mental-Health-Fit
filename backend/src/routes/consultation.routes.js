const express = require('express');
const multer = require('multer');
const path = require('path');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');
const ctrl = require('../controllers/consultation.controller');

const router = express.Router();

// Local disk storage for the store-and-forward image attachments (Rural
// Mode async submissions). For production, swap this for cloud object
// storage (e.g. S3/Cloudinary) - local disk doesn't survive Render's
// free-tier restarts/redeploys.
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../../uploads')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`),
});
const upload = multer({ storage, limits: { fileSize: 8 * 1024 * 1024 } });

router.get('/:roomCode', requireAuth, ctrl.getByRoomCode);
router.post('/:roomCode/mode', requireAuth, ctrl.logMode);
router.post('/:roomCode/async', requireAuth, upload.single('image'), ctrl.submitAsync);
router.get('/:roomCode/async', requireAuth, ctrl.listAsync);
router.post('/:roomCode/end', requireAuth, requireRole('doctor'), ctrl.endConsultation);

module.exports = router;
