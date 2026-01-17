import express from 'express';
import { handleWebhook, getSubscriptionStatus, verifyMembership, activateSubscription } from '../controllers/whopController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Webhook endpoint - no auth required (verified by signature)
router.post('/webhook', express.json({ verify: (req, res, buf) => { req.rawBody = buf; } }), handleWebhook);

// Protected routes
router.get('/subscription/status', authenticateToken, getSubscriptionStatus);
router.get('/membership/:membershipId/verify', authenticateToken, verifyMembership);

// Admin routes
router.post('/subscription/activate', authenticateToken, activateSubscription);

export default router;
