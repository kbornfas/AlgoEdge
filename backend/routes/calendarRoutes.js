import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get economic events (public endpoint with optional filters)
router.get('/', async (req, res) => {
  try {
    const { 
      start_date, 
      end_date, 
      currency, 
      impact,
      limit = 100 
    } = req.query;

    let query = 'SELECT * FROM economic_events WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (start_date) {
      query += ` AND event_date >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND event_date <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    if (currency) {
      query += ` AND currency = $${paramIndex}`;
      params.push(currency.toUpperCase());
      paramIndex++;
    }

    if (impact) {
      query += ` AND impact = $${paramIndex}`;
      params.push(impact.toLowerCase());
      paramIndex++;
    }

    query += ` ORDER BY event_date ASC LIMIT $${paramIndex}`;
    params.push(Math.min(parseInt(limit) || 100, 500));

    const result = await pool.query(query, params);

    res.json({ events: result.rows });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// Get upcoming events (next 7 days)
router.get('/upcoming', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM economic_events 
       WHERE event_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
       ORDER BY event_date ASC`,
      []
    );

    res.json({ events: result.rows });
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    res.status(500).json({ error: 'Failed to fetch upcoming events' });
  }
});

// Set reminder for event
router.post('/remind/:eventId', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { remind_before_minutes = 15 } = req.body;

    const result = await pool.query(
      `INSERT INTO economic_event_reminders (user_id, event_id, remind_before_minutes)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, event_id) 
       DO UPDATE SET remind_before_minutes = $3, notified = false
       RETURNING *`,
      [req.user.userId, eventId, remind_before_minutes]
    );

    res.json({ reminder: result.rows[0] });
  } catch (error) {
    console.error('Error setting reminder:', error);
    res.status(500).json({ error: 'Failed to set reminder' });
  }
});

// Remove reminder
router.delete('/remind/:eventId', authenticate, async (req, res) => {
  try {
    const { eventId } = req.params;

    await pool.query(
      'DELETE FROM economic_event_reminders WHERE user_id = $1 AND event_id = $2',
      [req.user.userId, eventId]
    );

    res.json({ message: 'Reminder removed' });
  } catch (error) {
    console.error('Error removing reminder:', error);
    res.status(500).json({ error: 'Failed to remove reminder' });
  }
});

// Get user's reminders
router.get('/reminders', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT er.*, ee.event_title, ee.event_date, ee.currency, ee.impact
       FROM economic_event_reminders er
       JOIN economic_events ee ON er.event_id = ee.id
       WHERE er.user_id = $1 AND ee.event_date > NOW()
       ORDER BY ee.event_date ASC`,
      [req.user.userId]
    );

    res.json({ reminders: result.rows });
  } catch (error) {
    console.error('Error fetching reminders:', error);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

// Admin: Create/update event
router.post('/admin', authenticate, async (req, res) => {
  try {
    // Check admin role
    const userCheck = await pool.query('SELECT role FROM users WHERE id = $1', [req.user.userId]);
    if (userCheck.rows[0]?.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const {
      event_title,
      country,
      currency,
      event_date,
      impact,
      forecast,
      previous,
      actual,
      description,
      source
    } = req.body;

    const result = await pool.query(
      `INSERT INTO economic_events 
       (event_title, country, currency, event_date, impact, forecast, previous, actual, description, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [event_title, country, currency, event_date, impact, forecast, previous, actual, description, source]
    );

    res.json({ event: result.rows[0] });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

export default router;
