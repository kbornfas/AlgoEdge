import express from 'express';
import pool from '../config/database.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { auditLog } from '../middleware/audit.js';
import { sendEmail } from '../services/emailService.js';
import { logActivity, ActivityTypes } from '../services/activityLogService.js';

const router = express.Router();

// All routes require admin authentication
router.use(authenticate);
router.use(requireAdmin);

/**
 * Bulk extend subscriptions for multiple users
 * POST /api/admin/users/bulk/extend-subscription
 */
router.post('/bulk/extend-subscription', async (req, res) => {
  const client = await pool.connect();
  try {
    const { userIds, days, reason } = req.body;
    const adminId = req.user.id;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'userIds array is required' });
    }

    if (!days || typeof days !== 'number' || days < 1) {
      return res.status(400).json({ error: 'days must be a positive number' });
    }

    await client.query('BEGIN');

    const results = {
      success: [],
      failed: [],
    };

    for (const userId of userIds) {
      try {
        // Get current subscription info
        const userResult = await client.query(
          'SELECT id, username, email, subscription_status, subscription_expires_at FROM users WHERE id = $1',
          [userId]
        );

        if (userResult.rows.length === 0) {
          results.failed.push({ userId, error: 'User not found' });
          continue;
        }

        const user = userResult.rows[0];
        
        // Calculate new expiry date
        let baseDate = user.subscription_expires_at 
          ? new Date(user.subscription_expires_at)
          : new Date();
        
        // If expired, use current date as base
        if (baseDate < new Date()) {
          baseDate = new Date();
        }
        
        const newExpiryDate = new Date(baseDate);
        newExpiryDate.setDate(newExpiryDate.getDate() + days);

        // Update subscription
        await client.query(
          `UPDATE users 
           SET subscription_status = 'active',
               subscription_expires_at = $1,
               updated_at = NOW()
           WHERE id = $2`,
          [newExpiryDate, userId]
        );

        results.success.push({
          userId,
          username: user.username,
          email: user.email,
          newExpiryDate: newExpiryDate.toISOString(),
        });

        // Log activity
        await logActivity(userId, ActivityTypes.SUBSCRIPTION_EXTENDED, 
          `Subscription extended by ${days} days by admin`, 
          { adminId, days, reason, newExpiryDate: newExpiryDate.toISOString() },
          req.ip, req.headers['user-agent']
        );
      } catch (err) {
        results.failed.push({ userId, error: err.message });
      }
    }

    await client.query('COMMIT');

    // Audit log
    auditLog(adminId, 'BULK_SUBSCRIPTION_EXTENSION', {
      totalRequested: userIds.length,
      successCount: results.success.length,
      failedCount: results.failed.length,
      days,
      reason,
    }, req);

    res.json({
      success: true,
      message: `Extended subscriptions for ${results.success.length} users`,
      results,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Bulk extend subscription error:', error);
    res.status(500).json({ error: 'Failed to extend subscriptions' });
  } finally {
    client.release();
  }
});

/**
 * Bulk revoke subscriptions for multiple users
 * POST /api/admin/users/bulk/revoke-subscription
 */
router.post('/bulk/revoke-subscription', async (req, res) => {
  const client = await pool.connect();
  try {
    const { userIds, reason } = req.body;
    const adminId = req.user.id;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'userIds array is required' });
    }

    await client.query('BEGIN');

    const results = {
      success: [],
      failed: [],
    };

    for (const userId of userIds) {
      try {
        const userResult = await client.query(
          'SELECT id, username, email FROM users WHERE id = $1',
          [userId]
        );

        if (userResult.rows.length === 0) {
          results.failed.push({ userId, error: 'User not found' });
          continue;
        }

        const user = userResult.rows[0];

        await client.query(
          `UPDATE users 
           SET subscription_status = 'expired',
               subscription_expires_at = NOW(),
               updated_at = NOW()
           WHERE id = $1`,
          [userId]
        );

        results.success.push({
          userId,
          username: user.username,
          email: user.email,
        });

        await logActivity(userId, ActivityTypes.SUBSCRIPTION_REVOKED, 
          'Subscription revoked by admin', 
          { adminId, reason },
          req.ip, req.headers['user-agent']
        );
      } catch (err) {
        results.failed.push({ userId, error: err.message });
      }
    }

    await client.query('COMMIT');

    auditLog(adminId, 'BULK_SUBSCRIPTION_REVOKE', {
      totalRequested: userIds.length,
      successCount: results.success.length,
      failedCount: results.failed.length,
      reason,
    }, req);

    res.json({
      success: true,
      message: `Revoked subscriptions for ${results.success.length} users`,
      results,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Bulk revoke subscription error:', error);
    res.status(500).json({ error: 'Failed to revoke subscriptions' });
  } finally {
    client.release();
  }
});

/**
 * Bulk block/unblock users
 * POST /api/admin/users/bulk/block
 */
router.post('/bulk/block', async (req, res) => {
  const client = await pool.connect();
  try {
    const { userIds, block, reason } = req.body;
    const adminId = req.user.id;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'userIds array is required' });
    }

    await client.query('BEGIN');

    const results = {
      success: [],
      failed: [],
    };

    for (const userId of userIds) {
      try {
        // Prevent admin from blocking themselves
        if (userId === adminId) {
          results.failed.push({ userId, error: 'Cannot block yourself' });
          continue;
        }

        const userResult = await client.query(
          'SELECT id, username, email, is_admin FROM users WHERE id = $1',
          [userId]
        );

        if (userResult.rows.length === 0) {
          results.failed.push({ userId, error: 'User not found' });
          continue;
        }

        const user = userResult.rows[0];

        // Prevent blocking other admins
        if (user.is_admin && block) {
          results.failed.push({ userId, error: 'Cannot block admin users' });
          continue;
        }

        await client.query(
          'UPDATE users SET is_blocked = $1, updated_at = NOW() WHERE id = $2',
          [!!block, userId]
        );

        results.success.push({
          userId,
          username: user.username,
          email: user.email,
          isBlocked: !!block,
        });

        await logActivity(userId, block ? ActivityTypes.ACCOUNT_BLOCKED : ActivityTypes.ACCOUNT_UNBLOCKED, 
          `Account ${block ? 'blocked' : 'unblocked'} by admin`, 
          { adminId, reason },
          req.ip, req.headers['user-agent']
        );
      } catch (err) {
        results.failed.push({ userId, error: err.message });
      }
    }

    await client.query('COMMIT');

    auditLog(adminId, block ? 'BULK_USER_BLOCK' : 'BULK_USER_UNBLOCK', {
      totalRequested: userIds.length,
      successCount: results.success.length,
      failedCount: results.failed.length,
      reason,
    }, req);

    res.json({
      success: true,
      message: `${block ? 'Blocked' : 'Unblocked'} ${results.success.length} users`,
      results,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Bulk block users error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  } finally {
    client.release();
  }
});

/**
 * Send mass email to selected users or filtered group
 * POST /api/admin/users/bulk/email
 */
router.post('/bulk/email', async (req, res) => {
  try {
    const { userIds, filter, subject, htmlContent, textContent } = req.body;
    const adminId = req.user.id;

    if (!subject || !htmlContent) {
      return res.status(400).json({ error: 'subject and htmlContent are required' });
    }

    let users = [];

    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      // Send to specific users
      const result = await pool.query(
        'SELECT id, email, username, full_name FROM users WHERE id = ANY($1) AND email IS NOT NULL',
        [userIds]
      );
      users = result.rows;
    } else if (filter) {
      // Send based on filter criteria
      let query = 'SELECT id, email, username, full_name FROM users WHERE email IS NOT NULL';
      const params = [];
      let paramIndex = 1;

      if (filter.subscriptionStatus) {
        query += ` AND subscription_status = $${paramIndex++}`;
        params.push(filter.subscriptionStatus);
      }

      if (filter.isVerified !== undefined) {
        query += ` AND is_verified = $${paramIndex++}`;
        params.push(filter.isVerified);
      }

      if (filter.expiringWithinDays) {
        query += ` AND subscription_expires_at BETWEEN NOW() AND NOW() + INTERVAL '${parseInt(filter.expiringWithinDays)} days'`;
      }

      if (filter.isSeller !== undefined) {
        query += ` AND is_seller = $${paramIndex++}`;
        params.push(filter.isSeller);
      }

      if (filter.isAffiliate !== undefined) {
        query += ` AND is_affiliate = $${paramIndex++}`;
        params.push(filter.isAffiliate);
      }

      query += ' AND is_blocked = false LIMIT 1000'; // Limit to prevent abuse

      const result = await pool.query(query, params);
      users = result.rows;
    } else {
      return res.status(400).json({ error: 'Either userIds or filter is required' });
    }

    if (users.length === 0) {
      return res.status(400).json({ error: 'No users match the criteria' });
    }

    const results = {
      success: [],
      failed: [],
    };

    // Send emails in batches
    for (const user of users) {
      try {
        // Personalize content
        const personalizedHtml = htmlContent
          .replace(/{{username}}/g, user.username || 'User')
          .replace(/{{full_name}}/g, user.full_name || user.username || 'User')
          .replace(/{{email}}/g, user.email);

        const personalizedText = textContent
          ? textContent
              .replace(/{{username}}/g, user.username || 'User')
              .replace(/{{full_name}}/g, user.full_name || user.username || 'User')
              .replace(/{{email}}/g, user.email)
          : undefined;

        await sendEmail({
          to: user.email,
          subject,
          html: personalizedHtml,
          text: personalizedText,
        });

        results.success.push({ userId: user.id, email: user.email });
      } catch (err) {
        results.failed.push({ userId: user.id, email: user.email, error: err.message });
      }
    }

    auditLog(adminId, 'BULK_EMAIL_SENT', {
      totalTargeted: users.length,
      successCount: results.success.length,
      failedCount: results.failed.length,
      subject,
      filter,
    }, req);

    res.json({
      success: true,
      message: `Sent emails to ${results.success.length} users`,
      results,
    });
  } catch (error) {
    console.error('Bulk email error:', error);
    res.status(500).json({ error: 'Failed to send emails' });
  }
});

/**
 * Get all users (root endpoint)
 * GET /api/admin/users
 * Returns complete list of all platform users with their details
 */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        id, username, email, full_name, phone, country, timezone, 
        is_verified, two_fa_enabled, created_at, 
        false as is_blocked,
        COALESCE(is_admin, false) as is_admin, 
        COALESCE(is_seller, false) as is_seller, 
        COALESCE(has_blue_badge, false) as has_blue_badge, 
        profile_image,
        COALESCE(subscription_status, 'none') as subscription_status,
        subscription_plan,
        subscription_expires_at,
        COALESCE(seller_featured, false) as seller_featured,
        COALESCE(verification_pending, false) as verification_pending,
        role
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
 * Get user statistics for admin dashboard
 * GET /api/admin/users/stats
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE subscription_status = 'active') as active_subscriptions,
        COUNT(*) FILTER (WHERE subscription_status = 'expired') as expired_subscriptions,
        COUNT(*) FILTER (WHERE subscription_status IS NULL OR subscription_status = '' OR subscription_status = 'none' OR subscription_status = 'inactive') as no_subscription,
        0 as blocked_users,
        COUNT(*) FILTER (WHERE is_verified = true) as verified_users,
        COUNT(*) FILTER (WHERE is_seller = true) as sellers,
        COUNT(*) FILTER (WHERE is_affiliate = true) as affiliates,
        COUNT(*) FILTER (WHERE subscription_expires_at BETWEEN NOW() AND NOW() + INTERVAL '7 days') as expiring_soon,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as new_users_30d,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as new_users_7d
      FROM users
    `);

    res.json({
      success: true,
      stats: stats.rows[0],
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({ error: 'Failed to get user statistics' });
  }
});

/**
 * Get users list with filters and pagination
 * GET /api/admin/users/list
 */
router.get('/list', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search,
      subscriptionStatus,
      isBlocked,
      isVerified,
      isSeller,
      isAffiliate,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let paramIndex = 1;
    let whereConditions = [];

    if (search) {
      whereConditions.push(`(username ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR full_name ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (subscriptionStatus) {
      whereConditions.push(`subscription_status = $${paramIndex++}`);
      params.push(subscriptionStatus);
    }

    if (isBlocked !== undefined) {
      whereConditions.push(`is_blocked = $${paramIndex++}`);
      params.push(isBlocked === 'true');
    }

    if (isVerified !== undefined) {
      whereConditions.push(`is_verified = $${paramIndex++}`);
      params.push(isVerified === 'true');
    }

    if (isSeller !== undefined) {
      whereConditions.push(`is_seller = $${paramIndex++}`);
      params.push(isSeller === 'true');
    }

    if (isAffiliate !== undefined) {
      whereConditions.push(`is_affiliate = $${paramIndex++}`);
      params.push(isAffiliate === 'true');
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const allowedSortFields = ['created_at', 'username', 'email', 'subscription_expires_at', 'subscription_status'];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const sortDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';

    // Get total count
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      params
    );
    const totalCount = parseInt(countResult.rows[0].count);

    // Get users
    const usersResult = await pool.query(
      `SELECT 
        id, username, email, full_name, phone, country, timezone,
        is_verified, two_fa_enabled, is_blocked, is_seller, is_affiliate,
        subscription_status, subscription_plan, subscription_expires_at,
        profile_image, created_at, last_login
       FROM users
       ${whereClause}
       ORDER BY ${sortField} ${sortDirection}
       LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, parseInt(limit), offset]
    );

    res.json({
      success: true,
      users: usersResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount,
        totalPages: Math.ceil(totalCount / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Get users list error:', error);
    res.status(500).json({ error: 'Failed to get users list' });
  }
});

/**
 * Get activity logs for a specific user
 * GET /api/admin/users/:userId/activity
 */
router.get('/:userId/activity', async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = await pool.query(
      `SELECT * FROM activity_logs 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, parseInt(limit), offset]
    );

    const countResult = await pool.query(
      'SELECT COUNT(*) FROM activity_logs WHERE user_id = $1',
      [userId]
    );

    res.json({
      success: true,
      activities: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalCount: parseInt(countResult.rows[0].count),
      },
    });
  } catch (error) {
    console.error('Get user activity error:', error);
    res.status(500).json({ error: 'Failed to get user activity' });
  }
});

/**
 * Update user subscription manually
 * PUT /api/admin/users/:userId/subscription
 */
router.put('/:userId/subscription', async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, plan, expiresAt, reason } = req.body;
    const adminId = req.user.id;

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (status) {
      updates.push(`subscription_status = $${paramIndex++}`);
      params.push(status);
    }

    if (plan) {
      updates.push(`subscription_plan = $${paramIndex++}`);
      params.push(plan);
    }

    if (expiresAt) {
      updates.push(`subscription_expires_at = $${paramIndex++}`);
      params.push(new Date(expiresAt));
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    updates.push('updated_at = NOW()');

    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, username, subscription_status, subscription_plan, subscription_expires_at`,
      [...params, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await logActivity(userId, ActivityTypes.SUBSCRIPTION_MANUAL_UPDATE, 
      'Subscription manually updated by admin', 
      { adminId, updates: { status, plan, expiresAt }, reason },
      req.ip, req.headers['user-agent']
    );

    auditLog(adminId, 'USER_SUBSCRIPTION_UPDATE', {
      userId,
      updates: { status, plan, expiresAt },
      reason,
    }, req);

    res.json({
      success: true,
      user: result.rows[0],
    });
  } catch (error) {
    console.error('Update user subscription error:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

/**
 * PATCH /api/admin/users/:userId/block
 * Block or unblock a user
 */
router.patch('/:userId/block', async (req, res) => {
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
 * PATCH /api/admin/users/:userId/badge
 * Grant or revoke blue badge (verified status)
 */
router.patch('/:userId/badge', async (req, res) => {
  try {
    const { userId } = req.params;
    const { has_blue_badge } = req.body;
    
    const result = await pool.query(
      `UPDATE users SET 
         has_blue_badge = $1, 
         blue_badge_granted_at = CASE WHEN $1 = TRUE THEN NOW() ELSE NULL END,
         updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING id, username, email, has_blue_badge`,
      [!!has_blue_badge, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Toggle blue badge error:', error);
    res.status(500).json({ error: 'Failed to update verification status' });
  }
});

/**
 * PATCH /api/admin/users/:userId/seller
 * Grant or revoke seller status
 */
router.patch('/:userId/seller', async (req, res) => {
  try {
    const { userId } = req.params;
    const { is_seller } = req.body;
    
    const result = await pool.query(
      `UPDATE users SET is_seller = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 
       RETURNING id, username, email, is_seller`,
      [!!is_seller, userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // If granting seller status, create seller wallet if not exists
    if (is_seller) {
      await pool.query(`
        INSERT INTO seller_wallets (user_id, balance, pending_balance, total_earnings)
        VALUES ($1, 0, 0, 0)
        ON CONFLICT (user_id) DO NOTHING
      `, [userId]);
    }
    
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Toggle seller status error:', error);
    res.status(500).json({ error: 'Failed to update seller status' });
  }
});

/**
 * PATCH /api/admin/users/:userId/admin
 * Toggle admin status
 */
router.patch('/:userId/admin', async (req, res) => {
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
 * PATCH /api/admin/users/:userId/feature
 * Toggle featured status for a seller (shows on landing page)
 * Requires seller to be verified AND have at least 1 listing
 */
router.patch('/:userId/feature', async (req, res) => {
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
      `UPDATE users SET seller_featured = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 RETURNING id, username, seller_featured`,
      [!!featured, userId]
    );
    
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    console.error('Toggle featured seller error:', error);
    res.status(500).json({ error: 'Failed to update featured status' });
  }
});

/**
 * DELETE /api/admin/users/:userId
 * Delete a user
 */
router.delete('/:userId', async (req, res) => {
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

export default router;
