/**
 * Seller Routes for AlgoEdge Marketplace
 * Handles seller dashboard, payouts, commissions, and listing management
 */

import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { getMarketplaceCommission, getMinimumWithdrawal } from '../services/settingsService.js';

const router = express.Router();

// Default commission rate: Platform receives 20%, Seller receives 80%
// These defaults are now overridden by admin settings via settingsService
const DEFAULT_COMMISSION_RATE = parseFloat(process.env.MARKETPLACE_COMMISSION_RATE) || 20;
const MINIMUM_PAYOUT = parseFloat(process.env.MINIMUM_PAYOUT) || 50;
const COMMISSION_CLEARING_DAYS = parseInt(process.env.COMMISSION_CLEARING_DAYS) || 7;

// ============================================================================
// SELLER PROFILE & STATUS
// ============================================================================

/**
 * GET /api/seller/profile
 * Get seller profile and status - used to check if user is a seller
 */
router.get('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Check if user is an approved seller
    const user = await pool.query(`
      SELECT id, is_seller, seller_slug, has_blue_badge, full_name, profile_image
      FROM users WHERE id = $1
    `, [userId]);

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = user.rows[0];

    // Check for seller application status
    const application = await pool.query(`
      SELECT id, status, created_at, updated_at
      FROM seller_applications 
      WHERE user_id = $1 
      ORDER BY created_at DESC LIMIT 1
    `, [userId]);

    const appData = application.rows[0] || null;

    // Determine seller status
    let sellerStatus = 'not_applied';
    if (userData.is_seller) {
      sellerStatus = 'approved';
    } else if (appData) {
      sellerStatus = appData.status; // pending, approved, rejected
    }

    res.json({
      success: true,
      seller: {
        status: sellerStatus,
        is_seller: userData.is_seller || false,
        seller_slug: userData.seller_slug,
        has_blue_badge: userData.has_blue_badge || false,
        full_name: userData.full_name,
        profile_image: userData.profile_image,
      },
      application: appData,
    });
  } catch (error) {
    console.error('Get seller profile error:', error);
    res.status(500).json({ error: 'Failed to get seller profile' });
  }
});

// ============================================================================
// SELLER DASHBOARD
// ============================================================================

/**
 * GET /api/seller/dashboard
 * Get comprehensive seller dashboard data
 */
router.get('/dashboard', authenticate, async (req, res) => {
  try {
    const sellerId = req.user.id;

    // Get or create seller wallet
    let wallet = await pool.query(
      'SELECT * FROM seller_wallets WHERE user_id = $1',
      [sellerId]
    );

    if (wallet.rows.length === 0) {
      await pool.query(
        'INSERT INTO seller_wallets (user_id) VALUES ($1)',
        [sellerId]
      );
      wallet = await pool.query('SELECT * FROM seller_wallets WHERE user_id = $1', [sellerId]);
    }

    const walletData = wallet.rows[0];

    // Get pending earnings (commissions not yet cleared)
    const pendingEarnings = await pool.query(`
      SELECT COALESCE(SUM(seller_earnings), 0) as total
      FROM seller_commissions
      WHERE seller_id = $1 AND status = 'pending'
    `, [sellerId]);

    // Get cleared earnings (available for withdrawal)
    const clearedEarnings = await pool.query(`
      SELECT COALESCE(SUM(seller_earnings), 0) as total
      FROM seller_commissions
      WHERE seller_id = $1 AND status = 'cleared'
    `, [sellerId]);

    // Get total paid out
    const paidOut = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM seller_payout_requests
      WHERE seller_id = $1 AND status = 'completed'
    `, [sellerId]);

    // Get listings stats
    const listingsStats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM marketplace_products WHERE seller_id = $1) as total_products,
        (SELECT COUNT(*) FROM marketplace_products WHERE seller_id = $1 AND status = 'pending') as pending_products,
        (SELECT COUNT(*) FROM marketplace_products WHERE seller_id = $1 AND status = 'approved') as approved_products,
        (SELECT COUNT(*) FROM marketplace_bots WHERE seller_id = $1) as total_bots,
        (SELECT COUNT(*) FROM marketplace_bots WHERE seller_id = $1 AND status = 'pending') as pending_bots,
        (SELECT COUNT(*) FROM marketplace_bots WHERE seller_id = $1 AND status = 'approved') as approved_bots
    `, [sellerId]);

    // Get sales stats (last 30 days)
    const salesStats = await pool.query(`
      SELECT 
        COUNT(*) as total_sales,
        COALESCE(SUM(price_paid), 0) as total_revenue,
        COALESCE(SUM(seller_earnings), 0) as total_earnings,
        COALESCE(SUM(platform_commission), 0) as total_commission
      FROM (
        SELECT price_paid, seller_earnings, platform_commission FROM marketplace_product_purchases 
        WHERE seller_id = $1 AND created_at > NOW() - INTERVAL '30 days'
        UNION ALL
        SELECT price_paid, seller_earnings, platform_commission FROM marketplace_bot_purchases 
        WHERE seller_id = $1 AND created_at > NOW() - INTERVAL '30 days'
      ) as sales
    `, [sellerId]);

    // Get recent transactions
    const recentTransactions = await pool.query(`
      SELECT * FROM (
        SELECT 
          'sale' as type,
          pp.id,
          p.name as item_name,
          pp.price_paid as amount,
          pp.seller_earnings,
          pp.platform_commission,
          'completed' as status,
          pp.created_at
        FROM marketplace_product_purchases pp
        JOIN marketplace_products p ON pp.product_id = p.id
        WHERE pp.seller_id = $1
        
        UNION ALL
        
        SELECT 
          'sale' as type,
          bp.id,
          b.name as item_name,
          bp.price_paid as amount,
          bp.seller_earnings,
          bp.platform_commission,
          'completed' as status,
          bp.created_at
        FROM marketplace_bot_purchases bp
        JOIN marketplace_bots b ON bp.bot_id = b.id
        WHERE bp.seller_id = $1
        
        UNION ALL
        
        SELECT 
          'payout' as type,
          pr.id,
          'Withdrawal' as item_name,
          -pr.amount as amount,
          0 as seller_earnings,
          0 as platform_commission,
          pr.status,
          pr.created_at
        FROM seller_payout_requests pr
        WHERE pr.seller_id = $1
      ) as transactions
      ORDER BY created_at DESC
      LIMIT 20
    `, [sellerId]);

    // Get all listings
    const products = await pool.query(`
      SELECT id, name, slug, price, product_type, status, checkout_url, 
             total_sales, rating_average, created_at, admin_notes, rejection_reason
      FROM marketplace_products
      WHERE seller_id = $1
      ORDER BY created_at DESC
    `, [sellerId]);

    const bots = await pool.query(`
      SELECT id, name, slug, price, category, status, checkout_url,
             total_sales, rating_average, created_at, admin_notes, rejection_reason
      FROM marketplace_bots
      WHERE seller_id = $1
      ORDER BY created_at DESC
    `, [sellerId]);

    // Get pending payout requests
    const pendingPayouts = await pool.query(`
      SELECT * FROM seller_payout_requests
      WHERE seller_id = $1 AND status IN ('pending', 'processing')
      ORDER BY created_at DESC
    `, [sellerId]);

    // Get dynamic commission rate from admin settings
    const currentCommissionRate = await getMarketplaceCommission();

    res.json({
      wallet: {
        ...walletData,
        available_balance: parseFloat(clearedEarnings.rows[0].total) || 0,
        pending_earnings: parseFloat(pendingEarnings.rows[0].total) || 0,
        total_paid_out: parseFloat(paidOut.rows[0].total) || 0,
        minimum_payout: MINIMUM_PAYOUT
      },
      stats: {
        ...listingsStats.rows[0],
        ...salesStats.rows[0],
        commission_rate: currentCommissionRate
      },
      transactions: recentTransactions.rows,
      listings: {
        products: products.rows,
        bots: bots.rows
      },
      pending_payouts: pendingPayouts.rows
    });
  } catch (error) {
    console.error('Error fetching seller dashboard:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// ============================================================================
// PAYOUT MANAGEMENT
// ============================================================================

/**
 * GET /api/seller/payout-settings
 * Get seller's payout settings
 */
router.get('/payout-settings', authenticate, async (req, res) => {
  try {
    const wallet = await pool.query(
      'SELECT * FROM seller_wallets WHERE user_id = $1',
      [req.user.id]
    );

    if (wallet.rows.length === 0) {
      return res.json({ settings: null, needs_setup: true });
    }

    const w = wallet.rows[0];
    res.json({
      settings: {
        payout_method: w.payout_method,
        payout_email: w.payout_email,
        bank_name: w.bank_name,
        bank_account_name: w.bank_account_name,
        bank_account_number: w.bank_account_number ? '****' + w.bank_account_number.slice(-4) : null,
        paypal_email: w.paypal_email,
        crypto_wallet_address: w.crypto_wallet_address ? w.crypto_wallet_address.slice(0, 10) + '...' : null,
        crypto_network: w.crypto_network,
        minimum_payout: w.minimum_payout || MINIMUM_PAYOUT,
        verified_at: w.verified_at
      },
      needs_setup: !w.payout_method || !w.verified_at
    });
  } catch (error) {
    console.error('Error fetching payout settings:', error);
    res.status(500).json({ error: 'Failed to fetch payout settings' });
  }
});

/**
 * PUT /api/seller/payout-settings
 * Update seller's payout settings
 */
router.put('/payout-settings', authenticate, async (req, res) => {
  try {
    const {
      payout_method,
      payout_email,
      bank_name,
      bank_account_name,
      bank_account_number,
      bank_routing_number,
      paypal_email,
      crypto_wallet_address,
      crypto_network
    } = req.body;

    await pool.query(`
      UPDATE seller_wallets SET
        payout_method = COALESCE($2, payout_method),
        payout_email = COALESCE($3, payout_email),
        bank_name = COALESCE($4, bank_name),
        bank_account_name = COALESCE($5, bank_account_name),
        bank_account_number = COALESCE($6, bank_account_number),
        bank_routing_number = COALESCE($7, bank_routing_number),
        paypal_email = COALESCE($8, paypal_email),
        crypto_wallet_address = COALESCE($9, crypto_wallet_address),
        crypto_network = COALESCE($10, crypto_network),
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $1
    `, [
      req.user.id, payout_method, payout_email, bank_name, bank_account_name,
      bank_account_number, bank_routing_number, paypal_email, crypto_wallet_address, crypto_network
    ]);

    res.json({ success: true, message: 'Payout settings updated' });
  } catch (error) {
    console.error('Error updating payout settings:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

/**
 * POST /api/seller/request-payout
 * Request a payout
 */
router.post('/request-payout', authenticate, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { amount } = req.body;
    const sellerId = req.user.id;

    // Validate amount
    if (!amount || amount < MINIMUM_PAYOUT) {
      return res.status(400).json({ 
        error: `Minimum payout amount is $${MINIMUM_PAYOUT}` 
      });
    }

    // Get available balance
    const clearedEarnings = await client.query(`
      SELECT COALESCE(SUM(seller_earnings), 0) as total
      FROM seller_commissions
      WHERE seller_id = $1 AND status = 'cleared'
    `, [sellerId]);

    const availableBalance = parseFloat(clearedEarnings.rows[0].total);

    if (amount > availableBalance) {
      return res.status(400).json({ 
        error: `Insufficient balance. Available: $${availableBalance.toFixed(2)}` 
      });
    }

    // Check for pending payout requests
    const pendingRequest = await client.query(`
      SELECT id FROM seller_payout_requests
      WHERE seller_id = $1 AND status IN ('pending', 'processing')
    `, [sellerId]);

    if (pendingRequest.rows.length > 0) {
      return res.status(400).json({ 
        error: 'You already have a pending payout request' 
      });
    }

    // Get wallet details
    const wallet = await client.query(
      'SELECT * FROM seller_wallets WHERE user_id = $1',
      [sellerId]
    );

    if (!wallet.rows[0]?.payout_method) {
      return res.status(400).json({ 
        error: 'Please set up your payout method first' 
      });
    }

    const w = wallet.rows[0];
    const payoutDetails = {
      method: w.payout_method,
      email: w.payout_email,
      bank_name: w.bank_name,
      bank_account_name: w.bank_account_name,
      bank_account_number: w.bank_account_number,
      paypal_email: w.paypal_email,
      crypto_wallet_address: w.crypto_wallet_address,
      crypto_network: w.crypto_network
    };

    // Create payout request
    const result = await client.query(`
      INSERT INTO seller_payout_requests 
      (seller_id, wallet_id, amount, payout_method, payout_details)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [sellerId, w.id, amount, w.payout_method, JSON.stringify(payoutDetails)]);

    // Mark commissions as being paid out (up to the amount)
    await client.query(`
      UPDATE seller_commissions
      SET status = 'paid_out', 
          paid_out_at = CURRENT_TIMESTAMP,
          payout_id = $1
      WHERE id IN (
        SELECT id FROM seller_commissions
        WHERE seller_id = $2 AND status = 'cleared'
        ORDER BY created_at
        LIMIT (
          SELECT COUNT(*) FROM seller_commissions
          WHERE seller_id = $2 AND status = 'cleared'
        )
      )
    `, [result.rows[0].id, sellerId]);

    await client.query('COMMIT');

    res.json({ 
      success: true, 
      message: 'Payout request submitted',
      payout: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error requesting payout:', error);
    res.status(500).json({ error: 'Failed to request payout' });
  } finally {
    client.release();
  }
});

/**
 * GET /api/seller/payouts
 * Get payout history
 */
router.get('/payouts', authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM seller_payout_requests
      WHERE seller_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [req.user.id]);

    res.json({ payouts: result.rows });
  } catch (error) {
    console.error('Error fetching payouts:', error);
    res.status(500).json({ error: 'Failed to fetch payouts' });
  }
});

// ============================================================================
// LISTING MANAGEMENT
// ============================================================================

/**
 * POST /api/seller/listings/product
 * Create a new product listing (pending approval)
 */
router.post('/listings/product', authenticate, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const {
      name,
      description,
      short_description,
      product_type,
      price,
      thumbnail_url,
      screenshots,
      tags,
      preferred_name,
      seller_notes
    } = req.body;

    // Validate required fields
    if (!name || !description || !product_type || !price) {
      return res.status(400).json({ 
        error: 'Name, description, product type, and price are required' 
      });
    }

    if (price < 5) {
      return res.status(400).json({ 
        error: 'Minimum price is $5' 
      });
    }

    // Generate slug
    const slug = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

    // Create the listing with pending status
    const result = await client.query(`
      INSERT INTO marketplace_products 
      (seller_id, name, slug, description, short_description, product_type, 
       price, thumbnail_url, screenshots, tags, status, preferred_name, seller_notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending', $11, $12)
      RETURNING *
    `, [
      req.user.id, name, slug, description, short_description || description.substring(0, 150),
      product_type, price, thumbnail_url, screenshots || [], tags || [],
      preferred_name || name, seller_notes
    ]);

    // Create submission record
    await client.query(`
      INSERT INTO listing_submissions 
      (seller_id, listing_type, listing_id, preferred_name, preferred_description, preferred_price, seller_notes)
      VALUES ($1, 'product', $2, $3, $4, $5, $6)
    `, [req.user.id, result.rows[0].id, preferred_name || name, description, price, seller_notes]);

    await client.query('COMMIT');

    res.json({ 
      success: true, 
      message: 'Listing submitted for review. Admin will attach a checkout link and approve it.',
      listing: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating listing:', error);
    res.status(500).json({ error: 'Failed to create listing' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/seller/listings/bot
 * Create a new bot listing (pending approval)
 */
router.post('/listings/bot', authenticate, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const {
      name,
      description,
      short_description,
      category,
      price,
      supported_platforms,
      supported_pairs,
      recommended_timeframes,
      minimum_balance,
      thumbnail_url,
      screenshots,
      tags,
      preferred_name,
      seller_notes
    } = req.body;

    if (!name || !description || !category || !price) {
      return res.status(400).json({ 
        error: 'Name, description, category, and price are required' 
      });
    }

    if (price < 10) {
      return res.status(400).json({ 
        error: 'Minimum price for bots is $10' 
      });
    }

    const slug = name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now().toString(36);

    const result = await client.query(`
      INSERT INTO marketplace_bots 
      (seller_id, name, slug, description, short_description, category, price,
       supported_platforms, supported_pairs, recommended_timeframes, minimum_balance,
       thumbnail_url, screenshots, tags, status, preferred_name, seller_notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, 'pending', $15, $16)
      RETURNING *
    `, [
      req.user.id, name, slug, description, short_description || description.substring(0, 150),
      category, price, supported_platforms || ['MT5'], supported_pairs || ['XAUUSD'],
      recommended_timeframes || ['H1'], minimum_balance || 100, thumbnail_url,
      screenshots || [], tags || [], preferred_name || name, seller_notes
    ]);

    await client.query(`
      INSERT INTO listing_submissions 
      (seller_id, listing_type, listing_id, preferred_name, preferred_description, preferred_price, seller_notes)
      VALUES ($1, 'bot', $2, $3, $4, $5, $6)
    `, [req.user.id, result.rows[0].id, preferred_name || name, description, price, seller_notes]);

    await client.query('COMMIT');

    res.json({ 
      success: true, 
      message: 'Bot listing submitted for review. Admin will attach a checkout link and approve it.',
      listing: result.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating bot listing:', error);
    res.status(500).json({ error: 'Failed to create listing' });
  } finally {
    client.release();
  }
});

/**
 * GET /api/seller/listings
 * Get all seller's listings
 */
router.get('/listings', authenticate, async (req, res) => {
  try {
    const products = await pool.query(`
      SELECT p.*, ls.status as submission_status, ls.admin_notes as submission_notes
      FROM marketplace_products p
      LEFT JOIN listing_submissions ls ON ls.listing_type = 'product' AND ls.listing_id = p.id
      WHERE p.seller_id = $1
      ORDER BY p.created_at DESC
    `, [req.user.id]);

    const bots = await pool.query(`
      SELECT b.*, ls.status as submission_status, ls.admin_notes as submission_notes
      FROM marketplace_bots b
      LEFT JOIN listing_submissions ls ON ls.listing_type = 'bot' AND ls.listing_id = b.id
      WHERE b.seller_id = $1
      ORDER BY b.created_at DESC
    `, [req.user.id]);

    res.json({
      products: products.rows,
      bots: bots.rows
    });
  } catch (error) {
    console.error('Error fetching listings:', error);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

/**
 * GET /api/seller/commissions
 * Get commission history
 */
router.get('/commissions', authenticate, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT sc.*, 
        CASE 
          WHEN sc.sale_type = 'product' THEN (SELECT name FROM marketplace_products WHERE id = sc.sale_id)
          WHEN sc.sale_type = 'bot' THEN (SELECT name FROM marketplace_bots WHERE id = sc.sale_id)
        END as item_name
      FROM seller_commissions sc
      WHERE sc.seller_id = $1
      ORDER BY sc.created_at DESC
      LIMIT 100
    `, [req.user.id]);

    res.json({ commissions: result.rows });
  } catch (error) {
    console.error('Error fetching commissions:', error);
    res.status(500).json({ error: 'Failed to fetch commissions' });
  }
});

// ============================================================================
// TELEGRAM FREE CHANNEL
// ============================================================================

/**
 * POST /api/seller/telegram/join-free
 * Join the free Telegram channel
 */
router.post('/telegram/join-free', authenticate, async (req, res) => {
  try {
    const { telegram_username } = req.body;

    // Check if user already joined
    const existing = await pool.query(
      'SELECT * FROM telegram_channel_members WHERE user_id = $1',
      [req.user.id]
    );

    if (existing.rows.length > 0) {
      return res.json({ 
        success: true, 
        already_member: true,
        channel_link: process.env.TELEGRAM_FREE_CHANNEL_LINK || 'https://t.me/AlgoEdgeSignals'
      });
    }

    // Add to channel members
    await pool.query(`
      INSERT INTO telegram_channel_members (user_id, telegram_username, channel_type)
      VALUES ($1, $2, 'free')
    `, [req.user.id, telegram_username]);

    res.json({ 
      success: true, 
      message: 'Welcome to the free channel!',
      channel_link: process.env.TELEGRAM_FREE_CHANNEL_LINK || 'https://t.me/AlgoEdgeSignals'
    });
  } catch (error) {
    console.error('Error joining free channel:', error);
    res.status(500).json({ error: 'Failed to join channel' });
  }
});

// ============================================================================
// SELLER CUSTOMERS
// ============================================================================

/**
 * GET /api/seller/customers
 * Get all customers (buyers) of seller's products/bots
 */
router.get('/customers', authenticate, async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Get all unique buyers from product and bot purchases
    const customers = await pool.query(`
      SELECT DISTINCT ON (u.id)
        u.id,
        u.full_name,
        u.email,
        u.profile_image,
        u.created_at as user_joined,
        (
          SELECT COUNT(*) FROM marketplace_product_purchases pp 
          JOIN marketplace_products p ON pp.product_id = p.id 
          WHERE p.seller_id = $1 AND pp.buyer_id = u.id
        ) + (
          SELECT COUNT(*) FROM marketplace_bot_purchases bp 
          JOIN marketplace_bots b ON bp.bot_id = b.id 
          WHERE b.seller_id = $1 AND bp.buyer_id = u.id
        ) as total_purchases,
        (
          SELECT COALESCE(SUM(pp.price_paid), 0) FROM marketplace_product_purchases pp 
          JOIN marketplace_products p ON pp.product_id = p.id 
          WHERE p.seller_id = $1 AND pp.buyer_id = u.id
        ) + (
          SELECT COALESCE(SUM(bp.price_paid), 0) FROM marketplace_bot_purchases bp 
          JOIN marketplace_bots b ON bp.bot_id = b.id 
          WHERE b.seller_id = $1 AND bp.buyer_id = u.id
        ) as total_spent,
        (
          SELECT MAX(created_at) FROM (
            SELECT pp.created_at FROM marketplace_product_purchases pp 
            JOIN marketplace_products p ON pp.product_id = p.id 
            WHERE p.seller_id = $1 AND pp.buyer_id = u.id
            UNION ALL
            SELECT bp.created_at FROM marketplace_bot_purchases bp 
            JOIN marketplace_bots b ON bp.bot_id = b.id 
            WHERE b.seller_id = $1 AND bp.buyer_id = u.id
          ) as all_purchases
        ) as last_purchase
      FROM users u
      WHERE u.id IN (
        SELECT DISTINCT pp.buyer_id FROM marketplace_product_purchases pp 
        JOIN marketplace_products p ON pp.product_id = p.id 
        WHERE p.seller_id = $1
        UNION
        SELECT DISTINCT bp.buyer_id FROM marketplace_bot_purchases bp 
        JOIN marketplace_bots b ON bp.bot_id = b.id 
        WHERE b.seller_id = $1
      )
      ORDER BY u.id, last_purchase DESC
      LIMIT $2 OFFSET $3
    `, [sellerId, parseInt(limit), offset]);

    // Get total count
    const countResult = await pool.query(`
      SELECT COUNT(DISTINCT buyer_id) as total FROM (
        SELECT pp.buyer_id FROM marketplace_product_purchases pp 
        JOIN marketplace_products p ON pp.product_id = p.id 
        WHERE p.seller_id = $1
        UNION
        SELECT bp.buyer_id FROM marketplace_bot_purchases bp 
        JOIN marketplace_bots b ON bp.bot_id = b.id 
        WHERE b.seller_id = $1
      ) as all_buyers
    `, [sellerId]);

    res.json({
      success: true,
      customers: customers.rows,
      total: parseInt(countResult.rows[0]?.total || 0),
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

/**
 * GET /api/seller/customers/:id/purchases
 * Get purchase history for a specific customer
 */
router.get('/customers/:id/purchases', authenticate, async (req, res) => {
  try {
    const sellerId = req.user.id;
    const customerId = req.params.id;

    const purchases = await pool.query(`
      SELECT * FROM (
        SELECT 
          pp.id,
          'product' as type,
          p.name as item_name,
          p.slug as item_slug,
          pp.price_paid,
          pp.created_at
        FROM marketplace_product_purchases pp 
        JOIN marketplace_products p ON pp.product_id = p.id 
        WHERE p.seller_id = $1 AND pp.buyer_id = $2
        
        UNION ALL
        
        SELECT 
          bp.id,
          'bot' as type,
          b.name as item_name,
          b.slug as item_slug,
          bp.price_paid,
          bp.created_at
        FROM marketplace_bot_purchases bp 
        JOIN marketplace_bots b ON bp.bot_id = b.id 
        WHERE b.seller_id = $1 AND bp.buyer_id = $2
      ) as all_purchases
      ORDER BY created_at DESC
    `, [sellerId, customerId]);

    res.json({
      success: true,
      purchases: purchases.rows,
    });
  } catch (error) {
    console.error('Error fetching customer purchases:', error);
    res.status(500).json({ error: 'Failed to fetch customer purchases' });
  }
});

// ============================================================================
// SELLER REVIEWS
// ============================================================================

/**
 * GET /api/seller/reviews
 * Get all reviews on seller's products/bots
 */
router.get('/reviews', authenticate, async (req, res) => {
  try {
    const sellerId = req.user.id;
    const { page = 1, limit = 20, filter = 'all' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let filterCondition = '';
    if (filter === 'pending') filterCondition = "AND r.status = 'pending'";
    else if (filter === 'approved') filterCondition = "AND r.status = 'approved'";

    const reviews = await pool.query(`
      SELECT * FROM (
        SELECT 
          r.id,
          'product' as type,
          p.id as item_id,
          p.name as item_name,
          p.slug as item_slug,
          r.rating,
          r.review_text,
          r.status,
          r.seller_reply,
          r.created_at,
          r.updated_at,
          u.id as reviewer_id,
          u.full_name as reviewer_name,
          u.profile_image as reviewer_avatar
        FROM marketplace_product_reviews r
        JOIN marketplace_products p ON r.product_id = p.id
        JOIN users u ON r.user_id = u.id
        WHERE p.seller_id = $1 ${filterCondition}
        
        UNION ALL
        
        SELECT 
          r.id,
          'bot' as type,
          b.id as item_id,
          b.name as item_name,
          b.slug as item_slug,
          r.rating,
          r.review_text,
          r.status,
          r.seller_reply,
          r.created_at,
          r.updated_at,
          u.id as reviewer_id,
          u.full_name as reviewer_name,
          u.profile_image as reviewer_avatar
        FROM marketplace_bot_reviews r
        JOIN marketplace_bots b ON r.bot_id = b.id
        JOIN users u ON r.user_id = u.id
        WHERE b.seller_id = $1 ${filterCondition}
      ) as all_reviews
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `, [sellerId, parseInt(limit), offset]);

    // Get counts
    const stats = await pool.query(`
      SELECT 
        COALESCE(SUM(CASE WHEN type = 'product' THEN 1 ELSE 0 END), 0) as product_reviews,
        COALESCE(SUM(CASE WHEN type = 'bot' THEN 1 ELSE 0 END), 0) as bot_reviews,
        COALESCE(AVG(rating), 0) as avg_rating,
        COUNT(*) as total_reviews
      FROM (
        SELECT 'product' as type, r.rating FROM marketplace_product_reviews r
        JOIN marketplace_products p ON r.product_id = p.id
        WHERE p.seller_id = $1 AND r.status = 'approved'
        UNION ALL
        SELECT 'bot' as type, r.rating FROM marketplace_bot_reviews r
        JOIN marketplace_bots b ON r.bot_id = b.id
        WHERE b.seller_id = $1 AND r.status = 'approved'
      ) as all_reviews
    `, [sellerId]);

    res.json({
      success: true,
      reviews: reviews.rows,
      stats: {
        total: parseInt(stats.rows[0]?.total_reviews || 0),
        average_rating: parseFloat(stats.rows[0]?.avg_rating || 0).toFixed(1),
        product_reviews: parseInt(stats.rows[0]?.product_reviews || 0),
        bot_reviews: parseInt(stats.rows[0]?.bot_reviews || 0),
      },
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

/**
 * POST /api/seller/reviews/:id/reply
 * Reply to a review
 */
router.post('/reviews/:id/reply', authenticate, async (req, res) => {
  try {
    const sellerId = req.user.id;
    const reviewId = req.params.id;
    const { reply, type } = req.body;

    if (!reply || !type) {
      return res.status(400).json({ error: 'Reply text and type are required' });
    }

    const table = type === 'product' ? 'marketplace_product_reviews' : 'marketplace_bot_reviews';
    const joinTable = type === 'product' ? 'marketplace_products' : 'marketplace_bots';
    const joinColumn = type === 'product' ? 'product_id' : 'bot_id';

    // Verify the review belongs to this seller's product/bot
    const verify = await pool.query(`
      SELECT r.id FROM ${table} r
      JOIN ${joinTable} p ON r.${joinColumn} = p.id
      WHERE r.id = $1 AND p.seller_id = $2
    `, [reviewId, sellerId]);

    if (verify.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Update the reply
    await pool.query(`
      UPDATE ${table} 
      SET seller_reply = $1, updated_at = NOW()
      WHERE id = $2
    `, [reply, reviewId]);

    res.json({
      success: true,
      message: 'Reply added successfully',
    });
  } catch (error) {
    console.error('Error replying to review:', error);
    res.status(500).json({ error: 'Failed to reply to review' });
  }
});

export default router;
