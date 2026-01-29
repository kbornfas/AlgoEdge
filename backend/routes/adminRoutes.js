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

export default router;
