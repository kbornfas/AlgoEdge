// backend/routes/ipWhitelistRoutes.js
import express from 'express';
import pool from '../config/database.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Get all whitelisted IPs for a user (admin only)
router.get('/user/:userId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await pool.query(
      'SELECT id, ip_address, created_at FROM ip_whitelist WHERE user_id = $1',
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get IP whitelist error:', error);
    res.status(500).json({ error: 'Failed to fetch IP whitelist' });
  }
});

// Add a whitelisted IP for a user (admin only)
router.post('/user/:userId', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { ip_address } = req.body;
    if (!ip_address) return res.status(400).json({ error: 'IP address required' });
    await pool.query(
      'INSERT INTO ip_whitelist (user_id, ip_address) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, ip_address]
    );
    res.json({ message: 'IP whitelisted' });
  } catch (error) {
    console.error('Add IP whitelist error:', error);
    res.status(500).json({ error: 'Failed to add IP' });
  }
});

// Remove a whitelisted IP for a user (admin only)
router.delete('/user/:userId/:ip', authenticate, requireAdmin, async (req, res) => {
  try {
    const { userId, ip } = req.params;
    await pool.query(
      'DELETE FROM ip_whitelist WHERE user_id = $1 AND ip_address = $2',
      [userId, ip]
    );
    res.json({ message: 'IP removed from whitelist' });
  } catch (error) {
    console.error('Remove IP whitelist error:', error);
    res.status(500).json({ error: 'Failed to remove IP' });
  }
});

export default router;
