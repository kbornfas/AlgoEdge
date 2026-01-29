import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Get signal provider leaderboard
router.get('/signal-providers', async (req, res) => {
  try {
    const { sort = 'win_rate', limit = 50 } = req.query;
    
    const validSorts = {
      win_rate: 'win_rate DESC, total_pips DESC',
      total_pips: 'total_pips DESC',
      monthly_pips: 'monthly_pips DESC',
      subscribers: 'subscriber_count DESC',
      signals: 'total_signals DESC',
    };

    const orderBy = validSorts[sort] || validSorts.win_rate;

    const result = await pool.query(
      `SELECT 
        id, user_id, username, profile_photo_url,
        total_signals, winning_signals, losing_signals,
        win_rate, total_pips, avg_pips_per_signal, monthly_pips,
        subscriber_count, updated_at
       FROM signal_provider_leaderboard
       ORDER BY ${orderBy}
       LIMIT $1`,
      [Math.min(parseInt(limit) || 50, 100)]
    );

    res.json({ providers: result.rows });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// Get specific provider stats
router.get('/signal-providers/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT * FROM signal_provider_leaderboard WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found or not visible on leaderboard' });
    }

    res.json({ provider: result.rows[0] });
  } catch (error) {
    console.error('Error fetching provider stats:', error);
    res.status(500).json({ error: 'Failed to fetch provider stats' });
  }
});

export default router;
