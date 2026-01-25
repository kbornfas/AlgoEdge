import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireAdmin);

// ============================================================================
// MARKETPLACE STATS
// ============================================================================

// Get marketplace stats for admin dashboard
router.get('/stats', async (req, res) => {
  try {
    const stats = {};

    // Pending counts
    const pendingBots = await pool.query(
      "SELECT COUNT(*) FROM marketplace_bots WHERE status = 'pending'"
    );
    stats.pending_bots = parseInt(pendingBots.rows[0].count);

    const pendingProducts = await pool.query(
      "SELECT COUNT(*) FROM marketplace_products WHERE status = 'pending'"
    );
    stats.pending_products = parseInt(pendingProducts.rows[0].count);

    const pendingSignals = await pool.query(
      "SELECT COUNT(*) FROM signal_providers WHERE status = 'pending'"
    );
    stats.pending_signals = parseInt(pendingSignals.rows[0].count);

    // Total sellers
    const totalSellers = await pool.query(
      'SELECT COUNT(DISTINCT user_id) FROM seller_wallets'
    );
    stats.total_sellers = parseInt(totalSellers.rows[0].count);

    // Today's sales
    const today = new Date().toISOString().split('T')[0];
    const salesToday = await pool.query(
      `SELECT 
        COUNT(*) as count,
        COALESCE(SUM(price_paid), 0) as revenue,
        COALESCE(SUM(platform_commission), 0) as commission
      FROM (
        SELECT price_paid, platform_commission FROM marketplace_bot_purchases WHERE DATE(created_at) = $1
        UNION ALL
        SELECT price_paid, platform_commission FROM marketplace_product_purchases WHERE DATE(created_at) = $1
        UNION ALL
        SELECT price_paid, platform_commission FROM signal_subscriptions WHERE DATE(created_at) = $1
      ) as all_sales`,
      [today]
    );
    
    stats.total_sales_today = parseInt(salesToday.rows[0].count);
    stats.revenue_today = parseFloat(salesToday.rows[0].revenue);
    stats.commission_today = parseFloat(salesToday.rows[0].commission);

    res.json(stats);
  } catch (error) {
    console.error('Error fetching marketplace stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ============================================================================
// PENDING ITEMS
// ============================================================================

// Get pending items by type
router.get('/pending', async (req, res) => {
  try {
    const { type = 'bots' } = req.query;
    let items = [];

    if (type === 'bots') {
      const result = await pool.query(
        `SELECT 
          b.id, b.name, b.price, b.is_free, b.category, b.status, b.created_at, b.description,
          u.full_name as seller_name, u.email as seller_email
        FROM marketplace_bots b
        JOIN users u ON b.seller_id = u.id
        WHERE b.status = 'pending'
        ORDER BY b.created_at DESC`
      );
      items = result.rows.map(r => ({ ...r, type: 'bot' }));
    } else if (type === 'products') {
      const result = await pool.query(
        `SELECT 
          p.id, p.name, p.price, p.product_type as category, p.status, p.created_at, p.description,
          u.full_name as seller_name, u.email as seller_email,
          FALSE as is_free
        FROM marketplace_products p
        JOIN users u ON p.seller_id = u.id
        WHERE p.status = 'pending'
        ORDER BY p.created_at DESC`
      );
      items = result.rows.map(r => ({ ...r, type: 'product' }));
    } else if (type === 'signals') {
      const result = await pool.query(
        `SELECT 
          sp.id, sp.name, sp.trading_style as category, sp.status, sp.created_at, sp.description,
          u.full_name as seller_name, u.email as seller_email,
          (sp.pricing->>'monthly')::numeric as price,
          FALSE as is_free
        FROM signal_providers sp
        JOIN users u ON sp.user_id = u.id
        WHERE sp.status = 'pending'
        ORDER BY sp.created_at DESC`
      );
      items = result.rows.map(r => ({ ...r, type: 'signal' }));
    }

    res.json({ items });
  } catch (error) {
    console.error('Error fetching pending items:', error);
    res.status(500).json({ error: 'Failed to fetch pending items' });
  }
});

// ============================================================================
// BOT APPROVAL
// ============================================================================

// Approve bot WITH checkout link (REQUIRED)
router.post('/bots/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { checkout_url, checkout_provider, admin_notes, final_price } = req.body;

    // Checkout URL is REQUIRED for approval
    if (!checkout_url) {
      return res.status(400).json({ 
        error: 'Checkout URL is required to approve a listing. Please add a payment link (Stripe, Gumroad, PayPal, etc.)' 
      });
    }

    if (!checkout_provider) {
      return res.status(400).json({ 
        error: 'Please specify the checkout provider (stripe, gumroad, whop, paypal, other)' 
      });
    }

    const result = await pool.query(
      `UPDATE marketplace_bots 
       SET status = 'approved', 
           checkout_url = $2,
           checkout_provider = $3,
           admin_notes = $4,
           price = COALESCE($5, price),
           approved_at = CURRENT_TIMESTAMP,
           approved_by = $6,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, checkout_url, checkout_provider, admin_notes, final_price, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    // Update listing submission status
    await pool.query(
      `UPDATE listing_submissions 
       SET status = 'approved', 
           admin_notes = $2,
           reviewed_by = $3,
           reviewed_at = CURRENT_TIMESTAMP
       WHERE listing_type = 'bot' AND listing_id = $1`,
      [id, admin_notes, req.user.id]
    );

    // TODO: Send notification to seller

    res.json({ 
      message: 'Bot approved with checkout link', 
      bot: result.rows[0] 
    });
  } catch (error) {
    console.error('Error approving bot:', error);
    res.status(500).json({ error: 'Failed to approve bot' });
  }
});

// Reject bot
router.post('/bots/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const result = await pool.query(
      `UPDATE marketplace_bots 
       SET status = 'rejected', rejection_reason = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, reason]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    // TODO: Send notification to seller

    res.json({ message: 'Bot rejected', bot: result.rows[0] });
  } catch (error) {
    console.error('Error rejecting bot:', error);
    res.status(500).json({ error: 'Failed to reject bot' });
  }
});

// ============================================================================
// PRODUCT APPROVAL
// ============================================================================

// Approve product WITH checkout link (REQUIRED)
router.post('/products/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { checkout_url, checkout_provider, admin_notes, final_price } = req.body;

    // Checkout URL is REQUIRED for approval
    if (!checkout_url) {
      return res.status(400).json({ 
        error: 'Checkout URL is required to approve a listing. Please add a payment link (Stripe, Gumroad, PayPal, etc.)' 
      });
    }

    if (!checkout_provider) {
      return res.status(400).json({ 
        error: 'Please specify the checkout provider (stripe, gumroad, whop, paypal, other)' 
      });
    }

    const result = await pool.query(
      `UPDATE marketplace_products 
       SET status = 'approved',
           checkout_url = $2,
           checkout_provider = $3,
           admin_notes = $4,
           price = COALESCE($5, price),
           approved_at = CURRENT_TIMESTAMP,
           approved_by = $6,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, checkout_url, checkout_provider, admin_notes, final_price, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Update listing submission status
    await pool.query(
      `UPDATE listing_submissions 
       SET status = 'approved', 
           admin_notes = $2,
           reviewed_by = $3,
           reviewed_at = CURRENT_TIMESTAMP
       WHERE listing_type = 'product' AND listing_id = $1`,
      [id, admin_notes, req.user.id]
    );

    res.json({ 
      message: 'Product approved with checkout link', 
      product: result.rows[0] 
    });
  } catch (error) {
    console.error('Error approving product:', error);
    res.status(500).json({ error: 'Failed to approve product' });
  }
});

// Reject product
router.post('/products/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const result = await pool.query(
      `UPDATE marketplace_products 
       SET status = 'rejected', rejection_reason = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, reason]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product rejected', product: result.rows[0] });
  } catch (error) {
    console.error('Error rejecting product:', error);
    res.status(500).json({ error: 'Failed to reject product' });
  }
});

// ============================================================================
// SIGNAL PROVIDER APPROVAL
// ============================================================================

// Approve signal provider
router.post('/signals/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE signal_providers 
       SET status = 'approved', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Signal provider not found' });
    }

    res.json({ message: 'Signal provider approved', provider: result.rows[0] });
  } catch (error) {
    console.error('Error approving signal provider:', error);
    res.status(500).json({ error: 'Failed to approve signal provider' });
  }
});

// Reject signal provider
router.post('/signals/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const result = await pool.query(
      `UPDATE signal_providers 
       SET status = 'rejected', rejection_reason = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, reason]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Signal provider not found' });
    }

    res.json({ message: 'Signal provider rejected', provider: result.rows[0] });
  } catch (error) {
    console.error('Error rejecting signal provider:', error);
    res.status(500).json({ error: 'Failed to reject signal provider' });
  }
});

// ============================================================================
// SELLER MANAGEMENT
// ============================================================================

// Get all sellers
router.get('/sellers', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const result = await pool.query(
      `SELECT 
        sw.*,
        u.full_name, u.email,
        (SELECT COUNT(*) FROM marketplace_bots WHERE seller_id = u.id AND status = 'approved') as active_bots,
        (SELECT COUNT(*) FROM marketplace_products WHERE seller_id = u.id AND status = 'approved') as active_products
      FROM seller_wallets sw
      JOIN users u ON sw.user_id = u.id
      ORDER BY sw.total_earned DESC
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countResult = await pool.query('SELECT COUNT(*) FROM seller_wallets');

    res.json({
      sellers: result.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error fetching sellers:', error);
    res.status(500).json({ error: 'Failed to fetch sellers' });
  }
});

// ============================================================================
// PAYOUT MANAGEMENT
// ============================================================================

// Get pending payouts
router.get('/payouts', async (req, res) => {
  try {
    const { status = 'pending' } = req.query;

    const result = await pool.query(
      `SELECT 
        sp.*,
        u.full_name, u.email,
        sw.available_balance
      FROM seller_payouts sp
      JOIN users u ON sp.user_id = u.id
      JOIN seller_wallets sw ON sp.wallet_id = sw.id
      WHERE sp.status = $1
      ORDER BY sp.created_at ASC`,
      [status]
    );

    res.json({ payouts: result.rows });
  } catch (error) {
    console.error('Error fetching payouts:', error);
    res.status(500).json({ error: 'Failed to fetch payouts' });
  }
});

// Process payout
router.post('/payouts/:id/process', async (req, res) => {
  try {
    const { id } = req.params;
    const { transaction_hash } = req.body;
    const adminId = req.user.id;

    // Get payout details
    const payoutResult = await pool.query(
      'SELECT * FROM seller_payouts WHERE id = $1',
      [id]
    );

    if (payoutResult.rows.length === 0) {
      return res.status(404).json({ error: 'Payout not found' });
    }

    const payout = payoutResult.rows[0];

    if (payout.status !== 'pending') {
      return res.status(400).json({ error: 'Payout already processed' });
    }

    // Update payout status
    await pool.query(
      `UPDATE seller_payouts 
       SET status = 'completed', 
           processed_by = $2, 
           processed_at = CURRENT_TIMESTAMP,
           transaction_hash = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id, adminId, transaction_hash]
    );

    // Update seller wallet
    await pool.query(
      `UPDATE seller_wallets 
       SET available_balance = available_balance - $2,
           withdrawn_balance = withdrawn_balance + $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [payout.wallet_id, payout.amount]
    );

    // Record transaction
    await pool.query(
      `INSERT INTO seller_transactions (wallet_id, user_id, type, amount, description, status)
       VALUES ($1, $2, 'payout', $3, $4, 'completed')`,
      [payout.wallet_id, payout.user_id, -payout.amount, `Payout processed: ${payout.payout_method}`]
    );

    res.json({ message: 'Payout processed successfully' });
  } catch (error) {
    console.error('Error processing payout:', error);
    res.status(500).json({ error: 'Failed to process payout' });
  }
});

// Reject payout
router.post('/payouts/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    await pool.query(
      `UPDATE seller_payouts 
       SET status = 'rejected', 
           processed_by = $2, 
           processed_at = CURRENT_TIMESTAMP,
           rejection_reason = $3,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id, adminId, reason]
    );

    res.json({ message: 'Payout rejected' });
  } catch (error) {
    console.error('Error rejecting payout:', error);
    res.status(500).json({ error: 'Failed to reject payout' });
  }
});

export default router;
