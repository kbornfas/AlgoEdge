import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import os from 'os';

const router = express.Router();

// Middleware to check admin role
const requireAdmin = async (req, res, next) => {
  try {
    const result = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.userId]);
    if (result.rows[0]?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Get system health dashboard
router.get('/health', authenticate, requireAdmin, async (req, res) => {
  try {
    // Database stats
    const dbStats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM users WHERE created_at > NOW() - INTERVAL '24 hours') as users_today,
        (SELECT COUNT(*) FROM trades) as total_trades,
        (SELECT COUNT(*) FROM trades WHERE opened_at > NOW() - INTERVAL '24 hours') as trades_today,
        (SELECT COUNT(*) FROM marketplace_products) as total_products,
        (SELECT COUNT(*) FROM signal_providers) as total_providers
    `);

    // Recent health metrics
    const recentMetrics = await pool.query(
      `SELECT metric_name, metric_value, metric_unit, status, recorded_at
       FROM system_health
       WHERE recorded_at > NOW() - INTERVAL '1 hour'
       ORDER BY recorded_at DESC
       LIMIT 50`
    );

    // System stats
    const systemStats = {
      uptime: os.uptime(),
      load_average: os.loadavg(),
      total_memory: os.totalmem(),
      free_memory: os.freemem(),
      memory_usage: ((os.totalmem() - os.freemem()) / os.totalmem() * 100).toFixed(2),
      cpu_count: os.cpus().length,
      platform: os.platform(),
      node_version: process.version,
    };

    // Record current metrics
    await pool.query(
      `INSERT INTO system_health (metric_name, metric_value, metric_unit, status)
       VALUES 
       ('memory_usage', $1, 'percent', CASE WHEN $1 > 90 THEN 'critical' WHEN $1 > 75 THEN 'warning' ELSE 'normal' END),
       ('cpu_load_1m', $2, 'load', CASE WHEN $2 > 80 THEN 'critical' WHEN $2 > 60 THEN 'warning' ELSE 'normal' END)`,
      [systemStats.memory_usage, os.loadavg()[0]]
    );

    res.json({
      database: dbStats.rows[0],
      system: systemStats,
      recent_metrics: recentMetrics.rows,
    });
  } catch (error) {
    console.error('Error fetching health dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch health data' });
  }
});

// Get maintenance mode status (public)
router.get('/maintenance/status', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT value FROM system_settings WHERE key = 'maintenance_mode'`
    );
    
    const messageResult = await pool.query(
      `SELECT value FROM system_settings WHERE key = 'maintenance_message'`
    );

    res.json({
      maintenance_mode: result.rows[0]?.value === 'true',
      message: messageResult.rows[0]?.value || 'System is under maintenance',
    });
  } catch (error) {
    console.error('Error fetching maintenance status:', error);
    res.json({ maintenance_mode: false, message: '' });
  }
});

// Toggle maintenance mode (admin only)
router.post('/maintenance/toggle', authenticate, requireAdmin, async (req, res) => {
  try {
    const { enabled, message } = req.body;

    await pool.query(
      `UPDATE system_settings 
       SET value = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2
       WHERE key = 'maintenance_mode'`,
      [enabled ? 'true' : 'false', req.user.userId]
    );

    if (message) {
      await pool.query(
        `UPDATE system_settings 
         SET value = $1, updated_at = CURRENT_TIMESTAMP, updated_by = $2
         WHERE key = 'maintenance_message'`,
        [message, req.user.userId]
      );
    }

    res.json({ success: true, maintenance_mode: enabled, message });
  } catch (error) {
    console.error('Error toggling maintenance mode:', error);
    res.status(500).json({ error: 'Failed to toggle maintenance mode' });
  }
});

// Get audit logs
router.get('/audit-logs', authenticate, requireAdmin, async (req, res) => {
  try {
    const { limit = 100, offset = 0, user_id, action_type, start_date, end_date } = req.query;

    let query = `
      SELECT al.*, u.username, u.email
      FROM activity_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramIndex = 1;

    if (user_id) {
      query += ` AND al.user_id = $${paramIndex}`;
      params.push(user_id);
      paramIndex++;
    }

    if (action_type) {
      query += ` AND al.action_type = $${paramIndex}`;
      params.push(action_type);
      paramIndex++;
    }

    if (start_date) {
      query += ` AND al.created_at >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND al.created_at <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    query += ` ORDER BY al.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const countResult = await pool.query(
      'SELECT COUNT(*) as total FROM activity_logs'
    );

    res.json({
      logs: result.rows,
      total: parseInt(countResult.rows[0].total),
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

// Get action type statistics
router.get('/audit-logs/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        action_type,
        COUNT(*) as count,
        MAX(created_at) as last_occurrence
      FROM activity_logs
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY action_type
      ORDER BY count DESC
    `);

    res.json({ stats: result.rows });
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    res.status(500).json({ error: 'Failed to fetch audit stats' });
  }
});

/**
 * GET /api/admin/featured
 * Get all featurable items (bots, signals, products) with current featured status
 */
router.get('/featured', authenticate, requireAdmin, async (req, res) => {
  try {
    const [bots, signals, products, sellers] = await Promise.all([
      pool.query(`
        SELECT b.id, b.name, b.slug, b.thumbnail_url, b.is_featured, b.status, b.total_sales,
               u.id as seller_id, u.username as seller_username, u.full_name as seller_name, 
               u.has_blue_badge as seller_verified
        FROM marketplace_bots b
        JOIN users u ON b.seller_id = u.id
        WHERE b.status = 'approved'
        ORDER BY b.is_featured DESC, b.total_sales DESC
      `),
      pool.query(`
        SELECT sp.id, sp.display_name as name, sp.slug, sp.avatar_url, sp.is_featured, sp.status, sp.subscriber_count,
               u.id as provider_id, u.username as provider_username, u.full_name as provider_name,
               u.has_blue_badge as provider_verified
        FROM signal_providers sp
        JOIN users u ON sp.user_id = u.id
        WHERE sp.status = 'approved'
        ORDER BY sp.is_featured DESC, sp.subscriber_count DESC
      `),
      pool.query(`
        SELECT p.id, p.name, p.slug, p.thumbnail_url, p.is_featured, p.status, p.total_sales,
               u.id as seller_id, u.username as seller_username, u.full_name as seller_name,
               u.has_blue_badge as seller_verified
        FROM marketplace_products p
        JOIN users u ON p.seller_id = u.id
        WHERE p.status = 'approved'
        ORDER BY p.is_featured DESC, p.total_sales DESC
      `),
      pool.query(`
        SELECT u.id, u.username, u.full_name, u.profile_image, u.seller_featured, u.has_blue_badge,
               (SELECT COUNT(*) FROM marketplace_bots WHERE seller_id = u.id AND status = 'approved') as bots_count,
               (SELECT COUNT(*) FROM marketplace_products WHERE seller_id = u.id AND status = 'approved') as products_count,
               (SELECT COUNT(*) FROM signal_providers WHERE user_id = u.id AND status = 'approved') as signals_count
        FROM users u
        WHERE u.is_seller = true
        ORDER BY u.seller_featured DESC, u.created_at DESC
      `)
    ]);

    res.json({
      success: true,
      bots: bots.rows,
      signals: signals.rows,
      products: products.rows,
      sellers: sellers.rows
    });
  } catch (error) {
    console.error('Get featured items error:', error);
    res.status(500).json({ error: 'Failed to get featured items' });
  }
});

/**
 * PATCH /api/admin/bots/:botId/feature
 * Toggle featured status for a bot
 */
router.patch('/bots/:botId/feature', authenticate, requireAdmin, async (req, res) => {
  try {
    const { botId } = req.params;
    const { featured } = req.body;
    
    const botCheck = await pool.query(`
      SELECT b.id, b.name, b.status, u.has_blue_badge as seller_verified
      FROM marketplace_bots b
      JOIN users u ON b.seller_id = u.id
      WHERE b.id = $1
    `, [botId]);
    
    if (botCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Bot not found' });
    }
    
    const bot = botCheck.rows[0];
    
    if (featured) {
      if (bot.status !== 'approved') {
        return res.status(400).json({ error: 'Bot must be approved before being featured' });
      }
      if (!bot.seller_verified) {
        return res.status(400).json({ 
          error: 'Bot seller must be verified (have blue badge) before the bot can be featured',
          requires_seller_verification: true
        });
      }
    }
    
    const result = await pool.query(
      `UPDATE marketplace_bots SET is_featured = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 
       RETURNING id, name, slug, is_featured`,
      [!!featured, botId]
    );
    res.json({ 
      success: true, 
      bot: result.rows[0],
      message: featured ? 'Bot is now featured on landing page' : 'Bot removed from featured list'
    });
  } catch (error) {
    console.error('Toggle bot featured error:', error);
    res.status(500).json({ error: 'Failed to update bot featured status' });
  }
});

/**
 * PATCH /api/admin/signals/:signalId/feature
 * Toggle featured status for a signal provider
 */
router.patch('/signals/:signalId/feature', authenticate, requireAdmin, async (req, res) => {
  try {
    const { signalId } = req.params;
    const { featured } = req.body;
    
    const signalCheck = await pool.query(`
      SELECT sp.id, sp.display_name, sp.status, u.has_blue_badge as provider_verified
      FROM signal_providers sp
      JOIN users u ON sp.user_id = u.id
      WHERE sp.id = $1
    `, [signalId]);
    
    if (signalCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Signal provider not found' });
    }
    
    const signal = signalCheck.rows[0];
    
    if (featured) {
      if (signal.status !== 'approved') {
        return res.status(400).json({ error: 'Signal provider must be approved before being featured' });
      }
      if (!signal.provider_verified) {
        return res.status(400).json({ 
          error: 'Signal provider must be verified (have blue badge) before they can be featured',
          requires_provider_verification: true
        });
      }
    }
    
    const result = await pool.query(
      `UPDATE signal_providers SET is_featured = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 
       RETURNING id, display_name, slug, is_featured`,
      [!!featured, signalId]
    );
    res.json({ 
      success: true, 
      signal: result.rows[0],
      message: featured ? 'Signal provider is now featured on landing page' : 'Signal provider removed from featured list'
    });
  } catch (error) {
    console.error('Toggle signal featured error:', error);
    res.status(500).json({ error: 'Failed to update signal featured status' });
  }
});

/**
 * PATCH /api/admin/products/:productId/feature
 * Toggle featured status for a product
 */
router.patch('/products/:productId/feature', authenticate, requireAdmin, async (req, res) => {
  try {
    const { productId } = req.params;
    const { featured } = req.body;
    
    const productCheck = await pool.query(`
      SELECT p.id, p.name, p.status, u.has_blue_badge as seller_verified
      FROM marketplace_products p
      JOIN users u ON p.seller_id = u.id
      WHERE p.id = $1
    `, [productId]);
    
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const product = productCheck.rows[0];
    
    if (featured) {
      if (product.status !== 'approved') {
        return res.status(400).json({ error: 'Product must be approved before being featured' });
      }
      if (!product.seller_verified) {
        return res.status(400).json({ 
          error: 'Product seller must be verified (have blue badge) before the product can be featured',
          requires_seller_verification: true
        });
      }
    }
    
    const result = await pool.query(
      `UPDATE marketplace_products SET is_featured = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 
       RETURNING id, name, slug, is_featured`,
      [!!featured, productId]
    );
    res.json({ 
      success: true, 
      product: result.rows[0],
      message: featured ? 'Product is now featured on landing page' : 'Product removed from featured list'
    });
  } catch (error) {
    console.error('Toggle product featured error:', error);
    res.status(500).json({ error: 'Failed to update product featured status' });
  }
});

/**
 * PATCH /api/admin/users/:userId/feature
 * Toggle featured status for a seller
 */
router.patch('/users/:userId/feature', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { featured } = req.body;
    
    const userCheck = await pool.query(`
      SELECT u.is_seller, u.has_blue_badge,
             (SELECT COUNT(*) FROM marketplace_bots WHERE seller_id = u.id AND status = 'approved') as bots_count,
             (SELECT COUNT(*) FROM marketplace_products WHERE seller_id = u.id AND status = 'approved') as products_count,
             (SELECT COUNT(*) FROM signal_providers WHERE user_id = u.id AND status = 'approved') as signals_count
      FROM users u WHERE u.id = $1
    `, [userId]);
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userCheck.rows[0];
    if (!user.is_seller) {
      return res.status(400).json({ error: 'User is not a seller' });
    }
    
    if (featured) {
      if (!user.has_blue_badge) {
        return res.status(400).json({ 
          error: 'Seller must be verified (have blue badge) to be featured',
          requires_verification: true
        });
      }
      
      const totalListings = parseInt(user.bots_count) + parseInt(user.products_count) + parseInt(user.signals_count);
      if (totalListings < 1) {
        return res.status(400).json({ 
          error: 'Seller must have at least 1 approved listing (bot, product, or signal) to be featured',
          requires_listings: true
        });
      }
    }
    
    const result = await pool.query(
      `UPDATE users SET seller_featured = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 
       RETURNING id, username, email, full_name, seller_featured`,
      [!!featured, userId]
    );
    res.json({ 
      success: true, 
      user: result.rows[0],
      message: featured ? 'Seller is now featured on landing page' : 'Seller removed from featured list'
    });
  } catch (error) {
    console.error('Toggle featured error:', error);
    res.status(500).json({ error: 'Failed to update featured status' });
  }
});

export default router;
