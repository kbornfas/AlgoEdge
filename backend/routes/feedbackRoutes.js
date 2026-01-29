/**
 * Feedback Routes
 * Bug reports and feature requests
 */

import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Get feedback items
 * GET /api/feedback?type=bug&status=pending
 */
router.get('/', apiLimiter, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, status, my } = req.query;
    
    let query = `
      SELECT 
        f.*,
        u.username,
        u.profile_image,
        (SELECT COUNT(*) FROM feedback_votes WHERE feedback_id = f.id) as vote_count,
        (SELECT COUNT(*) FROM feedback_comments WHERE feedback_id = f.id) as comment_count,
        EXISTS(SELECT 1 FROM feedback_votes WHERE feedback_id = f.id AND user_id = $1) as user_voted
      FROM feedback f
      JOIN users u ON f.user_id = u.id
      WHERE 1=1
    `;
    const params = [userId];
    let paramIndex = 2;
    
    if (my === 'true') {
      query += ` AND f.user_id = $${paramIndex++}`;
      params.push(userId);
    }
    
    if (type) {
      query += ` AND f.type = $${paramIndex++}`;
      params.push(type);
    }
    
    if (status) {
      query += ` AND f.status = $${paramIndex++}`;
      params.push(status);
    }
    
    query += ` ORDER BY f.created_at DESC LIMIT 50`;
    
    const result = await pool.query(query, params);
    res.json({ success: true, feedback: result.rows });
  } catch (error) {
    console.error('Get feedback error:', error);
    res.status(500).json({ success: false, error: 'Failed to get feedback' });
  }
});

/**
 * Get single feedback with comments
 * GET /api/feedback/:id
 */
router.get('/:id', apiLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    
    const feedbackResult = await pool.query(`
      SELECT 
        f.*,
        u.username,
        u.profile_image,
        EXISTS(SELECT 1 FROM feedback_votes WHERE feedback_id = f.id AND user_id = $2) as user_voted
      FROM feedback f
      JOIN users u ON f.user_id = u.id
      WHERE f.id = $1
    `, [id, userId]);
    
    if (feedbackResult.rowCount === 0) {
      return res.status(404).json({ error: 'Feedback not found' });
    }
    
    const commentsResult = await pool.query(`
      SELECT 
        fc.*,
        u.username,
        u.profile_image,
        u.role
      FROM feedback_comments fc
      JOIN users u ON fc.user_id = u.id
      WHERE fc.feedback_id = $1
      ORDER BY fc.created_at ASC
    `, [id]);
    
    res.json({
      success: true,
      feedback: feedbackResult.rows[0],
      comments: commentsResult.rows,
    });
  } catch (error) {
    console.error('Get feedback detail error:', error);
    res.status(500).json({ success: false, error: 'Failed to get feedback' });
  }
});

/**
 * Submit feedback
 * POST /api/feedback
 */
router.post('/', apiLimiter, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, category, title, description, browser_info } = req.body;
    
    if (!type || !title || !description) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const result = await pool.query(`
      INSERT INTO feedback (user_id, type, category, title, description, browser_info)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [userId, type, category, title, description, browser_info]);
    
    res.json({ success: true, feedback: result.rows[0] });
  } catch (error) {
    console.error('Submit feedback error:', error);
    res.status(500).json({ success: false, error: 'Failed to submit feedback' });
  }
});

/**
 * Vote on feedback
 * POST /api/feedback/:id/vote
 */
router.post('/:id/vote', apiLimiter, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    
    // Check if already voted
    const existingVote = await pool.query(
      'SELECT id FROM feedback_votes WHERE feedback_id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (existingVote.rowCount > 0) {
      // Remove vote
      await pool.query(
        'DELETE FROM feedback_votes WHERE feedback_id = $1 AND user_id = $2',
        [id, userId]
      );
      res.json({ success: true, voted: false });
    } else {
      // Add vote
      await pool.query(
        'INSERT INTO feedback_votes (feedback_id, user_id) VALUES ($1, $2)',
        [id, userId]
      );
      res.json({ success: true, voted: true });
    }
  } catch (error) {
    console.error('Vote feedback error:', error);
    res.status(500).json({ success: false, error: 'Failed to vote' });
  }
});

/**
 * Add comment to feedback
 * POST /api/feedback/:id/comment
 */
router.post('/:id/comment', apiLimiter, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { comment } = req.body;
    
    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ error: 'Comment cannot be empty' });
    }
    
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    const isAdmin = userResult.rows[0]?.role === 'admin';
    
    const result = await pool.query(`
      INSERT INTO feedback_comments (feedback_id, user_id, comment, is_admin)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [id, userId, comment, isAdmin]);
    
    res.json({ success: true, comment: result.rows[0] });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ success: false, error: 'Failed to add comment' });
  }
});

/**
 * Update feedback status (admin only)
 * PATCH /api/feedback/:id/status
 */
router.patch('/:id/status', apiLimiter, async (req, res) => {
  try {
    const userResult = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.id]);
    if (!userResult.rows[0] || userResult.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    
    const { id } = req.params;
    const { status, priority, admin_response } = req.body;
    
    const updates = [];
    const params = [id];
    let paramIndex = 2;
    
    if (status) {
      updates.push(`status = $${paramIndex++}`);
      params.push(status);
    }
    if (priority) {
      updates.push(`priority = $${paramIndex++}`);
      params.push(priority);
    }
    if (admin_response !== undefined) {
      updates.push(`admin_response = $${paramIndex++}`, `admin_responder_id = $${paramIndex++}`, `responded_at = NOW()`);
      params.push(admin_response, req.user.id);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    const result = await pool.query(`
      UPDATE feedback
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING *
    `, params);
    
    res.json({ success: true, feedback: result.rows[0] });
  } catch (error) {
    console.error('Update feedback status error:', error);
    res.status(500).json({ success: false, error: 'Failed to update status' });
  }
});

export default router;
