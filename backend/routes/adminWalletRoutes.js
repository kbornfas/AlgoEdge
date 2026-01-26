import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { getAdminWalletStats, getAdminWalletTransactions, addAdminWalletTransaction } from '../services/adminWalletService.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateToken, requireAdmin);

// ============================================================================
// ADMIN WALLET ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/wallet
 * Get admin wallet balance and stats
 */
router.get('/wallet', async (req, res) => {
  try {
    const stats = await getAdminWalletStats();
    
    // Get today's revenue
    const todayRevenue = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as today_revenue
      FROM admin_wallet_transactions
      WHERE amount > 0 AND created_at >= CURRENT_DATE
    `);

    // Get this month's revenue
    const monthRevenue = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as month_revenue
      FROM admin_wallet_transactions
      WHERE amount > 0 AND created_at >= date_trunc('month', CURRENT_DATE)
    `);

    // Get revenue breakdown by type
    const revenueByType = await pool.query(`
      SELECT type, COALESCE(SUM(amount), 0) as total
      FROM admin_wallet_transactions
      WHERE amount > 0
      GROUP BY type
      ORDER BY total DESC
    `);

    res.json({
      success: true,
      wallet: {
        balance: parseFloat(stats?.balance || 0),
        total_revenue: parseFloat(stats?.total_revenue || 0),
        total_marketplace_commission: parseFloat(stats?.total_marketplace_commission || 0),
        total_verification_fees: parseFloat(stats?.total_verification_fees || 0),
        total_withdrawal_fees: parseFloat(stats?.total_withdrawal_fees || 0),
        total_subscription_revenue: parseFloat(stats?.total_subscription_revenue || 0),
        total_payouts: parseFloat(stats?.total_payouts || 0),
        total_refunds: parseFloat(stats?.total_refunds || 0),
      },
      today_revenue: parseFloat(todayRevenue.rows[0]?.today_revenue || 0),
      month_revenue: parseFloat(monthRevenue.rows[0]?.month_revenue || 0),
      revenue_by_type: revenueByType.rows,
    });
  } catch (error) {
    console.error('Error getting admin wallet:', error);
    res.status(500).json({ error: 'Failed to get admin wallet' });
  }
});

/**
 * GET /api/admin/wallet/transactions
 * Get admin wallet transaction history
 */
router.get('/wallet/transactions', async (req, res) => {
  try {
    const { page = 1, limit = 50, type } = req.query;
    const result = await getAdminWalletTransactions(parseInt(page), parseInt(limit), type);
    
    res.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Error getting admin wallet transactions:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

/**
 * POST /api/admin/wallet/adjustment
 * Make a manual adjustment to admin wallet
 */
router.post('/wallet/adjustment', async (req, res) => {
  try {
    const adminId = req.user.id;
    const { amount, description, type = 'manual_adjustment' } = req.body;

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const transaction = await addAdminWalletTransaction(
      type,
      parseFloat(amount),
      description,
      null,
      null,
      null,
      adminId
    );

    res.json({
      success: true,
      message: 'Adjustment applied successfully',
      transaction,
    });
  } catch (error) {
    console.error('Error making admin wallet adjustment:', error);
    res.status(500).json({ error: 'Failed to apply adjustment' });
  }
});

// ============================================================================
// ALL USER BALANCES ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/users/balances
 * Get all user wallet balances (user wallets, seller wallets, affiliate wallets)
 */
router.get('/users/balances', async (req, res) => {
  try {
    const { page = 1, limit = 50, search, sort = 'balance', order = 'desc' } = req.query;
    const offset = (page - 1) * limit;

    // Get user wallets with user info
    let userWalletsQuery = `
      SELECT 
        u.id as user_id,
        u.username,
        u.email,
        u.created_at as user_created_at,
        COALESCE(uw.balance, 0) as user_balance,
        COALESCE(uw.total_deposited, 0) as total_deposited,
        COALESCE(uw.total_spent, 0) as total_spent,
        COALESCE(sw.balance, 0) as seller_balance,
        COALESCE(sw.pending_balance, 0) as seller_pending,
        COALESCE(sw.total_earned, 0) as seller_total_earned,
        COALESCE(aw.available_balance, 0) as affiliate_balance,
        COALESCE(aw.pending, 0) as affiliate_pending,
        COALESCE(aw.total_earned, 0) as affiliate_total_earned,
        COALESCE(uw.balance, 0) + COALESCE(sw.balance, 0) + COALESCE(aw.available_balance, 0) as total_balance
      FROM users u
      LEFT JOIN user_wallets uw ON u.id = uw.user_id
      LEFT JOIN seller_wallets sw ON u.id = sw.user_id
      LEFT JOIN affiliate_wallets aw ON u.id = aw.user_id
      WHERE 1=1
    `;
    const params = [];

    // Add search filter
    if (search) {
      userWalletsQuery += ` AND (u.username ILIKE $${params.length + 1} OR u.email ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    // Add sorting
    const validSortFields = {
      'balance': 'total_balance',
      'user_balance': 'user_balance',
      'seller_balance': 'seller_balance',
      'affiliate_balance': 'affiliate_balance',
      'username': 'u.username',
      'created_at': 'u.created_at',
    };
    const sortField = validSortFields[sort] || 'total_balance';
    const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    userWalletsQuery += ` ORDER BY ${sortField} ${sortOrder} NULLS LAST`;

    // Add pagination
    userWalletsQuery += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const wallets = await pool.query(userWalletsQuery, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) FROM users u
      LEFT JOIN user_wallets uw ON u.id = uw.user_id
      LEFT JOIN seller_wallets sw ON u.id = sw.user_id
      LEFT JOIN affiliate_wallets aw ON u.id = aw.user_id
      WHERE 1=1
    `;
    const countParams = [];
    if (search) {
      countQuery += ` AND (u.username ILIKE $1 OR u.email ILIKE $1)`;
      countParams.push(`%${search}%`);
    }
    const countResult = await pool.query(countQuery, countParams);

    // Get aggregate totals
    const totals = await pool.query(`
      SELECT 
        COALESCE(SUM(uw.balance), 0) as total_user_balance,
        COALESCE(SUM(sw.balance), 0) as total_seller_balance,
        COALESCE(SUM(aw.available_balance), 0) as total_affiliate_balance,
        COALESCE(SUM(uw.balance), 0) + COALESCE(SUM(sw.balance), 0) + COALESCE(SUM(aw.available_balance), 0) as grand_total
      FROM users u
      LEFT JOIN user_wallets uw ON u.id = uw.user_id
      LEFT JOIN seller_wallets sw ON u.id = sw.user_id
      LEFT JOIN affiliate_wallets aw ON u.id = aw.user_id
    `);

    res.json({
      success: true,
      users: wallets.rows,
      totals: {
        total_user_balance: parseFloat(totals.rows[0]?.total_user_balance || 0),
        total_seller_balance: parseFloat(totals.rows[0]?.total_seller_balance || 0),
        total_affiliate_balance: parseFloat(totals.rows[0]?.total_affiliate_balance || 0),
        grand_total: parseFloat(totals.rows[0]?.grand_total || 0),
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit),
      },
    });
  } catch (error) {
    console.error('Error getting user balances:', error);
    res.status(500).json({ error: 'Failed to get user balances' });
  }
});

/**
 * GET /api/admin/users/:userId/wallet
 * Get detailed wallet info for a specific user
 */
router.get('/users/:userId/wallet', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get user info
    const user = await pool.query(
      'SELECT id, username, email, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user wallet
    const userWallet = await pool.query(
      'SELECT * FROM user_wallets WHERE user_id = $1',
      [userId]
    );

    // Get seller wallet
    const sellerWallet = await pool.query(
      'SELECT * FROM seller_wallets WHERE user_id = $1',
      [userId]
    );

    // Get affiliate wallet
    const affiliateWallet = await pool.query(
      'SELECT * FROM affiliate_wallets WHERE user_id = $1',
      [userId]
    );

    // Get recent transactions from all wallet types
    const recentTransactions = await pool.query(`
      SELECT 'user' as wallet_type, type, amount, balance_before, balance_after, description, created_at
      FROM wallet_transactions WHERE user_id = $1
      UNION ALL
      SELECT 'seller' as wallet_type, type, amount, NULL, NULL, description, created_at
      FROM seller_transactions WHERE user_id = $1
      UNION ALL
      SELECT 'affiliate' as wallet_type, type, amount, balance_before, balance_after, description, created_at
      FROM affiliate_wallet_transactions WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [userId]);

    res.json({
      success: true,
      user: user.rows[0],
      wallets: {
        user: userWallet.rows[0] || { balance: 0, total_deposited: 0, total_spent: 0 },
        seller: sellerWallet.rows[0] || { balance: 0, pending_balance: 0, total_earned: 0 },
        affiliate: affiliateWallet.rows[0] || { available_balance: 0, pending: 0, total_earned: 0 },
      },
      recent_transactions: recentTransactions.rows,
    });
  } catch (error) {
    console.error('Error getting user wallet details:', error);
    res.status(500).json({ error: 'Failed to get user wallet details' });
  }
});

/**
 * POST /api/admin/users/:userId/wallet/adjust
 * Adjust a user's wallet balance (for refunds, corrections, bonuses)
 */
router.post('/users/:userId/wallet/adjust', async (req, res) => {
  const client = await pool.connect();
  
  try {
    const adminId = req.user.id;
    const { userId } = req.params;
    const { wallet_type, amount, reason } = req.body;

    if (!wallet_type || !['user', 'seller', 'affiliate'].includes(wallet_type)) {
      return res.status(400).json({ error: 'Valid wallet_type is required (user, seller, affiliate)' });
    }

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'Reason is required' });
    }

    await client.query('BEGIN');

    const adjustmentAmount = parseFloat(amount);
    const adjustmentType = adjustmentAmount >= 0 ? 'admin_credit' : 'admin_debit';

    if (wallet_type === 'user') {
      // Get or create user wallet
      let wallet = await client.query(
        'SELECT * FROM user_wallets WHERE user_id = $1 FOR UPDATE',
        [userId]
      );

      if (wallet.rows.length === 0) {
        await client.query(
          'INSERT INTO user_wallets (user_id, balance) VALUES ($1, 0)',
          [userId]
        );
        wallet = await client.query('SELECT * FROM user_wallets WHERE user_id = $1 FOR UPDATE', [userId]);
      }

      const currentBalance = parseFloat(wallet.rows[0].balance);
      const newBalance = currentBalance + adjustmentAmount;

      if (newBalance < 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Adjustment would result in negative balance' });
      }

      await client.query(
        'UPDATE user_wallets SET balance = $1, updated_at = NOW() WHERE user_id = $2',
        [newBalance, userId]
      );

      await client.query(
        `INSERT INTO wallet_transactions 
         (user_id, type, amount, balance_before, balance_after, description, reference_type, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, 'admin_adjustment', $7)`,
        [userId, adjustmentType, adjustmentAmount, currentBalance, newBalance, reason, JSON.stringify({ admin_id: adminId })]
      );

    } else if (wallet_type === 'seller') {
      let wallet = await client.query(
        'SELECT * FROM seller_wallets WHERE user_id = $1 FOR UPDATE',
        [userId]
      );

      if (wallet.rows.length === 0) {
        await client.query(
          'INSERT INTO seller_wallets (user_id, balance, pending_balance, total_earned) VALUES ($1, 0, 0, 0)',
          [userId]
        );
        wallet = await client.query('SELECT * FROM seller_wallets WHERE user_id = $1 FOR UPDATE', [userId]);
      }

      const currentBalance = parseFloat(wallet.rows[0].balance);
      const newBalance = currentBalance + adjustmentAmount;

      if (newBalance < 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Adjustment would result in negative balance' });
      }

      await client.query(
        'UPDATE seller_wallets SET balance = $1, updated_at = NOW() WHERE user_id = $2',
        [newBalance, userId]
      );

      await client.query(
        `INSERT INTO seller_transactions 
         (user_id, type, amount, description, status, metadata)
         VALUES ($1, $2, $3, $4, 'completed', $5)`,
        [userId, adjustmentType, adjustmentAmount, reason, JSON.stringify({ admin_id: adminId })]
      );

    } else if (wallet_type === 'affiliate') {
      let wallet = await client.query(
        'SELECT * FROM affiliate_wallets WHERE user_id = $1 FOR UPDATE',
        [userId]
      );

      if (wallet.rows.length === 0) {
        await client.query(
          'INSERT INTO affiliate_wallets (user_id, available_balance, pending, total_earned) VALUES ($1, 0, 0, 0)',
          [userId]
        );
        wallet = await client.query('SELECT * FROM affiliate_wallets WHERE user_id = $1 FOR UPDATE', [userId]);
      }

      const currentBalance = parseFloat(wallet.rows[0].available_balance);
      const newBalance = currentBalance + adjustmentAmount;

      if (newBalance < 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: 'Adjustment would result in negative balance' });
      }

      await client.query(
        'UPDATE affiliate_wallets SET available_balance = $1, updated_at = NOW() WHERE user_id = $2',
        [newBalance, userId]
      );

      await client.query(
        `INSERT INTO affiliate_wallet_transactions 
         (user_id, type, amount, balance_before, balance_after, description, reference_type)
         VALUES ($1, $2, $3, $4, $5, $6, 'admin_adjustment')`,
        [userId, adjustmentType, adjustmentAmount, currentBalance, newBalance, reason]
      );
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      message: `${wallet_type} wallet adjusted by $${adjustmentAmount.toFixed(2)}`,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adjusting user wallet:', error);
    res.status(500).json({ error: 'Failed to adjust wallet' });
  } finally {
    client.release();
  }
});

/**
 * GET /api/admin/financial-summary
 * Get complete financial summary of the platform
 */
router.get('/financial-summary', async (req, res) => {
  try {
    // Admin wallet stats
    const adminWallet = await getAdminWalletStats();

    // Total user balances (liabilities)
    const userBalances = await pool.query(`
      SELECT 
        COALESCE(SUM(uw.balance), 0) as total_user_balance,
        COALESCE(SUM(sw.balance), 0) as total_seller_balance,
        COALESCE(SUM(sw.pending_balance), 0) as total_seller_pending,
        COALESCE(SUM(aw.available_balance), 0) as total_affiliate_balance,
        COALESCE(SUM(aw.pending), 0) as total_affiliate_pending
      FROM users u
      LEFT JOIN user_wallets uw ON u.id = uw.user_id
      LEFT JOIN seller_wallets sw ON u.id = sw.user_id
      LEFT JOIN affiliate_wallets aw ON u.id = aw.user_id
    `);

    // Pending deposit requests
    const pendingDeposits = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM wallet_deposit_requests WHERE status = 'pending'
    `);

    // Pending withdrawal requests
    const pendingWithdrawals = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM wallet_withdrawal_requests WHERE status = 'pending'
    `);

    // Pending affiliate payouts
    const pendingPayouts = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM affiliate_payouts WHERE status = 'pending'
    `);

    // Total deposits approved
    const totalDeposits = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM wallet_deposit_requests WHERE status = 'approved'
    `);

    // Total withdrawals completed
    const totalWithdrawals = await pool.query(`
      SELECT COALESCE(SUM(net_amount), 0) as total
      FROM wallet_withdrawal_requests WHERE status = 'completed'
    `);

    const balances = userBalances.rows[0];
    const totalLiabilities = 
      parseFloat(balances.total_user_balance || 0) +
      parseFloat(balances.total_seller_balance || 0) +
      parseFloat(balances.total_seller_pending || 0) +
      parseFloat(balances.total_affiliate_balance || 0) +
      parseFloat(balances.total_affiliate_pending || 0);

    res.json({
      success: true,
      admin_wallet: {
        balance: parseFloat(adminWallet?.balance || 0),
        total_revenue: parseFloat(adminWallet?.total_revenue || 0),
        breakdown: {
          marketplace_commission: parseFloat(adminWallet?.total_marketplace_commission || 0),
          verification_fees: parseFloat(adminWallet?.total_verification_fees || 0),
          withdrawal_fees: parseFloat(adminWallet?.total_withdrawal_fees || 0),
          subscription_revenue: parseFloat(adminWallet?.total_subscription_revenue || 0),
        },
        total_payouts: parseFloat(adminWallet?.total_payouts || 0),
        total_refunds: parseFloat(adminWallet?.total_refunds || 0),
      },
      user_liabilities: {
        user_wallets: parseFloat(balances.total_user_balance || 0),
        seller_wallets: parseFloat(balances.total_seller_balance || 0),
        seller_pending: parseFloat(balances.total_seller_pending || 0),
        affiliate_wallets: parseFloat(balances.total_affiliate_balance || 0),
        affiliate_pending: parseFloat(balances.total_affiliate_pending || 0),
        total: totalLiabilities,
      },
      pending_operations: {
        deposits: parseFloat(pendingDeposits.rows[0]?.total || 0),
        withdrawals: parseFloat(pendingWithdrawals.rows[0]?.total || 0),
        affiliate_payouts: parseFloat(pendingPayouts.rows[0]?.total || 0),
      },
      totals: {
        total_deposits_approved: parseFloat(totalDeposits.rows[0]?.total || 0),
        total_withdrawals_completed: parseFloat(totalWithdrawals.rows[0]?.total || 0),
      },
      net_position: parseFloat(adminWallet?.balance || 0) - totalLiabilities,
    });
  } catch (error) {
    console.error('Error getting financial summary:', error);
    res.status(500).json({ error: 'Failed to get financial summary' });
  }
});

export default router;
