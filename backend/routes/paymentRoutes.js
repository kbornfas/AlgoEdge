import express from 'express';
import {
  createCheckoutSession,
  createPortalSession,
  handleWebhook,
} from '../controllers/stripeController.js';
import { authenticate } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Webhook must use raw body (no JSON parsing)
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

// Protected payment routes
router.post('/create-checkout-session', authenticate, apiLimiter, createCheckoutSession);
router.post('/create-portal-session', authenticate, apiLimiter, createPortalSession);

export default router;
