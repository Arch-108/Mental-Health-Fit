const express = require('express');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const authController = require('../controllers/auth.controller');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

// Brute-force protection on credential-guessing endpoints only (never on
// /me, which the frontend re-checks on most page loads - throttling that
// would lock out a whole classroom sharing one IP within minutes).
// skipSuccessfulRequests means only failed attempts count toward the limit,
// so many different people successfully logging in from the same shared
// WiFi IP never trips it - only repeated bad-password guesses do.
const credentialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
}

router.post(
  '/register',
  credentialLimiter,
  [
    body('email').isEmail().withMessage('A valid email is required.'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters.'),
    body('fullName').trim().notEmpty().withMessage('Full name is required.'),
  ],
  validate,
  authController.register
);

router.post(
  '/login',
  credentialLimiter,
  [
    body('email').isEmail().withMessage('A valid email is required.'),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  validate,
  authController.login
);

router.get('/me', requireAuth, authController.me);

router.put(
  '/me',
  requireAuth,
  [body('fullName').trim().notEmpty().withMessage('Full name is required.')],
  validate,
  authController.updateMe
);

router.post(
  '/change-password',
  requireAuth,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required.'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters.'),
  ],
  validate,
  authController.changePassword
);

router.post(
  '/forgot-password',
  credentialLimiter,
  [body('email').isEmail().withMessage('A valid email is required.')],
  validate,
  authController.forgotPassword
);

router.post(
  '/reset-password',
  credentialLimiter,
  [
    body('token').notEmpty().withMessage('token is required.'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters.'),
  ],
  validate,
  authController.resetPassword
);

module.exports = router;
