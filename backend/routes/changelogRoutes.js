/**
 * Changelog Routes
 * Platform updates and what's new
 */

import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

/**
 * Get published changelog entries (public)
 * GET /api/changelog?limit=10
 */
router.get('/', apiLimiter, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const offset = parseInt(req.query.offset) || 0;
    
    const result = await pool.query(`
      SELECT 
        id, version, title, description, category, image_url, published_at
      FROM changelog_entries
      WHERE is_published = true
      ORDER BY published_at DESC
      LIMIT $1 OFFSET $2
    `, [limit, offset]);
    
    // Get unread count for authenticated users
    let unreadCount = 0;
    if (req.user) {
      const countResult = await pool.query(`
        SELECT COUNT(*)
        FROM changelog_entries ce
        WHERE ce.is_published = true
          AND NOT EXISTS (
            SELECT 1 FROM changelog_views cv
            WHERE cv.changelog_id = ce.id AND cv.user_id = $1
          )
      `, [req.user.id]);
      unreadCount = parseInt(countResult.rows[0].count);
    }
    
    res.json({ success: true, entries: result.rows, unreadCount });
  } catch (error) {
    console.error('Get changelog error:', error);
    res.status(500).json({ success: false, error: 'Failed to get changelog' });
  }
});

/**
 * Mark changelog as viewed
 * POST /api/changelog/:id/view
 */
router.post('/:id/view', authenticate, apiLimiter, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    await pool.query(`
      INSERT INTO changelog_views (user_id, changelog_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, changelog_id) DO NOTHING
    `, [userId, id]);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Mark changelog viewed error:', error);
    res.status(500).json({ success: false, error: 'Failed to mark as viewed' });
  }
});

/**
 * Get unread count
 * GET /api/changelog/unread-count
 */
router.get('/unread-count', authenticate, apiLimiter, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const result = await pool.query(`
      SELECT COUNT(*)
      FROM changelog_entries ce
      WHERE ce.is_published = true
        AND NOT EXISTS (
          SELECT 1 FROM changelog_views cv
          WHERE cv.changelog_id = ce.id AND cv.user_id = $1
        )
    `, [userId]);
    
    res.json({ success: true, count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ success: false, error: 'Failed to get count' });
  }
});

// ===== ADMIN ROUTES =====

/**
 * Create changelog entry (admin only)
 * POST /api/changelog/admin
 */
router.post('/admin', authenticate, apiLimiter, async (req, res) => {
  try {
    // Check if user is admin
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (!userResult.rows[0] || userResult.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { version, title, description, category, image_url, is_published } = req.body;
    
    if (!title || !description || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await pool.query(`
      INSERT INTO changelog_entries (version, title, description, category, image_url, is_published, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [version, title, description, category, image_url, is_published || false, req.user.id]);
    
    res.json({ success: true, entry: result.rows[0] });
  } catch (error) {
    console.error('Create changelog error:', error);
    res.status(500).json({ success: false, error: 'Failed to create changelog entry' });
  }
});

/**
 * Update changelog entry (admin only)
 * PUT /api/changelog/admin/:id
 */
router.put('/admin/:id', authenticate, apiLimiter, async (req, res) => {
  try {
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (!userResult.rows[0] || userResult.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { id } = req.params;
    const { version, title, description, category, image_url, is_published } = req.body;
    
    const result = await pool.query(`
      UPDATE changelog_entries
      SET version = COALESCE($1, version),
          title = COALESCE($2, title),
          description = COALESCE($3, description),
          category = COALESCE($4, category),
          image_url = COALESCE($5, image_url),
          is_published = COALESCE($6, is_published)
      WHERE id = $7
      RETURNING *
    `, [version, title, description, category, image_url, is_published, id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    
    res.json({ success: true, entry: result.rows[0] });
  } catch (error) {
    console.error('Update changelog error:', error);
    res.status(500).json({ success: false, error: 'Failed to update changelog entry' });
  }
});

export default router;
