import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

/**
 * Admin authentication middleware
 * Checks for valid JWT token and admin role
 */
export const requireAdmin = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const result = await pool.query(
      `SELECT id, username, email, role, is_admin 
       FROM users WHERE id = $1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
    
    // Check if user is admin by email, role, or is_admin flag
    const isAdmin = 
      user.email?.toLowerCase() === adminEmail ||
      user.role === 'admin' ||
      user.is_admin === true;

    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user = { ...user, isAdmin: true };
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Role-based access control middleware factory
 * @param {string[]} allowedRoles - Array of roles that can access
 */
export const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const result = await pool.query(
        `SELECT id, username, email, role, is_admin 
         FROM users WHERE id = $1`,
        [decoded.userId]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'User not found' });
      }

      const user = result.rows[0];
      const userRole = user.role || 'user';
      
      // Admin always has access
      const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
      const isAdmin = 
        user.email?.toLowerCase() === adminEmail ||
        userRole === 'admin' ||
        user.is_admin === true;

      if (isAdmin || allowedRoles.includes(userRole)) {
        req.user = { ...user, isAdmin };
        next();
      } else {
        return res.status(403).json({ 
          error: `Access denied. Required role: ${allowedRoles.join(' or ')}` 
        });
      }
    } catch (error) {
      console.error('Role auth error:', error);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
};

/**
 * Check if user has affiliate permissions
 */
export const requireAffiliateAccess = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const result = await pool.query(
      `SELECT id, username, email, affiliate_blocked, affiliate_blocked_reason 
       FROM users WHERE id = $1`,
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Check if user is blocked from affiliate program
    if (user.affiliate_blocked) {
      return res.status(403).json({ 
        error: 'Your affiliate account has been suspended',
        reason: user.affiliate_blocked_reason || 'Contact support for details'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Affiliate auth error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export default { requireAdmin, requireRole, requireAffiliateAccess };
