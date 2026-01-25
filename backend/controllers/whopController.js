import pool from '../config/database.js';
import crypto from 'crypto';
import { sendCommissionEarnedTelegram, sendNewReferralTelegram } from '../services/telegramService.js';

// Whop webhook secret - should be set in environment variables
const WHOP_WEBHOOK_SECRET = process.env.WHOP_WEBHOOK_SECRET;
const WHOP_API_KEY = process.env.WHOP_API_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

// Plan prices for commission calculation
const PLAN_PRICES = {
  weekly: 19,
  monthly: 49,
  quarterly: 149
};

// Commission rate (10%)
const COMMISSION_RATE = 10;

/**
 * Verify Whop webhook signature
 */
const verifyWhopSignature = (payload, signature) => {
  if (!WHOP_WEBHOOK_SECRET) {
    console.warn('WHOP_WEBHOOK_SECRET not set - skipping signature verification');
    return true;
  }
  
  const expectedSignature = crypto
    .createHmac('sha256', WHOP_WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
  
  return signature === expectedSignature;
};

/**
 * Handle Whop webhook events
 * Supported events:
 * - membership.went_valid: User subscribed successfully
 * - membership.went_invalid: Subscription expired/cancelled
 * - payment.succeeded: Payment was successful
 * - payment.failed: Payment failed
 */
const handleWebhook = async (req, res) => {
  try {
    const signature = req.headers['whop-signature'] || req.headers['x-whop-signature'];
    const event = req.body;

    console.log('Received Whop webhook:', event.event || event.action);

    // Verify signature in production
    if (process.env.NODE_ENV === 'production' && !verifyWhopSignature(event, signature)) {
      console.error('Invalid Whop webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const eventType = event.event || event.action;
    const data = event.data;

    switch (eventType) {
      case 'membership.went_valid':
      case 'membership_went_valid':
      case 'membership_activated':
        await handleMembershipValid(data);
        break;
      
      case 'membership.went_invalid':
      case 'membership_went_invalid':
      case 'membership_deactivated':
        await handleMembershipInvalid(data);
        break;
      
      case 'payment.succeeded':
      case 'payment_succeeded':
      case 'invoice_paid':
        await handlePaymentSucceeded(data);
        break;
      
      case 'payment.failed':
      case 'payment_failed':
      case 'invoice_past_due':
        await handlePaymentFailed(data);
        break;

      default:
        console.log('Unhandled Whop event type:', eventType);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Whop webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
};

/**
 * Handle successful membership activation
 */
const handleMembershipValid = async (data) => {
  try {
    const {
      id: membershipId,
      user,
      product,
      plan,
      valid_until,
      status,
    } = data;

    const userEmail = user?.email;
    const whopUserId = user?.id;
    const userName = user?.username || user?.name || userEmail?.split('@')[0] || 'user';

    if (!userEmail) {
      console.error('No email in Whop membership data');
      return;
    }

    console.log(`Processing membership activation for ${userEmail}`);

    // Determine plan type from Whop plan/product
    let planType = 'monthly'; // default
    const planName = plan?.plan_name?.toLowerCase() || product?.name?.toLowerCase() || '';
    
    if (planName.includes('week')) {
      planType = 'weekly';
    } else if (planName.includes('quarter') || planName.includes('90')) {
      planType = 'quarterly';
    } else if (planName.includes('month')) {
      planType = 'monthly';
    }

    // Calculate expiration date based on plan
    let expiresAt = valid_until ? new Date(valid_until) : new Date();
    if (!valid_until) {
      switch (planType) {
        case 'weekly':
          expiresAt.setDate(expiresAt.getDate() + 7);
          break;
        case 'monthly':
          expiresAt.setMonth(expiresAt.getMonth() + 1);
          break;
        case 'quarterly':
          expiresAt.setMonth(expiresAt.getMonth() + 3);
          break;
      }
    }

    // Find user by email
    let userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [userEmail.toLowerCase()]
    );

    let userId;

    if (userResult.rows.length === 0) {
      // AUTO-CREATE USER if they don't exist (paid via Whop without registering first)
      console.log(`Creating new user for Whop customer: ${userEmail}`);
      
      const username = userName + '_' + Math.random().toString(36).substring(2, 6);
      
      const newUserResult = await pool.query(
        `INSERT INTO users (username, email, is_verified, is_active, whop_user_id)
         VALUES ($1, $2, true, true, $3)
         RETURNING id`,
        [username, userEmail.toLowerCase(), whopUserId]
      );
      
      userId = newUserResult.rows[0].id;
      
      // Create default user settings
      await pool.query(
        'INSERT INTO user_settings (user_id) VALUES ($1) ON CONFLICT (user_id) DO NOTHING',
        [userId]
      );
      
      console.log(`Created new user ${userId} for ${userEmail}`);
    } else {
      userId = userResult.rows[0].id;
    }

    // Update or create subscription record
    const existingSubscription = await pool.query(
      'SELECT id FROM subscriptions WHERE user_id = $1',
      [userId]
    );

    if (existingSubscription.rows.length > 0) {
      await pool.query(
        `UPDATE subscriptions 
         SET plan = $1, status = 'active', whop_membership_id = $2, whop_user_id = $3,
             whop_product_id = $4, whop_plan_id = $5, current_period_end = $6, updated_at = NOW()
         WHERE user_id = $7`,
        [planType, membershipId, whopUserId, product?.id, plan?.id, expiresAt, userId]
      );
    } else {
      await pool.query(
        `INSERT INTO subscriptions (user_id, plan, status, whop_membership_id, whop_user_id, whop_product_id, whop_plan_id, current_period_end)
         VALUES ($1, $2, 'active', $3, $4, $5, $6, $7)`,
        [userId, planType, membershipId, whopUserId, product?.id, plan?.id, expiresAt]
      );
    }

    // Update user's subscription status
    await pool.query(
      `UPDATE users 
       SET subscription_status = 'active', subscription_plan = $1, subscription_expires_at = $2, is_active = true, updated_at = NOW()
       WHERE id = $3`,
      [planType, expiresAt, userId]
    );

    // ============ AFFILIATE COMMISSION CALCULATION ============
    // Check if this user was referred by someone
    const referrerResult = await pool.query(
      `SELECT u.id, u.username, u.email, u.referral_code, u.affiliate_commission_rate,
              COALESCE(us.telegram_chat_id, '') as telegram_chat_id
       FROM users u 
       LEFT JOIN user_settings us ON us.user_id = u.id
       WHERE u.id = (SELECT referred_by FROM users WHERE id = $1)`,
      [userId]
    );

    if (referrerResult.rows.length > 0) {
      const referrer = referrerResult.rows[0];
      const planPrice = PLAN_PRICES[planType] || 49; // Default to monthly if unknown
      const commissionRate = referrer.affiliate_commission_rate || COMMISSION_RATE;
      const commissionAmount = (planPrice * commissionRate) / 100;

      // Get subscription ID for tracking
      const subResult = await pool.query(
        'SELECT id FROM subscriptions WHERE user_id = $1',
        [userId]
      );
      const subscriptionId = subResult.rows[0]?.id;

      // Insert commission record
      await pool.query(
        `INSERT INTO affiliate_commissions 
         (affiliate_user_id, referred_user_id, subscription_id, amount, commission_rate, status, period_start, period_end)
         VALUES ($1, $2, $3, $4, $5, 'approved', NOW(), $6)`,
        [referrer.id, userId, subscriptionId, commissionAmount, commissionRate, expiresAt]
      );

      console.log(`Awarded $${commissionAmount.toFixed(2)} commission to affiliate ${referrer.id} (${referrer.username}) for ${planType} subscription`);

      // Send Telegram notification to referrer about earned commission
      if (referrer.telegram_chat_id) {
        const subscribedUser = await pool.query('SELECT username, email FROM users WHERE id = $1', [userId]);
        const subscribedUsername = subscribedUser.rows[0]?.username || userEmail.split('@')[0];
        
        try {
          await sendCommissionEarnedTelegram(
            referrer.telegram_chat_id,
            subscribedUsername,
            planType,
            planPrice,
            commissionAmount
          );
        } catch (telegramError) {
          console.error('Failed to send Telegram commission notification:', telegramError);
          // Don't throw - commission was still awarded
        }
      }
    }
    // ============ END AFFILIATE COMMISSION ============

    console.log(`Successfully activated ${planType} subscription for user ${userId} (${userEmail})`);
  } catch (error) {
    console.error('Error handling membership valid:', error);
    throw error;
  }
};

/**
 * Handle membership invalidation (expired/cancelled)
 */
const handleMembershipInvalid = async (data) => {
  try {
    const membershipId = data.id;
    const userEmail = data.user?.email;

    if (!userEmail && !membershipId) {
      console.error('No identifier in membership invalid data');
      return;
    }

    let userId;

    if (membershipId) {
      const subResult = await pool.query(
        'SELECT user_id FROM subscriptions WHERE whop_membership_id = $1',
        [membershipId]
      );
      if (subResult.rows.length > 0) {
        userId = subResult.rows[0].user_id;
      }
    }

    if (!userId && userEmail) {
      const userResult = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [userEmail.toLowerCase()]
      );
      if (userResult.rows.length > 0) {
        userId = userResult.rows[0].id;
      }
    }

    if (!userId) {
      console.error('Could not find user for membership invalidation');
      return;
    }

    // Update subscription status
    await pool.query(
      `UPDATE subscriptions SET status = 'expired', updated_at = NOW() WHERE user_id = $1`,
      [userId]
    );

    // Update user's subscription status
    await pool.query(
      `UPDATE users SET subscription_status = 'expired', updated_at = NOW() WHERE id = $1`,
      [userId]
    );

    console.log(`Subscription expired for user ${userId}`);
  } catch (error) {
    console.error('Error handling membership invalid:', error);
    throw error;
  }
};

/**
 * Handle successful payment
 */
const handlePaymentSucceeded = async (data) => {
  console.log('Payment succeeded:', data);
  // The membership.went_valid event will handle the actual activation
  // This is just for logging/tracking purposes
};

/**
 * Handle failed payment
 */
const handlePaymentFailed = async (data) => {
  console.log('Payment failed:', data);
  // Optionally send notification to user about failed payment
};

/**
 * Verify membership status with Whop API
 */
const verifyMembership = async (req, res) => {
  try {
    const { membershipId } = req.params;

    if (!WHOP_API_KEY) {
      return res.status(500).json({ error: 'Whop API key not configured' });
    }

    const response = await fetch(`https://api.whop.com/api/v2/memberships/${membershipId}`, {
      headers: {
        'Authorization': `Bearer ${WHOP_API_KEY}`,
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to verify membership' });
    }

    const membership = await response.json();
    res.json({ valid: membership.valid, membership });
  } catch (error) {
    console.error('Error verifying membership:', error);
    res.status(500).json({ error: 'Failed to verify membership' });
  }
};

/**
 * Get user's subscription status
 */
const getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const userEmail = req.user.email;

    // Admin bypass - always return active for admin users
    if (ADMIN_EMAIL && userEmail && userEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      console.log(`Admin bypass for subscription status: ${userEmail}`);
      return res.json({
        status: 'active',
        plan: 'admin',
        expiresAt: null,
        isActive: true,
      });
    }

    const result = await pool.query(
      `SELECT u.subscription_status, u.subscription_plan, u.subscription_expires_at,
              s.whop_membership_id, s.status as sub_status, s.current_period_end
       FROM users u
       LEFT JOIN subscriptions s ON u.id = s.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({
        status: 'trial',
        plan: null,
        expiresAt: null,
        isActive: false,
      });
    }

    const user = result.rows[0];
    const now = new Date();
    const expiresAt = user.subscription_expires_at ? new Date(user.subscription_expires_at) : null;
    const isActive = user.subscription_status === 'active' && (!expiresAt || expiresAt > now);

    res.json({
      status: isActive ? 'active' : user.subscription_status || 'trial',
      plan: user.subscription_plan,
      expiresAt: user.subscription_expires_at,
      isActive,
    });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
};

/**
 * Manual subscription activation (for admin or testing)
 */
const activateSubscription = async (req, res) => {
  try {
    const { userId, plan, durationDays } = req.body;

    // Check if requester is admin
    if (!req.user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (durationDays || 30));

    await pool.query(
      `UPDATE users 
       SET subscription_status = 'active', subscription_plan = $1, subscription_expires_at = $2, is_active = true, updated_at = NOW()
       WHERE id = $3`,
      [plan || 'monthly', expiresAt, userId]
    );

    // Update or create subscription record
    const existingSubscription = await pool.query(
      'SELECT id FROM subscriptions WHERE user_id = $1',
      [userId]
    );

    if (existingSubscription.rows.length > 0) {
      await pool.query(
        `UPDATE subscriptions SET plan = $1, status = 'active', current_period_end = $2, updated_at = NOW() WHERE user_id = $3`,
        [plan || 'monthly', expiresAt, userId]
      );
    } else {
      await pool.query(
        `INSERT INTO subscriptions (user_id, plan, status, current_period_end) VALUES ($1, $2, 'active', $3)`,
        [userId, plan || 'monthly', expiresAt]
      );
    }

    res.json({ success: true, message: 'Subscription activated', expiresAt });
  } catch (error) {
    console.error('Error activating subscription:', error);
    res.status(500).json({ error: 'Failed to activate subscription' });
  }
};

export {
  handleWebhook,
  verifyMembership,
  getSubscriptionStatus,
  activateSubscription,
};
