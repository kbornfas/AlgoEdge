import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// ============================================================================
// COMMISSION CONFIGURATION
// Platform receives 20%, Seller receives 80%
// ============================================================================
const COMMISSION_RATE = parseFloat(process.env.MARKETPLACE_COMMISSION_RATE) || 20; // 20% to platform
const MIN_DEPOSIT = parseFloat(process.env.MIN_DEPOSIT_AMOUNT) || 19;
const MAX_DEPOSIT = parseFloat(process.env.MAX_DEPOSIT_AMOUNT) || 10000;

// ============================================================================
// USER WALLET ENDPOINTS
// ============================================================================

// Get user's wallet balance and info
router.get('/balance', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get or create wallet
    let wallet = await pool.query(
      'SELECT * FROM user_wallets WHERE user_id = $1',
      [userId]
    );

    if (wallet.rows.length === 0) {
      // Create wallet if doesn't exist
      wallet = await pool.query(
        `INSERT INTO user_wallets (user_id, balance) 
         VALUES ($1, 0) 
         RETURNING *`,
        [userId]
      );
    }

    // Get pending deposits
    const pendingDeposits = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total 
       FROM wallet_deposit_requests 
       WHERE user_id = $1 AND status = 'pending'`,
      [userId]
    );

    // Get recent transactions
    const recentTransactions = await pool.query(
      `SELECT * FROM wallet_transactions 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [userId]
    );

    res.json({
      success: true,
      wallet: {
        balance: parseFloat(wallet.rows[0].balance),
        total_deposited: parseFloat(wallet.rows[0].total_deposited),
        total_spent: parseFloat(wallet.rows[0].total_spent),
        currency: wallet.rows[0].currency,
        is_frozen: wallet.rows[0].is_frozen,
        pending_deposits: parseFloat(pendingDeposits.rows[0].total),
      },
      recent_transactions: recentTransactions.rows,
    });
  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({ error: 'Failed to get wallet balance' });
  }
});

// Get transaction history
router.get('/transactions', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT * FROM wallet_transactions 
      WHERE user_id = $1
    `;
    const params = [userId];

    if (type) {
      query += ` AND type = $2`;
      params.push(type);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const transactions = await pool.query(query, params);

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM wallet_transactions WHERE user_id = $1`,
      [userId]
    );

    res.json({
      success: true,
      transactions: transactions.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit),
      },
    });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

// ============================================================================
// DEPOSIT ENDPOINTS
// ============================================================================

// Get available payment methods
router.get('/payment-methods', async (req, res) => {
  try {
    const methods = await pool.query(
      `SELECT id, payment_method, account_name, account_number, 
              crypto_address, crypto_network, qr_code_url, instructions,
              min_amount, max_amount
       FROM platform_payment_accounts 
       WHERE is_active = TRUE 
       ORDER BY display_order ASC`
    );

    res.json({
      success: true,
      payment_methods: methods.rows,
      limits: {
        min_deposit: MIN_DEPOSIT,
        max_deposit: MAX_DEPOSIT,
      },
    });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ error: 'Failed to get payment methods' });
  }
});

// Request a deposit (user submits payment proof)
router.post('/deposit/request', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      amount, 
      payment_method, 
      payment_reference, 
      payment_proof_url,
      phone_number,
      crypto_address,
      crypto_network 
    } = req.body;

    // Validate amount
    if (!amount || amount < MIN_DEPOSIT || amount > MAX_DEPOSIT) {
      return res.status(400).json({ 
        error: `Deposit amount must be between $${MIN_DEPOSIT} and $${MAX_DEPOSIT}` 
      });
    }

    // Validate payment method - M-Pesa, Airtel Money, USDT, and BTC allowed
    const validMethods = ['mpesa', 'airtel_money', 'usdt', 'btc'];
    if (!validMethods.includes(payment_method)) {
      return res.status(400).json({ error: 'Invalid payment method. Only M-Pesa, Airtel Money, USDT, and BTC are accepted.' });
    }

    // Check for pending deposits (limit to prevent spam)
    const pendingCount = await pool.query(
      `SELECT COUNT(*) FROM wallet_deposit_requests 
       WHERE user_id = $1 AND status = 'pending'`,
      [userId]
    );

    if (parseInt(pendingCount.rows[0].count) >= 3) {
      return res.status(400).json({ 
        error: 'You have too many pending deposits. Please wait for approval.' 
      });
    }

    // Create deposit request
    const deposit = await pool.query(
      `INSERT INTO wallet_deposit_requests 
       (user_id, amount, payment_method, payment_reference, payment_proof_url,
        phone_number, crypto_address, crypto_network)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [userId, amount, payment_method, payment_reference, payment_proof_url,
       phone_number, crypto_address, crypto_network]
    );

    res.json({
      success: true,
      message: 'Deposit request submitted. It will be reviewed within 24 hours.',
      deposit: deposit.rows[0],
    });
  } catch (error) {
    console.error('Deposit request error:', error);
    res.status(500).json({ error: 'Failed to submit deposit request' });
  }
});

// Get user's deposit requests
router.get('/deposit/history', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const deposits = await pool.query(
      `SELECT * FROM wallet_deposit_requests 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId]
    );

    res.json({
      success: true,
      deposits: deposits.rows,
    });
  } catch (error) {
    console.error('Get deposit history error:', error);
    res.status(500).json({ error: 'Failed to get deposit history' });
  }
});

// ============================================================================
// PURCHASE ENDPOINTS
// ============================================================================

// Purchase a bot
router.post('/purchase/bot/:botId', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { botId } = req.params;

    // Get bot details
    const bot = await pool.query(
      `SELECT b.*, u.id as seller_id, u.email as seller_email
       FROM marketplace_bots b
       JOIN users u ON b.seller_id = u.id
       WHERE b.id = $1 AND b.status = 'approved'`,
      [botId]
    );

    if (bot.rows.length === 0) {
      return res.status(404).json({ error: 'Bot not found or not available' });
    }

    const item = bot.rows[0];
    const price = parseFloat(item.price);

    // Check if user is the seller
    if (item.seller_id === userId) {
      return res.status(400).json({ error: 'You cannot purchase your own product' });
    }

    // Check if already purchased
    const existingPurchase = await pool.query(
      `SELECT id FROM marketplace_purchases 
       WHERE buyer_id = $1 AND item_type = 'bot' AND item_id = $2 AND status = 'completed'`,
      [userId, botId]
    );

    if (existingPurchase.rows.length > 0) {
      return res.status(400).json({ error: 'You already own this bot' });
    }

    // Get user wallet
    const wallet = await pool.query(
      'SELECT * FROM user_wallets WHERE user_id = $1',
      [userId]
    );

    if (wallet.rows.length === 0 || parseFloat(wallet.rows[0].balance) < price) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        required: price,
        current: wallet.rows.length > 0 ? parseFloat(wallet.rows[0].balance) : 0,
      });
    }

    if (wallet.rows[0].is_frozen) {
      return res.status(400).json({ error: 'Your wallet is frozen. Contact support.' });
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Calculate commissions: 20% platform, 80% seller
      const platformCommission = price * (COMMISSION_RATE / 100);
      const sellerEarnings = price - platformCommission;

      const currentBalance = parseFloat(wallet.rows[0].balance);
      const newBalance = currentBalance - price;

      // Deduct from buyer wallet
      await client.query(
        `UPDATE user_wallets 
         SET balance = $1, total_spent = total_spent + $2, updated_at = NOW()
         WHERE user_id = $3`,
        [newBalance, price, userId]
      );

      // Record buyer transaction
      const buyerTx = await client.query(
        `INSERT INTO wallet_transactions 
         (user_id, type, amount, balance_before, balance_after, description, reference_type, reference_id)
         VALUES ($1, 'purchase', $2, $3, $4, $5, 'bot_purchase', $6)
         RETURNING id`,
        [userId, -price, currentBalance, newBalance, `Purchased bot: ${item.name}`, botId]
      );

      // Get or create seller wallet
      let sellerWallet = await client.query(
        'SELECT * FROM seller_wallets WHERE user_id = $1',
        [item.seller_id]
      );

      if (sellerWallet.rows.length === 0) {
        await client.query(
          `INSERT INTO seller_wallets (user_id, balance, pending_balance, total_earned)
           VALUES ($1, 0, 0, 0)`,
          [item.seller_id]
        );
        sellerWallet = await client.query(
          'SELECT * FROM seller_wallets WHERE user_id = $1',
          [item.seller_id]
        );
      }

      // Credit seller pending balance (7-day hold)
      await client.query(
        `UPDATE seller_wallets 
         SET pending_balance = pending_balance + $1, 
             total_earned = total_earned + $1,
             updated_at = NOW()
         WHERE user_id = $2`,
        [sellerEarnings, item.seller_id]
      );

      // Record seller transaction
      await client.query(
        `INSERT INTO seller_transactions 
         (user_id, type, amount, description, status)
         VALUES ($1, 'sale', $2, $3, 'completed')`,
        [item.seller_id, sellerEarnings, `Sale: ${item.name} (Commission: $${platformCommission.toFixed(2)})`]
      );

      // Record purchase
      const purchase = await client.query(
        `INSERT INTO marketplace_purchases 
         (buyer_id, seller_id, item_type, item_id, item_name, price, 
          platform_commission, seller_earnings, commission_rate, wallet_transaction_id)
         VALUES ($1, $2, 'bot', $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [userId, item.seller_id, botId, item.name, price, 
         platformCommission, sellerEarnings, COMMISSION_RATE, buyerTx.rows[0].id]
      );

      // Record platform earnings
      await client.query(
        `INSERT INTO platform_earnings (source_type, source_id, amount, description)
         VALUES ('marketplace_commission', $1, $2, $3)`,
        [purchase.rows[0].id, platformCommission, `Commission from bot sale: ${item.name}`]
      );

      // Also record in marketplace_bot_purchases for compatibility
      await client.query(
        `INSERT INTO marketplace_bot_purchases 
         (bot_id, buyer_id, price, payment_status, access_granted)
         VALUES ($1, $2, $3, 'completed', TRUE)
         ON CONFLICT DO NOTHING`,
        [botId, userId, price]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Purchase successful!',
        purchase: purchase.rows[0],
        new_balance: newBalance,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Purchase bot error:', error);
    res.status(500).json({ error: 'Failed to complete purchase' });
  }
});

// Purchase a product
router.post('/purchase/product/:productId', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    // Get product details
    const product = await pool.query(
      `SELECT p.*, u.id as seller_id, u.email as seller_email
       FROM marketplace_products p
       JOIN users u ON p.seller_id = u.id
       WHERE p.id = $1 AND p.status = 'approved'`,
      [productId]
    );

    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found or not available' });
    }

    const item = product.rows[0];
    const price = parseFloat(item.price);

    // Check if user is the seller
    if (item.seller_id === userId) {
      return res.status(400).json({ error: 'You cannot purchase your own product' });
    }

    // Check if already purchased
    const existingPurchase = await pool.query(
      `SELECT id FROM marketplace_purchases 
       WHERE buyer_id = $1 AND item_type = 'product' AND item_id = $2 AND status = 'completed'`,
      [userId, productId]
    );

    if (existingPurchase.rows.length > 0) {
      return res.status(400).json({ error: 'You already own this product' });
    }

    // Get user wallet
    const wallet = await pool.query(
      'SELECT * FROM user_wallets WHERE user_id = $1',
      [userId]
    );

    if (wallet.rows.length === 0 || parseFloat(wallet.rows[0].balance) < price) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        required: price,
        current: wallet.rows.length > 0 ? parseFloat(wallet.rows[0].balance) : 0,
      });
    }

    if (wallet.rows[0].is_frozen) {
      return res.status(400).json({ error: 'Your wallet is frozen. Contact support.' });
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Calculate commissions: 20% platform, 80% seller
      const platformCommission = price * (COMMISSION_RATE / 100);
      const sellerEarnings = price - platformCommission;

      const currentBalance = parseFloat(wallet.rows[0].balance);
      const newBalance = currentBalance - price;

      // Deduct from buyer wallet
      await client.query(
        `UPDATE user_wallets 
         SET balance = $1, total_spent = total_spent + $2, updated_at = NOW()
         WHERE user_id = $3`,
        [newBalance, price, userId]
      );

      // Record buyer transaction
      const buyerTx = await client.query(
        `INSERT INTO wallet_transactions 
         (user_id, type, amount, balance_before, balance_after, description, reference_type, reference_id)
         VALUES ($1, 'purchase', $2, $3, $4, $5, 'product_purchase', $6)
         RETURNING id`,
        [userId, -price, currentBalance, newBalance, `Purchased product: ${item.name}`, productId]
      );

      // Get or create seller wallet
      let sellerWallet = await pool.query(
        'SELECT * FROM seller_wallets WHERE user_id = $1',
        [item.seller_id]
      );

      if (sellerWallet.rows.length === 0) {
        await client.query(
          `INSERT INTO seller_wallets (user_id, balance, pending_balance, total_earned)
           VALUES ($1, 0, 0, 0)`,
          [item.seller_id]
        );
      }

      // Credit seller pending balance
      await client.query(
        `UPDATE seller_wallets 
         SET pending_balance = pending_balance + $1, 
             total_earned = total_earned + $1,
             updated_at = NOW()
         WHERE user_id = $2`,
        [sellerEarnings, item.seller_id]
      );

      // Record seller transaction
      await client.query(
        `INSERT INTO seller_transactions 
         (user_id, type, amount, description, status)
         VALUES ($1, 'sale', $2, $3, 'completed')`,
        [item.seller_id, sellerEarnings, `Sale: ${item.name} (Commission: $${platformCommission.toFixed(2)})`]
      );

      // Record purchase
      const purchase = await client.query(
        `INSERT INTO marketplace_purchases 
         (buyer_id, seller_id, item_type, item_id, item_name, price, 
          platform_commission, seller_earnings, commission_rate, wallet_transaction_id)
         VALUES ($1, $2, 'product', $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [userId, item.seller_id, productId, item.name, price, 
         platformCommission, sellerEarnings, COMMISSION_RATE, buyerTx.rows[0].id]
      );

      // Record platform earnings
      await client.query(
        `INSERT INTO platform_earnings (source_type, source_id, amount, description)
         VALUES ('marketplace_commission', $1, $2, $3)`,
        [purchase.rows[0].id, platformCommission, `Commission from product sale: ${item.name}`]
      );

      // Also record in marketplace_product_purchases for compatibility
      await client.query(
        `INSERT INTO marketplace_product_purchases 
         (product_id, buyer_id, price, payment_status, access_granted)
         VALUES ($1, $2, $3, 'completed', TRUE)
         ON CONFLICT DO NOTHING`,
        [productId, userId, price]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: 'Purchase successful!',
        purchase: purchase.rows[0],
        new_balance: newBalance,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Purchase product error:', error);
    res.status(500).json({ error: 'Failed to complete purchase' });
  }
});

// Get user's purchases
router.get('/purchases', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.query;

    let query = `
      SELECT mp.*, 
             CASE 
               WHEN mp.item_type = 'bot' THEN (SELECT name FROM marketplace_bots WHERE id = mp.item_id)
               WHEN mp.item_type = 'product' THEN (SELECT name FROM marketplace_products WHERE id = mp.item_id)
             END as current_name
      FROM marketplace_purchases mp
      WHERE mp.buyer_id = $1
    `;
    const params = [userId];

    if (type) {
      query += ` AND mp.item_type = $2`;
      params.push(type);
    }

    query += ` ORDER BY mp.created_at DESC`;

    const purchases = await pool.query(query, params);

    res.json({
      success: true,
      purchases: purchases.rows,
    });
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({ error: 'Failed to get purchases' });
  }
});

// Check if user owns an item
router.get('/owns/:itemType/:itemId', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { itemType, itemId } = req.params;

    const purchase = await pool.query(
      `SELECT id FROM marketplace_purchases 
       WHERE buyer_id = $1 AND item_type = $2 AND item_id = $3 AND status = 'completed'`,
      [userId, itemType, itemId]
    );

    res.json({
      success: true,
      owns: purchase.rows.length > 0,
    });
  } catch (error) {
    console.error('Check ownership error:', error);
    res.status(500).json({ error: 'Failed to check ownership' });
  }
});

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

// Admin: Get pending deposit requests
router.get('/admin/deposits/pending', authenticate, async (req, res) => {
  try {
    const adminCheck = await pool.query(
      'SELECT is_admin FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const deposits = await pool.query(
      `SELECT dr.*, u.email, u.username, u.name
       FROM wallet_deposit_requests dr
       JOIN users u ON dr.user_id = u.id
       WHERE dr.status = 'pending'
       ORDER BY dr.created_at ASC`
    );

    res.json({
      success: true,
      deposits: deposits.rows,
    });
  } catch (error) {
    console.error('Get pending deposits error:', error);
    res.status(500).json({ error: 'Failed to get pending deposits' });
  }
});

// Admin: Approve deposit
router.post('/admin/deposits/:id/approve', authenticate, async (req, res) => {
  try {
    const adminCheck = await pool.query(
      'SELECT is_admin FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { admin_notes } = req.body;

    // Get deposit request
    const deposit = await pool.query(
      'SELECT * FROM wallet_deposit_requests WHERE id = $1 AND status = $2',
      [id, 'pending']
    );

    if (deposit.rows.length === 0) {
      return res.status(404).json({ error: 'Deposit request not found or already processed' });
    }

    const depositData = deposit.rows[0];
    const userId = depositData.user_id;
    const amount = parseFloat(depositData.amount);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get or create user wallet
      let wallet = await client.query(
        'SELECT * FROM user_wallets WHERE user_id = $1',
        [userId]
      );

      if (wallet.rows.length === 0) {
        wallet = await client.query(
          `INSERT INTO user_wallets (user_id, balance, total_deposited)
           VALUES ($1, 0, 0)
           RETURNING *`,
          [userId]
        );
      }

      const currentBalance = parseFloat(wallet.rows[0].balance);
      const newBalance = currentBalance + amount;

      // Credit wallet
      await client.query(
        `UPDATE user_wallets 
         SET balance = $1, total_deposited = total_deposited + $2, updated_at = NOW()
         WHERE user_id = $3`,
        [newBalance, amount, userId]
      );

      // Record transaction
      await client.query(
        `INSERT INTO wallet_transactions 
         (user_id, type, amount, balance_before, balance_after, description, reference_type, reference_id)
         VALUES ($1, 'deposit', $2, $3, $4, $5, 'deposit_request', $6)`,
        [userId, amount, currentBalance, newBalance, 
         `Deposit via ${depositData.payment_method}`, id]
      );

      // Update deposit status
      await client.query(
        `UPDATE wallet_deposit_requests 
         SET status = 'approved', admin_notes = $1, reviewed_by = $2, reviewed_at = NOW()
         WHERE id = $3`,
        [admin_notes, req.user.id, id]
      );

      await client.query('COMMIT');

      res.json({
        success: true,
        message: `Deposit of $${amount} approved and credited to user's wallet`,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Approve deposit error:', error);
    res.status(500).json({ error: 'Failed to approve deposit' });
  }
});

// Admin: Reject deposit
router.post('/admin/deposits/:id/reject', authenticate, async (req, res) => {
  try {
    const adminCheck = await pool.query(
      'SELECT is_admin FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { admin_notes } = req.body;

    const result = await pool.query(
      `UPDATE wallet_deposit_requests 
       SET status = 'rejected', admin_notes = $1, reviewed_by = $2, reviewed_at = NOW()
       WHERE id = $3 AND status = 'pending'
       RETURNING *`,
      [admin_notes || 'Payment not verified', req.user.id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Deposit request not found or already processed' });
    }

    res.json({
      success: true,
      message: 'Deposit rejected',
    });
  } catch (error) {
    console.error('Reject deposit error:', error);
    res.status(500).json({ error: 'Failed to reject deposit' });
  }
});

// Admin: Get platform earnings summary
router.get('/admin/earnings', authenticate, async (req, res) => {
  try {
    const adminCheck = await pool.query(
      'SELECT is_admin FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Total earnings by type
    const earningsByType = await pool.query(`
      SELECT source_type, 
             SUM(amount) as total,
             COUNT(*) as count
      FROM platform_earnings
      GROUP BY source_type
    `);

    // Today's earnings
    const todayEarnings = await pool.query(`
      SELECT SUM(amount) as total
      FROM platform_earnings
      WHERE DATE(created_at) = CURRENT_DATE
    `);

    // This month's earnings
    const monthEarnings = await pool.query(`
      SELECT SUM(amount) as total
      FROM platform_earnings
      WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', CURRENT_DATE)
    `);

    // Total all time
    const totalEarnings = await pool.query(`
      SELECT SUM(amount) as total FROM platform_earnings
    `);

    // Recent earnings
    const recentEarnings = await pool.query(`
      SELECT * FROM platform_earnings
      ORDER BY created_at DESC
      LIMIT 20
    `);

    res.json({
      success: true,
      summary: {
        today: parseFloat(todayEarnings.rows[0].total) || 0,
        this_month: parseFloat(monthEarnings.rows[0].total) || 0,
        all_time: parseFloat(totalEarnings.rows[0].total) || 0,
        by_type: earningsByType.rows,
      },
      recent: recentEarnings.rows,
    });
  } catch (error) {
    console.error('Get earnings error:', error);
    res.status(500).json({ error: 'Failed to get earnings' });
  }
});

// Admin: Update payment account
router.put('/admin/payment-accounts/:id', authenticate, async (req, res) => {
  try {
    const adminCheck = await pool.query(
      'SELECT is_admin FROM users WHERE id = $1',
      [req.user.id]
    );

    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { account_name, account_number, crypto_address, crypto_network, instructions, is_active } = req.body;

    const result = await pool.query(
      `UPDATE platform_payment_accounts
       SET account_name = COALESCE($1, account_name),
           account_number = COALESCE($2, account_number),
           crypto_address = COALESCE($3, crypto_address),
           crypto_network = COALESCE($4, crypto_network),
           instructions = COALESCE($5, instructions),
           is_active = COALESCE($6, is_active),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [account_name, account_number, crypto_address, crypto_network, instructions, is_active, id]
    );

    res.json({
      success: true,
      account: result.rows[0],
    });
  } catch (error) {
    console.error('Update payment account error:', error);
    res.status(500).json({ error: 'Failed to update payment account' });
  }
});

// ============================================================================
// SELLER WALLET ENDPOINTS
// ============================================================================

// Get seller wallet balance
router.get('/seller/balance', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const client = await pool.connect();

    try {
      let wallet = await client.query(
        'SELECT * FROM seller_wallets WHERE user_id = $1',
        [userId]
      );

      if (wallet.rows.length === 0) {
        wallet = await client.query(
          `INSERT INTO seller_wallets (user_id, balance, pending_balance, total_earned, total_withdrawn)
           VALUES ($1, 0, 0, 0, 0) RETURNING *`,
          [userId]
        );
      }

      const pendingWithdrawals = await client.query(
        `SELECT COALESCE(SUM(amount), 0) as total FROM wallet_withdrawal_requests 
         WHERE user_id = $1 AND wallet_type = 'seller' AND status IN ('pending', 'processing')`,
        [userId]
      );

      const recentSales = await client.query(
        `SELECT * FROM marketplace_purchases WHERE seller_id = $1 ORDER BY created_at DESC LIMIT 10`,
        [userId]
      );

      res.json({
        success: true,
        wallet: {
          balance: parseFloat(wallet.rows[0].balance),
          pending_balance: parseFloat(wallet.rows[0].pending_balance || 0),
          total_earned: parseFloat(wallet.rows[0].total_earned),
          total_withdrawn: parseFloat(wallet.rows[0].total_withdrawn || 0),
          is_frozen: wallet.rows[0].is_frozen,
          frozen_reason: wallet.rows[0].frozen_reason,
          pending_withdrawals: parseFloat(pendingWithdrawals.rows[0].total),
        },
        recent_sales: recentSales.rows,
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get seller wallet error:', error);
    res.status(500).json({ error: 'Failed to get seller wallet' });
  }
});

// ============================================================================
// WITHDRAWAL ENDPOINTS
// ============================================================================

// Get withdrawal settings
router.get('/withdrawal/settings', authenticate, async (req, res) => {
  try {
    const settings = await pool.query('SELECT setting_key, setting_value FROM withdrawal_settings');
    const settingsObj = {};
    settings.rows.forEach(s => { settingsObj[s.setting_key] = s.setting_value; });
    res.json({ success: true, settings: settingsObj });
  } catch (error) {
    console.error('Get withdrawal settings error:', error);
    // Return defaults if table doesn't exist
    res.json({
      success: true,
      settings: {
        min_withdrawal_user: '10',
        min_withdrawal_seller: '20',
        withdrawal_fee_percent: '3',
        withdrawal_fee_fixed: '0',
        processing_time_hours: '24',
        instant_withdrawal_enabled: 'true',
      }
    });
  }
});

// Request withdrawal
router.post('/withdrawal/request', authenticate, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id;
    const { amount, payment_method, payment_details, wallet_type = 'user' } = req.body;

    const minWithdrawal = wallet_type === 'seller' ? 20 : 10;
    const feePercent = 3;
    const feeFixed = 0;

    if (!amount || amount < minWithdrawal) {
      return res.status(400).json({ error: `Minimum withdrawal is $${minWithdrawal}` });
    }

    // Validate payment method - M-Pesa, Airtel Money, USDT, and BTC allowed
    const validWithdrawMethods = ['mpesa', 'airtel_money', 'usdt', 'btc'];
    if (!payment_method || !validWithdrawMethods.includes(payment_method)) {
      return res.status(400).json({ error: 'Invalid payment method. Only M-Pesa, Airtel Money, USDT, and BTC are accepted.' });
    }

    if (!payment_details) {
      return res.status(400).json({ error: 'Payment details are required' });
    }

    // Validate payment details based on method
    if (payment_method === 'mpesa' && !payment_details.phone_number) {
      return res.status(400).json({ error: 'M-Pesa phone number is required' });
    }
    if (payment_method === 'airtel_money' && !payment_details.phone_number) {
      return res.status(400).json({ error: 'Airtel Money phone number is required' });
    }
    if ((payment_method === 'usdt' || payment_method === 'btc') && !payment_details.wallet_address) {
      return res.status(400).json({ error: 'Wallet address is required' });
    }

    await client.query('BEGIN');

    const walletTable = wallet_type === 'seller' ? 'seller_wallets' : 'user_wallets';
    const wallet = await client.query(`SELECT * FROM ${walletTable} WHERE user_id = $1 FOR UPDATE`, [userId]);

    if (wallet.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Wallet not found' });
    }

    if (wallet.rows[0].is_frozen) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Your wallet is frozen. Contact support.' });
    }

    const currentBalance = parseFloat(wallet.rows[0].balance);
    if (currentBalance < amount) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient balance', available: currentBalance });
    }

    const withdrawalFee = Math.max((amount * feePercent / 100) + feeFixed, feeFixed);
    const netAmount = amount - withdrawalFee;
    const newBalance = currentBalance - amount;

    // Deduct from wallet
    await client.query(
      `UPDATE ${walletTable} SET balance = $1, updated_at = NOW() WHERE user_id = $2`,
      [newBalance, userId]
    );

    // Record hold transaction
    await client.query(
      `INSERT INTO wallet_transactions (user_id, wallet_type, type, amount, balance_before, balance_after, description, reference_type)
       VALUES ($1, $2, 'withdrawal_hold', $3, $4, $5, $6, 'withdrawal_request')`,
      [userId, wallet_type, -amount, currentBalance, newBalance, `Withdrawal hold - $${amount} (Fee: $${withdrawalFee.toFixed(2)})`]
    );

    // Create withdrawal request
    const withdrawal = await client.query(
      `INSERT INTO wallet_withdrawal_requests 
       (user_id, wallet_type, amount, withdrawal_fee, net_amount, payment_method, payment_details, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending') RETURNING *`,
      [userId, wallet_type, amount, withdrawalFee, netAmount, payment_method, JSON.stringify(payment_details)]
    );

    // Record platform fee
    await client.query(
      `INSERT INTO platform_earnings (source_type, source_id, amount, description)
       VALUES ('withdrawal_fee', $1, $2, $3)`,
      [withdrawal.rows[0].id, withdrawalFee, `Withdrawal fee from ${wallet_type} wallet`]
    );

    await client.query('COMMIT');

    res.json({
      success: true,
      message: 'Withdrawal request submitted. Processing time: 24-48 hours.',
      withdrawal: withdrawal.rows[0],
      new_balance: newBalance,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Withdrawal request error:', error);
    res.status(500).json({ error: 'Failed to process withdrawal request' });
  } finally {
    client.release();
  }
});

// Get withdrawal history
router.get('/withdrawal/history', authenticate, async (req, res) => {
  try {
    const { wallet_type = 'user' } = req.query;
    const withdrawals = await pool.query(
      `SELECT * FROM wallet_withdrawal_requests 
       WHERE user_id = $1 AND wallet_type = $2 
       ORDER BY created_at DESC LIMIT 50`,
      [req.user.id, wallet_type]
    );
    res.json({ success: true, withdrawals: withdrawals.rows });
  } catch (error) {
    console.error('Get withdrawal history error:', error);
    res.status(500).json({ error: 'Failed to get withdrawal history' });
  }
});

// Cancel pending withdrawal
router.post('/withdrawal/:id/cancel', authenticate, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await client.query('BEGIN');

    const withdrawal = await client.query(
      `SELECT * FROM wallet_withdrawal_requests WHERE id = $1 AND user_id = $2 AND status = 'pending' FOR UPDATE`,
      [id, userId]
    );

    if (withdrawal.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Withdrawal not found or cannot be cancelled' });
    }

    const w = withdrawal.rows[0];
    const walletTable = w.wallet_type === 'seller' ? 'seller_wallets' : 'user_wallets';

    const wallet = await client.query(`SELECT balance FROM ${walletTable} WHERE user_id = $1 FOR UPDATE`, [userId]);
    const currentBalance = parseFloat(wallet.rows[0].balance);
    const newBalance = currentBalance + parseFloat(w.amount);

    await client.query(`UPDATE ${walletTable} SET balance = $1, updated_at = NOW() WHERE user_id = $2`, [newBalance, userId]);
    await client.query(`UPDATE wallet_withdrawal_requests SET status = 'cancelled' WHERE id = $1`, [id]);

    await client.query(
      `INSERT INTO wallet_transactions (user_id, wallet_type, type, amount, balance_before, balance_after, description, reference_type, reference_id)
       VALUES ($1, $2, 'withdrawal_cancelled', $3, $4, $5, 'Withdrawal cancelled - funds returned', 'withdrawal_request', $6)`,
      [userId, w.wallet_type, parseFloat(w.amount), currentBalance, newBalance, id]
    );

    await client.query(`DELETE FROM platform_earnings WHERE source_type = 'withdrawal_fee' AND source_id = $1`, [id]);

    await client.query('COMMIT');
    res.json({ success: true, message: 'Withdrawal cancelled and funds returned', new_balance: newBalance });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Cancel withdrawal error:', error);
    res.status(500).json({ error: 'Failed to cancel withdrawal' });
  } finally {
    client.release();
  }
});

// ============================================================================
// ADMIN WALLET CONTROL ENDPOINTS
// ============================================================================

// Admin: Get all wallets overview
router.get('/admin/wallets', authenticate, async (req, res) => {
  try {
    const adminCheck = await pool.query('SELECT is_admin FROM users WHERE id = $1', [req.user.id]);
    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { page = 1, limit = 50, search, frozen_only } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT uw.*, u.email, u.username, u.name, 
             COALESCE(sw.balance, 0) as seller_balance,
             COALESCE(sw.total_earned, 0) as seller_total_earned,
             COALESCE(sw.is_frozen, false) as seller_frozen
      FROM user_wallets uw
      JOIN users u ON uw.user_id = u.id
      LEFT JOIN seller_wallets sw ON uw.user_id = sw.user_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (u.email ILIKE $${params.length} OR u.username ILIKE $${params.length} OR u.name ILIKE $${params.length})`;
    }

    if (frozen_only === 'true') {
      query += ` AND (uw.is_frozen = TRUE OR sw.is_frozen = TRUE)`;
    }

    query += ` ORDER BY uw.balance DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const wallets = await pool.query(query, params);

    const totals = await pool.query(`
      SELECT 
        (SELECT COALESCE(SUM(balance), 0) FROM user_wallets) as total_user_balance,
        (SELECT COALESCE(SUM(balance), 0) FROM seller_wallets) as total_seller_balance,
        (SELECT COUNT(*) FROM user_wallets WHERE is_frozen = TRUE) as frozen_user_count,
        (SELECT COUNT(*) FROM seller_wallets WHERE is_frozen = TRUE) as frozen_seller_count,
        (SELECT COUNT(*) FROM user_wallets) as total_user_wallets,
        (SELECT COUNT(*) FROM seller_wallets) as total_seller_wallets
    `);

    let platformWallets = [];
    try {
      const pw = await pool.query('SELECT * FROM platform_wallet');
      platformWallets = pw.rows;
    } catch (e) {
      // Table may not exist yet
    }

    res.json({
      success: true,
      wallets: wallets.rows,
      platform_wallets: platformWallets,
      totals: totals.rows[0],
    });
  } catch (error) {
    console.error('Admin get wallets error:', error);
    res.status(500).json({ error: 'Failed to get wallets' });
  }
});

// Admin: Get single user wallet details
router.get('/admin/wallets/:userId', authenticate, async (req, res) => {
  try {
    const adminCheck = await pool.query('SELECT is_admin FROM users WHERE id = $1', [req.user.id]);
    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.params;

    const [user, userWallet, sellerWallet, transactions, deposits, withdrawals] = await Promise.all([
      pool.query('SELECT id, email, username, name FROM users WHERE id = $1', [userId]),
      pool.query('SELECT * FROM user_wallets WHERE user_id = $1', [userId]),
      pool.query('SELECT * FROM seller_wallets WHERE user_id = $1', [userId]),
      pool.query('SELECT * FROM wallet_transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50', [userId]),
      pool.query('SELECT * FROM wallet_deposit_requests WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20', [userId]),
      pool.query('SELECT * FROM wallet_withdrawal_requests WHERE user_id = $1 ORDER BY created_at DESC LIMIT 20', [userId]),
    ]);

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: user.rows[0],
      user_wallet: userWallet.rows[0] || null,
      seller_wallet: sellerWallet.rows[0] || null,
      transactions: transactions.rows,
      deposits: deposits.rows,
      withdrawals: withdrawals.rows,
    });
  } catch (error) {
    console.error('Admin get wallet details error:', error);
    res.status(500).json({ error: 'Failed to get wallet details' });
  }
});

// Admin: Instant deposit (directly credit wallet)
router.post('/admin/wallets/:userId/deposit', authenticate, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const adminCheck = await pool.query('SELECT is_admin FROM users WHERE id = $1', [req.user.id]);
    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.params;
    const { amount, wallet_type = 'user', reason } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'Reason is required for audit trail' });
    }

    await client.query('BEGIN');

    const walletTable = wallet_type === 'seller' ? 'seller_wallets' : 'user_wallets';
    
    // Ensure wallet exists
    let wallet = await client.query(`SELECT * FROM ${walletTable} WHERE user_id = $1`, [userId]);
    
    if (wallet.rows.length === 0) {
      if (wallet_type === 'user') {
        await client.query(
          `INSERT INTO user_wallets (user_id, balance, total_deposited) VALUES ($1, 0, 0)`,
          [userId]
        );
      } else {
        await client.query(
          `INSERT INTO seller_wallets (user_id, balance, pending_balance, total_earned, total_withdrawn) VALUES ($1, 0, 0, 0, 0)`,
          [userId]
        );
      }
      wallet = await client.query(`SELECT * FROM ${walletTable} WHERE user_id = $1`, [userId]);
    }

    wallet = await client.query(`SELECT * FROM ${walletTable} WHERE user_id = $1 FOR UPDATE`, [userId]);
    const balanceBefore = parseFloat(wallet.rows[0].balance);
    const balanceAfter = balanceBefore + parseFloat(amount);

    await client.query(
      `UPDATE ${walletTable} SET balance = $1, updated_at = NOW() WHERE user_id = $2`,
      [balanceAfter, userId]
    );

    await client.query(
      `INSERT INTO wallet_transactions (user_id, wallet_type, type, amount, balance_before, balance_after, description, reference_type, created_by)
       VALUES ($1, $2, 'admin_credit', $3, $4, $5, $6, 'admin_adjustment', $7)`,
      [userId, wallet_type, parseFloat(amount), balanceBefore, balanceAfter, `Admin credit: ${reason}`, req.user.id]
    );

    await client.query(
      `INSERT INTO admin_wallet_adjustments (admin_id, target_user_id, wallet_type, action, amount, balance_before, balance_after, reason)
       VALUES ($1, $2, $3, 'credit', $4, $5, $6, $7)`,
      [req.user.id, userId, wallet_type, amount, balanceBefore, balanceAfter, reason]
    );

    await client.query('COMMIT');

    res.json({ success: true, message: `$${amount} credited to ${wallet_type} wallet`, new_balance: balanceAfter });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Admin deposit error:', error);
    res.status(500).json({ error: 'Failed to credit wallet' });
  } finally {
    client.release();
  }
});

// Admin: Deduct from wallet
router.post('/admin/wallets/:userId/deduct', authenticate, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const adminCheck = await pool.query('SELECT is_admin FROM users WHERE id = $1', [req.user.id]);
    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.params;
    const { amount, wallet_type = 'user', reason } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!reason) {
      return res.status(400).json({ error: 'Reason is required for audit trail' });
    }

    await client.query('BEGIN');

    const walletTable = wallet_type === 'seller' ? 'seller_wallets' : 'user_wallets';
    const wallet = await client.query(`SELECT * FROM ${walletTable} WHERE user_id = $1 FOR UPDATE`, [userId]);

    if (wallet.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Wallet not found' });
    }

    const balanceBefore = parseFloat(wallet.rows[0].balance);
    const balanceAfter = balanceBefore - parseFloat(amount);

    if (balanceAfter < 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Insufficient balance', current: balanceBefore });
    }

    await client.query(`UPDATE ${walletTable} SET balance = $1, updated_at = NOW() WHERE user_id = $2`, [balanceAfter, userId]);

    await client.query(
      `INSERT INTO wallet_transactions (user_id, wallet_type, type, amount, balance_before, balance_after, description, reference_type, created_by)
       VALUES ($1, $2, 'admin_debit', $3, $4, $5, $6, 'admin_adjustment', $7)`,
      [userId, wallet_type, -parseFloat(amount), balanceBefore, balanceAfter, `Admin debit: ${reason}`, req.user.id]
    );

    await client.query(
      `INSERT INTO admin_wallet_adjustments (admin_id, target_user_id, wallet_type, action, amount, balance_before, balance_after, reason)
       VALUES ($1, $2, $3, 'debit', $4, $5, $6, $7)`,
      [req.user.id, userId, wallet_type, amount, balanceBefore, balanceAfter, reason]
    );

    await client.query('COMMIT');

    res.json({ success: true, message: `$${amount} deducted from ${wallet_type} wallet`, new_balance: balanceAfter });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Admin deduct error:', error);
    res.status(500).json({ error: 'Failed to deduct from wallet' });
  } finally {
    client.release();
  }
});

// Admin: Freeze wallet
router.post('/admin/wallets/:userId/freeze', authenticate, async (req, res) => {
  try {
    const adminCheck = await pool.query('SELECT is_admin FROM users WHERE id = $1', [req.user.id]);
    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.params;
    const { wallet_type = 'user', reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Reason is required' });
    }

    const walletTable = wallet_type === 'seller' ? 'seller_wallets' : 'user_wallets';

    await pool.query(
      `UPDATE ${walletTable} SET is_frozen = TRUE, frozen_reason = $1, frozen_at = NOW(), frozen_by = $2 WHERE user_id = $3`,
      [reason, req.user.id, userId]
    );

    await pool.query(
      `INSERT INTO admin_wallet_adjustments (admin_id, target_user_id, wallet_type, action, reason)
       VALUES ($1, $2, $3, 'freeze', $4)`,
      [req.user.id, userId, wallet_type, reason]
    );

    res.json({ success: true, message: `${wallet_type} wallet frozen` });
  } catch (error) {
    console.error('Admin freeze error:', error);
    res.status(500).json({ error: 'Failed to freeze wallet' });
  }
});

// Admin: Unfreeze wallet
router.post('/admin/wallets/:userId/unfreeze', authenticate, async (req, res) => {
  try {
    const adminCheck = await pool.query('SELECT is_admin FROM users WHERE id = $1', [req.user.id]);
    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.params;
    const { wallet_type = 'user', reason } = req.body;

    const walletTable = wallet_type === 'seller' ? 'seller_wallets' : 'user_wallets';

    await pool.query(
      `UPDATE ${walletTable} SET is_frozen = FALSE, frozen_reason = NULL, frozen_at = NULL, frozen_by = NULL WHERE user_id = $1`,
      [userId]
    );

    await pool.query(
      `INSERT INTO admin_wallet_adjustments (admin_id, target_user_id, wallet_type, action, reason)
       VALUES ($1, $2, $3, 'unfreeze', $4)`,
      [req.user.id, userId, wallet_type, reason || 'Wallet unfrozen by admin']
    );

    res.json({ success: true, message: `${wallet_type} wallet unfrozen` });
  } catch (error) {
    console.error('Admin unfreeze error:', error);
    res.status(500).json({ error: 'Failed to unfreeze wallet' });
  }
});

// Admin: Get pending withdrawals
router.get('/admin/withdrawals/pending', authenticate, async (req, res) => {
  try {
    const adminCheck = await pool.query('SELECT is_admin FROM users WHERE id = $1', [req.user.id]);
    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const withdrawals = await pool.query(
      `SELECT w.*, u.email, u.username, u.name
       FROM wallet_withdrawal_requests w
       JOIN users u ON w.user_id = u.id
       WHERE w.status IN ('pending', 'processing')
       ORDER BY w.created_at ASC`
    );

    res.json({ success: true, withdrawals: withdrawals.rows });
  } catch (error) {
    console.error('Admin get withdrawals error:', error);
    res.status(500).json({ error: 'Failed to get withdrawals' });
  }
});

// Admin: Complete withdrawal (instant payout)
router.post('/admin/withdrawals/:id/complete', authenticate, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const adminCheck = await pool.query('SELECT is_admin FROM users WHERE id = $1', [req.user.id]);
    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { transaction_reference, admin_notes } = req.body;

    await client.query('BEGIN');

    const withdrawal = await client.query(
      `SELECT * FROM wallet_withdrawal_requests WHERE id = $1 AND status IN ('pending', 'processing') FOR UPDATE`,
      [id]
    );

    if (withdrawal.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Withdrawal not found or already processed' });
    }

    const w = withdrawal.rows[0];
    const walletTable = w.wallet_type === 'seller' ? 'seller_wallets' : 'user_wallets';

    // Update total_withdrawn
    await client.query(
      `UPDATE ${walletTable} SET total_withdrawn = COALESCE(total_withdrawn, 0) + $1, updated_at = NOW() WHERE user_id = $2`,
      [w.net_amount, w.user_id]
    );

    // Mark as completed
    await client.query(
      `UPDATE wallet_withdrawal_requests SET status = 'completed', transaction_reference = $1, admin_notes = $2, reviewed_by = $3, reviewed_at = NOW(), completed_at = NOW() WHERE id = $4`,
      [transaction_reference, admin_notes, req.user.id, id]
    );

    // Record completion transaction
    await client.query(
      `INSERT INTO wallet_transactions (user_id, wallet_type, type, amount, description, reference_type, reference_id, created_by)
       VALUES ($1, $2, 'withdrawal_completed', $3, $4, 'withdrawal_request', $5, $6)`,
      [w.user_id, w.wallet_type, -parseFloat(w.net_amount), `Withdrawal completed: ${transaction_reference || 'N/A'}`, id, req.user.id]
    );

    await client.query('COMMIT');

    res.json({ success: true, message: 'Withdrawal completed successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Admin complete withdrawal error:', error);
    res.status(500).json({ error: 'Failed to complete withdrawal' });
  } finally {
    client.release();
  }
});

// Admin: Reject withdrawal (refund to wallet)
router.post('/admin/withdrawals/:id/reject', authenticate, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const adminCheck = await pool.query('SELECT is_admin FROM users WHERE id = $1', [req.user.id]);
    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { admin_notes } = req.body;

    if (!admin_notes) {
      return res.status(400).json({ error: 'Reason is required for rejection' });
    }

    await client.query('BEGIN');

    const withdrawal = await client.query(
      `SELECT * FROM wallet_withdrawal_requests WHERE id = $1 AND status IN ('pending', 'processing') FOR UPDATE`,
      [id]
    );

    if (withdrawal.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Withdrawal not found' });
    }

    const w = withdrawal.rows[0];
    const walletTable = w.wallet_type === 'seller' ? 'seller_wallets' : 'user_wallets';

    // Refund full amount (no fee)
    const wallet = await client.query(`SELECT balance FROM ${walletTable} WHERE user_id = $1 FOR UPDATE`, [w.user_id]);
    const balanceBefore = parseFloat(wallet.rows[0].balance);
    const balanceAfter = balanceBefore + parseFloat(w.amount);

    await client.query(`UPDATE ${walletTable} SET balance = $1, updated_at = NOW() WHERE user_id = $2`, [balanceAfter, w.user_id]);

    await client.query(
      `INSERT INTO wallet_transactions (user_id, wallet_type, type, amount, balance_before, balance_after, description, reference_type, reference_id, created_by)
       VALUES ($1, $2, 'withdrawal_rejected', $3, $4, $5, $6, 'withdrawal_request', $7, $8)`,
      [w.user_id, w.wallet_type, parseFloat(w.amount), balanceBefore, balanceAfter, `Withdrawal rejected: ${admin_notes}`, id, req.user.id]
    );

    await client.query(
      `UPDATE wallet_withdrawal_requests SET status = 'rejected', admin_notes = $1, reviewed_by = $2, reviewed_at = NOW() WHERE id = $3`,
      [admin_notes, req.user.id, id]
    );

    // Remove withdrawal fee from earnings
    await client.query(`DELETE FROM platform_earnings WHERE source_type = 'withdrawal_fee' AND source_id = $1`, [id]);

    await client.query('COMMIT');

    res.json({ success: true, message: 'Withdrawal rejected and funds returned to user' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Admin reject withdrawal error:', error);
    res.status(500).json({ error: 'Failed to reject withdrawal' });
  } finally {
    client.release();
  }
});

// Admin: Get adjustment history (audit log)
router.get('/admin/adjustments', authenticate, async (req, res) => {
  try {
    const adminCheck = await pool.query('SELECT is_admin FROM users WHERE id = $1', [req.user.id]);
    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const adjustments = await pool.query(
      `SELECT a.*, 
              u.email as target_email, u.username as target_username,
              admin.email as admin_email, admin.username as admin_username
       FROM admin_wallet_adjustments a
       LEFT JOIN users u ON a.target_user_id = u.id
       LEFT JOIN users admin ON a.admin_id = admin.id
       ORDER BY a.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM admin_wallet_adjustments');

    res.json({
      success: true,
      adjustments: adjustments.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit),
      },
    });
  } catch (error) {
    console.error('Admin get adjustments error:', error);
    res.status(500).json({ error: 'Failed to get adjustments' });
  }
});

export default router;
