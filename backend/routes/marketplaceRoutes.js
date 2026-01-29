import express from 'express';
import pool from '../config/database.js';
import { authenticate, optionalAuthenticate } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import { auditLog } from '../middleware/audit.js';
import crypto from 'crypto';
import { addAdminWalletTransaction } from '../services/adminWalletService.js';

const router = express.Router();

// Commission rate: Platform receives 20%, Seller receives 80%
const COMMISSION_RATE = parseFloat(process.env.MARKETPLACE_COMMISSION_RATE) || 20;

// ============================================================================
// SELLER SUBSCRIPTION CHECK MIDDLEWARE
// ============================================================================
const requireSellerSubscription = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Check if user has an active Whop subscription
    const subscription = await pool.query(
      `SELECT * FROM whop_subscriptions 
       WHERE user_id = $1 
       AND status = 'active' 
       AND (current_period_end IS NULL OR current_period_end > NOW())`,
      [userId]
    );

    if (subscription.rows.length === 0) {
      return res.status(403).json({
        error: 'Active subscription required',
        message: 'You must have an active AlgoEdge subscription to become a seller. Please subscribe to access seller features.',
        code: 'SUBSCRIPTION_REQUIRED'
      });
    }

    // Verify seller wallet exists, create if not
    const wallet = await pool.query(
      'SELECT * FROM seller_wallets WHERE user_id = $1',
      [userId]
    );

    if (wallet.rows.length === 0) {
      await pool.query(
        `INSERT INTO seller_wallets (user_id, subscription_verified_at) 
         VALUES ($1, CURRENT_TIMESTAMP)`,
        [userId]
      );
    } else if (!wallet.rows[0].subscription_verified_at) {
      await pool.query(
        'UPDATE seller_wallets SET subscription_verified_at = CURRENT_TIMESTAMP WHERE user_id = $1',
        [userId]
      );
    }

    req.isVerifiedSeller = true;
    next();
  } catch (error) {
    console.error('Seller subscription check error:', error);
    res.status(500).json({ error: 'Failed to verify seller status' });
  }
};

// ============================================================================
// MARKETPLACE OVERVIEW
// ============================================================================

// Get marketplace stats (public)
router.get('/stats', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM marketplace_bots WHERE status = 'approved') + 
        (SELECT COUNT(*) FROM marketplace_products WHERE status = 'approved' AND category = 'bot') as total_bots,
        (SELECT COUNT(*) FROM signal_providers WHERE status = 'approved') + 
        (SELECT COUNT(*) FROM signal_tiers WHERE is_active = true) as total_signal_providers,
        (SELECT COUNT(*) FROM marketplace_products WHERE status = 'approved' AND category NOT IN ('bot')) as total_products,
        (SELECT COUNT(DISTINCT buyer_id) FROM marketplace_bot_purchases) +
        (SELECT COUNT(DISTINCT subscriber_id) FROM signal_provider_subscriptions) +
        (SELECT COUNT(DISTINCT buyer_id) FROM marketplace_product_purchases) as total_customers,
        (SELECT COALESCE(SUM(total_revenue), 0) FROM marketplace_bots) +
        (SELECT COALESCE(SUM(total_revenue), 0) FROM signal_providers) +
        (SELECT COALESCE(SUM(total_revenue), 0) FROM marketplace_products) as total_volume
    `);

    res.json({ success: true, stats: stats.rows[0] });
  } catch (error) {
    console.error('Get marketplace stats error:', error);
    res.status(500).json({ error: 'Failed to get marketplace stats' });
  }
});

// Get featured items across all marketplaces
router.get('/featured', async (req, res) => {
  try {
    const [bots, providers, products] = await Promise.all([
      pool.query(`
        SELECT id, name, slug, short_description, thumbnail_url, price, price_type,
               win_rate, monthly_return, rating_average, rating_count, total_sales, category
        FROM marketplace_bots
        WHERE status = 'approved' AND is_featured = TRUE
        ORDER BY total_sales DESC LIMIT 4
      `),
      pool.query(`
        SELECT sp.id, sp.display_name, sp.slug, sp.avatar_url, sp.monthly_price,
               sp.win_rate, sp.total_pips, sp.subscriber_count, sp.rating_average
        FROM signal_providers sp
        WHERE sp.status = 'approved' AND sp.is_featured = TRUE
        ORDER BY sp.subscriber_count DESC LIMIT 4
      `),
      pool.query(`
        SELECT id, name, slug, short_description, thumbnail_url, price,
               product_type, rating_average, rating_count, total_sales
        FROM marketplace_products
        WHERE status = 'approved' AND is_featured = TRUE
        ORDER BY total_sales DESC LIMIT 4
      `)
    ]);

    res.json({
      success: true,
      featured: {
        bots: bots.rows,
        signalProviders: providers.rows,
        products: products.rows
      }
    });
  } catch (error) {
    console.error('Get featured items error:', error);
    res.status(500).json({ error: 'Failed to get featured items' });
  }
});

// Fast landing page data endpoint - returns all products needed for homepage in single request
router.get('/landing', async (req, res) => {
  try {
    const [bots, providers, products] = await Promise.all([
      pool.query(`
        SELECT b.id, b.name, b.slug, b.short_description as description, b.thumbnail_url, b.price, b.price_type,
               b.win_rate, b.monthly_return, b.rating_average, b.rating_count as total_reviews, b.total_sales, b.category,
               b.is_featured,
               u.full_name as seller_name, u.profile_image as seller_avatar, u.has_blue_badge as seller_verified
        FROM marketplace_bots b
        JOIN users u ON b.seller_id = u.id
        WHERE b.status = 'approved'
        ORDER BY b.is_featured DESC, b.total_sales DESC, b.rating_average DESC
        LIMIT 6
      `),
      pool.query(`
        SELECT sp.id, sp.display_name as name, sp.slug, sp.avatar_url, sp.monthly_price,
               sp.win_rate, sp.total_pips, sp.subscriber_count, sp.rating_average,
               sp.trading_style, sp.risk_level, sp.bio as description, sp.is_featured,
               u.full_name as provider_name, u.profile_image as provider_avatar, u.has_blue_badge as provider_verified
        FROM signal_providers sp
        JOIN users u ON sp.user_id = u.id
        WHERE sp.status = 'approved'
        ORDER BY sp.is_featured DESC, sp.subscriber_count DESC, sp.rating_average DESC
        LIMIT 4
      `),
      pool.query(`
        SELECT p.id, p.name, p.slug, p.short_description as description, p.thumbnail_url, p.price,
               p.product_type as type, p.rating_average, p.rating_count as total_reviews, p.total_sales,
               p.is_featured,
               u.full_name as seller_name, u.profile_image as seller_avatar, u.has_blue_badge as seller_verified
        FROM marketplace_products p
        JOIN users u ON p.seller_id = u.id
        WHERE p.status = 'approved'
        ORDER BY p.is_featured DESC, p.total_sales DESC, p.rating_average DESC
        LIMIT 6
      `)
    ]);

    res.json({
      success: true,
      bots: bots.rows,
      signals: providers.rows,
      products: products.rows
    });
  } catch (error) {
    console.error('Get landing data error:', error);
    res.status(500).json({ error: 'Failed to get landing data' });
  }
});

// ============================================================================
// BOT MARKETPLACE
// ============================================================================

// List bots (public)
router.get('/bots', async (req, res) => {
  try {
    const {
      category,
      price_type,
      min_price,
      max_price,
      min_win_rate,
      platform,
      sort = 'popular',
      page = 1,
      limit = 12
    } = req.query;

    let query = `
      SELECT b.*, 
             u.username as seller_name,
             u.profile_picture as seller_avatar,
             u.has_blue_badge as seller_verified,
             COALESCE(u.seller_rating_average, 0) as seller_rating,
             COALESCE(u.seller_total_sales, 0) as seller_total_sales
      FROM marketplace_bots b
      JOIN users u ON b.seller_id = u.id
      WHERE b.status = 'approved'
    `;
    const params = [];
    let paramCount = 0;

    if (category) {
      params.push(category);
      query += ` AND b.category = $${++paramCount}`;
    }
    if (price_type) {
      params.push(price_type);
      query += ` AND b.price_type = $${++paramCount}`;
    }
    if (min_price) {
      params.push(min_price);
      query += ` AND b.price >= $${++paramCount}`;
    }
    if (max_price) {
      params.push(max_price);
      query += ` AND b.price <= $${++paramCount}`;
    }
    if (min_win_rate) {
      params.push(min_win_rate);
      query += ` AND b.win_rate >= $${++paramCount}`;
    }
    if (platform) {
      params.push(platform);
      query += ` AND $${++paramCount} = ANY(b.supported_platforms)`;
    }

    // Sorting
    switch (sort) {
      case 'newest':
        query += ' ORDER BY b.created_at DESC';
        break;
      case 'price_low':
        query += ' ORDER BY b.price ASC';
        break;
      case 'price_high':
        query += ' ORDER BY b.price DESC';
        break;
      case 'rating':
        query += ' ORDER BY b.rating_average DESC, b.rating_count DESC';
        break;
      case 'win_rate':
        query += ' ORDER BY b.win_rate DESC';
        break;
      default: // popular
        query += ' ORDER BY b.total_sales DESC, b.view_count DESC';
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(limit, offset);
    query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;

    const [bots, countResult] = await Promise.all([
      pool.query(query, params),
      pool.query(`SELECT COUNT(*) FROM marketplace_bots WHERE status = 'approved'`)
    ]);

    res.json({
      success: true,
      bots: bots.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        totalPages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('List bots error:', error);
    res.status(500).json({ error: 'Failed to list bots' });
  }
});

// Get single bot (public)
router.get('/bots/:slug', optionalAuthenticate, async (req, res) => {
  try {
    const { slug } = req.params;

    const bot = await pool.query(`
      SELECT b.*, 
             u.username as seller_name, 
             u.created_at as seller_since,
             u.profile_picture as seller_avatar,
             u.has_blue_badge as seller_verified,
             COALESCE(u.seller_rating_average, 0) as seller_rating,
             COALESCE(u.seller_total_sales, 0) as seller_total_sales
      FROM marketplace_bots b
      JOIN users u ON b.seller_id = u.id
      WHERE b.slug = $1 AND b.status = 'approved'
    `, [slug]);

    if (bot.rows.length === 0) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    // Increment view count
    await pool.query('UPDATE marketplace_bots SET view_count = view_count + 1 WHERE slug = $1', [slug]);

    // Get reviews with avatars
    const reviews = await pool.query(`
      SELECT r.id, r.rating, r.title, r.review, r.created_at,
             COALESCE(r.reviewer_name, u.username) as user_name,
             COALESCE(r.reviewer_avatar, u.profile_picture) as avatar
      FROM marketplace_bot_reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.bot_id = $1 AND r.status = 'published'
      ORDER BY r.created_at DESC LIMIT 10
    `, [bot.rows[0].id]);

    // Check if user owns this bot
    let owned = false;
    if (req.user) {
      const purchase = await pool.query(
        'SELECT id FROM marketplace_bot_purchases WHERE bot_id = $1 AND buyer_id = $2 AND (subscription_status = $3 OR purchase_type = $4)',
        [bot.rows[0].id, req.user.id, 'active', 'one_time']
      );
      owned = purchase.rows.length > 0;
    }

    // Create sanitized bot object - hide download files unless owned
    const botData = { ...bot.rows[0] };
    if (!owned) {
      // Hide sensitive delivery info from non-owners
      delete botData.download_files;
      delete botData.delivery_instructions;
      delete botData.setup_guide;
      delete botData.bot_file_url;
    }

    res.json({
      success: true,
      bot: botData,
      reviews: reviews.rows,
      owned
    });
  } catch (error) {
    console.error('Get bot error:', error);
    res.status(500).json({ error: 'Failed to get bot' });
  }
});

// Create bot listing (authenticated sellers with subscription)
router.post('/bots', authenticate, requireSellerSubscription, apiLimiter, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name, description, short_description,
      supported_platforms, supported_pairs, recommended_timeframes,
      minimum_balance, price_type, price, subscription_period,
      trial_days, category, tags, thumbnail_url, screenshots, demo_video_url,
      // NEW: File uploads for product delivery
      download_files, // [{name, url, size_bytes, file_type}]
      delivery_instructions,
      setup_guide
    } = req.body;

    // Validate required fields
    if (!name || !description) {
      return res.status(400).json({ error: 'Name and description are required' });
    }
    if (!description || description.length < 100) {
      return res.status(400).json({ error: 'Description must be at least 100 characters' });
    }
    if (!download_files || download_files.length === 0) {
      return res.status(400).json({ error: 'You must upload at least one file (the EA/Bot file)' });
    }

    // Generate slug
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    const result = await pool.query(`
      INSERT INTO marketplace_bots (
        seller_id, name, slug, description, short_description,
        supported_platforms, supported_pairs, recommended_timeframes,
        minimum_balance, price_type, price, subscription_period,
        trial_days, category, tags, thumbnail_url, screenshots, demo_video_url,
        download_files, delivery_instructions, setup_guide
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING *
    `, [
      userId, name, slug, description, short_description,
      supported_platforms || ['MT5'], supported_pairs || ['XAUUSD'], recommended_timeframes || ['H1'],
      minimum_balance || 100, price_type || 'one_time', price || 0, subscription_period,
      trial_days || 0, category || 'general', tags || [], thumbnail_url, screenshots || [], demo_video_url,
      download_files ? JSON.stringify(download_files) : null, delivery_instructions, setup_guide
    ]);

    auditLog(userId, 'BOT_LISTING_CREATED', { botId: result.rows[0].id, name }, req);

    res.status(201).json({ success: true, bot: result.rows[0] });
  } catch (error) {
    console.error('Create bot listing error:', error);
    res.status(500).json({ error: 'Failed to create bot listing' });
  }
});

// Purchase bot
router.post('/bots/:id/purchase', authenticate, apiLimiter, async (req, res) => {
  try {
    const userId = req.user.id;
    const botId = parseInt(req.params.id);
    const { payment_reference } = req.body;

    // Get bot details
    const bot = await pool.query('SELECT * FROM marketplace_bots WHERE id = $1 AND status = $2', [botId, 'approved']);
    if (bot.rows.length === 0) {
      return res.status(404).json({ error: 'Bot not found' });
    }

    const botData = bot.rows[0];
    const price = parseFloat(botData.price) || 0;
    
    // Check if already purchased
    const existing = await pool.query(
      'SELECT id FROM marketplace_bot_purchases WHERE bot_id = $1 AND buyer_id = $2',
      [botId, userId]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'You already own this bot' });
    }

    if (price <= 0) {
      return res.status(400).json({ error: 'This bot is not available for purchase' });
    }

    // Get or create user wallet
    let wallet = await pool.query('SELECT * FROM user_wallets WHERE user_id = $1', [userId]);
    if (wallet.rows.length === 0) {
      wallet = await pool.query(
        'INSERT INTO user_wallets (user_id, balance) VALUES ($1, 0) RETURNING *',
        [userId]
      );
    }
    const userWallet = wallet.rows[0];

    // Check if wallet is frozen
    if (userWallet.is_frozen) {
      return res.status(400).json({ error: 'Your wallet is frozen. Please contact support.' });
    }

    // Check balance
    if (parseFloat(userWallet.balance) < price) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        required: price,
        current_balance: parseFloat(userWallet.balance),
        shortfall: price - parseFloat(userWallet.balance)
      });
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Deduct from user wallet
      const balanceBefore = parseFloat(userWallet.balance);
      const balanceAfter = balanceBefore - price;

      await client.query(
        'UPDATE user_wallets SET balance = $1, total_spent = total_spent + $2, updated_at = NOW() WHERE user_id = $3',
        [balanceAfter, price, userId]
      );

      // Record wallet transaction
      await client.query(`
        INSERT INTO wallet_transactions (user_id, type, amount, balance_before, balance_after, description, reference_type)
        VALUES ($1, 'purchase', $2, $3, $4, $5, 'bot_purchase')
      `, [userId, -price, balanceBefore, balanceAfter, `Bot purchase: ${botData.name}`]);

      // Calculate commissions: 20% platform, 80% seller
      const platformCommission = price * (COMMISSION_RATE / 100);
      const sellerEarnings = price - platformCommission;

      // Generate license key
      const licenseKey = `AE-BOT-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

      // Create purchase record
      const purchase = await client.query(`
        INSERT INTO marketplace_bot_purchases (
          bot_id, buyer_id, seller_id, purchase_type, price_paid,
          platform_commission, seller_earnings, commission_rate,
          license_key, payment_reference, subscription_start,
          subscription_end
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(),
          CASE WHEN $4 = 'subscription' THEN NOW() + INTERVAL '30 days' ELSE NULL END
        ) RETURNING *
      `, [
        botId, userId, botData.seller_id, botData.price_type, price,
        platformCommission, sellerEarnings, COMMISSION_RATE,
        licenseKey, payment_reference || 'wallet_payment'
      ]);

      // Update bot stats
      await client.query(`
        UPDATE marketplace_bots 
        SET total_sales = total_sales + 1, 
            total_revenue = total_revenue + $1,
            active_subscriptions = CASE WHEN $2 = 'subscription' THEN active_subscriptions + 1 ELSE active_subscriptions END
        WHERE id = $3
      `, [price, botData.price_type, botId]);

      // Credit seller wallet
      await client.query(`SELECT record_marketplace_sale($1, $2, $3, 'bot_purchase', $4, $5)`, [
        botData.seller_id, sellerEarnings, COMMISSION_RATE, purchase.rows[0].id, `Bot sale: ${botData.name}`
      ]);

      await client.query('COMMIT');

      auditLog(userId, 'BOT_PURCHASED', { botId, price }, req);

      res.json({ 
        success: true, 
        purchase: purchase.rows[0], 
        licenseKey,
        message: 'Purchase successful!',
        new_balance: balanceAfter
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Purchase bot error:', error);
    res.status(500).json({ error: 'Failed to purchase bot' });
  }
});

// ============================================================================
// SIGNAL PROVIDERS
// ============================================================================

// List signal providers (public)
router.get('/signals/providers', async (req, res) => {
  try {
    const { trading_style, risk_level, sort = 'popular', page = 1, limit = 12 } = req.query;

    let query = `
      SELECT sp.*, 
             u.username,
             u.profile_picture as seller_avatar,
             u.has_blue_badge as seller_verified,
             COALESCE(u.seller_rating_average, 0) as seller_rating,
             COALESCE(u.seller_total_sales, 0) as seller_total_sales
      FROM signal_providers sp
      JOIN users u ON sp.user_id = u.id
      WHERE sp.status = 'approved'
    `;
    const params = [];
    let paramCount = 0;

    if (trading_style) {
      params.push(trading_style);
      query += ` AND sp.trading_style = $${++paramCount}`;
    }
    if (risk_level) {
      params.push(risk_level);
      query += ` AND sp.risk_level = $${++paramCount}`;
    }

    switch (sort) {
      case 'newest':
        query += ' ORDER BY sp.created_at DESC';
        break;
      case 'win_rate':
        query += ' ORDER BY sp.win_rate DESC';
        break;
      case 'pips':
        query += ' ORDER BY sp.total_pips DESC';
        break;
      case 'rating':
        query += ' ORDER BY sp.rating_average DESC';
        break;
      default:
        query += ' ORDER BY sp.subscriber_count DESC';
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(limit, offset);
    query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;

    const providers = await pool.query(query, params);

    res.json({ success: true, providers: providers.rows });
  } catch (error) {
    console.error('List signal providers error:', error);
    res.status(500).json({ error: 'Failed to list signal providers' });
  }
});

// Get provider details
router.get('/signals/providers/:idOrSlug', optionalAuthenticate, async (req, res) => {
  try {
    const { idOrSlug } = req.params;

    // Support both numeric ID and slug
    const isNumeric = /^\d+$/.test(idOrSlug);
    const provider = await pool.query(`
      SELECT sp.*, 
             u.username, 
             u.created_at as member_since,
             u.profile_picture as seller_avatar,
             u.has_blue_badge as seller_verified,
             COALESCE(u.seller_rating_average, 0) as seller_rating,
             COALESCE(u.seller_total_sales, 0) as seller_total_sales
      FROM signal_providers sp
      JOIN users u ON sp.user_id = u.id
      WHERE ${isNumeric ? 'sp.id = $1' : 'sp.slug = $1'} AND sp.status = 'approved'
    `, [isNumeric ? parseInt(idOrSlug) : idOrSlug]);

    if (provider.rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    // Get recent signals (free ones or if subscribed)
    let signals = [];
    const isSubscribed = req.user ? await pool.query(
      'SELECT id FROM signal_provider_subscriptions WHERE provider_id = $1 AND subscriber_id = $2 AND status = $3',
      [provider.rows[0].id, req.user.id, 'active']
    ) : { rows: [] };

    if (isSubscribed.rows.length > 0 || provider.rows[0].is_free) {
      const signalsResult = await pool.query(`
        SELECT * FROM marketplace_signals 
        WHERE provider_id = $1 
        ORDER BY created_at DESC LIMIT 20
      `, [provider.rows[0].id]);
      signals = signalsResult.rows;
    } else {
      // Only show free signals
      const signalsResult = await pool.query(`
        SELECT * FROM marketplace_signals 
        WHERE provider_id = $1 AND is_free = TRUE
        ORDER BY created_at DESC LIMIT 5
      `, [provider.rows[0].id]);
      signals = signalsResult.rows;
    }

    // Get reviews with avatars
    const reviews = await pool.query(`
      SELECT r.id, r.rating, r.title, r.review, r.created_at,
             COALESCE(r.reviewer_name, u.username) as user_name,
             COALESCE(r.reviewer_avatar, u.profile_picture) as avatar
      FROM signal_provider_reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.provider_id = $1
      ORDER BY r.created_at DESC LIMIT 10
    `, [provider.rows[0].id]);

    // Create a sanitized provider object - hide community link unless subscribed
    const providerData = { ...provider.rows[0] };
    const hasActiveSubscription = isSubscribed.rows.length > 0;
    
    if (!hasActiveSubscription) {
      // Hide sensitive community access info from non-subscribers
      delete providerData.community_link;
      delete providerData.community_instructions;
      // Keep community_platform visible so users know what platform they'll get access to
    }

    res.json({
      success: true,
      provider: providerData,
      signals,
      reviews: reviews.rows,
      isSubscribed: hasActiveSubscription,
      // Let user know what they get after subscribing
      accessInfo: hasActiveSubscription ? {
        community_link: provider.rows[0].community_link,
        community_platform: provider.rows[0].community_platform,
        community_instructions: provider.rows[0].community_instructions
      } : null
    });
  } catch (error) {
    console.error('Get provider error:', error);
    res.status(500).json({ error: 'Failed to get provider' });
  }
});

// Become a signal provider (requires subscription)
router.post('/signals/providers', authenticate, requireSellerSubscription, apiLimiter, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      display_name, bio, long_description, trading_style, main_instruments, risk_level,
      monthly_price, quarterly_price, yearly_price, 
      // Community link - where buyers get access after purchase
      community_link, community_platform, community_instructions,
      // Additional details for attractive listing
      experience_years, trading_pairs, signal_frequency, average_signals_per_day,
      screenshots, testimonials, avatar_url, cover_image_url
    } = req.body;

    // Validate required fields for signal listing
    if (!display_name) {
      return res.status(400).json({ error: 'Display name is required' });
    }
    if (!bio || bio.length < 50) {
      return res.status(400).json({ error: 'Bio must be at least 50 characters' });
    }
    if (!community_link) {
      return res.status(400).json({ error: 'Community link (Telegram, WhatsApp, etc.) is required' });
    }
    if (!community_platform) {
      return res.status(400).json({ error: 'Community platform type is required' });
    }

    // Check if already a provider
    const existing = await pool.query('SELECT id FROM signal_providers WHERE user_id = $1', [userId]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'You are already a signal provider' });
    }

    const slug = display_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const result = await pool.query(`
      INSERT INTO signal_providers (
        user_id, display_name, slug, bio, long_description, trading_style, main_instruments,
        risk_level, monthly_price, quarterly_price, yearly_price,
        community_link, community_platform, community_instructions,
        experience_years, trading_pairs, signal_frequency, average_signals_per_day,
        screenshots, testimonials, avatar_url, cover_image_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
      RETURNING *
    `, [
      userId, display_name, `${slug}-${Date.now().toString(36)}`, bio, long_description,
      trading_style, main_instruments || ['XAUUSD'], risk_level || 'moderate',
      monthly_price || 0, quarterly_price || 0, yearly_price || 0,
      community_link, community_platform, community_instructions,
      experience_years || 0, trading_pairs || main_instruments || ['XAUUSD'],
      signal_frequency || 'daily', average_signals_per_day || 5,
      screenshots || [], testimonials || null, avatar_url, cover_image_url
    ]);

    auditLog(userId, 'SIGNAL_PROVIDER_CREATED', { providerId: result.rows[0].id }, req);

    res.status(201).json({ success: true, provider: result.rows[0] });
  } catch (error) {
    console.error('Create signal provider error:', error);
    res.status(500).json({ error: 'Failed to create signal provider profile' });
  }
});

// Subscribe to provider
router.post('/signals/providers/:idOrSlug/subscribe', authenticate, apiLimiter, async (req, res) => {
  try {
    const userId = req.user.id;
    const idOrSlug = req.params.idOrSlug;
    const { plan_type, payment_reference } = req.body;

    // Support both numeric ID and slug
    const isNumeric = /^\d+$/.test(idOrSlug);
    const provider = await pool.query(
      `SELECT * FROM signal_providers WHERE ${isNumeric ? 'id = $1' : 'slug = $1'} AND status = $2`, 
      [isNumeric ? parseInt(idOrSlug) : idOrSlug, 'approved']
    );
    if (provider.rows.length === 0) {
      return res.status(404).json({ error: 'Provider not found' });
    }

    const providerData = provider.rows[0];
    const providerId = providerData.id;

    // Check if already subscribed
    const existingSub = await pool.query(
      'SELECT id FROM signal_provider_subscriptions WHERE provider_id = $1 AND subscriber_id = $2 AND status = $3',
      [providerId, userId, 'active']
    );
    if (existingSub.rows.length > 0) {
      return res.status(400).json({ error: 'You already have an active subscription to this provider' });
    }

    // Get price based on plan
    let price = 0;
    let expiresAt = new Date();
    switch (plan_type) {
      case 'monthly':
        price = parseFloat(providerData.monthly_price) || 0;
        expiresAt.setMonth(expiresAt.getMonth() + 1);
        break;
      case 'quarterly':
        price = parseFloat(providerData.quarterly_price) || 0;
        expiresAt.setMonth(expiresAt.getMonth() + 3);
        break;
      case 'yearly':
        price = parseFloat(providerData.yearly_price) || 0;
        expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        break;
      default:
        return res.status(400).json({ error: 'Invalid plan type' });
    }

    if (price <= 0) {
      return res.status(400).json({ error: 'This plan is not available' });
    }

    // Get or create user wallet
    let wallet = await pool.query('SELECT * FROM user_wallets WHERE user_id = $1', [userId]);
    if (wallet.rows.length === 0) {
      wallet = await pool.query(
        'INSERT INTO user_wallets (user_id, balance) VALUES ($1, 0) RETURNING *',
        [userId]
      );
    }
    const userWallet = wallet.rows[0];

    // Check if wallet is frozen
    if (userWallet.is_frozen) {
      return res.status(400).json({ error: 'Your wallet is frozen. Please contact support.' });
    }

    // Check balance
    if (parseFloat(userWallet.balance) < price) {
      return res.status(400).json({ 
        error: 'Insufficient balance',
        required: price,
        current_balance: parseFloat(userWallet.balance),
        shortfall: price - parseFloat(userWallet.balance)
      });
    }

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Deduct from user wallet
      const balanceBefore = parseFloat(userWallet.balance);
      const balanceAfter = balanceBefore - price;

      await client.query(
        'UPDATE user_wallets SET balance = $1, total_spent = total_spent + $2, updated_at = NOW() WHERE user_id = $3',
        [balanceAfter, price, userId]
      );

      // Record wallet transaction
      await client.query(`
        INSERT INTO wallet_transactions (user_id, type, amount, balance_before, balance_after, description, reference_type)
        VALUES ($1, 'purchase', $2, $3, $4, $5, 'signal_subscription')
      `, [userId, -price, balanceBefore, balanceAfter, `Signal subscription: ${providerData.display_name} (${plan_type})`]);

      // Calculate commissions: 20% platform, 80% provider
      const platformCommission = price * (COMMISSION_RATE / 100);
      const providerEarnings = price - platformCommission;

      // Create subscription
      const subscription = await client.query(`
        INSERT INTO signal_provider_subscriptions (
          provider_id, subscriber_id, plan_type, price_paid,
          platform_commission, provider_earnings, expires_at, payment_reference
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `, [providerId, userId, plan_type, price, platformCommission, providerEarnings, expiresAt, payment_reference || 'wallet_payment']);

      // Update provider stats
      await client.query(`
        UPDATE signal_providers 
        SET subscriber_count = subscriber_count + 1,
            total_revenue = total_revenue + $1
        WHERE id = $2
      `, [price, providerId]);

      // Credit provider wallet
      await client.query(`SELECT record_marketplace_sale($1, $2, $3, 'signal_subscription', $4, $5)`, [
        providerData.user_id, providerEarnings, COMMISSION_RATE, subscription.rows[0].id, `Signal subscription: ${plan_type}`
      ]);

      await client.query('COMMIT');

      auditLog(userId, 'SIGNAL_SUBSCRIPTION_PURCHASED', { providerId, price, plan_type }, req);

      res.json({ 
        success: true, 
        subscription: subscription.rows[0],
        message: 'Subscription successful!',
        new_balance: balanceAfter
      });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Subscribe to provider error:', error);
    res.status(500).json({ error: 'Failed to subscribe' });
  }
});

// Post a signal (for providers)
router.post('/signals', authenticate, apiLimiter, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Verify user is an approved provider
    const provider = await pool.query(
      'SELECT * FROM signal_providers WHERE user_id = $1 AND status = $2',
      [userId, 'approved']
    );
    if (provider.rows.length === 0) {
      return res.status(403).json({ error: 'You are not an approved signal provider' });
    }

    const {
      symbol, signal_type, entry_price, stop_loss,
      take_profit_1, take_profit_2, take_profit_3,
      timeframe, analysis, chart_image_url, is_free
    } = req.body;

    const signal = await pool.query(`
      INSERT INTO marketplace_signals (
        provider_id, symbol, signal_type, entry_price, stop_loss,
        take_profit_1, take_profit_2, take_profit_3,
        timeframe, analysis, chart_image_url, is_free
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      provider.rows[0].id, symbol, signal_type, entry_price, stop_loss,
      take_profit_1, take_profit_2, take_profit_3,
      timeframe, analysis, chart_image_url, is_free || false
    ]);

    // Update provider stats
    await pool.query(`
      UPDATE signal_providers SET total_signals = total_signals + 1 WHERE id = $1
    `, [provider.rows[0].id]);

    res.status(201).json({ success: true, signal: signal.rows[0] });
  } catch (error) {
    console.error('Post signal error:', error);
    res.status(500).json({ error: 'Failed to post signal' });
  }
});

// ============================================================================
// DIGITAL PRODUCTS
// ============================================================================

// List products (public)
router.get('/products', async (req, res) => {
  try {
    const { product_type, category, min_price, max_price, sort = 'popular', page = 1, limit = 12 } = req.query;

    let query = `
      SELECT p.*, 
             u.username as seller_name,
             u.profile_picture as seller_avatar,
             u.has_blue_badge as seller_verified,
             COALESCE(u.seller_rating_average, 0) as seller_rating,
             COALESCE(u.seller_total_sales, 0) as seller_total_sales
      FROM marketplace_products p
      JOIN users u ON p.seller_id = u.id
      WHERE p.status = 'approved'
    `;
    const params = [];
    let paramCount = 0;

    if (product_type) {
      params.push(product_type);
      query += ` AND p.product_type = $${++paramCount}`;
    }
    if (category) {
      params.push(category);
      query += ` AND p.category = $${++paramCount}`;
    }
    if (min_price) {
      params.push(min_price);
      query += ` AND p.price >= $${++paramCount}`;
    }
    if (max_price) {
      params.push(max_price);
      query += ` AND p.price <= $${++paramCount}`;
    }

    switch (sort) {
      case 'newest':
        query += ' ORDER BY p.created_at DESC';
        break;
      case 'price_low':
        query += ' ORDER BY p.price ASC';
        break;
      case 'price_high':
        query += ' ORDER BY p.price DESC';
        break;
      case 'rating':
        query += ' ORDER BY p.rating_average DESC';
        break;
      default:
        query += ' ORDER BY p.total_sales DESC';
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    params.push(limit, offset);
    query += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;

    const products = await pool.query(query, params);

    res.json({ success: true, products: products.rows });
  } catch (error) {
    console.error('List products error:', error);
    res.status(500).json({ error: 'Failed to list products' });
  }
});

// Get single product
router.get('/products/:slug', optionalAuthenticate, async (req, res) => {
  try {
    const { slug } = req.params;

    const product = await pool.query(`
      SELECT p.*, 
             u.username as seller_name,
             u.profile_picture as seller_avatar,
             u.has_blue_badge as seller_verified,
             COALESCE(u.seller_rating_average, 0) as seller_rating,
             COALESCE(u.seller_total_sales, 0) as seller_total_sales
      FROM marketplace_products p
      JOIN users u ON p.seller_id = u.id
      WHERE p.slug = $1 AND p.status = 'approved'
    `, [slug]);

    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Increment view
    await pool.query('UPDATE marketplace_products SET view_count = view_count + 1 WHERE slug = $1', [slug]);

    // Check ownership
    let owned = false;
    if (req.user) {
      const purchase = await pool.query(
        'SELECT id FROM marketplace_product_purchases WHERE product_id = $1 AND buyer_id = $2',
        [product.rows[0].id, req.user.id]
      );
      owned = purchase.rows.length > 0;
    }

    // Get reviews with avatars
    const reviews = await pool.query(`
      SELECT r.id, r.rating, r.title, r.review, r.created_at,
             COALESCE(r.reviewer_name, u.username) as user_name,
             COALESCE(r.reviewer_avatar, u.profile_picture) as avatar
      FROM marketplace_product_reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.product_id = $1
      ORDER BY r.created_at DESC LIMIT 10
    `, [product.rows[0].id]);

    // Create sanitized product object - hide download files unless owned
    const productData = { ...product.rows[0] };
    if (!owned) {
      // Hide sensitive delivery info from non-owners
      delete productData.download_files;
      delete productData.delivery_instructions;
      delete productData.license_terms;
      delete productData.file_url;
      delete productData.additional_files;
    }

    res.json({
      success: true,
      product: productData,
      reviews: reviews.rows,
      owned
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to get product' });
  }
});

// Create product listing (requires subscription)
router.post('/products', authenticate, requireSellerSubscription, apiLimiter, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name, description, short_description, product_type,
      price, compare_at_price, category, subcategory, tags,
      thumbnail_url, preview_images, preview_video_url,
      course_modules, total_duration_minutes,
      // NEW: File uploads for product delivery
      download_files, // [{name, url, size_bytes, file_type}]
      delivery_instructions,
      license_terms
    } = req.body;

    // Validate required fields
    if (!name || !description) {
      return res.status(400).json({ error: 'Name and description are required' });
    }
    if (!description || description.length < 100) {
      return res.status(400).json({ error: 'Description must be at least 100 characters' });
    }
    if (!product_type) {
      return res.status(400).json({ error: 'Product type is required' });
    }
    if (!download_files || download_files.length === 0) {
      return res.status(400).json({ error: 'You must upload at least one file for delivery' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const result = await pool.query(`
      INSERT INTO marketplace_products (
        seller_id, name, slug, description, short_description,
        product_type, price, compare_at_price, category, subcategory, tags,
        thumbnail_url, preview_images, preview_video_url,
        course_modules, total_duration_minutes,
        download_files, delivery_instructions, license_terms
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *
    `, [
      userId, name, `${slug}-${Date.now().toString(36)}`, description, short_description,
      product_type, price, compare_at_price, category, subcategory, tags || [],
      thumbnail_url, preview_images || [], preview_video_url,
      course_modules ? JSON.stringify(course_modules) : null, total_duration_minutes,
      download_files ? JSON.stringify(download_files) : null, delivery_instructions, license_terms
    ]);

    auditLog(userId, 'PRODUCT_LISTING_CREATED', { productId: result.rows[0].id, name }, req);

    res.status(201).json({ success: true, product: result.rows[0] });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Purchase product
router.post('/products/:id/purchase', authenticate, apiLimiter, async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = parseInt(req.params.id);
    const { payment_reference } = req.body;

    const product = await pool.query('SELECT * FROM marketplace_products WHERE id = $1 AND status = $2', [productId, 'approved']);
    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const productData = product.rows[0];

    // Check if already purchased
    const existing = await pool.query(
      'SELECT id FROM marketplace_product_purchases WHERE product_id = $1 AND buyer_id = $2',
      [productId, userId]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'You already own this product' });
    }

    // Calculate commissions: 20% platform, 80% seller
    const platformCommission = productData.price * (COMMISSION_RATE / 100);
    const sellerEarnings = productData.price - platformCommission;

    const purchase = await pool.query(`
      INSERT INTO marketplace_product_purchases (
        product_id, buyer_id, seller_id, price_paid,
        platform_commission, seller_earnings, payment_reference
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [productId, userId, productData.seller_id, productData.price, platformCommission, sellerEarnings, payment_reference]);

    // Update product stats
    await pool.query(`
      UPDATE marketplace_products 
      SET total_sales = total_sales + 1, total_revenue = total_revenue + $1 
      WHERE id = $2
    `, [productData.price, productId]);

    // Credit seller
    await pool.query(`SELECT record_marketplace_sale($1, $2, $3, 'product_purchase', $4, $5)`, [
      productData.seller_id, sellerEarnings, COMMISSION_RATE, purchase.rows[0].id, `Product sale: ${productData.name}`
    ]);

    res.json({ success: true, purchase: purchase.rows[0] });
  } catch (error) {
    console.error('Purchase product error:', error);
    res.status(500).json({ error: 'Failed to purchase product' });
  }
});

// ============================================================================
// API KEYS & MONETIZATION
// ============================================================================

// Get API plans (public) - exclude free tier plans
router.get('/api-plans', async (req, res) => {
  try {
    const plans = await pool.query('SELECT * FROM api_plans WHERE is_active = TRUE AND price_monthly > 0 ORDER BY price_monthly ASC');
    res.json({ success: true, plans: plans.rows });
  } catch (error) {
    console.error('Get API plans error:', error);
    res.status(500).json({ error: 'Failed to get API plans' });
  }
});

// Get user's API keys
router.get('/api-keys', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const keys = await pool.query(`
      SELECT ak.id, ak.key_prefix, ak.name, ak.permissions, ak.is_active,
             ak.requests_today, ak.requests_this_month, ak.last_request_at,
             ak.subscription_status, ak.subscription_end,
             ap.name as plan_name, ap.requests_per_day, ap.requests_per_month
      FROM api_keys ak
      LEFT JOIN api_plans ap ON ak.plan_id = ap.id
      WHERE ak.user_id = $1
      ORDER BY ak.created_at DESC
    `, [userId]);

    res.json({ success: true, keys: keys.rows });
  } catch (error) {
    console.error('Get API keys error:', error);
    res.status(500).json({ error: 'Failed to get API keys' });
  }
});

// Create API key
router.post('/api-keys', authenticate, apiLimiter, async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, plan_id, payment_reference } = req.body;

    // Generate API key
    const rawKey = `ae_${crypto.randomBytes(24).toString('hex')}`;
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');
    const keyPrefix = rawKey.substring(0, 10);

    // Get plan details
    const plan = await pool.query('SELECT * FROM api_plans WHERE id = $1', [plan_id || 1]);
    const planData = plan.rows[0];

    const subscriptionEnd = new Date();
    subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);

    const result = await pool.query(`
      INSERT INTO api_keys (
        user_id, plan_id, key_hash, key_prefix, name,
        subscription_end, payment_reference
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, key_prefix, name, is_active, subscription_status, subscription_end
    `, [userId, plan_id || 1, keyHash, keyPrefix, name || 'My API Key', subscriptionEnd, payment_reference]);

    auditLog(userId, 'API_KEY_CREATED', { keyPrefix, planId: plan_id }, req);

    // Return the raw key ONLY ONCE (user must save it)
    res.status(201).json({
      success: true,
      key: result.rows[0],
      apiKey: rawKey, // Only returned on creation
      warning: 'Save this API key securely. It will not be shown again.'
    });
  } catch (error) {
    console.error('Create API key error:', error);
    res.status(500).json({ error: 'Failed to create API key' });
  }
});

// Revoke API key
router.delete('/api-keys/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const keyId = parseInt(req.params.id);

    const result = await pool.query(`
      UPDATE api_keys 
      SET is_active = FALSE, revoked_at = NOW(), revoke_reason = 'User revoked'
      WHERE id = $1 AND user_id = $2
      RETURNING key_prefix
    `, [keyId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'API key not found' });
    }

    auditLog(userId, 'API_KEY_REVOKED', { keyPrefix: result.rows[0].key_prefix }, req);

    res.json({ success: true, message: 'API key revoked' });
  } catch (error) {
    console.error('Revoke API key error:', error);
    res.status(500).json({ error: 'Failed to revoke API key' });
  }
});

// ============================================================================
// SELLER DASHBOARD
// ============================================================================

// Get seller dashboard
router.get('/seller/dashboard', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user verification status and seller_slug
    const userInfo = await pool.query(`
      SELECT is_verified, verification_pending, profile_image, seller_slug, has_blue_badge 
      FROM users WHERE id = $1
    `, [userId]);

    // Get or create wallet
    const wallet = await pool.query(`
      SELECT * FROM seller_wallets WHERE user_id = $1
    `, [userId]);

    let walletData = wallet.rows[0];
    if (!walletData) {
      const newWallet = await pool.query(`
        INSERT INTO seller_wallets (user_id) VALUES ($1) RETURNING *
      `, [userId]);
      walletData = newWallet.rows[0];
    }

    // Get seller's listings with full pricing info
    const [bots, products, provider] = await Promise.all([
      pool.query(`
        SELECT id, name, slug, thumbnail_url, price, price_type, is_free, 
               status, total_sales, total_revenue, rating_average, rating_count
        FROM marketplace_bots WHERE seller_id = $1
      `, [userId]),
      pool.query(`
        SELECT id, name, slug, thumbnail_url, price, is_free,
               status, total_sales, total_revenue, rating_average, rating_count
        FROM marketplace_products WHERE seller_id = $1
      `, [userId]),
      pool.query(`
        SELECT id, display_name as name, slug, profile_image_url as thumbnail_url,
               monthly_price, quarterly_price, yearly_price, is_free,
               status, subscriber_count, total_revenue, rating_average, rating_count
        FROM signal_providers WHERE user_id = $1
      `, [userId])
    ]);

    // Recent transactions
    const transactions = await pool.query(`
      SELECT * FROM seller_transactions 
      WHERE user_id = $1 
      ORDER BY created_at DESC LIMIT 20
    `, [userId]);

    // Log the raw user info for debugging
    console.log('Raw userInfo:', userInfo.rows[0]);
    
    // Handle PostgreSQL boolean values which might come as strings 't'/'f' or actual booleans
    const isVerified = userInfo.rows[0]?.is_verified === true || 
                       userInfo.rows[0]?.is_verified === 't' ||
                       userInfo.rows[0]?.is_verified === 1 ||
                       userInfo.rows[0]?.has_blue_badge === true || 
                       userInfo.rows[0]?.has_blue_badge === 't' ||
                       userInfo.rows[0]?.has_blue_badge === 1;
    
    const verificationPending = userInfo.rows[0]?.verification_pending === true || 
                                userInfo.rows[0]?.verification_pending === 't' ||
                                userInfo.rows[0]?.verification_pending === 1;
    
    console.log('Computed is_verified:', isVerified); // Debug log

    res.json({
      success: true,
      wallet: walletData,
      listings: {
        bots: bots.rows,
        products: products.rows,
        signalProvider: provider.rows[0] || null
      },
      transactions: transactions.rows,
      verification: {
        is_verified: isVerified,
        verification_pending: verificationPending,
        profile_image: userInfo.rows[0]?.profile_image || null,
        seller_slug: userInfo.rows[0]?.seller_slug || null
      },
      // Also include at top level for easier access
      is_verified: isVerified,
      has_blue_badge: isVerified // Alias for frontend compatibility
    });
  } catch (error) {
    console.error('Get seller dashboard error:', error);
    res.status(500).json({ error: 'Failed to get seller dashboard' });
  }
});

// Request payout
router.post('/seller/payouts', authenticate, apiLimiter, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, payout_method, payout_details } = req.body;

    // Get wallet
    const wallet = await pool.query('SELECT * FROM seller_wallets WHERE user_id = $1', [userId]);
    if (wallet.rows.length === 0) {
      return res.status(400).json({ error: 'No seller wallet found' });
    }

    const walletData = wallet.rows[0];

    if (amount > walletData.available_balance) {
      return res.status(400).json({ error: 'Insufficient available balance' });
    }

    if (amount < walletData.minimum_payout) {
      return res.status(400).json({ error: `Minimum payout is $${walletData.minimum_payout}` });
    }

    // Calculate fee (if any)
    const fee = 0; // Can add withdrawal fees here
    const netAmount = amount - fee;

    // Create payout request
    const payout = await pool.query(`
      INSERT INTO seller_payouts (
        user_id, wallet_id, amount, fee, net_amount, payout_method, payout_details
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [userId, walletData.id, amount, fee, netAmount, payout_method, JSON.stringify(payout_details)]);

    // Deduct from available balance
    await pool.query(`
      UPDATE seller_wallets 
      SET available_balance = available_balance - $1,
          updated_at = NOW()
      WHERE id = $2
    `, [amount, walletData.id]);

    auditLog(userId, 'SELLER_PAYOUT_REQUESTED', { amount, method: payout_method }, req);

    res.json({ success: true, payout: payout.rows[0] });
  } catch (error) {
    console.error('Request payout error:', error);
    res.status(500).json({ error: 'Failed to request payout' });
  }
});

// Admin: Approve seller verification
router.post('/admin/approve-verification/:userId', authenticate, async (req, res) => {
  try {
    const adminId = req.user.id;
    const { userId } = req.params;

    // Check if requester is admin
    const adminCheck = await pool.query(
      'SELECT is_admin FROM users WHERE id = $1',
      [adminId]
    );

    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Approve verification
    const result = await pool.query(
      `UPDATE users 
       SET is_verified = TRUE, verification_pending = FALSE, verified_at = NOW()
       WHERE id = $1
       RETURNING id, email, name`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    auditLog(adminId, 'ADMIN_APPROVED_VERIFICATION', { userId, user: result.rows[0] }, req);

    res.json({ 
      success: true, 
      message: 'Seller verification approved',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Approve verification error:', error);
    res.status(500).json({ error: 'Failed to approve verification' });
  }
});

// Admin: Reject seller verification
router.post('/admin/reject-verification/:userId', authenticate, async (req, res) => {
  try {
    const adminId = req.user.id;
    const { userId } = req.params;
    const { reason } = req.body;

    // Check if requester is admin
    const adminCheck = await pool.query(
      'SELECT is_admin FROM users WHERE id = $1',
      [adminId]
    );

    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Reject verification and refund
    const VERIFICATION_FEE = 50.00;

    // Refund the fee
    await pool.query(
      'UPDATE seller_wallets SET balance = balance + $1 WHERE user_id = $2',
      [VERIFICATION_FEE, userId]
    );

    // Record the refund
    await pool.query(
      `INSERT INTO seller_transactions (user_id, type, amount, description, status)
       VALUES ($1, 'verification_refund', $2, $3, 'completed')`,
      [userId, VERIFICATION_FEE, `Verification rejected: ${reason || 'Does not meet requirements'}`]
    );

    // Clear pending status
    await pool.query(
      'UPDATE users SET verification_pending = FALSE WHERE id = $1',
      [userId]
    );

    auditLog(adminId, 'ADMIN_REJECTED_VERIFICATION', { userId, reason }, req);

    res.json({ 
      success: true, 
      message: 'Verification rejected and fee refunded'
    });
  } catch (error) {
    console.error('Reject verification error:', error);
    res.status(500).json({ error: 'Failed to reject verification' });
  }
});

// Admin: Get pending verifications
router.get('/admin/pending-verifications', authenticate, async (req, res) => {
  try {
    const adminId = req.user.id;

    // Check if requester is admin
    const adminCheck = await pool.query(
      'SELECT is_admin FROM users WHERE id = $1',
      [adminId]
    );

    if (!adminCheck.rows[0]?.is_admin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const pending = await pool.query(`
      SELECT u.id, u.email, u.full_name, u.created_at,
             sw.balance as wallet_balance,
             (SELECT COUNT(*) FROM marketplace_products WHERE seller_id = u.id) as products_count,
             (SELECT COUNT(*) FROM marketplace_bots WHERE seller_id = u.id) as bots_count,
             (SELECT COUNT(*) FROM signal_providers WHERE user_id = u.id) as signals_count
      FROM users u
      LEFT JOIN seller_wallets sw ON sw.user_id = u.id
      WHERE u.verification_pending = TRUE
      ORDER BY u.created_at DESC
    `);

    res.json({ 
      success: true, 
      pendingVerifications: pending.rows
    });
  } catch (error) {
    console.error('Get pending verifications error:', error);
    res.status(500).json({ error: 'Failed to get pending verifications' });
  }
});

// Get categories
router.get('/categories', async (req, res) => {
  try {
    const { marketplace_type } = req.query;
    
    let query = 'SELECT * FROM marketplace_categories WHERE is_active = TRUE';
    const params = [];
    
    if (marketplace_type) {
      params.push(marketplace_type);
      query += ' AND marketplace_type = $1';
    }
    
    query += ' ORDER BY display_order ASC';
    
    const categories = await pool.query(query, params);
    res.json({ success: true, categories: categories.rows });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to get categories' });
  }
});

// User's purchases
router.get('/purchases', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const [bots, products, subscriptions] = await Promise.all([
      pool.query(`
        SELECT bp.*, b.name, b.slug, b.thumbnail_url
        FROM marketplace_bot_purchases bp
        JOIN marketplace_bots b ON bp.bot_id = b.id
        WHERE bp.buyer_id = $1
        ORDER BY bp.created_at DESC
      `, [userId]),
      pool.query(`
        SELECT pp.*, p.name, p.slug, p.thumbnail_url, p.product_type
        FROM marketplace_product_purchases pp
        JOIN marketplace_products p ON pp.product_id = p.id
        WHERE pp.buyer_id = $1
        ORDER BY pp.created_at DESC
      `, [userId]),
      pool.query(`
        SELECT ss.*, sp.display_name, sp.slug, sp.avatar_url,
               sp.community_platform, sp.trading_style, sp.risk_level,
               ss.expires_at as subscription_end,
               CASE WHEN ss.expires_at > NOW() AND ss.status = 'active' THEN 'active' ELSE 'expired' END as subscription_status
        FROM signal_provider_subscriptions ss
        JOIN signal_providers sp ON ss.provider_id = sp.id
        WHERE ss.subscriber_id = $1
        ORDER BY ss.created_at DESC
      `, [userId])
    ]);

    res.json({
      success: true,
      purchases: {
        bots: bots.rows,
        products: products.rows,
        signalSubscriptions: subscriptions.rows
      }
    });
  } catch (error) {
    console.error('Get purchases error:', error);
    res.status(500).json({ error: 'Failed to get purchases' });
  }
});

// ============================================================================
// SELLER PRICE MANAGEMENT - Update prices for existing listings
// ============================================================================

// Update bot price
router.put('/seller/bots/:id/price', authenticate, requireSellerSubscription, async (req, res) => {
  try {
    const userId = req.user.id;
    const botId = parseInt(req.params.id);
    const { price, price_type, subscription_period, change_reason } = req.body;

    // Verify ownership
    const bot = await pool.query(
      'SELECT * FROM marketplace_bots WHERE id = $1 AND seller_id = $2',
      [botId, userId]
    );

    if (bot.rows.length === 0) {
      return res.status(404).json({ error: 'Bot not found or you do not own it' });
    }

    const oldBot = bot.rows[0];

    // Validate price
    if (price !== undefined && (price < 0 || price > 10000)) {
      return res.status(400).json({ error: 'Price must be between $0 and $10,000' });
    }

    // Update the price
    const updates = [];
    const values = [];
    let paramCount = 0;

    if (price !== undefined) {
      updates.push(`price = $${++paramCount}`);
      values.push(price);
    }
    if (price_type) {
      updates.push(`price_type = $${++paramCount}`);
      values.push(price_type);
    }
    if (subscription_period !== undefined) {
      updates.push(`subscription_period = $${++paramCount}`);
      values.push(subscription_period);
    }
    updates.push('updated_at = NOW()');

    values.push(botId);
    const result = await pool.query(
      `UPDATE marketplace_bots SET ${updates.join(', ')} WHERE id = $${++paramCount} RETURNING *`,
      values
    );

    // Log the price change
    await pool.query(`
      INSERT INTO price_history (bot_id, old_price, new_price, old_price_type, new_price_type, changed_by, change_reason)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [botId, oldBot.price, price || oldBot.price, oldBot.price_type, price_type || oldBot.price_type, userId, change_reason]);

    auditLog(userId, 'BOT_PRICE_UPDATED', { botId, oldPrice: oldBot.price, newPrice: price }, req);

    res.json({ success: true, bot: result.rows[0], message: 'Price updated successfully' });
  } catch (error) {
    console.error('Update bot price error:', error);
    res.status(500).json({ error: 'Failed to update price' });
  }
});

// Update product price
router.put('/seller/products/:id/price', authenticate, requireSellerSubscription, async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = parseInt(req.params.id);
    const { price, compare_at_price, change_reason } = req.body;

    // Verify ownership
    const product = await pool.query(
      'SELECT * FROM marketplace_products WHERE id = $1 AND seller_id = $2',
      [productId, userId]
    );

    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found or you do not own it' });
    }

    const oldProduct = product.rows[0];

    // Validate price
    if (price !== undefined && (price < 0 || price > 5000)) {
      return res.status(400).json({ error: 'Price must be between $0 and $5,000' });
    }

    // Update the price
    const updates = [];
    const values = [];
    let paramCount = 0;

    if (price !== undefined) {
      updates.push(`price = $${++paramCount}`);
      values.push(price);
    }
    if (compare_at_price !== undefined) {
      updates.push(`compare_at_price = $${++paramCount}`);
      values.push(compare_at_price);
    }
    updates.push('updated_at = NOW()');

    values.push(productId);
    const result = await pool.query(
      `UPDATE marketplace_products SET ${updates.join(', ')} WHERE id = $${++paramCount} RETURNING *`,
      values
    );

    // Log the price change
    await pool.query(`
      INSERT INTO price_history (product_id, old_price, new_price, changed_by, change_reason)
      VALUES ($1, $2, $3, $4, $5)
    `, [productId, oldProduct.price, price || oldProduct.price, userId, change_reason]);

    auditLog(userId, 'PRODUCT_PRICE_UPDATED', { productId, oldPrice: oldProduct.price, newPrice: price }, req);

    res.json({ success: true, product: result.rows[0], message: 'Price updated successfully' });
  } catch (error) {
    console.error('Update product price error:', error);
    res.status(500).json({ error: 'Failed to update price' });
  }
});

// Update signal provider pricing
router.put('/seller/signals/price', authenticate, requireSellerSubscription, async (req, res) => {
  try {
    const userId = req.user.id;
    const { monthly_price, quarterly_price, yearly_price, is_free, change_reason } = req.body;

    // Get provider
    const provider = await pool.query(
      'SELECT * FROM signal_providers WHERE user_id = $1',
      [userId]
    );

    if (provider.rows.length === 0) {
      return res.status(404).json({ error: 'You are not a signal provider' });
    }

    const oldProvider = provider.rows[0];

    // Validate prices
    if (monthly_price !== undefined && (monthly_price < 0 || monthly_price > 500)) {
      return res.status(400).json({ error: 'Monthly price must be between $0 and $500' });
    }

    // Update pricing
    const result = await pool.query(`
      UPDATE signal_providers 
      SET monthly_price = COALESCE($1, monthly_price),
          quarterly_price = COALESCE($2, quarterly_price),
          yearly_price = COALESCE($3, yearly_price),
          is_free = COALESCE($4, is_free),
          updated_at = NOW()
      WHERE user_id = $5
      RETURNING *
    `, [monthly_price, quarterly_price, yearly_price, is_free, userId]);

    // Log the price change
    await pool.query(`
      INSERT INTO price_history (provider_id, old_price, new_price, changed_by, change_reason)
      VALUES ($1, $2, $3, $4, $5)
    `, [oldProvider.id, oldProvider.monthly_price, monthly_price || oldProvider.monthly_price, userId, change_reason]);

    auditLog(userId, 'SIGNAL_PRICE_UPDATED', { oldPrice: oldProvider.monthly_price, newPrice: monthly_price }, req);

    res.json({ success: true, provider: result.rows[0], message: 'Pricing updated successfully' });
  } catch (error) {
    console.error('Update signal pricing error:', error);
    res.status(500).json({ error: 'Failed to update pricing' });
  }
});

// ============================================================================
// PRODUCT DELIVERABLES MANAGEMENT
// ============================================================================

// Add deliverable to a product
router.post('/seller/deliverables', authenticate, requireSellerSubscription, async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      bot_id, product_id, provider_id,
      deliverable_type, name, description,
      file_url, file_name, file_size_bytes, file_type,
      access_url, invite_code, api_endpoint,
      requires_license, max_downloads, access_duration_days, display_order
    } = req.body;

    // Verify ownership
    if (bot_id) {
      const bot = await pool.query('SELECT id FROM marketplace_bots WHERE id = $1 AND seller_id = $2', [bot_id, userId]);
      if (bot.rows.length === 0) return res.status(403).json({ error: 'Not authorized' });
    }
    if (product_id) {
      const product = await pool.query('SELECT id FROM marketplace_products WHERE id = $1 AND seller_id = $2', [product_id, userId]);
      if (product.rows.length === 0) return res.status(403).json({ error: 'Not authorized' });
    }
    if (provider_id) {
      const provider = await pool.query('SELECT id FROM signal_providers WHERE id = $1 AND user_id = $2', [provider_id, userId]);
      if (provider.rows.length === 0) return res.status(403).json({ error: 'Not authorized' });
    }

    const result = await pool.query(`
      INSERT INTO product_deliverables (
        bot_id, product_id, provider_id, deliverable_type, name, description,
        file_url, file_name, file_size_bytes, file_type,
        access_url, invite_code, api_endpoint,
        requires_license, max_downloads, access_duration_days, display_order
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `, [
      bot_id, product_id, provider_id, deliverable_type, name, description,
      file_url, file_name, file_size_bytes, file_type,
      access_url, invite_code, api_endpoint,
      requires_license, max_downloads, access_duration_days, display_order || 0
    ]);

    res.status(201).json({ success: true, deliverable: result.rows[0] });
  } catch (error) {
    console.error('Add deliverable error:', error);
    res.status(500).json({ error: 'Failed to add deliverable' });
  }
});

// Get deliverables for a product (seller view)
router.get('/seller/deliverables', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { bot_id, product_id, provider_id } = req.query;

    let query = `
      SELECT pd.* FROM product_deliverables pd
    `;
    const params = [];
    let paramCount = 0;

    if (bot_id) {
      query += `
        JOIN marketplace_bots b ON pd.bot_id = b.id
        WHERE pd.bot_id = $${++paramCount} AND b.seller_id = $${++paramCount}
      `;
      params.push(bot_id, userId);
    } else if (product_id) {
      query += `
        JOIN marketplace_products p ON pd.product_id = p.id
        WHERE pd.product_id = $${++paramCount} AND p.seller_id = $${++paramCount}
      `;
      params.push(product_id, userId);
    } else if (provider_id) {
      query += `
        JOIN signal_providers sp ON pd.provider_id = sp.id
        WHERE pd.provider_id = $${++paramCount} AND sp.user_id = $${++paramCount}
      `;
      params.push(provider_id, userId);
    } else {
      return res.status(400).json({ error: 'Must specify bot_id, product_id, or provider_id' });
    }

    query += ' ORDER BY pd.display_order ASC';

    const deliverables = await pool.query(query, params);
    res.json({ success: true, deliverables: deliverables.rows });
  } catch (error) {
    console.error('Get deliverables error:', error);
    res.status(500).json({ error: 'Failed to get deliverables' });
  }
});

// Update a deliverable
router.put('/seller/deliverables/:id', authenticate, requireSellerSubscription, async (req, res) => {
  try {
    const userId = req.user.id;
    const deliverableId = parseInt(req.params.id);
    const updates = req.body;

    // Verify ownership through the associated product
    const deliverable = await pool.query(`
      SELECT pd.*, 
             b.seller_id as bot_seller, 
             p.seller_id as product_seller,
             sp.user_id as provider_user
      FROM product_deliverables pd
      LEFT JOIN marketplace_bots b ON pd.bot_id = b.id
      LEFT JOIN marketplace_products p ON pd.product_id = p.id
      LEFT JOIN signal_providers sp ON pd.provider_id = sp.id
      WHERE pd.id = $1
    `, [deliverableId]);

    if (deliverable.rows.length === 0) {
      return res.status(404).json({ error: 'Deliverable not found' });
    }

    const d = deliverable.rows[0];
    const ownerId = d.bot_seller || d.product_seller || d.provider_user;
    if (ownerId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Build update query
    const allowedFields = ['name', 'description', 'file_url', 'file_name', 'file_size_bytes', 
                           'file_type', 'access_url', 'invite_code', 'max_downloads', 
                           'access_duration_days', 'display_order', 'is_active'];
    const setClauses = [];
    const values = [];
    let paramCount = 0;

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        setClauses.push(`${field} = $${++paramCount}`);
        values.push(updates[field]);
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    setClauses.push('updated_at = NOW()');
    values.push(deliverableId);

    const result = await pool.query(
      `UPDATE product_deliverables SET ${setClauses.join(', ')} WHERE id = $${++paramCount} RETURNING *`,
      values
    );

    res.json({ success: true, deliverable: result.rows[0] });
  } catch (error) {
    console.error('Update deliverable error:', error);
    res.status(500).json({ error: 'Failed to update deliverable' });
  }
});

// Delete a deliverable
router.delete('/seller/deliverables/:id', authenticate, requireSellerSubscription, async (req, res) => {
  try {
    const userId = req.user.id;
    const deliverableId = parseInt(req.params.id);

    // Verify ownership
    const deliverable = await pool.query(`
      SELECT pd.*, 
             b.seller_id as bot_seller, 
             p.seller_id as product_seller,
             sp.user_id as provider_user
      FROM product_deliverables pd
      LEFT JOIN marketplace_bots b ON pd.bot_id = b.id
      LEFT JOIN marketplace_products p ON pd.product_id = p.id
      LEFT JOIN signal_providers sp ON pd.provider_id = sp.id
      WHERE pd.id = $1
    `, [deliverableId]);

    if (deliverable.rows.length === 0) {
      return res.status(404).json({ error: 'Deliverable not found' });
    }

    const d = deliverable.rows[0];
    const ownerId = d.bot_seller || d.product_seller || d.provider_user;
    if (ownerId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await pool.query('DELETE FROM product_deliverables WHERE id = $1', [deliverableId]);

    res.json({ success: true, message: 'Deliverable deleted' });
  } catch (error) {
    console.error('Delete deliverable error:', error);
    res.status(500).json({ error: 'Failed to delete deliverable' });
  }
});

// ============================================================================
// BUYER PRODUCT ACCESS & DOWNLOADS
// ============================================================================

// Get my purchased product with deliverables (buyer view)
router.get('/purchases/:type/:id/access', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, id } = req.params;
    const itemId = parseInt(id);

    let purchase, deliverables, accessInfo, downloadFiles;

    if (type === 'bot') {
      // Verify purchase
      purchase = await pool.query(`
        SELECT bp.*, b.name, b.slug, b.thumbnail_url, b.setup_instructions,
               b.installation_guide_url, b.documentation_url, b.support_email, b.support_telegram,
               b.supported_platforms, b.supported_pairs, b.bot_version, b.includes_source_code,
               b.download_files, b.delivery_instructions, b.setup_guide
        FROM marketplace_bot_purchases bp
        JOIN marketplace_bots b ON bp.bot_id = b.id
        WHERE bp.bot_id = $1 AND bp.buyer_id = $2
      `, [itemId, userId]);

      if (purchase.rows.length === 0) {
        return res.status(403).json({ error: 'You have not purchased this bot' });
      }

      // Get download files from bot record
      downloadFiles = purchase.rows[0].download_files;

      // Get deliverables (legacy support)
      deliverables = await pool.query(`
        SELECT * FROM product_deliverables 
        WHERE bot_id = $1 AND is_active = TRUE
        ORDER BY display_order ASC
      `, [itemId]);

      // Get access info
      accessInfo = await pool.query(`
        SELECT * FROM user_product_access 
        WHERE bot_purchase_id = $1
      `, [purchase.rows[0].id]);

    } else if (type === 'product') {
      purchase = await pool.query(`
        SELECT pp.*, p.name, p.slug, p.thumbnail_url, p.product_type,
               p.delivery_instructions, p.support_email, p.course_modules,
               p.total_duration_minutes, p.download_files, p.license_terms
        FROM marketplace_product_purchases pp
        JOIN marketplace_products p ON pp.product_id = p.id
        WHERE pp.product_id = $1 AND pp.buyer_id = $2
      `, [itemId, userId]);

      if (purchase.rows.length === 0) {
        return res.status(403).json({ error: 'You have not purchased this product' });
      }

      // Get download files from product record
      downloadFiles = purchase.rows[0].download_files;

      deliverables = await pool.query(`
        SELECT * FROM product_deliverables 
        WHERE product_id = $1 AND is_active = TRUE
        ORDER BY display_order ASC
      `, [itemId]);

      accessInfo = await pool.query(`
        SELECT * FROM user_product_access 
        WHERE product_purchase_id = $1
      `, [purchase.rows[0].id]);

    } else if (type === 'signal') {
      purchase = await pool.query(`
        SELECT ss.*, sp.display_name, sp.slug, sp.avatar_url,
               sp.community_link, sp.community_platform, sp.community_instructions,
               sp.telegram_channel, sp.twitter_handle, sp.website_url
        FROM signal_provider_subscriptions ss
        JOIN signal_providers sp ON ss.provider_id = sp.id
        WHERE ss.provider_id = $1 AND ss.subscriber_id = $2 AND ss.status = 'active'
      `, [itemId, userId]);

      if (purchase.rows.length === 0) {
        return res.status(403).json({ error: 'You do not have an active subscription' });
      }

      // For signals, the "download" is the community link
      downloadFiles = null; // No file downloads for signals

      deliverables = await pool.query(`
        SELECT * FROM product_deliverables 
        WHERE provider_id = $1 AND is_active = TRUE
        ORDER BY display_order ASC
      `, [itemId]);

      accessInfo = await pool.query(`
        SELECT * FROM user_product_access 
        WHERE signal_subscription_id = $1
      `, [purchase.rows[0].id]);

    } else {
      return res.status(400).json({ error: 'Invalid product type' });
    }

    res.json({
      success: true,
      purchase: purchase.rows[0],
      download_files: downloadFiles, // Files to download (products/bots)
      deliverables: deliverables.rows,
      access: accessInfo.rows[0] || null,
      whatYouGet: generateWhatYouGet(type, purchase.rows[0], deliverables.rows)
    });
  } catch (error) {
    console.error('Get purchase access error:', error);
    res.status(500).json({ error: 'Failed to get purchase access' });
  }
});

// Helper function to generate "What You Get" summary
function generateWhatYouGet(type, purchase, deliverables) {
  const items = [];

  if (type === 'bot') {
    items.push({ icon: '🤖', text: `${purchase.name} Trading Bot (v${purchase.bot_version || '1.0'})` });
    items.push({ icon: '🔑', text: `License Key: ${purchase.license_key}` });
    if (purchase.supported_platforms?.length) {
      items.push({ icon: '💻', text: `Platforms: ${purchase.supported_platforms.join(', ')}` });
    }
    if (purchase.supported_pairs?.length) {
      items.push({ icon: '📊', text: `Trading Pairs: ${purchase.supported_pairs.join(', ')}` });
    }
    if (purchase.includes_source_code) {
      items.push({ icon: '📝', text: 'Source Code Included' });
    }
    if (purchase.setup_instructions) {
      items.push({ icon: '📋', text: 'Step-by-step Setup Instructions' });
    }
    if (purchase.documentation_url) {
      items.push({ icon: '📚', text: 'Full Documentation' });
    }
    if (purchase.support_email || purchase.support_telegram) {
      items.push({ icon: '💬', text: 'Seller Support Access' });
    }
  } else if (type === 'product') {
    items.push({ icon: '📦', text: purchase.name });
    if (purchase.product_type === 'course' || purchase.product_type === 'video_course') {
      items.push({ icon: '🎬', text: `Video Course (${purchase.total_duration_minutes || 0} minutes)` });
      if (purchase.course_modules?.length) {
        items.push({ icon: '📚', text: `${purchase.course_modules.length} Modules` });
      }
    }
    if (purchase.delivery_instructions) {
      items.push({ icon: '📋', text: 'Delivery Instructions' });
    }
    if (purchase.support_email) {
      items.push({ icon: '💬', text: 'Email Support' });
    }
  } else if (type === 'signal') {
    items.push({ icon: '📡', text: `${purchase.display_name} Signals` });
    
    // Prominent community access
    if (purchase.community_link) {
      const platformEmoji = 
        purchase.community_platform?.toLowerCase() === 'telegram' ? '✈️' :
        purchase.community_platform?.toLowerCase() === 'discord' ? '🎮' :
        purchase.community_platform?.toLowerCase() === 'whatsapp' ? '💬' :
        '🔗';
      items.push({ 
        icon: platformEmoji, 
        text: `${purchase.community_platform || 'Community'} Access Included`,
        description: 'Click "Access Signals" to get your invite link'
      });
    }
    
    if (purchase.telegram_channel) {
      items.push({ icon: '✈️', text: 'Telegram Channel Access' });
    }
    if (purchase.signal_delivery_method?.includes('discord') && purchase.discord_invite_link) {
      items.push({ icon: '🎮', text: 'Discord Server Access' });
    }
    if (purchase.analysis_included) {
      items.push({ icon: '📈', text: 'Trade Analysis & Reasoning' });
    }
    if (purchase.educational_content) {
      items.push({ icon: '🎓', text: 'Educational Content' });
    }
    items.push({ icon: '⏰', text: 'Real-time Signal Alerts' });
  }

  // Add deliverables
  for (const d of deliverables) {
    let icon = '📎';
    if (d.deliverable_type === 'download_file') icon = '⬇️';
    else if (d.deliverable_type === 'video_tutorial') icon = '🎬';
    else if (d.deliverable_type === 'setup_guide') icon = '📋';
    else if (d.deliverable_type === 'telegram_invite') icon = '✈️';
    else if (d.deliverable_type === 'discord_invite') icon = '🎮';
    else if (d.deliverable_type === 'api_key') icon = '🔐';
    else if (d.deliverable_type === 'source_code') icon = '💻';
    
    items.push({ icon, text: d.name, description: d.description });
  }

  return items;
}

// Download a deliverable file
router.get('/downloads/:deliverableId', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const deliverableId = parseInt(req.params.deliverableId);

    // Get the deliverable
    const deliverable = await pool.query(`
      SELECT pd.*, 
             mbp.id as bot_purchase_id, mbp.buyer_id as bot_buyer,
             mpp.id as product_purchase_id, mpp.buyer_id as product_buyer,
             ss.id as sub_id, ss.subscriber_id as signal_subscriber
      FROM product_deliverables pd
      LEFT JOIN marketplace_bot_purchases mbp ON pd.bot_id = mbp.bot_id AND mbp.buyer_id = $2
      LEFT JOIN marketplace_product_purchases mpp ON pd.product_id = mpp.product_id AND mpp.buyer_id = $2
      LEFT JOIN signal_provider_subscriptions ss ON pd.provider_id = ss.provider_id AND ss.subscriber_id = $2 AND ss.status = 'active'
      WHERE pd.id = $1
    `, [deliverableId, userId]);

    if (deliverable.rows.length === 0) {
      return res.status(404).json({ error: 'Deliverable not found' });
    }

    const d = deliverable.rows[0];

    // Check if user has purchased the associated product
    const hasAccess = d.bot_buyer === userId || d.product_buyer === userId || d.signal_subscriber === userId;
    if (!hasAccess) {
      return res.status(403).json({ error: 'You do not have access to this download' });
    }

    // Check download limits
    if (d.max_downloads) {
      const downloadCount = await pool.query(
        'SELECT COUNT(*) FROM download_logs WHERE deliverable_id = $1 AND user_id = $2',
        [deliverableId, userId]
      );
      if (parseInt(downloadCount.rows[0].count) >= d.max_downloads) {
        return res.status(403).json({ error: 'Download limit reached' });
      }
    }

    // Generate download token
    const downloadToken = crypto.randomBytes(32).toString('hex');

    // Log the download
    await pool.query(`
      INSERT INTO download_logs (user_id, deliverable_id, file_name, file_size_bytes, ip_address, user_agent, download_token)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [userId, deliverableId, d.file_name, d.file_size_bytes, req.ip, req.headers['user-agent'], downloadToken]);

    // Update download counts
    if (d.bot_purchase_id) {
      await pool.query('UPDATE marketplace_bot_purchases SET download_count = download_count + 1, last_download_at = NOW() WHERE id = $1', [d.bot_purchase_id]);
    }
    if (d.product_purchase_id) {
      await pool.query('UPDATE marketplace_product_purchases SET download_count = download_count + 1, last_accessed_at = NOW() WHERE id = $1', [d.product_purchase_id]);
    }

    // Return the download URL (in production, this would be a signed URL from cloud storage)
    res.json({
      success: true,
      download: {
        url: d.file_url,
        fileName: d.file_name,
        fileSize: d.file_size_bytes,
        fileType: d.file_type,
        token: downloadToken,
        expiresIn: 3600 // 1 hour
      }
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to process download' });
  }
});

// Get price history for a product (public)
router.get('/price-history/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const itemId = parseInt(id);

    let query;
    if (type === 'bot') {
      query = 'SELECT * FROM price_history WHERE bot_id = $1 ORDER BY created_at DESC LIMIT 10';
    } else if (type === 'product') {
      query = 'SELECT * FROM price_history WHERE product_id = $1 ORDER BY created_at DESC LIMIT 10';
    } else if (type === 'signal') {
      query = 'SELECT * FROM price_history WHERE provider_id = $1 ORDER BY created_at DESC LIMIT 10';
    } else {
      return res.status(400).json({ error: 'Invalid type' });
    }

    const history = await pool.query(query, [itemId]);
    res.json({ success: true, history: history.rows });
  } catch (error) {
    console.error('Get price history error:', error);
    res.status(500).json({ error: 'Failed to get price history' });
  }
});

// ============================================================================
// BUYER REVIEW ENDPOINTS
// ============================================================================

/**
 * POST /api/marketplace/reviews/:type/:id
 * Submit a review for a purchased product or bot
 */
router.post('/reviews/:type/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, id } = req.params;
    const itemId = parseInt(id);
    const { rating, title, review } = req.body;

    // Validate input
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }
    if (!review || review.trim().length < 10) {
      return res.status(400).json({ error: 'Review must be at least 10 characters' });
    }

    // Get user info for reviewer name and avatar
    const user = await pool.query(
      'SELECT username, profile_picture FROM users WHERE id = $1',
      [userId]
    );
    const reviewer = user.rows[0];

    if (type === 'bot') {
      // Verify purchase
      const purchase = await pool.query(
        'SELECT id FROM marketplace_bot_purchases WHERE bot_id = $1 AND buyer_id = $2',
        [itemId, userId]
      );
      if (purchase.rows.length === 0) {
        return res.status(403).json({ error: 'You must purchase this bot before reviewing' });
      }

      // Check if already reviewed
      const existing = await pool.query(
        'SELECT id FROM marketplace_bot_reviews WHERE bot_id = $1 AND user_id = $2',
        [itemId, userId]
      );
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'You have already reviewed this bot' });
      }

      // Insert review
      await pool.query(`
        INSERT INTO marketplace_bot_reviews (bot_id, user_id, rating, title, review, reviewer_name, reviewer_avatar, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'approved')
      `, [itemId, userId, rating, title || '', review, reviewer?.username, reviewer?.profile_picture]);

      // Update average rating
      await pool.query(`
        UPDATE marketplace_bots SET 
          rating_average = (SELECT COALESCE(AVG(rating), 0) FROM marketplace_bot_reviews WHERE bot_id = $1 AND status = 'approved'),
          rating_count = (SELECT COUNT(*) FROM marketplace_bot_reviews WHERE bot_id = $1 AND status = 'approved')
        WHERE id = $1
      `, [itemId]);

      res.json({ success: true, message: 'Review submitted successfully' });

    } else if (type === 'product') {
      // Verify purchase
      const purchase = await pool.query(
        'SELECT id FROM marketplace_product_purchases WHERE product_id = $1 AND buyer_id = $2',
        [itemId, userId]
      );
      if (purchase.rows.length === 0) {
        return res.status(403).json({ error: 'You must purchase this product before reviewing' });
      }

      // Check if already reviewed
      const existing = await pool.query(
        'SELECT id FROM marketplace_product_reviews WHERE product_id = $1 AND user_id = $2',
        [itemId, userId]
      );
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'You have already reviewed this product' });
      }

      // Insert review
      await pool.query(`
        INSERT INTO marketplace_product_reviews (product_id, user_id, rating, title, review, reviewer_name, reviewer_avatar, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'approved')
      `, [itemId, userId, rating, title || '', review, reviewer?.username, reviewer?.profile_picture]);

      // Update average rating
      await pool.query(`
        UPDATE marketplace_products SET 
          rating_average = (SELECT COALESCE(AVG(rating), 0) FROM marketplace_product_reviews WHERE product_id = $1 AND status = 'approved'),
          rating_count = (SELECT COUNT(*) FROM marketplace_product_reviews WHERE product_id = $1 AND status = 'approved')
        WHERE id = $1
      `, [itemId]);

      res.json({ success: true, message: 'Review submitted successfully' });

    } else if (type === 'signal') {
      // Verify subscription
      const subscription = await pool.query(
        'SELECT id FROM signal_provider_subscriptions WHERE provider_id = $1 AND subscriber_id = $2',
        [itemId, userId]
      );
      if (subscription.rows.length === 0) {
        return res.status(403).json({ error: 'You must subscribe to this provider before reviewing' });
      }

      // Check if already reviewed
      const existing = await pool.query(
        'SELECT id FROM signal_provider_reviews WHERE provider_id = $1 AND user_id = $2',
        [itemId, userId]
      );
      if (existing.rows.length > 0) {
        return res.status(400).json({ error: 'You have already reviewed this signal provider' });
      }

      // Insert review
      await pool.query(`
        INSERT INTO signal_provider_reviews (provider_id, user_id, rating, title, review, reviewer_name, reviewer_avatar, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'approved')
      `, [itemId, userId, rating, title || '', review, reviewer?.username, reviewer?.profile_picture]);

      // Update average rating
      await pool.query(`
        UPDATE signal_providers SET 
          rating_average = (SELECT COALESCE(AVG(rating), 0) FROM signal_provider_reviews WHERE provider_id = $1 AND status = 'approved'),
          rating_count = (SELECT COUNT(*) FROM signal_provider_reviews WHERE provider_id = $1 AND status = 'approved')
        WHERE id = $1
      `, [itemId]);

      res.json({ success: true, message: 'Review submitted successfully' });

    } else {
      return res.status(400).json({ error: 'Invalid type. Use bot, product, or signal' });
    }
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

/**
 * GET /api/marketplace/reviews/:type/:id/check
 * Check if user can review and if they have already reviewed
 */
router.get('/reviews/:type/:id/check', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, id } = req.params;
    const itemId = parseInt(id);

    let hasPurchased = false;
    let hasReviewed = false;
    let existingReview = null;

    if (type === 'bot') {
      const purchase = await pool.query(
        'SELECT id FROM marketplace_bot_purchases WHERE bot_id = $1 AND buyer_id = $2',
        [itemId, userId]
      );
      hasPurchased = purchase.rows.length > 0;

      const review = await pool.query(
        'SELECT * FROM marketplace_bot_reviews WHERE bot_id = $1 AND user_id = $2',
        [itemId, userId]
      );
      hasReviewed = review.rows.length > 0;
      existingReview = review.rows[0] || null;

    } else if (type === 'product') {
      const purchase = await pool.query(
        'SELECT id FROM marketplace_product_purchases WHERE product_id = $1 AND buyer_id = $2',
        [itemId, userId]
      );
      hasPurchased = purchase.rows.length > 0;

      const review = await pool.query(
        'SELECT * FROM marketplace_product_reviews WHERE product_id = $1 AND user_id = $2',
        [itemId, userId]
      );
      hasReviewed = review.rows.length > 0;
      existingReview = review.rows[0] || null;

    } else if (type === 'signal') {
      const subscription = await pool.query(
        'SELECT id FROM signal_provider_subscriptions WHERE provider_id = $1 AND subscriber_id = $2',
        [itemId, userId]
      );
      hasPurchased = subscription.rows.length > 0;

      const review = await pool.query(
        'SELECT * FROM signal_provider_reviews WHERE provider_id = $1 AND user_id = $2',
        [itemId, userId]
      );
      hasReviewed = review.rows.length > 0;
      existingReview = review.rows[0] || null;

    } else {
      return res.status(400).json({ error: 'Invalid type' });
    }

    res.json({
      success: true,
      canReview: hasPurchased && !hasReviewed,
      hasPurchased,
      hasReviewed,
      existingReview
    });
  } catch (error) {
    console.error('Check review error:', error);
    res.status(500).json({ error: 'Failed to check review status' });
  }
});

/**
 * PUT /api/marketplace/reviews/:type/:reviewId
 * Update an existing review
 */
router.put('/reviews/:type/:reviewId', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, reviewId } = req.params;
    const { rating, title, review } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    let tableName, idColumn;
    if (type === 'bot') {
      tableName = 'marketplace_bot_reviews';
      idColumn = 'bot_id';
    } else if (type === 'product') {
      tableName = 'marketplace_product_reviews';
      idColumn = 'product_id';
    } else if (type === 'signal') {
      tableName = 'signal_provider_reviews';
      idColumn = 'provider_id';
    } else {
      return res.status(400).json({ error: 'Invalid type' });
    }

    // Verify ownership
    const existing = await pool.query(
      `SELECT ${idColumn} as item_id FROM ${tableName} WHERE id = $1 AND user_id = $2`,
      [reviewId, userId]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found or you do not own it' });
    }

    const itemId = existing.rows[0].item_id;

    // Update review
    await pool.query(`
      UPDATE ${tableName} SET rating = $1, title = $2, review = $3, updated_at = NOW()
      WHERE id = $4 AND user_id = $5
    `, [rating, title || '', review, reviewId, userId]);

    // Update average rating
    if (type === 'bot') {
      await pool.query(`
        UPDATE marketplace_bots SET 
          rating_average = (SELECT COALESCE(AVG(rating), 0) FROM marketplace_bot_reviews WHERE bot_id = $1 AND status = 'approved')
        WHERE id = $1
      `, [itemId]);
    } else if (type === 'product') {
      await pool.query(`
        UPDATE marketplace_products SET 
          rating_average = (SELECT COALESCE(AVG(rating), 0) FROM marketplace_product_reviews WHERE product_id = $1 AND status = 'approved')
        WHERE id = $1
      `, [itemId]);
    } else if (type === 'signal') {
      await pool.query(`
        UPDATE signal_providers SET 
          rating_average = (SELECT COALESCE(AVG(rating), 0) FROM signal_provider_reviews WHERE provider_id = $1 AND status = 'approved')
        WHERE id = $1
      `, [itemId]);
    }

    res.json({ success: true, message: 'Review updated successfully' });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ error: 'Failed to update review' });
  }
});

/**
 * DELETE /api/marketplace/reviews/:type/:reviewId
 * Delete a review
 */
router.delete('/reviews/:type/:reviewId', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { type, reviewId } = req.params;

    let tableName, idColumn, updateTable;
    if (type === 'bot') {
      tableName = 'marketplace_bot_reviews';
      idColumn = 'bot_id';
      updateTable = 'marketplace_bots';
    } else if (type === 'product') {
      tableName = 'marketplace_product_reviews';
      idColumn = 'product_id';
      updateTable = 'marketplace_products';
    } else if (type === 'signal') {
      tableName = 'signal_provider_reviews';
      idColumn = 'provider_id';
      updateTable = 'signal_providers';
    } else {
      return res.status(400).json({ error: 'Invalid type' });
    }

    // Get item ID before deletion
    const existing = await pool.query(
      `SELECT ${idColumn} as item_id FROM ${tableName} WHERE id = $1 AND user_id = $2`,
      [reviewId, userId]
    );
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found or you do not own it' });
    }

    const itemId = existing.rows[0].item_id;

    // Delete review
    await pool.query(`DELETE FROM ${tableName} WHERE id = $1 AND user_id = $2`, [reviewId, userId]);

    // Update average rating
    await pool.query(`
      UPDATE ${updateTable} SET 
        rating_average = (SELECT COALESCE(AVG(rating), 0) FROM ${tableName} WHERE ${idColumn} = $1 AND status = 'approved'),
        rating_count = (SELECT COUNT(*) FROM ${tableName} WHERE ${idColumn} = $1 AND status = 'approved')
      WHERE id = $1
    `, [itemId]);

    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

export default router;
