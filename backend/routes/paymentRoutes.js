import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All payment processing is handled through Whop
// Whop webhooks are handled in whopRoutes.js

// Get payment status
router.get('/status', authenticate, apiLimiter, async (req, res) => {
  try {
    // Return user's payment/subscription status from Whop
    res.json({
      success: true,
      provider: 'whop',
      message: 'Payment processing is handled through Whop',
    });
  } catch (error) {
    console.error('Payment status error:', error);
    res.status(500).json({ error: 'Failed to get payment status' });
  }
});

export default router;
