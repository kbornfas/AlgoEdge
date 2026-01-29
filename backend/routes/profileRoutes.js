import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// ============================================================================
// PUBLIC PROFILE ROUTES (No auth required)
// ============================================================================

// Get public seller profile by slug
router.get('/seller/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    
    const seller = await pool.query(`
      SELECT 
        u.id, u.username, u.full_name, u.profile_image, u.has_blue_badge,
        u.seller_bio, u.seller_tagline, u.seller_website, u.seller_telegram,
        u.seller_twitter, u.seller_instagram, u.seller_youtube, u.seller_discord,
        u.seller_experience_years, u.seller_specialties, u.seller_trading_style,
        u.seller_joined_at, u.seller_total_sales, u.seller_rating_average, 
        u.seller_rating_count, u.seller_banner_url, u.seller_featured,
        u.country, u.verified_at,
        (SELECT COUNT(*) FROM marketplace_bots WHERE seller_id = u.id AND status = 'approved') as bots_count,
        (SELECT COUNT(*) FROM marketplace_products WHERE seller_id = u.id AND status = 'approved') as products_count,
        (SELECT COUNT(*) FROM signal_providers WHERE user_id = u.id AND status = 'approved') as signals_count
      FROM users u
      WHERE u.seller_slug = $1 AND u.is_seller = TRUE
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
      SELECT id, name, slug, trading_style, monthly_price, total_subscribers,
             rating_average, rating_count, performance_stats
      FROM signal_providers 
      WHERE user_id = $1 AND status = 'approved'
      LIMIT 6
    `, [sellerData.id]);

    res.json({
      success: true,
      seller: {
        ...sellerData,
        profile_link: `/sellers/${slug}`,
      },
      bots: bots.rows,
      products: products.rows,
      signals: signals.rows,
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
      full_name, phone, country, bio, tagline, experience_years,
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
        user_id, full_name, email, phone, country, bio, tagline, 
        experience_years, trading_style, specialties, website,
        telegram, twitter, instagram, youtube, discord,
        portfolio_links, sample_work_urls, why_join, terms_accepted
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      ON CONFLICT (user_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
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
      userId, full_name, user.rows[0].email, phone, country, bio, tagline,
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

    // Generate unique seller slug
    let slug = application.full_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const existingSlug = await pool.query('SELECT id FROM users WHERE seller_slug = $1', [slug]);
    if (existingSlug.rows.length > 0) {
      slug = `${slug}-${application.user_id}`;
    }

    // Update user to be a seller
    await pool.query(`
      UPDATE users SET
        is_seller = TRUE,
        seller_slug = $1,
        full_name = COALESCE($2, full_name),
        seller_bio = $3,
        seller_tagline = $4,
        seller_experience_years = $5,
        seller_trading_style = $6,
        seller_specialties = $7,
        seller_website = $8,
        seller_telegram = $9,
        seller_twitter = $10,
        seller_instagram = $11,
        seller_youtube = $12,
        seller_discord = $13,
        seller_joined_at = NOW(),
        phone = COALESCE($14, phone),
        country = COALESCE($15, country),
        updated_at = NOW()
      WHERE id = $16
    `, [
      slug, application.full_name, application.bio, application.tagline,
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

export default router;
