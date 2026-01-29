import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Follow a user
router.post('/follow/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;

    if (parseInt(userId) === req.user.userId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const result = await pool.query(
      `INSERT INTO user_follows (follower_id, following_id)
       VALUES ($1, $2)
       ON CONFLICT (follower_id, following_id) DO NOTHING
       RETURNING *`,
      [req.user.userId, userId]
    );

    res.json({ follow: result.rows[0] || { message: 'Already following' } });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

// Unfollow a user
router.delete('/follow/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      'DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2 RETURNING *',
      [req.user.userId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Not following this user' });
    }

    res.json({ message: 'Unfollowed successfully' });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
});

// Get user's followers
router.get('/followers/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT u.id, u.username, u.profile_photo_url, uf.created_at as followed_since
       FROM user_follows uf
       JOIN users u ON uf.follower_id = u.id
       WHERE uf.following_id = $1
       ORDER BY uf.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({ followers: result.rows });
  } catch (error) {
    console.error('Error fetching followers:', error);
    res.status(500).json({ error: 'Failed to fetch followers' });
  }
});

// Get users that a user is following
router.get('/following/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT u.id, u.username, u.profile_photo_url, uf.created_at as following_since
       FROM user_follows uf
       JOIN users u ON uf.following_id = u.id
       WHERE uf.follower_id = $1
       ORDER BY uf.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({ following: result.rows });
  } catch (error) {
    console.error('Error fetching following:', error);
    res.status(500).json({ error: 'Failed to fetch following' });
  }
});

// Check if current user follows target user
router.get('/check/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      'SELECT id FROM user_follows WHERE follower_id = $1 AND following_id = $2',
      [req.user.userId, userId]
    );

    res.json({ is_following: result.rows.length > 0 });
  } catch (error) {
    console.error('Error checking follow status:', error);
    res.status(500).json({ error: 'Failed to check follow status' });
  }
});

// Get follow counts
router.get('/counts/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT 
        get_follower_count($1) as followers_count,
        get_following_count($1) as following_count`,
      [userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching follow counts:', error);
    res.status(500).json({ error: 'Failed to fetch follow counts' });
  }
});

// Get notification settings
router.get('/notification-settings', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `INSERT INTO follow_notification_settings (user_id)
       VALUES ($1)
       ON CONFLICT (user_id) DO UPDATE SET user_id = $1
       RETURNING *`,
      [req.user.userId]
    );

    res.json({ settings: result.rows[0] });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({ error: 'Failed to fetch notification settings' });
  }
});

// Update notification settings
router.put('/notification-settings', authenticate, async (req, res) => {
  try {
    const {
      notify_on_new_trade,
      notify_on_profit_milestone,
      notify_on_new_signal
    } = req.body;

    const result = await pool.query(
      `UPDATE follow_notification_settings
       SET notify_on_new_trade = COALESCE($1, notify_on_new_trade),
           notify_on_profit_milestone = COALESCE($2, notify_on_profit_milestone),
           notify_on_new_signal = COALESCE($3, notify_on_new_signal)
       WHERE user_id = $4
       RETURNING *`,
      [notify_on_new_trade, notify_on_profit_milestone, notify_on_new_signal, req.user.userId]
    );

    res.json({ settings: result.rows[0] });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({ error: 'Failed to update notification settings' });
  }
});

export default router;
