import express from 'express';
import pool from '../config/database.js';
import { authenticate as authenticateToken } from '../middleware/auth.js';
import { requireAffiliateAccess } from '../middleware/adminAuth.js';
import { 
  logAuditAction, 
  logPayoutEvent, 
  logUserAffiliateAction,
  checkRegistrationFraud,
  processFraudFlags 
} from '../services/auditService.js';

const router = express.Router();

/**
 * GET /api/affiliate/stats
 * Get affiliate statistics for the logged-in user
 */
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's affiliate info
    const userResult = await pool.query(
      `SELECT 
        referral_code, 
        affiliate_tier, 
        affiliate_commission_rate,
        affiliate_blocked 
      FROM users WHERE id = $1`,
      [userId]
    );

    // Check if blocked
    if (userResult.rows[0]?.affiliate_blocked) {
      return res.status(403).json({ 
        error: 'Your affiliate account has been suspended',
        blocked: true 
      });
    }

    if (!userResult.rows[0]?.referral_code) {
      // Generate referral code if user doesn't have one
      const codeResult = await pool.query(
        `UPDATE users 
         SET referral_code = 'ALGO' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 4))
         WHERE id = $1 AND referral_code IS NULL
         RETURNING referral_code`,
        [userId]
      );
      userResult.rows[0] = { 
        ...userResult.rows[0], 
        referral_code: codeResult.rows[0]?.referral_code 
      };
      
      // Create wallet for user
      await pool.query(
        'INSERT INTO affiliate_wallets (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
        [userId]
      );
    }

    const user = userResult.rows[0];

    // Get referral counts
    const referralStats = await pool.query(
      `SELECT 
        COUNT(*) as total_referrals,
        COUNT(CASE WHEN s.status = 'active' THEN 1 END) as active_referrals,
        COUNT(CASE WHEN s.status IS NULL OR s.status = 'pending' THEN 1 END) as pending_referrals
      FROM users u
      LEFT JOIN subscriptions s ON s.user_id = u.id
      WHERE u.referred_by = $1`,
      [userId]
    );

    // Get wallet balance (preferred) or calculate from commissions
    const walletResult = await pool.query(
      `SELECT total_earned, pending, available_balance, withdrawn, held
       FROM affiliate_wallets WHERE user_id = $1`,
      [userId]
    );

    let earnings;
    if (walletResult.rows.length > 0) {
      const wallet = walletResult.rows[0];
      earnings = {
        total_earnings: parseFloat(wallet.total_earned) || 0,
        pending_earnings: parseFloat(wallet.pending) || 0,
        available_for_payout: parseFloat(wallet.available_balance) || 0,
        withdrawn: parseFloat(wallet.withdrawn) || 0,
        held: parseFloat(wallet.held) || 0,
      };
    } else {
      // Fallback to calculating from commissions
      const earningsResult = await pool.query(
        `SELECT 
          COALESCE(SUM(CASE WHEN status IN ('approved', 'paid') THEN amount END), 0) as total_earnings,
          COALESCE(SUM(CASE WHEN status = 'pending' THEN amount END), 0) as pending_earnings,
          COALESCE(SUM(CASE WHEN status = 'approved' THEN amount END), 0) as available_for_payout
        FROM affiliate_commissions
        WHERE affiliate_user_id = $1`,
        [userId]
      );
      earnings = earningsResult.rows[0];
    }

    const stats = referralStats.rows[0];

    // Calculate tier based on active referrals
    const activeReferrals = parseInt(stats.active_referrals) || 0;
    let tier = 'Bronze';
    let commissionRate = 10;
    let nextTier = null;
    let referralsToNextTier = 0;

    if (activeReferrals >= 100) {
      tier = 'Elite';
      commissionRate = 20;
      nextTier = null;
    } else if (activeReferrals >= 50) {
      tier = 'Diamond';
      commissionRate = 18;
      nextTier = 'Elite';
      referralsToNextTier = 100 - activeReferrals;
    } else if (activeReferrals >= 25) {
      tier = 'Gold';
      commissionRate = 15;
      nextTier = 'Diamond';
      referralsToNextTier = 50 - activeReferrals;
    } else if (activeReferrals >= 10) {
      tier = 'Silver';
      commissionRate = 12;
      nextTier = 'Gold';
      referralsToNextTier = 25 - activeReferrals;
    } else {
      tier = 'Bronze';
      commissionRate = 10;
      nextTier = 'Silver';
      referralsToNextTier = 10 - activeReferrals;
    }

    // Update user's tier if changed
    if (user.affiliate_tier !== tier.toLowerCase()) {
      await pool.query(
        'UPDATE users SET affiliate_tier = $1, affiliate_commission_rate = $2 WHERE id = $3',
        [tier.toLowerCase(), commissionRate, userId]
      );
    }

    const totalReferrals = parseInt(stats.total_referrals) || 0;

    res.json({
      referralCode: user.referral_code,
      referralLink: `${process.env.FRONTEND_URL || 'https://algoedgehub.com'}/auth/register?ref=${user.referral_code}`,
      totalReferrals,
      activeReferrals,
      pendingReferrals: parseInt(stats.pending_referrals) || 0,
      totalEarnings: earnings.total_earnings || 0,
      pendingEarnings: earnings.pending_earnings || 0,
      availableBalance: earnings.available_for_payout || 0,
      withdrawn: earnings.withdrawn || 0,
      tier,
      commissionRate,
      nextTier,
      referralsToNextTier,
    });
  } catch (error) {
    console.error('Error fetching affiliate stats:', error);
    res.status(500).json({ error: 'Failed to fetch affiliate statistics' });
  }
});

/**
 * GET /api/affiliate/referrals
 * Get list of user's referrals
 */
router.get('/referrals', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const referrals = await pool.query(
      `SELECT 
        u.id,
        u.username,
        CONCAT(LEFT(u.email, 1), '***', SUBSTRING(u.email FROM POSITION('@' IN u.email))) as email,
        u.created_at as joined_at,
        s.plan,
        COALESCE(s.status, 'pending') as status,
        COALESCE(SUM(ac.amount), 0) as total_commission
      FROM users u
      LEFT JOIN subscriptions s ON s.user_id = u.id
      LEFT JOIN affiliate_commissions ac ON ac.referred_user_id = u.id AND ac.affiliate_user_id = $1
      WHERE u.referred_by = $1
      GROUP BY u.id, u.username, u.email, u.created_at, s.plan, s.status
      ORDER BY u.created_at DESC
      LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM users WHERE referred_by = $1',
      [userId]
    );

    res.json({
      referrals: referrals.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit),
    });
  } catch (error) {
    console.error('Error fetching referrals:', error);
    res.status(500).json({ error: 'Failed to fetch referrals' });
  }
});

/**
 * GET /api/affiliate/commissions
 * Get commission history
 */
router.get('/commissions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        ac.id,
        ac.amount,
        ac.commission_rate,
        ac.status,
        ac.period_start,
        ac.period_end,
        ac.created_at,
        u.username as referred_username,
        s.plan as subscription_plan
      FROM affiliate_commissions ac
      JOIN users u ON u.id = ac.referred_user_id
      LEFT JOIN subscriptions s ON s.id = ac.subscription_id
      WHERE ac.affiliate_user_id = $1
    `;
    const params = [userId];

    if (status) {
      query += ' AND ac.status = $' + (params.length + 1);
      params.push(status);
    }

    query += ` ORDER BY ac.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const commissions = await pool.query(query, params);

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM affiliate_commissions WHERE affiliate_user_id = $1' +
        (status ? ' AND status = $2' : ''),
      status ? [userId, status] : [userId]
    );

    res.json({
      commissions: commissions.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit),
    });
  } catch (error) {
    console.error('Error fetching commissions:', error);
    res.status(500).json({ error: 'Failed to fetch commission history' });
  }
});

/**
 * GET /api/affiliate/payouts
 * Get payout history
 */
router.get('/payouts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const payouts = await pool.query(
      `SELECT 
        id,
        amount,
        payout_method as method,
        status,
        requested_at,
        processed_at,
        transaction_id
      FROM affiliate_payouts
      WHERE user_id = $1
      ORDER BY requested_at DESC`,
      [userId]
    );

    res.json({ payouts: payouts.rows });
  } catch (error) {
    console.error('Error fetching payouts:', error);
    res.status(500).json({ error: 'Failed to fetch payout history' });
  }
});

/**
 * POST /api/affiliate/payouts/request
 * Request a payout
 */
router.post('/payouts/request', authenticateToken, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id;
    const { method, address, phoneNumber, network } = req.body;

    if (!method) {
      return res.status(400).json({ error: 'Payment method is required' });
    }

    const validMethods = ['usdt', 'btc', 'eth', 'mpesa', 'airtel'];
    if (!validMethods.includes(method.toLowerCase())) {
      return res.status(400).json({ error: 'Invalid payment method. Supported: USDT, BTC, ETH, M-Pesa, Airtel Money' });
    }

    // Validate based on method type
    const cryptoMethods = ['usdt', 'btc', 'eth'];
    const mobileMethods = ['mpesa', 'airtel'];

    if (cryptoMethods.includes(method.toLowerCase()) && !address) {
      return res.status(400).json({ error: 'Wallet address is required for crypto payments' });
    }

    if (mobileMethods.includes(method.toLowerCase()) && !phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required for mobile money payments' });
    }

    // Build payment details
    const payoutAddress = cryptoMethods.includes(method.toLowerCase()) 
      ? address 
      : phoneNumber;

    const payoutDetails = {
      method: method.toUpperCase(),
      ...(cryptoMethods.includes(method.toLowerCase()) && { walletAddress: address, network: network || 'TRC20' }),
      ...(mobileMethods.includes(method.toLowerCase()) && { phoneNumber })
    };

    await client.query('BEGIN');

    // Check available balance
    const balanceResult = await client.query(
      `SELECT COALESCE(SUM(amount), 0) as available
       FROM affiliate_commissions
       WHERE affiliate_user_id = $1 AND status = 'approved'`,
      [userId]
    );

    const available = parseFloat(balanceResult.rows[0].available);

    // Check user's tier for minimum payout
    const userResult = await client.query(
      'SELECT affiliate_tier FROM users WHERE id = $1',
      [userId]
    );

    const tier = userResult.rows[0]?.affiliate_tier || 'standard';
    const minPayout = tier === 'vip' ? 0 : tier === 'elite' ? 20 : 50;

    if (available < minPayout) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: `Minimum payout is $${minPayout}. Available: $${available.toFixed(2)}` 
      });
    }

    // Check for pending payout
    const pendingResult = await client.query(
      `SELECT id FROM affiliate_payouts 
       WHERE user_id = $1 AND status = 'pending'`,
      [userId]
    );

    if (pendingResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'You already have a pending payout request' });
    }

    // Create payout request
    const payoutResult = await client.query(
      `INSERT INTO affiliate_payouts (user_id, amount, payout_method, payout_address, notes, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, amount, payout_method as method, status, requested_at`,
      [userId, available, method.toUpperCase(), payoutAddress, JSON.stringify(payoutDetails), req.ip]
    );

    // Mark commissions as processing
    await client.query(
      `UPDATE affiliate_commissions
       SET status = 'processing', payout_id = $1
       WHERE affiliate_user_id = $2 AND status = 'approved'`,
      [payoutResult.rows[0].id, userId]
    );

    // Update wallet - move from available to held
    await client.query(
      `SELECT add_wallet_transaction($1, 'withdrawal_request', $2, 'payout', $3, 'Payout requested')`,
      [userId, available, payoutResult.rows[0].id]
    );

    // Log the payout request
    await logPayoutEvent('requested', { ...payoutResult.rows[0], user_id: userId }, userId, req);

    await client.query('COMMIT');

    res.json({
      message: 'Payout request submitted successfully',
      payout: payoutResult.rows[0],
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
 * GET /api/affiliate/wallet/transactions
 * Get wallet transaction history
 */
router.get('/wallet/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        id, type, amount, balance_before, balance_after,
        reference_type, reference_id, description, created_at
      FROM affiliate_wallet_transactions
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

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM affiliate_wallet_transactions WHERE user_id = $1${type ? ' AND type = $2' : ''}`,
      type ? [userId, type] : [userId]
    );

    res.json({
      transactions: transactions.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit),
    });
  } catch (error) {
    console.error('Error fetching wallet transactions:', error);
    res.status(500).json({ error: 'Failed to fetch wallet transactions' });
  }
});

/**
 * POST /api/affiliate/terms/accept
 * Accept affiliate terms and conditions
 */
router.post('/terms/accept', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { termsVersion = '1.0' } = req.body;

    await pool.query(
      `INSERT INTO affiliate_terms_acceptance (user_id, terms_version, ip_address, user_agent)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, terms_version) DO UPDATE SET accepted_at = NOW()`,
      [userId, termsVersion, req.ip, req.headers['user-agent']]
    );

    await logUserAffiliateAction('terms_accepted', userId, { termsVersion }, req);

    res.json({ success: true, message: 'Terms accepted successfully' });
  } catch (error) {
    console.error('Error accepting terms:', error);
    res.status(500).json({ error: 'Failed to accept terms' });
  }
});

/**
 * GET /api/affiliate/terms/status
 * Check if user has accepted current terms
 */
router.get('/terms/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const currentVersion = '1.0'; // Update this when terms change

    const result = await pool.query(
      `SELECT terms_version, accepted_at 
       FROM affiliate_terms_acceptance 
       WHERE user_id = $1 AND terms_version = $2`,
      [userId, currentVersion]
    );

    res.json({
      accepted: result.rows.length > 0,
      currentVersion,
      acceptedAt: result.rows[0]?.accepted_at || null,
    });
  } catch (error) {
    console.error('Error checking terms status:', error);
    res.status(500).json({ error: 'Failed to check terms status' });
  }
});

/**
 * POST /api/affiliate/track
 * Track a referral visit (for cookie-based tracking)
 */
router.post('/track', async (req, res) => {
  try {
    const { code, cookieId, landingPage, utmSource, utmMedium, utmCampaign } = req.body;

    if (!code || !cookieId) {
      return res.status(400).json({ error: 'Code and cookieId are required' });
    }

    // Validate the referral code
    const referrerResult = await pool.query(
      'SELECT id FROM users WHERE referral_code = $1 AND affiliate_blocked = FALSE',
      [code.toUpperCase()]
    );

    if (referrerResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid referral code' });
    }

    const affiliateUserId = referrerResult.rows[0].id;

    // Create or update tracking record
    await pool.query(`
      INSERT INTO referral_tracking (
        cookie_id, referral_code, affiliate_user_id, ip_address, user_agent,
        landing_page, utm_source, utm_medium, utm_campaign
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (cookie_id) DO UPDATE SET
        referral_code = EXCLUDED.referral_code,
        affiliate_user_id = EXCLUDED.affiliate_user_id,
        landing_page = EXCLUDED.landing_page,
        utm_source = EXCLUDED.utm_source,
        utm_medium = EXCLUDED.utm_medium,
        utm_campaign = EXCLUDED.utm_campaign,
        expires_at = NOW() + INTERVAL '90 days'
    `, [
      cookieId, 
      code.toUpperCase(), 
      affiliateUserId, 
      req.ip, 
      req.headers['user-agent'],
      landingPage,
      utmSource,
      utmMedium,
      utmCampaign
    ]);

    res.json({ success: true, tracked: true });
  } catch (error) {
    console.error('Error tracking referral:', error);
    res.status(500).json({ error: 'Failed to track referral' });
  }
});

/**
 * POST /api/affiliate/validate-code
 * Validate a referral code (public endpoint)
 */
router.post('/validate-code', async (req, res) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ valid: false, error: 'Code is required' });
    }

    const result = await pool.query(
      'SELECT id, username FROM users WHERE referral_code = $1',
      [code.toUpperCase()]
    );

    if (result.rows.length === 0) {
      return res.json({ valid: false });
    }

    res.json({
      valid: true,
      referrer: result.rows[0].username,
    });
  } catch (error) {
    console.error('Error validating referral code:', error);
    res.status(500).json({ valid: false, error: 'Failed to validate code' });
  }
});

/**
 * GET /api/affiliate/leaderboard
 * Get top affiliates (public)
 */
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const leaderboard = await pool.query(
      `SELECT 
        u.username,
        u.affiliate_tier as tier,
        COUNT(DISTINCT ref.id) as total_referrals,
        COUNT(DISTINCT CASE WHEN s.status = 'active' THEN ref.id END) as active_referrals
      FROM users u
      LEFT JOIN users ref ON ref.referred_by = u.id
      LEFT JOIN subscriptions s ON s.user_id = ref.id
      WHERE u.referral_code IS NOT NULL
      GROUP BY u.id, u.username, u.affiliate_tier
      HAVING COUNT(DISTINCT ref.id) > 0
      ORDER BY total_referrals DESC
      LIMIT $1`,
      [limit]
    );

    // Mask usernames for privacy
    const maskedLeaderboard = leaderboard.rows.map((user, index) => ({
      rank: index + 1,
      username: user.username.substring(0, 2) + '***' + user.username.slice(-1),
      tier: user.tier,
      referrals: parseInt(user.total_referrals),
    }));

    res.json({ leaderboard: maskedLeaderboard });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

export default router;
