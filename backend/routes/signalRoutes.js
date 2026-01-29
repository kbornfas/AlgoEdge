/**
 * Signal Routes for AlgoEdge
 * Handles signal subscription management and signal broadcasting
 */

import express from 'express';
import { authenticate, optionalAuth, requireSubscription } from '../middleware/auth.js';
import pool from '../config/database.js';
import {
  getSignalTiers,
  getSignalTierBySlug,
  getUserSignalSubscription,
  subscribeToSignals,
  cancelSignalSubscription,
  createSignal,
  updateSignalStatus,
  getSignalHistory,
  getSignalStats,
  getSubscriberStats
} from '../services/signalService.js';
import { getMarketIndicators } from '../services/marketIndicators.js';

const router = express.Router();

/**
 * GET /api/signals/tiers
 * Get all available signal subscription tiers
 */
router.get('/tiers', async (req, res) => {
  try {
    const tiers = await getSignalTiers();
    res.json({ tiers });
  } catch (error) {
    console.error('Error fetching signal tiers:', error);
    res.status(500).json({ error: 'Failed to fetch signal tiers' });
  }
});

/**
 * GET /api/signals/tiers/:slug
 * Get a specific signal tier by slug
 */
router.get('/tiers/:slug', async (req, res) => {
  try {
    const tier = await getSignalTierBySlug(req.params.slug);
    if (!tier) {
      return res.status(404).json({ error: 'Tier not found' });
    }
    res.json({ tier });
  } catch (error) {
    console.error('Error fetching signal tier:', error);
    res.status(500).json({ error: 'Failed to fetch signal tier' });
  }
});

/**
 * GET /api/signals/subscription
 * Get user's current signal subscription
 */
router.get('/subscription', authenticate, async (req, res) => {
  try {
    const subscription = await getUserSignalSubscription(req.user.id);
    res.json({ subscription: subscription || null });
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

/**
 * POST /api/signals/subscribe
 * Subscribe to a signal tier
 */
router.post('/subscribe', authenticate, async (req, res) => {
  try {
    const { tierSlug, stripeSubscriptionId } = req.body;
    
    if (!tierSlug) {
      return res.status(400).json({ error: 'Tier slug is required' });
    }

    // Get user's Telegram chat ID if connected
    const userResult = await pool.query(
      `SELECT telegram_chat_id FROM users WHERE id = $1`,
      [req.user.id]
    );
    const telegramChatId = userResult.rows[0]?.telegram_chat_id;

    const result = await subscribeToSignals(
      req.user.id, 
      tierSlug, 
      telegramChatId,
      stripeSubscriptionId
    );

    res.json({ 
      success: true, 
      subscription: result,
      message: `Successfully subscribed to ${result.tier.name}!`
    });
  } catch (error) {
    console.error('Error subscribing:', error);
    res.status(500).json({ error: error.message || 'Failed to subscribe' });
  }
});

/**
 * POST /api/signals/subscribe/free
 * Quick subscribe to free tier
 */
router.post('/subscribe/free', authenticate, async (req, res) => {
  try {
    // Get user's Telegram chat ID if connected
    const userResult = await pool.query(
      `SELECT telegram_chat_id FROM users WHERE id = $1`,
      [req.user.id]
    );
    const telegramChatId = userResult.rows[0]?.telegram_chat_id;

    if (!telegramChatId) {
      return res.status(400).json({ 
        error: 'Please connect your Telegram first to receive signals',
        requiresTelegram: true
      });
    }

    const result = await subscribeToSignals(req.user.id, 'free', telegramChatId);

    res.json({ 
      success: true, 
      subscription: result,
      message: 'Successfully subscribed to Free Signals!'
    });
  } catch (error) {
    console.error('Error subscribing to free tier:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

/**
 * POST /api/signals/cancel
 * Cancel signal subscription
 */
router.post('/cancel', authenticate, async (req, res) => {
  try {
    await cancelSignalSubscription(req.user.id);
    res.json({ success: true, message: 'Subscription cancelled' });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

/**
 * GET /api/signals/active
 * Get currently active trading signals
 */
router.get('/active', optionalAuth, async (req, res) => {
  try {
    // Get active signals from the last 24 hours
    const result = await pool.query(`
      SELECT 
        id,
        symbol,
        signal_type,
        entry_price,
        stop_loss,
        take_profit_1,
        take_profit_2,
        take_profit_3,
        confidence,
        timeframe,
        analysis,
        status,
        created_at
      FROM trading_signals
      WHERE status IN ('active', 'pending')
        AND created_at > NOW() - INTERVAL '24 hours'
      ORDER BY created_at DESC
      LIMIT 20
    `);

    // Hide sensitive details for non-authenticated users
    const signals = result.rows.map(signal => {
      if (!req.user) {
        return {
          ...signal,
          stop_loss: null,
          take_profit_1: null,
          take_profit_2: null,
          take_profit_3: null,
          analysis: null,
        };
      }
      return signal;
    });

    res.json({ signals });
  } catch (error) {
    console.error('Error fetching active signals:', error);
    res.status(500).json({ error: 'Failed to fetch active signals' });
  }
});

/**
 * GET /api/signals/history
 * Get signal history (public, limited for non-subscribers)
 */
router.get('/history', optionalAuth, async (req, res) => {
  try {
    const limit = req.user ? 50 : 5; // Non-users see only last 5
    const signals = await getSignalHistory(limit);
    
    // Hide details for non-subscribers
    if (!req.user) {
      signals.forEach(signal => {
        signal.stop_loss = null;
        signal.take_profit_1 = null;
        signal.take_profit_2 = null;
        signal.take_profit_3 = null;
        signal.analysis = null;
      });
    }

    res.json({ signals });
  } catch (error) {
    console.error('Error fetching signal history:', error);
    res.status(500).json({ error: 'Failed to fetch signal history' });
  }
});

/**
 * GET /api/signals/stats
 * Get signal performance statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await getSignalStats();
    res.json({ stats });
  } catch (error) {
    console.error('Error fetching signal stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ============ ADMIN ROUTES ============

/**
 * POST /api/signals/admin/create
 * Create and broadcast a new signal (Admin only)
 */
router.post('/admin/create', authenticate, async (req, res) => {
  try {
    // Check if user is admin
    if (!req.user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const signal = await createSignal(req.body);
    res.json({ success: true, signal });
  } catch (error) {
    console.error('Error creating signal:', error);
    res.status(500).json({ error: 'Failed to create signal' });
  }
});

/**
 * PUT /api/signals/admin/:id/update
 * Update signal status (Admin only)
 */
router.put('/admin/:id/update', authenticate, async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { status, resultPips } = req.body;
    await updateSignalStatus(req.params.id, status, resultPips);
    
    res.json({ success: true, message: 'Signal updated' });
  } catch (error) {
    console.error('Error updating signal:', error);
    res.status(500).json({ error: 'Failed to update signal' });
  }
});

/**
 * GET /api/signals/admin/subscribers
 * Get subscriber statistics (Admin only)
 */
router.get('/admin/subscribers', authenticate, async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const stats = await getSubscriberStats();
    res.json({ stats });
  } catch (error) {
    console.error('Error fetching subscriber stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

/**
 * POST /api/signals/admin/quick-signal
 * Quick signal creation form (Admin only)
 */
router.post('/admin/quick-signal', authenticate, async (req, res) => {
  try {
    if (!req.user.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { 
      symbol, 
      signalType, 
      entryPrice, 
      stopLoss, 
      takeProfit1, 
      takeProfit2, 
      takeProfit3,
      analysis,
      timeframe,
      confidence 
    } = req.body;

    // Validation
    if (!symbol || !signalType || !entryPrice) {
      return res.status(400).json({ error: 'Symbol, signal type, and entry price are required' });
    }

    const signal = await createSignal({
      signalType: signalType.toUpperCase(),
      symbol: symbol.toUpperCase(),
      entryPrice: parseFloat(entryPrice),
      stopLoss: stopLoss ? parseFloat(stopLoss) : null,
      takeProfit1: takeProfit1 ? parseFloat(takeProfit1) : null,
      takeProfit2: takeProfit2 ? parseFloat(takeProfit2) : null,
      takeProfit3: takeProfit3 ? parseFloat(takeProfit3) : null,
      analysis,
      timeframe: timeframe || 'H1',
      confidence: confidence || 'MEDIUM'
    });

    res.json({ 
      success: true, 
      signal,
      message: `Signal for ${symbol} ${signalType} broadcasted to all subscribers!`
    });
  } catch (error) {
    console.error('Error creating quick signal:', error);
    res.status(500).json({ error: 'Failed to create signal' });
  }
});

/**
 * GET /api/signals/indicators/:symbol
 * Get real-time market indicators for a symbol
 */
router.get('/indicators/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    if (!symbol) {
      return res.status(400).json({ error: 'Symbol is required' });
    }

    const indicators = await getMarketIndicators(symbol);
    
    res.json({ 
      success: true, 
      indicators,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching market indicators:', error);
    res.status(500).json({ error: 'Failed to fetch market indicators' });
  }
});

/**
 * GET /api/signals/indicators
 * Get market indicators for multiple symbols
 */
router.get('/indicators', async (req, res) => {
  try {
    const symbols = req.query.symbols?.split(',') || ['EURUSD', 'GBPUSD', 'XAUUSD', 'USDJPY'];
    
    const results = {};
    for (const symbol of symbols) {
      results[symbol] = await getMarketIndicators(symbol.trim());
    }
    
    res.json({ 
      success: true, 
      indicators: results,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching market indicators:', error);
    res.status(500).json({ error: 'Failed to fetch market indicators' });
  }
});

export default router;
