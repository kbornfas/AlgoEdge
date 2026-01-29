/**
 * Price Alerts Routes
 * Manages user price alerts for trading pairs
 */

import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import { createInAppNotification, InAppNotificationTypes } from '../services/notificationService.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Get user's price alerts
 * GET /api/alerts?active=true
 */
router.get('/', apiLimiter, async (req, res) => {
  try {
    const userId = req.user.id;
    const { active } = req.query;
    
    let query = 'SELECT * FROM price_alerts WHERE user_id = $1';
    const params = [userId];
    
    if (active === 'true') {
      query += ' AND is_active = true AND triggered = false';
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    res.json({ success: true, alerts: result.rows });
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json({ success: false, error: 'Failed to get alerts' });
  }
});

/**
 * Create a price alert
 * POST /api/alerts
 */
router.post('/', apiLimiter, async (req, res) => {
  try {
    const userId = req.user.id;
    const { symbol, alert_type, target_price, current_price, message } = req.body;
    
    if (!symbol || !alert_type || !target_price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await pool.query(`
      INSERT INTO price_alerts (user_id, symbol, alert_type, target_price, current_price, message)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [userId, symbol, alert_type, target_price, current_price || null, message || null]);
    
    res.json({ success: true, alert: result.rows[0] });
  } catch (error) {
    console.error('Create alert error:', error);
    res.status(500).json({ success: false, error: 'Failed to create alert' });
  }
});

/**
 * Update a price alert
 * PUT /api/alerts/:id
 */
router.put('/:id', apiLimiter, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { target_price, is_active, message } = req.body;
    
    const updates = [];
    const params = [userId, id];
    let paramIndex = 3;
    
    if (target_price !== undefined) {
      updates.push(`target_price = $${paramIndex++}`);
      params.push(target_price);
    }
    if (is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      params.push(is_active);
    }
    if (message !== undefined) {
      updates.push(`message = $${paramIndex++}`);
      params.push(message);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    const result = await pool.query(`
      UPDATE price_alerts
      SET ${updates.join(', ')}
      WHERE user_id = $1 AND id = $2
      RETURNING *
    `, params);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    res.json({ success: true, alert: result.rows[0] });
  } catch (error) {
    console.error('Update alert error:', error);
    res.status(500).json({ success: false, error: 'Failed to update alert' });
  }
});

/**
 * Delete a price alert
 * DELETE /api/alerts/:id
 */
router.delete('/:id', apiLimiter, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM price_alerts WHERE user_id = $1 AND id = $2 RETURNING id',
      [userId, id]
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    res.json({ success: true, message: 'Alert deleted' });
  } catch (error) {
    console.error('Delete alert error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete alert' });
  }
});

/**
 * Check and trigger alerts (called by cron job or price update service)
 * POST /api/alerts/check
 */
router.post('/check', async (req, res) => {
  try {
    const { symbol, current_price } = req.body;
    
    if (!symbol || !current_price) {
      return res.status(400).json({ error: 'Missing symbol or price' });
    }
    
    // Find matching alerts
    const result = await pool.query(`
      SELECT * FROM price_alerts
      WHERE symbol = $1 
        AND is_active = true 
        AND triggered = false
        AND (
          (alert_type = 'above' AND $2 >= target_price) OR
          (alert_type = 'below' AND $2 <= target_price)
        )
    `, [symbol, current_price]);
    
    const triggered = [];
    
    for (const alert of result.rows) {
      // Mark as triggered
      await pool.query(`
        UPDATE price_alerts
        SET triggered = true, triggered_at = NOW(), current_price = $1
        WHERE id = $2
      `, [current_price, alert.id]);
      
      // Send notification
      await createInAppNotification({
        userId: alert.user_id,
        type: InAppNotificationTypes.ALERT,
        title: `Price Alert: ${symbol}`,
        message: `${symbol} has ${alert.alert_type === 'above' ? 'reached above' : 'dropped below'} ${alert.target_price}. Current: ${current_price}`,
        icon: 'alert',
        link: '/dashboard/alerts',
      });
      
      triggered.push(alert.id);
    }
    
    res.json({ success: true, triggered_count: triggered.length, triggered_ids: triggered });
  } catch (error) {
    console.error('Check alerts error:', error);
    res.status(500).json({ success: false, error: 'Failed to check alerts' });
  }
});

export default router;
