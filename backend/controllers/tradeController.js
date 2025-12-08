// List all trades (admin only)
export const listAllTrades = async (req, res) => {
  try {
    const { status, limit = 100, offset = 0 } = req.query;
    let query = `
      SELECT t.*, u.username, tr.name as robot_name, ma.account_id as mt5_account
      FROM trades t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN trading_robots tr ON t.robot_id = tr.id
      LEFT JOIN mt5_accounts ma ON t.mt5_account_id = ma.id
      WHERE 1=1
    `;
    const params = [];
    if (status) {
      params.push(status);
      query += ` AND t.status = $${params.length}`;
    }
    query += ` ORDER BY t.open_time DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);
    const result = await pool.query(query, params);
    res.json({ trades: result.rows });
  } catch (error) {
    console.error('List all trades error:', error);
    res.status(500).json({ error: 'Failed to list trades' });
  }
};

// Approve or reject a pending transaction (admin only)
export const approveTransaction = async (req, res) => {
  try {
    const { tradeId } = req.params;
    const { approve } = req.body;
    const status = approve ? 'approved' : 'rejected';
    const result = await pool.query(
      `UPDATE trades SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [status, tradeId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trade not found' });
    }
    auditLog(req.user.id, approve ? 'TRADE_APPROVED' : 'TRADE_REJECTED', { tradeId }, req);
    res.json({ trade: result.rows[0] });
  } catch (error) {
    console.error('Approve/reject transaction error:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
};
import pool from '../config/database.js';
import { sendEmail } from '../services/emailService.js';
import { auditLog } from '../middleware/audit.js';

// Get All Trades
export const getTrades = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, limit = 100, offset = 0 } = req.query;

    let query = `
      SELECT t.*, tr.name as robot_name, ma.account_id as mt5_account
      FROM trades t
      LEFT JOIN trading_robots tr ON t.robot_id = tr.id
      LEFT JOIN mt5_accounts ma ON t.mt5_account_id = ma.id
      WHERE t.user_id = $1
    `;
    const params = [userId];

    if (status) {
      params.push(status);
      query += ` AND t.status = $${params.length}`;
    }

    query += ` ORDER BY t.open_time DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    res.json({ trades: result.rows });
  } catch (error) {
    console.error('Get trades error:', error);
    res.status(500).json({ error: 'Failed to get trades' });
  }
};

// Get Trade Statistics
export const getTradeStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const stats = await pool.query(
      `SELECT 
        COUNT(*) as total_trades,
        COUNT(*) FILTER (WHERE status = 'open') as open_trades,
        COUNT(*) FILTER (WHERE status = 'closed') as closed_trades,
        COUNT(*) FILTER (WHERE profit > 0) as winning_trades,
        COUNT(*) FILTER (WHERE profit < 0) as losing_trades,
        COALESCE(SUM(profit) FILTER (WHERE status = 'closed'), 0) as total_profit,
        COALESCE(AVG(profit) FILTER (WHERE status = 'closed'), 0) as avg_profit,
        COALESCE(MAX(profit), 0) as max_profit,
        COALESCE(MIN(profit), 0) as max_loss
       FROM trades
       WHERE user_id = $1`,
      [userId]
    );

    const winRate = stats.rows[0].closed_trades > 0
      ? (stats.rows[0].winning_trades / stats.rows[0].closed_trades * 100).toFixed(2)
      : 0;

    res.json({
      stats: {
        ...stats.rows[0],
        win_rate: winRate,
      },
    });
  } catch (error) {
    console.error('Get trade stats error:', error);
    res.status(500).json({ error: 'Failed to get trade statistics' });
  }
};

// Create Trade (simulate or real)
export const createTrade = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id;
    const {
      robot_id,
      mt5_account_id,
      pair,
      type,
      volume,
      open_price,
      stop_loss,
      take_profit,
    } = req.body;

    if (!pair || !type || !volume || !open_price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await client.query('BEGIN');

    // Create trade record
    const result = await client.query(
      `INSERT INTO trades (user_id, robot_id, mt5_account_id, pair, type, volume, open_price, stop_loss, take_profit, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'open')
       RETURNING *`,
      [userId, robot_id, mt5_account_id, pair, type, volume, open_price, stop_loss, take_profit]
    );

    const trade = result.rows[0];

    await client.query('COMMIT');

    // Send trade alert if enabled
    const settings = await pool.query(
      'SELECT trade_alerts FROM user_settings WHERE user_id = $1',
      [userId]
    );

    if (settings.rows[0]?.trade_alerts) {
      const user = await pool.query(
        'SELECT username, email FROM users WHERE id = $1',
        [userId]
      );
      
      const robot = await pool.query(
        'SELECT name FROM trading_robots WHERE id = $1',
        [robot_id]
      );

      sendEmail(user.rows[0].email, 'tradeAlert', [
        user.rows[0].username,
        { ...trade, robot: robot.rows[0]?.name || 'Unknown', status: 'open' },
      ]);
    }

    auditLog(userId, 'TRADE_OPENED', { pair, type, volume }, req);

    res.status(201).json({ trade });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create trade error:', error);
    res.status(500).json({ error: 'Failed to create trade' });
  } finally {
    client.release();
  }
};

// Close Trade
export const closeTrade = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id;
    const { tradeId } = req.params;
    const { close_price } = req.body;

    if (!close_price) {
      return res.status(400).json({ error: 'Close price is required' });
    }

    await client.query('BEGIN');

    // Get trade details
    const tradeResult = await client.query(
      'SELECT * FROM trades WHERE id = $1 AND user_id = $2 AND status = $3',
      [tradeId, userId, 'open']
    );

    if (tradeResult.rows.length === 0) {
      return res.status(404).json({ error: 'Trade not found or already closed' });
    }

    const trade = tradeResult.rows[0];

    // Calculate profit (simplified calculation)
    const pips = trade.type === 'BUY'
      ? (close_price - trade.open_price) * 10000
      : (trade.open_price - close_price) * 10000;
    
    const profit = pips * parseFloat(trade.volume) * 10;

    // Update trade
    const result = await client.query(
      `UPDATE trades 
       SET close_price = $1, profit = $2, status = 'closed', close_time = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [close_price, profit, tradeId]
    );

    await client.query('COMMIT');

    // Send trade alert if enabled
    const settings = await pool.query(
      'SELECT trade_alerts FROM user_settings WHERE user_id = $1',
      [userId]
    );

    if (settings.rows[0]?.trade_alerts) {
      const user = await pool.query(
        'SELECT username, email FROM users WHERE id = $1',
        [userId]
      );
      
      const robot = await pool.query(
        'SELECT name FROM trading_robots WHERE id = $1',
        [trade.robot_id]
      );

      const closedTrade = result.rows[0];
      sendEmail(user.rows[0].email, 'tradeAlert', [
        user.rows[0].username,
        { ...closedTrade, robot: robot.rows[0]?.name || 'Unknown', status: 'closed' },
      ]);
    }

    auditLog(userId, 'TRADE_CLOSED', { tradeId, profit }, req);

    res.json({ trade: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Close trade error:', error);
    res.status(500).json({ error: 'Failed to close trade' });
  } finally {
    client.release();
  }
};

// Get Available Trading Robots
export const getRobots = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM trading_robots WHERE is_active = true ORDER BY name'
    );

    res.json({ robots: result.rows });
  } catch (error) {
    console.error('Get robots error:', error);
    res.status(500).json({ error: 'Failed to get robots' });
  }
};

export default {
  getTrades,
  getTradeStats,
  createTrade,
  closeTrade,
  getRobots,
  listAllTrades,
  approveTransaction,
};
