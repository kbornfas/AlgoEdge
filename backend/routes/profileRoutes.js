import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Configure multer for seller media uploads (images and videos)
const sellerMediaStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'seller-media');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `media-${req.user?.id || 'unknown'}-${uniqueSuffix}${ext}`);
  }
});

const sellerMediaUpload = multer({
  storage: sellerMediaStorage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit for videos
  fileFilter: (req, file, cb) => {
    const imageTypes = /jpeg|jpg|png|gif|webp/;
    const videoTypes = /mp4|webm|mov|avi|mkv/;
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    const isImage = imageTypes.test(ext) || file.mimetype.startsWith('image/');
    const isVideo = videoTypes.test(ext) || file.mimetype.startsWith('video/');
    
    if (isImage || isVideo) {
      return cb(null, true);
    }
    cb(new Error('Only image and video files are allowed'));
  }
});

// Configure multer for profile/banner images
const profileImageStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'profiles');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `profile-${req.user?.id || 'unknown'}-${uniqueSuffix}${ext}`);
  }
});

const profileImageUpload = multer({
  storage: profileImageStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit for images
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    const isImage = allowedTypes.test(ext) || file.mimetype.startsWith('image/');
    if (isImage) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

// ============================================================================
// PUBLIC PROFILE ROUTES (No auth required)
// ============================================================================

// Get public seller profile by slug
router.get('/seller/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Look up seller by seller_slug first, then fallback to username
    const seller = await pool.query(`
      SELECT 
        u.id, u.username, u.full_name, u.profile_image, u.profile_picture, u.has_blue_badge,
        COALESCE(u.profile_image, u.profile_picture) as avatar,
        u.seller_display_name,
        COALESCE(u.seller_display_name, u.full_name, u.username) as display_name,
        u.seller_bio, u.seller_tagline, u.seller_website, u.seller_telegram,
        u.seller_twitter, u.seller_instagram, u.seller_youtube, u.seller_discord,
        u.seller_experience_years, u.seller_specialties, u.seller_trading_style,
        u.seller_joined_at, u.seller_total_sales, u.seller_rating_average, 
        u.seller_rating_count, u.seller_banner_url, u.seller_featured,
        u.country, u.verified_at,
        COALESCE(u.seller_slug, u.username) as seller_slug,
        (SELECT COUNT(*) FROM marketplace_bots WHERE seller_id = u.id AND status = 'approved') as bots_count,
        (SELECT COUNT(*) FROM marketplace_products WHERE seller_id = u.id AND status = 'approved') as products_count,
        (SELECT COUNT(*) FROM signal_providers WHERE user_id = u.id AND status = 'approved') as signals_count
      FROM users u
      WHERE (u.seller_slug = $1 OR u.username = $1) AND u.is_seller = TRUE
    `, [slug]);

    if (seller.rows.length === 0) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    const sellerData = seller.rows[0];

    // Get seller's approved products
    const bots = await pool.query(`
      SELECT id, name, slug, short_description, price, price_type, thumbnail_url,
             rating_average, rating_count, total_sales, category
      FROM marketplace_bots 
      WHERE seller_id = $1 AND status = 'approved'
      ORDER BY is_featured DESC, total_sales DESC
      LIMIT 12
    `, [sellerData.id]);

    const products = await pool.query(`
      SELECT id, name, slug, short_description, price, thumbnail_url,
             rating_average, rating_count, total_sales, product_type
      FROM marketplace_products 
      WHERE seller_id = $1 AND status = 'approved'
      ORDER BY is_featured DESC, total_sales DESC
      LIMIT 12
    `, [sellerData.id]);

    const signals = await pool.query(`
      SELECT id, display_name as name, slug, trading_style, monthly_price, 
             subscriber_count as total_subscribers, rating_average, rating_count,
             win_rate, total_pips, avatar_url, profile_image
      FROM signal_providers 
      WHERE user_id = $1 AND status = 'approved'
      LIMIT 6
    `, [sellerData.id]);

    // Get seller's performance media (screenshots, videos)
    const media = await pool.query(`
      SELECT id, media_type, COALESCE(media_url, url) as media_url, thumbnail_url, title, description, is_featured
      FROM seller_media 
      WHERE user_id = $1 AND is_visible = TRUE
      ORDER BY is_featured DESC, display_order ASC
      LIMIT 20
    `, [sellerData.id]);

    // Get seller reviews from various review tables
    let reviews = { rows: [] };
    try {
      // Try to get reviews from bot reviews
      const botReviews = await pool.query(`
        SELECT br.id, br.rating, br.review as comment, br.created_at,
               u.username as reviewer_username, 
               u.full_name as reviewer_name,
               u.profile_image as reviewer_avatar,
               'bot' as review_type,
               b.name as item_name
        FROM marketplace_bot_reviews br
        JOIN users u ON br.user_id = u.id
        JOIN marketplace_bots b ON br.bot_id = b.id
        WHERE b.seller_id = $1 AND br.status = 'approved'
        ORDER BY br.created_at DESC
      `, [sellerData.id]);
      
      // Try to get reviews from product reviews (no status column in this table)
      const productReviews = await pool.query(`
        SELECT pr.id, pr.rating, pr.review as comment, pr.created_at,
               u.username as reviewer_username, 
               u.full_name as reviewer_name,
               u.profile_image as reviewer_avatar,
               'product' as review_type,
               p.name as item_name
        FROM marketplace_product_reviews pr
        JOIN users u ON pr.user_id = u.id
        JOIN marketplace_products p ON pr.product_id = p.id
        WHERE p.seller_id = $1
        ORDER BY pr.created_at DESC
      `, [sellerData.id]);
      
      // Combine and sort all reviews by date
      reviews.rows = [...botReviews.rows, ...productReviews.rows]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    } catch (reviewError) {
      console.log('Reviews fetch note:', reviewError.message);
      reviews.rows = [];
    }

    res.json({
      success: true,
      seller: {
        ...sellerData,
        profile_link: `/sellers/${slug}`,
      },
      bots: bots.rows,
      products: products.rows,
      signals: signals.rows,
      media: media.rows,
      reviews: reviews.rows,
    });
  } catch (error) {
    console.error('Get seller profile error:', error);
    res.status(500).json({ error: 'Failed to get seller profile' });
  }
});

// Get public product by slug
router.get('/product/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Check if it's a bot or product
    let item = await pool.query(`
      SELECT b.*, 
             u.username as seller_username, u.full_name as seller_name, 
             u.profile_image as seller_avatar, u.has_blue_badge as seller_verified,
             u.seller_slug, u.seller_rating_average as seller_rating
      FROM marketplace_bots b
      JOIN users u ON b.seller_id = u.id
      WHERE b.slug = $1 AND b.status = 'approved'
    `, [slug]);

    if (item.rows.length === 0) {
      item = await pool.query(`
        SELECT p.*, 
               u.username as seller_username, u.full_name as seller_name, 
               u.profile_image as seller_avatar, u.has_blue_badge as seller_verified,
               u.seller_slug, u.seller_rating_average as seller_rating
        FROM marketplace_products p
        JOIN users u ON p.seller_id = u.id
        WHERE p.slug = $1 AND p.status = 'approved'
      `, [slug]);
      
      if (item.rows.length > 0) {
        item.rows[0].item_type = 'product';
      }
    } else {
      item.rows[0].item_type = 'bot';
    }

    if (item.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const productData = item.rows[0];
    
    // Don't expose download_files to public
    delete productData.download_files;
    delete productData.bot_file_url;

    res.json({
      success: true,
      product: {
        ...productData,
        product_link: `/marketplace/${slug}`,
        seller_link: productData.seller_slug ? `/sellers/${productData.seller_slug}` : null,
      },
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to get product' });
  }
});

// Get all sellers (public listing)
router.get('/sellers', async (req, res) => {
  try {
    const { page = 1, limit = 20, featured, search } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        u.id, u.username, u.full_name, u.profile_image, u.has_blue_badge,
        u.seller_slug, u.seller_tagline, u.seller_experience_years,
        u.seller_total_sales, u.seller_rating_average, u.seller_rating_count,
        u.seller_featured, u.country,
        (SELECT COUNT(*) FROM marketplace_bots WHERE seller_id = u.id AND status = 'approved') as bots_count,
        (SELECT COUNT(*) FROM marketplace_products WHERE seller_id = u.id AND status = 'approved') as products_count,
        (SELECT COUNT(*) FROM signal_providers WHERE user_id = u.id AND status = 'approved') as signals_count
      FROM users u
      WHERE u.is_seller = TRUE
    `;
    const params = [];

    if (featured === 'true') {
      // Featured sellers must be verified AND have at least 1 listing
      query += ` AND u.seller_featured = TRUE AND u.has_blue_badge = TRUE`;
      query += ` AND (
        (SELECT COUNT(*) FROM marketplace_bots WHERE seller_id = u.id AND status = 'approved') > 0 OR
        (SELECT COUNT(*) FROM marketplace_products WHERE seller_id = u.id AND status = 'approved') > 0 OR
        (SELECT COUNT(*) FROM signal_providers WHERE user_id = u.id AND status = 'approved') > 0
      )`;
    }

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (u.full_name ILIKE $${params.length} OR u.username ILIKE $${params.length} OR u.seller_tagline ILIKE $${params.length})`;
    }

    query += ` ORDER BY u.has_blue_badge DESC, u.seller_featured DESC, u.seller_total_sales DESC`;
    query += ` LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const sellers = await pool.query(query, params);

    res.json({
      success: true,
      sellers: sellers.rows.map(s => ({
        ...s,
        profile_link: `/sellers/${s.seller_slug}`,
      })),
    });
  } catch (error) {
    console.error('Get sellers error:', error);
    res.status(500).json({ error: 'Failed to get sellers' });
  }
});

// ============================================================================
// SELLER/AFFILIATE STATUS CHECK
// ============================================================================

// Check if user is seller
router.get('/status/seller', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await pool.query(`
      SELECT is_seller, seller_slug, has_blue_badge, verification_pending
      FROM users WHERE id = $1
    `, [userId]);

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const pending = await pool.query(`
      SELECT id, status, created_at FROM seller_applications 
      WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1
    `, [userId]);

    res.json({
      success: true,
      is_seller: user.rows[0].is_seller || false,
      seller_slug: user.rows[0].seller_slug,
      has_blue_badge: user.rows[0].has_blue_badge || false,
      verification_pending: user.rows[0].verification_pending || false,
      application: pending.rows[0] || null,
    });
  } catch (error) {
    console.error('Check seller status error:', error);
    res.status(500).json({ error: 'Failed to check seller status' });
  }
});

// Check if user is affiliate
router.get('/status/affiliate', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await pool.query(`
      SELECT is_affiliate, affiliate_slug, referral_code, affiliate_tier, affiliate_commission_rate
      FROM users WHERE id = $1
    `, [userId]);

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const pending = await pool.query(`
      SELECT id, status, created_at FROM affiliate_applications 
      WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1
    `, [userId]);

    res.json({
      success: true,
      is_affiliate: user.rows[0].is_affiliate || false,
      affiliate_slug: user.rows[0].affiliate_slug,
      referral_code: user.rows[0].referral_code,
      affiliate_tier: user.rows[0].affiliate_tier || 'bronze',
      commission_rate: user.rows[0].affiliate_commission_rate || 10,
      application: pending.rows[0] || null,
    });
  } catch (error) {
    console.error('Check affiliate status error:', error);
    res.status(500).json({ error: 'Failed to check affiliate status' });
  }
});

// ============================================================================
// BECOME A SELLER
// ============================================================================

// Apply to become a seller
router.post('/become-seller', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      full_name, display_name, phone, country, bio, tagline, experience_years,
      trading_style, specialties, website, telegram, twitter,
      instagram, youtube, discord, portfolio_links, sample_work_urls,
      why_join, terms_accepted
    } = req.body;

    // Check if already a seller
    const existing = await pool.query('SELECT is_seller, profile_image FROM users WHERE id = $1', [userId]);
    if (existing.rows[0]?.is_seller) {
      return res.status(400).json({ error: 'You are already a seller' });
    }

    // Check if user has a profile picture
    if (!existing.rows[0]?.profile_image) {
      return res.status(400).json({ error: 'Please upload a profile picture before applying to become a seller' });
    }

    // Check for pending application
    const pendingApp = await pool.query(
      `SELECT id FROM seller_applications WHERE user_id = $1 AND status = 'pending'`,
      [userId]
    );
    if (pendingApp.rows.length > 0) {
      return res.status(400).json({ error: 'You already have a pending seller application' });
    }

    // Validate required fields
    if (!full_name || !bio || !terms_accepted) {
      return res.status(400).json({ error: 'Full name, bio, and terms acceptance are required' });
    }

    const user = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);

    // Create application
    const application = await pool.query(`
      INSERT INTO seller_applications (
        user_id, full_name, display_name, email, phone, country, bio, tagline, 
        experience_years, trading_style, specialties, website,
        telegram, twitter, instagram, youtube, discord,
        portfolio_links, sample_work_urls, why_join, terms_accepted
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        display_name = EXCLUDED.display_name,
        phone = EXCLUDED.phone,
        country = EXCLUDED.country,
        bio = EXCLUDED.bio,
        tagline = EXCLUDED.tagline,
        experience_years = EXCLUDED.experience_years,
        trading_style = EXCLUDED.trading_style,
        specialties = EXCLUDED.specialties,
        website = EXCLUDED.website,
        telegram = EXCLUDED.telegram,
        twitter = EXCLUDED.twitter,
        instagram = EXCLUDED.instagram,
        youtube = EXCLUDED.youtube,
        discord = EXCLUDED.discord,
        portfolio_links = EXCLUDED.portfolio_links,
        sample_work_urls = EXCLUDED.sample_work_urls,
        why_join = EXCLUDED.why_join,
        terms_accepted = EXCLUDED.terms_accepted,
        status = 'pending',
        updated_at = NOW()
      RETURNING *
    `, [
      userId, full_name, display_name || null, user.rows[0].email, phone, country, bio, tagline,
      experience_years || 0, trading_style, specialties || [], website,
      telegram, twitter, instagram, youtube, discord,
      portfolio_links || [], sample_work_urls || [], why_join, terms_accepted
    ]);

    res.json({
      success: true,
      message: 'Seller application submitted successfully. You will be notified once reviewed.',
      application: application.rows[0],
    });
  } catch (error) {
    console.error('Become seller error:', error);
    res.status(500).json({ error: 'Failed to submit seller application' });
  }
});

// ============================================================================
// BECOME AN AFFILIATE
// ============================================================================

// Apply to become an affiliate
router.post('/become-affiliate', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      full_name, phone, country, promotion_methods, website,
      social_media, audience_size, why_join, terms_accepted
    } = req.body;

    // Check if already an affiliate
    const existing = await pool.query('SELECT is_affiliate, referral_code FROM users WHERE id = $1', [userId]);
    if (existing.rows[0]?.is_affiliate || existing.rows[0]?.referral_code) {
      return res.status(400).json({ error: 'You are already an affiliate' });
    }

    // Check for pending application
    const pendingApp = await pool.query(
      `SELECT id FROM affiliate_applications WHERE user_id = $1 AND status = 'pending'`,
      [userId]
    );
    if (pendingApp.rows.length > 0) {
      return res.status(400).json({ error: 'You already have a pending affiliate application' });
    }

    // Validate required fields
    if (!full_name || !terms_accepted) {
      return res.status(400).json({ error: 'Full name and terms acceptance are required' });
    }

    const user = await pool.query('SELECT email FROM users WHERE id = $1', [userId]);

    // Create application
    const application = await pool.query(`
      INSERT INTO affiliate_applications (
        user_id, full_name, email, phone, country, promotion_methods,
        website, social_media, audience_size, why_join, terms_accepted
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone,
        country = EXCLUDED.country,
        promotion_methods = EXCLUDED.promotion_methods,
        website = EXCLUDED.website,
        social_media = EXCLUDED.social_media,
        audience_size = EXCLUDED.audience_size,
        why_join = EXCLUDED.why_join,
        terms_accepted = EXCLUDED.terms_accepted,
        status = 'pending',
        updated_at = NOW()
      RETURNING *
    `, [
      userId, full_name, user.rows[0].email, phone, country, 
      promotion_methods || [], website, social_media || {},
      audience_size, why_join, terms_accepted
    ]);

    res.json({
      success: true,
      message: 'Affiliate application submitted successfully. You will be notified once reviewed.',
      application: application.rows[0],
    });
  } catch (error) {
    console.error('Become affiliate error:', error);
    res.status(500).json({ error: 'Failed to submit affiliate application' });
  }
});

// ============================================================================
// ADMIN: APPROVE/REJECT APPLICATIONS
// ============================================================================

const isAdmin = (req) => {
  return req.user?.isAdmin || req.user?.is_admin || req.user?.role === 'admin';
};

// Get pending seller applications
router.get('/admin/seller-applications', authenticate, async (req, res) => {
  try {
    console.log('Seller applications request - User:', req.user?.id, 'isAdmin:', req.user?.isAdmin, 'is_admin:', req.user?.is_admin, 'role:', req.user?.role);
    
    if (!isAdmin(req)) {
      console.log('Admin check failed for user:', req.user?.id);
      return res.status(403).json({ error: 'Admin access required' });
    }

    const applications = await pool.query(`
      SELECT sa.*, u.email as user_email, u.username, u.profile_image
      FROM seller_applications sa
      JOIN users u ON sa.user_id = u.id
      WHERE sa.status = 'pending'
      ORDER BY sa.created_at ASC
    `);
    
    console.log('Seller applications found:', applications.rows.length);

    res.json({ success: true, applications: applications.rows });
  } catch (error) {
    console.error('Get seller applications error:', error);
    res.status(500).json({ error: 'Failed to get applications' });
  }
});

// Approve seller application
router.post('/admin/seller-applications/:id/approve', authenticate, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const adminId = req.user.id;

    const app = await pool.query('SELECT * FROM seller_applications WHERE id = $1', [id]);
    if (app.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const application = app.rows[0];

    // Generate unique seller slug from display_name if provided, otherwise full_name
    const nameForSlug = application.display_name || application.full_name;
    let slug = nameForSlug.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const existingSlug = await pool.query('SELECT id FROM users WHERE seller_slug = $1', [slug]);
    if (existingSlug.rows.length > 0) {
      slug = `${slug}-${application.user_id}`;
    }

    // Update user to be a seller
    await pool.query(`
      UPDATE users SET
        is_seller = TRUE,
        seller_slug = $1,
        seller_display_name = $2,
        full_name = COALESCE($3, full_name),
        seller_bio = $4,
        seller_tagline = $5,
        seller_experience_years = $6,
        seller_trading_style = $7,
        seller_specialties = $8,
        seller_website = $9,
        seller_telegram = $10,
        seller_twitter = $11,
        seller_instagram = $12,
        seller_youtube = $13,
        seller_discord = $14,
        seller_joined_at = NOW(),
        phone = COALESCE($15, phone),
        country = COALESCE($16, country),
        updated_at = NOW()
      WHERE id = $17
    `, [
      slug, application.display_name || null, application.full_name, application.bio, application.tagline,
      application.experience_years, application.trading_style, application.specialties,
      application.website, application.telegram, application.twitter, application.instagram,
      application.youtube, application.discord, application.phone, application.country,
      application.user_id
    ]);

    // Create seller wallet if doesn't exist
    await pool.query(`
      INSERT INTO seller_wallets (user_id, available_balance, pending_balance, total_earned)
      VALUES ($1, 0, 0, 0)
      ON CONFLICT (user_id) DO NOTHING
    `, [application.user_id]);

    // Update application status
    await pool.query(`
      UPDATE seller_applications 
      SET status = 'approved', reviewed_by = $1, reviewed_at = NOW()
      WHERE id = $2
    `, [adminId, id]);

    res.json({
      success: true,
      message: 'Seller application approved',
      seller_slug: slug,
    });
  } catch (error) {
    console.error('Approve seller error:', error);
    res.status(500).json({ error: 'Failed to approve application' });
  }
});

// Reject seller application
router.post('/admin/seller-applications/:id/reject', authenticate, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    await pool.query(`
      UPDATE seller_applications 
      SET status = 'rejected', rejection_reason = $1, reviewed_by = $2, reviewed_at = NOW()
      WHERE id = $3
    `, [reason, adminId, id]);

    res.json({ success: true, message: 'Application rejected' });
  } catch (error) {
    console.error('Reject seller error:', error);
    res.status(500).json({ error: 'Failed to reject application' });
  }
});

// Get pending affiliate applications
router.get('/admin/affiliate-applications', authenticate, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const applications = await pool.query(`
      SELECT aa.*, u.email as user_email, u.username, u.profile_image
      FROM affiliate_applications aa
      JOIN users u ON aa.user_id = u.id
      WHERE aa.status = 'pending'
      ORDER BY aa.created_at ASC
    `);

    res.json({ success: true, applications: applications.rows });
  } catch (error) {
    console.error('Get affiliate applications error:', error);
    res.status(500).json({ error: 'Failed to get applications' });
  }
});

// Approve affiliate application
router.post('/admin/affiliate-applications/:id/approve', authenticate, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const adminId = req.user.id;

    const app = await pool.query('SELECT * FROM affiliate_applications WHERE id = $1', [id]);
    if (app.rows.length === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const application = app.rows[0];

    // Generate unique affiliate slug and referral code
    let slug = application.full_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const existingSlug = await pool.query('SELECT id FROM users WHERE affiliate_slug = $1', [slug]);
    if (existingSlug.rows.length > 0) {
      slug = `${slug}-${application.user_id}`;
    }

    // Generate referral code
    const referralCode = `AE${application.user_id}${Date.now().toString(36).toUpperCase().slice(-4)}`;

    // Update user to be an affiliate
    await pool.query(`
      UPDATE users SET
        is_affiliate = TRUE,
        affiliate_slug = $1,
        referral_code = $2,
        affiliate_tier = 'bronze',
        affiliate_commission_rate = 10,
        affiliate_joined_at = NOW(),
        full_name = COALESCE($3, full_name),
        phone = COALESCE($4, phone),
        country = COALESCE($5, country),
        updated_at = NOW()
      WHERE id = $6
    `, [slug, referralCode, application.full_name, application.phone, application.country, application.user_id]);

    // Update application status
    await pool.query(`
      UPDATE affiliate_applications 
      SET status = 'approved', reviewed_by = $1, reviewed_at = NOW()
      WHERE id = $2
    `, [adminId, id]);

    res.json({
      success: true,
      message: 'Affiliate application approved',
      affiliate_slug: slug,
      referral_code: referralCode,
    });
  } catch (error) {
    console.error('Approve affiliate error:', error);
    res.status(500).json({ error: 'Failed to approve application' });
  }
});

// Reject affiliate application
router.post('/admin/affiliate-applications/:id/reject', authenticate, async (req, res) => {
  try {
    if (!isAdmin(req)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    await pool.query(`
      UPDATE affiliate_applications 
      SET status = 'rejected', rejection_reason = $1, reviewed_by = $2, reviewed_at = NOW()
      WHERE id = $3
    `, [reason, adminId, id]);

    res.json({ success: true, message: 'Application rejected' });
  } catch (error) {
    console.error('Reject affiliate error:', error);
    res.status(500).json({ error: 'Failed to reject application' });
  }
});

// ============================================================================
// GET SHARE LINKS
// ============================================================================

// Get seller's share links
router.get('/my-links', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await pool.query(`
      SELECT is_seller, seller_slug, is_affiliate, affiliate_slug, referral_code
      FROM users WHERE id = $1
    `, [userId]);

    if (user.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const u = user.rows[0];
    const baseUrl = process.env.FRONTEND_URL || 'https://algoedgehub.com';
    
    const links = {
      seller_profile: u.is_seller && u.seller_slug ? `${baseUrl}/sellers/${u.seller_slug}` : null,
      affiliate_link: u.is_affiliate && u.referral_code ? `${baseUrl}/?ref=${u.referral_code}` : null,
      products: [],
    };

    if (u.is_seller) {
      const bots = await pool.query(`
        SELECT name, slug FROM marketplace_bots 
        WHERE seller_id = $1 AND status = 'approved'
      `, [userId]);
      
      const products = await pool.query(`
        SELECT name, slug FROM marketplace_products 
        WHERE seller_id = $1 AND status = 'approved'
      `, [userId]);

      const signals = await pool.query(`
        SELECT name, slug FROM signal_providers 
        WHERE user_id = $1 AND status = 'approved'
      `, [userId]);

      links.products = [
        ...bots.rows.map(b => ({ name: b.name, type: 'bot', link: `${baseUrl}/marketplace/bots/${b.slug}` })),
        ...products.rows.map(p => ({ name: p.name, type: 'product', link: `${baseUrl}/marketplace/products/${p.slug}` })),
        ...signals.rows.map(s => ({ name: s.name, type: 'signal', link: `${baseUrl}/marketplace/signals/${s.slug}` })),
      ];
    }

    res.json({ success: true, links });
  } catch (error) {
    console.error('Get links error:', error);
    res.status(500).json({ error: 'Failed to get links' });
  }
});

// ============================================================================
// SELLER MEDIA UPLOAD ROUTES
// ============================================================================

// Upload seller profile image
router.post('/seller/profile-image', authenticate, profileImageUpload.single('image'), async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const baseUrl = process.env.BACKEND_URL || 'https://algoedge-production-a108.up.railway.app';
    const imageUrl = `${baseUrl}/uploads/profiles/${req.file.filename}`;

    // Update user's profile_image
    await pool.query(
      'UPDATE users SET profile_image = $1, updated_at = NOW() WHERE id = $2',
      [imageUrl, userId]
    );

    res.json({
      success: true,
      image_url: imageUrl,
      message: 'Profile image uploaded successfully'
    });
  } catch (error) {
    console.error('Profile image upload error:', error);
    res.status(500).json({ error: 'Failed to upload profile image' });
  }
});

// Upload seller banner image
router.post('/seller/banner-image', authenticate, profileImageUpload.single('image'), async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const baseUrl = process.env.BACKEND_URL || 'https://algoedge-production-a108.up.railway.app';
    const imageUrl = `${baseUrl}/uploads/profiles/${req.file.filename}`;

    // Update user's banner image
    await pool.query(
      'UPDATE users SET banner_image_url = $1, updated_at = NOW() WHERE id = $2',
      [imageUrl, userId]
    );

    res.json({
      success: true,
      image_url: imageUrl,
      message: 'Banner image uploaded successfully'
    });
  } catch (error) {
    console.error('Banner image upload error:', error);
    res.status(500).json({ error: 'Failed to upload banner image' });
  }
});

// Upload seller media (performance screenshots/videos)
router.post('/seller/media', authenticate, sellerMediaUpload.single('media'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { title, description, is_featured } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No media file provided' });
    }

    // Determine media type
    const ext = path.extname(req.file.originalname).toLowerCase();
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
    const mediaType = videoExtensions.includes(ext) ? 'video' : 'image';

    const baseUrl = process.env.BACKEND_URL || 'https://algoedge-production-a108.up.railway.app';
    const mediaUrl = `${baseUrl}/uploads/seller-media/${req.file.filename}`;

    // Get current max display order
    const orderResult = await pool.query(
      'SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM seller_media WHERE user_id = $1',
      [userId]
    );
    const displayOrder = orderResult.rows[0].next_order;

    // Insert into seller_media table
    const result = await pool.query(`
      INSERT INTO seller_media (user_id, media_type, media_url, title, description, is_featured, display_order)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [userId, mediaType, mediaUrl, title || null, description || null, is_featured === 'true', displayOrder]);

    res.json({
      success: true,
      media: result.rows[0],
      message: `${mediaType === 'video' ? 'Video' : 'Image'} uploaded successfully`
    });
  } catch (error) {
    console.error('Seller media upload error:', error);
    res.status(500).json({ error: 'Failed to upload media' });
  }
});

// Upload multiple seller media files
router.post('/seller/media/bulk', authenticate, sellerMediaUpload.array('media', 10), async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No media files provided' });
    }

    const baseUrl = process.env.BACKEND_URL || 'https://algoedge-production-a108.up.railway.app';
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv'];
    
    // Get current max display order
    const orderResult = await pool.query(
      'SELECT COALESCE(MAX(display_order), 0) as max_order FROM seller_media WHERE user_id = $1',
      [userId]
    );
    let displayOrder = orderResult.rows[0].max_order;

    const uploadedMedia = [];
    
    for (const file of req.files) {
      displayOrder++;
      const ext = path.extname(file.originalname).toLowerCase();
      const mediaType = videoExtensions.includes(ext) ? 'video' : 'image';
      const mediaUrl = `${baseUrl}/uploads/seller-media/${file.filename}`;

      const result = await pool.query(`
        INSERT INTO seller_media (user_id, media_type, media_url, display_order)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [userId, mediaType, mediaUrl, displayOrder]);
      
      uploadedMedia.push(result.rows[0]);
    }

    res.json({
      success: true,
      media: uploadedMedia,
      message: `${uploadedMedia.length} files uploaded successfully`
    });
  } catch (error) {
    console.error('Bulk media upload error:', error);
    res.status(500).json({ error: 'Failed to upload media files' });
  }
});

// Get seller's media
router.get('/seller/media', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const media = await pool.query(`
      SELECT * FROM seller_media 
      WHERE user_id = $1 AND is_visible = TRUE
      ORDER BY is_featured DESC, display_order ASC
    `, [userId]);

    res.json({
      success: true,
      media: media.rows
    });
  } catch (error) {
    console.error('Get seller media error:', error);
    res.status(500).json({ error: 'Failed to get media' });
  }
});

// Get public seller media by seller slug/username
router.get('/seller/:slug/media', async (req, res) => {
  try {
    const { slug } = req.params;
    
    // Find seller by slug or username
    const seller = await pool.query(
      'SELECT id FROM users WHERE (seller_slug = $1 OR username = $1) AND is_seller = TRUE',
      [slug]
    );
    
    if (seller.rows.length === 0) {
      return res.status(404).json({ error: 'Seller not found' });
    }

    const media = await pool.query(`
      SELECT id, media_type, media_url, thumbnail_url, title, description, is_featured, created_at
      FROM seller_media 
      WHERE user_id = $1 AND is_visible = TRUE
      ORDER BY is_featured DESC, display_order ASC
    `, [seller.rows[0].id]);

    res.json({
      success: true,
      media: media.rows
    });
  } catch (error) {
    console.error('Get public seller media error:', error);
    res.status(500).json({ error: 'Failed to get media' });
  }
});

// Update seller media (full update)
router.put('/seller/media/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, description, is_featured, is_visible, display_order } = req.body;

    // Verify ownership
    const existing = await pool.query(
      'SELECT id FROM seller_media WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }

    const result = await pool.query(`
      UPDATE seller_media SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        is_featured = COALESCE($3, is_featured),
        is_visible = COALESCE($4, is_visible),
        display_order = COALESCE($5, display_order),
        updated_at = NOW()
      WHERE id = $6 AND user_id = $7
      RETURNING *
    `, [title, description, is_featured, is_visible, display_order, id, userId]);

    res.json({
      success: true,
      media: result.rows[0],
      message: 'Media updated successfully'
    });
  } catch (error) {
    console.error('Update seller media error:', error);
    res.status(500).json({ error: 'Failed to update media' });
  }
});

// Partial update seller media (for toggle switches)
router.patch('/seller/media/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { is_featured, is_visible } = req.body;

    // Verify ownership
    const existing = await pool.query(
      'SELECT id FROM seller_media WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }

    const result = await pool.query(`
      UPDATE seller_media SET 
        is_featured = COALESCE($1, is_featured),
        is_visible = COALESCE($2, is_visible),
        updated_at = NOW()
      WHERE id = $3 AND user_id = $4
      RETURNING *
    `, [is_featured, is_visible, id, userId]);

    res.json({
      success: true,
      media: result.rows[0]
    });
  } catch (error) {
    console.error('Patch seller media error:', error);
    res.status(500).json({ error: 'Failed to update media' });
  }
});

// Delete seller media
router.delete('/seller/media/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Get media info to delete file
    const media = await pool.query(
      'SELECT media_url FROM seller_media WHERE id = $1 AND user_id = $2',
      [id, userId]
    );
    
    if (media.rows.length === 0) {
      return res.status(404).json({ error: 'Media not found' });
    }

    // Delete from database
    await pool.query('DELETE FROM seller_media WHERE id = $1 AND user_id = $2', [id, userId]);

    // Try to delete the file (don't fail if file doesn't exist)
    try {
      const filename = media.rows[0].media_url.split('/').pop();
      const filePath = path.join(process.cwd(), 'uploads', 'seller-media', filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (fileError) {
      console.error('Error deleting media file:', fileError);
    }

    res.json({
      success: true,
      message: 'Media deleted successfully'
    });
  } catch (error) {
    console.error('Delete seller media error:', error);
    res.status(500).json({ error: 'Failed to delete media' });
  }
});

export default router;
