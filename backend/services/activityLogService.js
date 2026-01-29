/**
 * Activity Log Service
 * Tracks user activities for security and analytics
 */

import pool from '../config/database.js';

/**
 * Activity types enum
 */
export const ActivityTypes = {
  // Authentication
  LOGIN: 'login',
  LOGIN_FAILED: 'login_failed',
  LOGOUT: 'logout',
  PASSWORD_CHANGE: 'password_change',
  PASSWORD_RESET_REQUEST: 'password_reset_request',
  TWO_FA_ENABLED: '2fa_enabled',
  TWO_FA_DISABLED: '2fa_disabled',
  
  // Profile
  PROFILE_UPDATE: 'profile_update',
  EMAIL_CHANGE: 'email_change',
  AVATAR_UPDATE: 'avatar_update',
  
  // Subscription
  SUBSCRIPTION_CREATED: 'subscription_created',
  SUBSCRIPTION_RENEWED: 'subscription_renewed',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  SUBSCRIPTION_EXPIRED: 'subscription_expired',
  
  // Trading
  MT5_CONNECTED: 'mt5_connected',
  MT5_DISCONNECTED: 'mt5_disconnected',
  TRADE_OPENED: 'trade_opened',
  TRADE_CLOSED: 'trade_closed',
  ROBOT_STARTED: 'robot_started',
  ROBOT_STOPPED: 'robot_stopped',
  
  // Wallet
  DEPOSIT_REQUESTED: 'deposit_requested',
  DEPOSIT_COMPLETED: 'deposit_completed',
  WITHDRAWAL_REQUESTED: 'withdrawal_requested',
  WITHDRAWAL_COMPLETED: 'withdrawal_completed',
  
  // Marketplace
  PURCHASE_MADE: 'purchase_made',
  PRODUCT_LISTED: 'product_listed',
  PRODUCT_UPDATED: 'product_updated',
  
  // Sessions
  SESSION_CREATED: 'session_created',
  SESSION_REVOKED: 'session_revoked',
  
  // Admin
  ADMIN_USER_UPDATE: 'admin_user_update',
  ADMIN_SUBSCRIPTION_EXTEND: 'admin_subscription_extend',
  ADMIN_WALLET_ADJUST: 'admin_wallet_adjust',
  
  // Bulk Admin Actions
  SUBSCRIPTION_EXTENDED: 'subscription_extended',
  SUBSCRIPTION_REVOKED: 'subscription_revoked',
  SUBSCRIPTION_MANUAL_UPDATE: 'subscription_manual_update',
  ACCOUNT_BLOCKED: 'account_blocked',
  ACCOUNT_UNBLOCKED: 'account_unblocked',
};

/**
 * Log a user activity
 */
export async function logActivity({
  userId,
  type,
  description = null,
  metadata = null,
  ipAddress = null,
  userAgent = null,
  req = null,
}) {
  try {
    // Extract IP and user agent from request if provided
    const ip = ipAddress || req?.ip || req?.headers?.['x-forwarded-for']?.split(',')[0] || req?.connection?.remoteAddress || null;
    const ua = userAgent || req?.headers?.['user-agent'] || null;
    
    await pool.query(`
      INSERT INTO activity_logs (user_id, activity_type, description, metadata, ip_address, user_agent, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [
      userId,
      type,
      description,
      metadata ? JSON.stringify(metadata) : null,
      ip,
      ua,
    ]);
    
    return true;
  } catch (error) {
    console.error('Failed to log activity:', error.message);
    return false;
  }
}

/**
 * Get user's recent activities
 */
export async function getUserActivities(userId, options = {}) {
  const { limit = 50, offset = 0, types = null, startDate = null, endDate = null } = options;
  
  let query = `
    SELECT id, activity_type, description, metadata, ip_address, user_agent, created_at
    FROM activity_logs
    WHERE user_id = $1
  `;
  const params = [userId];
  let paramIndex = 2;
  
  if (types && types.length > 0) {
    query += ` AND activity_type = ANY($${paramIndex})`;
    params.push(types);
    paramIndex++;
  }
  
  if (startDate) {
    query += ` AND created_at >= $${paramIndex}`;
    params.push(startDate);
    paramIndex++;
  }
  
  if (endDate) {
    query += ` AND created_at <= $${paramIndex}`;
    params.push(endDate);
    paramIndex++;
  }
  
  query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);
  
  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Get activity count by type for a user
 */
export async function getUserActivityStats(userId, days = 30) {
  const result = await pool.query(`
    SELECT 
      activity_type,
      COUNT(*) as count
    FROM activity_logs
    WHERE user_id = $1
      AND created_at > NOW() - INTERVAL '${days} days'
    GROUP BY activity_type
    ORDER BY count DESC
  `, [userId]);
  
  return result.rows;
}

/**
 * Get login history for a user
 */
export async function getLoginHistory(userId, limit = 20) {
  const result = await pool.query(`
    SELECT 
      activity_type,
      ip_address,
      user_agent,
      metadata,
      created_at
    FROM activity_logs
    WHERE user_id = $1
      AND activity_type IN ('login', 'login_failed', 'logout')
    ORDER BY created_at DESC
    LIMIT $2
  `, [userId, limit]);
  
  return result.rows;
}

/**
 * Get all user activities (admin view)
 */
export async function getAllActivities(options = {}) {
  const { limit = 100, offset = 0, userId = null, types = null, startDate = null, endDate = null } = options;
  
  let query = `
    SELECT 
      al.id, al.user_id, al.activity_type, al.description, al.metadata, 
      al.ip_address, al.user_agent, al.created_at,
      u.email, u.username, u.full_name
    FROM activity_logs al
    JOIN users u ON al.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;
  
  if (userId) {
    query += ` AND al.user_id = $${paramIndex}`;
    params.push(userId);
    paramIndex++;
  }
  
  if (types && types.length > 0) {
    query += ` AND al.activity_type = ANY($${paramIndex})`;
    params.push(types);
    paramIndex++;
  }
  
  if (startDate) {
    query += ` AND al.created_at >= $${paramIndex}`;
    params.push(startDate);
    paramIndex++;
  }
  
  if (endDate) {
    query += ` AND al.created_at <= $${paramIndex}`;
    params.push(endDate);
    paramIndex++;
  }
  
  query += ` ORDER BY al.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);
  
  const result = await pool.query(query, params);
  
  // Get total count
  let countQuery = 'SELECT COUNT(*) FROM activity_logs al WHERE 1=1';
  const countParams = [];
  let countParamIndex = 1;
  
  if (userId) {
    countQuery += ` AND al.user_id = $${countParamIndex}`;
    countParams.push(userId);
    countParamIndex++;
  }
  
  if (types && types.length > 0) {
    countQuery += ` AND al.activity_type = ANY($${countParamIndex})`;
    countParams.push(types);
    countParamIndex++;
  }
  
  const countResult = await pool.query(countQuery, countParams);
  
  return {
    activities: result.rows,
    total: parseInt(countResult.rows[0].count),
  };
}

/**
 * Get suspicious activity (multiple failed logins, etc.)
 */
export async function getSuspiciousActivity(hours = 24) {
  const result = await pool.query(`
    SELECT 
      user_id,
      u.email,
      u.username,
      activity_type,
      COUNT(*) as count,
      array_agg(DISTINCT ip_address) as ip_addresses,
      MAX(created_at) as last_activity
    FROM activity_logs al
    JOIN users u ON al.user_id = u.id
    WHERE al.created_at > NOW() - INTERVAL '${hours} hours'
      AND al.activity_type IN ('login_failed', 'password_reset_request')
    GROUP BY user_id, u.email, u.username, activity_type
    HAVING COUNT(*) >= 3
    ORDER BY count DESC
  `);
  
  return result.rows;
}

/**
 * Clean old activity logs (keep last 90 days)
 */
export async function cleanOldActivityLogs(daysToKeep = 90) {
  const result = await pool.query(`
    DELETE FROM activity_logs
    WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
  `);
  
  console.log(`🧹 Cleaned ${result.rowCount} old activity logs`);
  return result.rowCount;
}

export default {
  ActivityTypes,
  logActivity,
  getUserActivities,
  getUserActivityStats,
  getLoginHistory,
  getAllActivities,
  getSuspiciousActivity,
  cleanOldActivityLogs,
};
