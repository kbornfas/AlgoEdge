// backend/middleware/ipWhitelist.js
import pool from '../config/database.js';

/**
 * Middleware to check if the request IP is whitelisted for the authenticated user.
 * Assumes req.user.id is set (after authentication middleware).
 */
export const ipWhitelistMiddleware = async (req, res, next) => {
  try {
    // Get client IP (trusts proxy headers if behind a proxy)
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.connection.remoteAddress;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    // Query whitelist
    const result = await pool.query(
      'SELECT 1 FROM ip_whitelist WHERE user_id = $1 AND ip_address = $2',
      [userId, ip]
    );
    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'IP address not authorized' });
    }
    next();
  } catch (error) {
    console.error('IP whitelist middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
