/**
 * Export Routes
 * Handles data export functionality for users
 */

import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * Export user data
 * GET /api/export?type=trades&format=csv&days=30
 */
router.get('/', apiLimiter, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type = 'trades', format = 'csv', days, startDate, endDate } = req.query;
    
    let data = [];
    let filename = `algoedge_${type}_export`;
    
    // Calculate date filter
    let dateFilter = '';
    const params = [userId];
    let paramIndex = 2;
    
    if (startDate && endDate) {
      dateFilter = ` AND created_at BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
      params.push(startDate, endDate);
      paramIndex += 2;
      filename += `_${startDate}_to_${endDate}`;
    } else if (days && days !== 'all') {
      dateFilter = ` AND created_at >= NOW() - INTERVAL '${parseInt(days)} days'`;
      filename += `_last_${days}_days`;
    }
    
    // Fetch data based on type
    switch (type) {
      case 'trades':
        const tradesResult = await pool.query(`
          SELECT 
            t.id,
            t.symbol,
            t.trade_type,
            t.entry_price,
            t.exit_price,
            t.lot_size,
            t.profit_loss,
            t.status,
            t.opened_at,
            t.closed_at,
            ma.account_number as mt5_account
          FROM trades t
          LEFT JOIN mt5_accounts ma ON t.mt5_account_id = ma.id
          WHERE t.user_id = $1${dateFilter}
          ORDER BY t.opened_at DESC
        `, params);
        data = tradesResult.rows;
        break;
        
      case 'activity':
        const activityResult = await pool.query(`
          SELECT 
            id,
            activity_type,
            description,
            ip_address,
            created_at
          FROM activity_logs
          WHERE user_id = $1${dateFilter}
          ORDER BY created_at DESC
          LIMIT 1000
        `, params);
        data = activityResult.rows;
        break;
        
      case 'transactions':
        const txResult = await pool.query(`
          SELECT 
            id,
            type,
            amount,
            currency,
            status,
            reference,
            created_at
          FROM wallet_transactions
          WHERE user_id = $1${dateFilter}
          ORDER BY created_at DESC
        `, params);
        data = txResult.rows;
        break;
        
      case 'signals':
        const signalsResult = await pool.query(`
          SELECT 
            s.id,
            s.symbol,
            s.signal_type,
            s.entry_price,
            s.stop_loss,
            s.take_profit,
            s.status,
            s.result_pips,
            s.created_at,
            sp.name as provider_name
          FROM signal_subscriptions ss
          JOIN signals s ON ss.signal_id = s.id
          LEFT JOIN signal_providers sp ON s.provider_id = sp.id
          WHERE ss.user_id = $1${dateFilter.replace('created_at', 's.created_at')}
          ORDER BY s.created_at DESC
        `, params);
        data = signalsResult.rows;
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }
    
    if (data.length === 0) {
      return res.status(404).json({ error: 'No data found for the selected criteria' });
    }
    
    // Generate file
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}.json"`);
      return res.json(data);
    }
    
    // CSV format
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          let value = row[header];
          if (value === null || value === undefined) return '';
          if (value instanceof Date) value = value.toISOString();
          value = String(value).replace(/"/g, '""');
          return value.includes(',') || value.includes('"') || value.includes('\n') 
            ? `"${value}"` 
            : value;
        }).join(',')
      ),
    ];
    
    const csv = csvRows.join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.csv"`);
    res.send(csv);
    
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

export default router;
