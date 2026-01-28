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
// ADMIN USER MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * GET /api/admin/users
 * Get all users for admin dashboard
 */
router.get('/users', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, username, email, full_name, phone, country, timezone, 
        is_verified, two_fa_enabled, created_at, is_blocked,
        subscription_status, subscription_plan, subscription_expires_at,
        is_admin, is_seller, has_blue_badge, profile_image
      FROM users
      ORDER BY created_at DESC
    `);
    res.json({ success: true, users: result.rows });
  } catch (error) {
    console.error('List all users error:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

/**
 * PATCH /api/admin/users/:userId/block
 * Block or unblock a user
 */
router.patch('/users/:userId/block', async (req, res) => {
  try {
    const { userId } = req.params;
    const { block } = req.body;
    const result = await pool.query(
      `UPDATE users SET is_blocked = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 
       RETURNING id, username, email, is_blocked`,
      [!!block, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Set user blocked error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
});

/**
 * PATCH /api/admin/users/:userId/admin
 * Toggle admin status
 */
router.patch('/users/:userId/admin', async (req, res) => {
  try {
    const { userId } = req.params;
    const { is_admin } = req.body;
    const result = await pool.query(
      `UPDATE users SET is_admin = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 
       RETURNING id, username, email, is_admin`,
      [!!is_admin, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Toggle admin error:', error);
    res.status(500).json({ error: 'Failed to update admin status' });
  }
});

/**
 * DELETE /api/admin/users/:userId
 * Delete a user
 */
router.delete('/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;
    
    // Prevent self-deletion
    if (parseInt(userId) === adminId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id, email', [userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

/**
 * GET /api/admin/featured
 * Get all featurable items (bots, signals, products) with current featured status
 */
router.get('/featured', async (req, res) => {
  try {
    const [bots, signals, products, sellers] = await Promise.all([
      pool.query(`
        SELECT b.id, b.name, b.slug, b.thumbnail_url, b.is_featured, b.status, b.total_sales,
               u.id as seller_id, u.username as seller_username, u.full_name as seller_name, 
               u.has_blue_badge as seller_verified
        FROM marketplace_bots b
        JOIN users u ON b.seller_id = u.id
        WHERE b.status = 'approved'
        ORDER BY b.is_featured DESC, b.total_sales DESC
      `),
      pool.query(`
        SELECT sp.id, sp.display_name as name, sp.slug, sp.avatar_url, sp.is_featured, sp.status, sp.subscriber_count,
               u.id as provider_id, u.username as provider_username, u.full_name as provider_name,
               u.has_blue_badge as provider_verified
        FROM signal_providers sp
        JOIN users u ON sp.user_id = u.id
        WHERE sp.status = 'approved'
        ORDER BY sp.is_featured DESC, sp.subscriber_count DESC
      `),
      pool.query(`
        SELECT p.id, p.name, p.slug, p.thumbnail_url, p.is_featured, p.status, p.total_sales,
               u.id as seller_id, u.username as seller_username, u.full_name as seller_name,
               u.has_blue_badge as seller_verified
        FROM marketplace_products p
        JOIN users u ON p.seller_id = u.id
        WHERE p.status = 'approved'
        ORDER BY p.is_featured DESC, p.total_sales DESC
      `),
      pool.query(`
        SELECT u.id, u.username, u.full_name, u.profile_image, u.seller_featured, u.has_blue_badge,
               (SELECT COUNT(*) FROM marketplace_bots WHERE seller_id = u.id AND status = 'approved') as bots_count,
               (SELECT COUNT(*) FROM marketplace_products WHERE seller_id = u.id AND status = 'approved') as products_count,
               (SELECT COUNT(*) FROM signal_providers WHERE user_id = u.id AND status = 'approved') as signals_count
        FROM users u
        WHERE u.is_seller = true
        ORDER BY u.seller_featured DESC, u.created_at DESC
      `)
    ]);

    res.json({
      success: true,
      bots: bots.rows,
      signals: signals.rows,
      products: products.rows,
      sellers: sellers.rows
    });
  } catch (error) {
    console.error('Get featured items error:', error);
    res.status(500).json({ error: 'Failed to get featured items' });
  }
});

/**
 * PATCH /api/admin/users/:userId/feature
 * Toggle featured status for a seller (shows on landing page)
 * Requires seller to be verified AND have at least 1 listing
 */
router.patch('/users/:userId/feature', async (req, res) => {
  try {
    const { userId } = req.params;
    const { featured } = req.body;
    
    // Check if user is a seller with verification status
    const userCheck = await pool.query(`
      SELECT u.is_seller, u.has_blue_badge,
             (SELECT COUNT(*) FROM marketplace_bots WHERE seller_id = u.id AND status = 'approved') as bots_count,
             (SELECT COUNT(*) FROM marketplace_products WHERE seller_id = u.id AND status = 'approved') as products_count,
             (SELECT COUNT(*) FROM signal_providers WHERE user_id = u.id AND status = 'approved') as signals_count
      FROM users u WHERE u.id = $1
    `, [userId]);
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userCheck.rows[0];
    if (!user.is_seller) {
      return res.status(400).json({ error: 'User is not a seller' });
    }
    
    // Only enforce verification and listing requirements when featuring (not when unfeaturing)
    if (featured) {
      if (!user.has_blue_badge) {
        return res.status(400).json({ 
          error: 'Seller must be verified (have blue badge) to be featured',
          requires_verification: true
        });
      }
      
      const totalListings = parseInt(user.bots_count) + parseInt(user.products_count) + parseInt(user.signals_count);
      if (totalListings < 1) {
        return res.status(400).json({ 
          error: 'Seller must have at least 1 approved listing (bot, product, or signal) to be featured',
          requires_listings: true
        });
      }
    }
    
    const result = await pool.query(
      `UPDATE users SET seller_featured = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 
       RETURNING id, username, email, full_name, seller_featured`,
      [!!featured, userId]
    );
    res.json({ 
      success: true, 
      user: result.rows[0],
      message: featured ? 'Seller is now featured on landing page' : 'Seller removed from featured list'
    });
  } catch (error) {
    console.error('Toggle featured error:', error);
    res.status(500).json({ error: 'Failed to update featured status' });
  }
});

/**
 * PATCH /api/admin/bots/:botId/feature
 * Toggle featured status for a bot (shows on landing page)
 * Requires bot seller to be verified
 */
router.patch('/bots/:botId/feature', async (req, res) => {
  try {
    const { botId } = req.params;
    const { featured } = req.body;
    
    // Check if bot exists and get seller verification status
    const botCheck = await pool.query(`
      SELECT b.id, b.name, b.status, u.has_blue_badge as seller_verified
      FROM marketplace_bots b
      JOIN users u ON b.seller_id = u.id
      WHERE b.id = $1
    `, [botId]);
    
    if (botCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Bot not found' });
    }
    
    const bot = botCheck.rows[0];
    
    // Only check requirements when featuring
    if (featured) {
      if (bot.status !== 'approved') {
        return res.status(400).json({ error: 'Bot must be approved before being featured' });
      }
      if (!bot.seller_verified) {
        return res.status(400).json({ 
          error: 'Bot seller must be verified (have blue badge) before the bot can be featured',
          requires_seller_verification: true
        });
      }
    }
    
    const result = await pool.query(
      `UPDATE marketplace_bots SET is_featured = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 
       RETURNING id, name, slug, is_featured`,
      [!!featured, botId]
    );
    res.json({ 
      success: true, 
      bot: result.rows[0],
      message: featured ? 'Bot is now featured on landing page' : 'Bot removed from featured list'
    });
  } catch (error) {
    console.error('Toggle bot featured error:', error);
    res.status(500).json({ error: 'Failed to update bot featured status' });
  }
});

/**
 * PATCH /api/admin/signals/:signalId/feature
 * Toggle featured status for a signal provider (shows on landing page)
 * Requires signal provider to be verified
 */
router.patch('/signals/:signalId/feature', async (req, res) => {
  try {
    const { signalId } = req.params;
    const { featured } = req.body;
    
    // Check if signal exists and get provider verification status
    const signalCheck = await pool.query(`
      SELECT sp.id, sp.display_name, sp.status, u.has_blue_badge as provider_verified
      FROM signal_providers sp
      JOIN users u ON sp.user_id = u.id
      WHERE sp.id = $1
    `, [signalId]);
    
    if (signalCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Signal provider not found' });
    }
    
    const signal = signalCheck.rows[0];
    
    // Only check requirements when featuring
    if (featured) {
      if (signal.status !== 'approved') {
        return res.status(400).json({ error: 'Signal provider must be approved before being featured' });
      }
      if (!signal.provider_verified) {
        return res.status(400).json({ 
          error: 'Signal provider must be verified (have blue badge) before they can be featured',
          requires_provider_verification: true
        });
      }
    }
    
    const result = await pool.query(
      `UPDATE signal_providers SET is_featured = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 
       RETURNING id, display_name, slug, is_featured`,
      [!!featured, signalId]
    );
    res.json({ 
      success: true, 
      signal: result.rows[0],
      message: featured ? 'Signal provider is now featured on landing page' : 'Signal provider removed from featured list'
    });
  } catch (error) {
    console.error('Toggle signal featured error:', error);
    res.status(500).json({ error: 'Failed to update signal featured status' });
  }
});

/**
 * PATCH /api/admin/products/:productId/feature
 * Toggle featured status for a product (shows on landing page)
 * Requires product seller to be verified
 */
router.patch('/products/:productId/feature', async (req, res) => {
  try {
    const { productId } = req.params;
    const { featured } = req.body;
    
    // Check if product exists and get seller verification status
    const productCheck = await pool.query(`
      SELECT p.id, p.name, p.status, u.has_blue_badge as seller_verified
      FROM marketplace_products p
      JOIN users u ON p.seller_id = u.id
      WHERE p.id = $1
    `, [productId]);
    
    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    const product = productCheck.rows[0];
    
    // Only check requirements when featuring
    if (featured) {
      if (product.status !== 'approved') {
        return res.status(400).json({ error: 'Product must be approved before being featured' });
      }
      if (!product.seller_verified) {
        return res.status(400).json({ 
          error: 'Product seller must be verified (have blue badge) before the product can be featured',
          requires_seller_verification: true
        });
      }
    }
    
    const result = await pool.query(
      `UPDATE marketplace_products SET is_featured = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 
       RETURNING id, name, slug, is_featured`,
      [!!featured, productId]
    );
    res.json({ 
      success: true, 
      product: result.rows[0],
      message: featured ? 'Product is now featured on landing page' : 'Product removed from featured list'
    });
  } catch (error) {
    console.error('Toggle product featured error:', error);
    res.status(500).json({ error: 'Failed to update product featured status' });
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
