import express from 'express';
import {
  register,
  login,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  setup2FA,
  verify2FA,
  disable2FA,
  sendVerificationCode,
  verifyCode,
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes with rate limiting
router.post('/register', authLimiter, register);

router.post('/login', authLimiter, login);
router.post('/verify-email', verifyEmail);
router.post('/request-password-reset', authLimiter, requestPasswordReset);
router.post('/reset-password', authLimiter, resetPassword);

// Verification code routes
router.post('/send-verification-code', authLimiter, sendVerificationCode);
router.post('/verify-code', authLimiter, verifyCode);

// Protected 2FA routes
router.post('/2fa/setup', authenticate, setup2FA);
router.post('/2fa/verify', authenticate, verify2FA);
router.post('/2fa/disable', authenticate, disable2FA);

export default router;
