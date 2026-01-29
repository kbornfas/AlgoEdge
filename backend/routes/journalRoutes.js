import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all trades with journal data
router.get('/journal', authenticate, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, symbol, trade_type, entry_price, exit_price, profit_loss, 
              notes, tags, setup_rating, emotion, screenshot_url, 
              opened_at, closed_at
       FROM trades 
       WHERE user_id = $1 
       ORDER BY opened_at DESC 
       LIMIT 100`,
      [req.user.userId]
    );

    res.json({ trades: result.rows });
  } catch (error) {
    console.error('Error fetching trades:', error);
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
});

// Update trade journal entry
router.put('/:id/journal', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, tags, setup_rating, emotion, screenshot_url } = req.body;

    // Verify ownership
    const tradeCheck = await pool.query('SELECT user_id FROM trades WHERE id = $1', [id]);
    if (tradeCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Trade not found' });
    }
    if (tradeCheck.rows[0].user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const result = await pool.query(
      `UPDATE trades 
       SET notes = $1, tags = $2, setup_rating = $3, emotion = $4, screenshot_url = $5
       WHERE id = $6
       RETURNING *`,
      [notes, tags, setup_rating, emotion, screenshot_url, id]
    );

    res.json({ trade: result.rows[0] });
  } catch (error) {
    console.error('Error updating journal:', error);
    res.status(500).json({ error: 'Failed to update journal' });
  }
});

// Get user's tags
router.get('/tags', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT name FROM trade_tags WHERE user_id = $1 OR user_id IS NULL ORDER BY name',
      [req.user.userId]
    );
    res.json({ tags: result.rows });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// Create new tag
router.post('/tags', authenticate, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Tag name required' });
    }

    // Check if already exists
    const existing = await pool.query(
      'SELECT id FROM trade_tags WHERE user_id = $1 AND name = $2',
      [req.user.userId, name]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Tag already exists' });
    }

    const result = await pool.query(
      'INSERT INTO trade_tags (user_id, name) VALUES ($1, $2) RETURNING *',
      [req.user.userId, name]
    );

    res.json({ tag: result.rows[0] });
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

export default router;
