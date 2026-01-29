import pool from '../config/database.js';
import crypto from 'crypto';

/**
 * Parse user agent string to extract device info
 */
export function parseUserAgent(userAgent) {
  const ua = userAgent || '';
  
  // Detect device type
  let deviceType = 'desktop';
  if (/mobile|android|iphone|ipad|ipod|blackberry|windows phone/i.test(ua)) {
    deviceType = /ipad|tablet/i.test(ua) ? 'tablet' : 'mobile';
  }
  
  // Detect browser
  let browser = 'Unknown';
  if (/edg/i.test(ua)) browser = 'Edge';
  else if (/chrome/i.test(ua) && !/edg/i.test(ua)) browser = 'Chrome';
  else if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua) && !/chrome/i.test(ua)) browser = 'Safari';
  else if (/opera|opr/i.test(ua)) browser = 'Opera';
  else if (/msie|trident/i.test(ua)) browser = 'Internet Explorer';
  
  // Detect OS
  let os = 'Unknown';
  if (/windows nt 10/i.test(ua)) os = 'Windows 10/11';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua) && !/android/i.test(ua)) os = 'Linux';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  
  // Generate device name
  let deviceName = `${browser} on ${os}`;
  if (deviceType === 'mobile') {
    if (/iphone/i.test(ua)) deviceName = 'iPhone';
    else if (/android/i.test(ua)) {
      const match = ua.match(/android.*?;\s*([^;)]+)/i);
      deviceName = match ? match[1].trim() : 'Android Device';
    }
  }
  
  return { deviceType, deviceName, browser, os };
}

/**
 * Create a new session for a user
 */
export async function createSession(userId, req, token) {
  try {
    const userAgent = req.headers['user-agent'] || '';
    const { deviceType, deviceName, browser, os } = parseUserAgent(userAgent);
    
    // Get IP address
    const ip = req.headers['x-forwarded-for']?.split(',')[0] || 
               req.headers['x-real-ip'] || 
               req.connection?.remoteAddress || 
               req.ip || 
               'Unknown';
    
    // Generate a unique session token hash (we hash the JWT to avoid storing it directly)
    const sessionToken = crypto.createHash('sha256').update(token).digest('hex');
    
    // Calculate expiry (7 days from now)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    // Insert session
    await pool.query(`
      INSERT INTO user_sessions (
        user_id, session_token, device_type, device_name, browser, os, 
        ip_address, user_agent, is_current, expires_at, last_active
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE, $9, NOW())
      ON CONFLICT (session_token) DO UPDATE SET
        last_active = NOW(),
        is_current = TRUE
    `, [userId, sessionToken, deviceType, deviceName, browser, os, ip, userAgent, expiresAt]);
    
    console.log(`Session created for user ${userId}: ${deviceName} (${deviceType})`);
    
    return sessionToken;
  } catch (error) {
    console.error('Error creating session:', error);
    // Don't throw - session creation failure shouldn't break login
    return null;
  }
}

/**
 * Get all sessions for a user
 */
export async function getUserSessions(userId, currentToken = null) {
  try {
    const result = await pool.query(`
      SELECT 
        id, device_type, device_name, browser, os, ip_address, 
        location, last_active, created_at, session_token
      FROM user_sessions
      WHERE user_id = $1 AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY last_active DESC
    `, [userId]);
    
    // Hash current token for comparison
    const currentTokenHash = currentToken 
      ? crypto.createHash('sha256').update(currentToken).digest('hex')
      : null;
    
    return result.rows.map(session => ({
      id: session.id,
      deviceType: session.device_type,
      deviceName: session.device_name,
      browser: session.browser,
      os: session.os,
      ip: session.ip_address,
      location: session.location,
      lastActive: session.last_active,
      createdAt: session.created_at,
      current: currentTokenHash === session.session_token,
    }));
  } catch (error) {
    console.error('Error getting user sessions:', error);
    return [];
  }
}

/**
 * Update session last_active timestamp
 */
export async function updateSessionActivity(token) {
  try {
    const sessionToken = crypto.createHash('sha256').update(token).digest('hex');
    await pool.query(`
      UPDATE user_sessions SET last_active = NOW() WHERE session_token = $1
    `, [sessionToken]);
  } catch (error) {
    // Silent fail - don't break the request
  }
}

/**
 * Revoke a session
 */
export async function revokeSession(userId, sessionId) {
  try {
    const result = await pool.query(`
      DELETE FROM user_sessions WHERE id = $1 AND user_id = $2 RETURNING id
    `, [sessionId, userId]);
    return result.rows.length > 0;
  } catch (error) {
    console.error('Error revoking session:', error);
    return false;
  }
}

/**
 * Revoke all sessions except current
 */
export async function revokeOtherSessions(userId, currentToken) {
  try {
    const currentTokenHash = crypto.createHash('sha256').update(currentToken).digest('hex');
    await pool.query(`
      DELETE FROM user_sessions WHERE user_id = $1 AND session_token != $2
    `, [userId, currentTokenHash]);
    return true;
  } catch (error) {
    console.error('Error revoking sessions:', error);
    return false;
  }
}

/**
 * Clean up expired sessions
 */
export async function cleanupExpiredSessions() {
  try {
    await pool.query('DELETE FROM user_sessions WHERE expires_at < NOW()');
  } catch (error) {
    console.error('Error cleaning up sessions:', error);
  }
}
