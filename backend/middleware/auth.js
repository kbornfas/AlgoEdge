import jwt from 'jsonwebtoken';
import pool from '../config/database.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    if (!token || token === 'undefined' || token === 'null') {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Validate token format before trying to verify
    if (!token.includes('.') || token.split('.').length !== 3) {
      return res.status(401).json({ error: 'Invalid token format' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const result = await pool.query(
      'SELECT id, username, email, two_fa_enabled, is_admin, role FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = result.rows[0];
    // Also set isAdmin flag for convenience
    req.user.isAdmin = req.user.is_admin || req.user.role === 'admin';
    next();
  } catch (error) {
    // Log detailed error on server side only
    if (error.name === 'JsonWebTokenError') {
      console.error('[Auth] Invalid token:', error.message);
    } else if (error.name === 'TokenExpiredError') {
      console.error('[Auth] Token expired');
    } else {
      console.error('[Auth] Error:', error.message);
    }
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;

    if (token && token !== 'undefined' && token !== 'null' && token.includes('.')) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const result = await pool.query(
        'SELECT id, username, email FROM users WHERE id = $1',
        [decoded.userId]
      );

      if (result.rows.length > 0) {
        req.user = result.rows[0];
      }
    }
  } catch (error) {
    // Silently fail for optional auth
  }
  
  next();
};

// Alias for authenticate
export const authenticateToken = authenticate;

// Alias for optionalAuth
export const optionalAuthenticate = optionalAuth;

// Middleware to require admin role
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    if (result.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.user.role = 'admin';
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    return res.status(500).json({ error: 'Authorization failed' });
  }
};

// Middleware to require active subscription for premium features
export const requireSubscription = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
    
    // Admin bypass - always has access
    if (req.user.email?.toLowerCase() === adminEmail || req.user.role === 'admin' || req.user.is_admin) {
      return next();
    }

    const result = await pool.query(
      `SELECT u.subscription_status, u.subscription_plan, u.subscription_expires_at,
              s.status as sub_status, s.plan as sub_plan
       FROM users u
       LEFT JOIN subscriptions s ON u.id = s.user_id AND s.status = 'active' AND s.plan != 'free'
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ 
        error: 'Subscription required',
        code: 'SUBSCRIPTION_REQUIRED',
        message: 'This feature requires an active subscription. Please subscribe to access premium features.'
      });
    }

    const user = result.rows[0];
    const now = new Date();
    const expiresAt = user.subscription_expires_at ? new Date(user.subscription_expires_at) : null;
    
    // Check if subscription has expired
    const isExpired = expiresAt && expiresAt <= now;
    const hasPaidPlan = user.subscription_plan && user.subscription_plan !== 'free';
    const hasPaidSubscription = user.sub_plan && user.sub_plan !== 'free';
    const isActive = !isExpired && ((user.subscription_status === 'active' && hasPaidPlan) || hasPaidSubscription);

    if (!isActive) {
      // Auto-update expired subscription status
      if (isExpired && user.subscription_status === 'active') {
        await pool.query(
          `UPDATE users SET subscription_status = 'expired', updated_at = NOW() WHERE id = $1`,
          [req.user.id]
        );
        await pool.query(
          `UPDATE subscriptions SET status = 'expired', updated_at = NOW() WHERE user_id = $1 AND status = 'active'`,
          [req.user.id]
        );
      }

      return res.status(403).json({ 
        error: 'Subscription expired',
        code: isExpired ? 'SUBSCRIPTION_EXPIRED' : 'SUBSCRIPTION_REQUIRED',
        message: isExpired 
          ? 'Your subscription has expired. Please renew to continue accessing premium features.'
          : 'This feature requires an active subscription. Please subscribe to access premium features.',
        expiresAt: user.subscription_expires_at
      });
    }

    // Attach subscription info to request for downstream use
    req.subscription = {
      status: 'active',
      plan: user.subscription_plan || user.sub_plan,
      expiresAt: user.subscription_expires_at
    };

    next();
  } catch (error) {
    console.error('Subscription auth error:', error);
    return res.status(500).json({ error: 'Authorization failed' });
  }
};
