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
import { authenticate } from '../middleware/auth.js';
import { tradeLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Admin: List all trades
router.get('/admin/all', listAllTrades);

// Admin: Approve/reject transaction
router.patch('/admin/:tradeId/approve', approveTransaction);

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
