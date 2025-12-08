import express from 'express';
import {
  getTrades,
  getTradeStats,
  createTrade,
  closeTrade,
  getRobots,
  listAllTrades,
  approveTransaction,
} from '../controllers/tradeController.js';
import { requireAdmin } from '../middleware/auth.js';
// Admin: List all trades
router.get('/admin/all', requireAdmin, listAllTrades);

// Admin: Approve/reject transaction
router.patch('/admin/:tradeId/approve', requireAdmin, approveTransaction);
import { authenticate } from '../middleware/auth.js';
import { tradeLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All trade routes require authentication
router.use(authenticate);

// Robots
router.get('/robots', tradeLimiter, getRobots);

// Trades
router.get('/', tradeLimiter, getTrades);
router.get('/stats', tradeLimiter, getTradeStats);
router.post('/', tradeLimiter, createTrade);
router.put('/:tradeId/close', tradeLimiter, closeTrade);

export default router;
