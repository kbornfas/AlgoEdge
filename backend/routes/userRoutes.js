import express from 'express';
import pool from '../config/database.js';
import {
  getProfile,
  updateProfile,
  getSettings,
  updateSettings,
  getMT5Accounts,
  addMT5Account,
  getRobotConfigs,
  updateRobotConfig,
  listAllUsers,
  setUserBlocked,
  changePassword,
  sendPasswordChangeCode,
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';
import { fetchEconomicCalendar, getUpcomingNews, getRecentNews } from '../services/newsService.js';

const router = express.Router();

// =====================================================
// PUBLIC ROUTES (no auth required)
// =====================================================

// Economic Calendar - Returns real scheduled news events
router.get('/economic-calendar', apiLimiter, async (req, res) => {
  try {
    const news = await fetchEconomicCalendar();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Filter for today and upcoming events, format for frontend
    const events = news
      .filter(item => {
        const eventDate = new Date(item.time);
        return eventDate >= today;
      })
      .slice(0, 20) // Limit to 20 events
      .map((item, index) => ({
        id: index + 1,
        title: item.event,
        currency: item.currency,
        impact: item.impact?.toLowerCase() || 'medium',
        actual: item.actual || null,
        forecast: item.forecast || null,
        previous: item.previous || null,
        time: new Date(item.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        date: new Date(item.time).toLocaleDateString('en-US'),
      }));
    
    res.json({ events, success: true });
  } catch (error) {
    console.error('Economic calendar error:', error);
    res.json({ events: [], success: false, error: error.message });
  }
});

// Market News - Returns recent forex news
router.get('/news', apiLimiter, async (req, res) => {
  try {
    const recentNews = await getRecentNews(12); // Last 12 hours
    
    const news = recentNews.slice(0, 10).map((item, index) => ({
      id: index + 1,
      title: item.event,
      summary: `${item.currency} - ${item.impact} impact event. ${item.actual ? `Actual: ${item.actual}` : ''} ${item.forecast ? `Forecast: ${item.forecast}` : ''} ${item.previous ? `Previous: ${item.previous}` : ''}`.trim(),
      impact: item.impact?.toLowerCase() || 'medium',
      currency: item.currency,
      published_at: item.time,
      source: 'Economic Calendar',
    }));
    
    res.json({ news, success: true });
  } catch (error) {
    console.error('News fetch error:', error);
    res.json({ news: [], success: false, error: error.message });
  }
});

// Admin: List all users
router.get('/admin/all', listAllUsers);

// Admin: Block/unblock user
router.patch('/admin/:userId/block', setUserBlocked);

// All user routes require authentication
router.use(authenticate);

// Profile
router.get('/profile', apiLimiter, getProfile);
router.put('/profile', apiLimiter, updateProfile);
router.post('/send-password-code', apiLimiter, sendPasswordChangeCode);
router.post('/change-password', apiLimiter, changePassword);

// Settings
router.get('/settings', apiLimiter, getSettings);
router.put('/settings', apiLimiter, updateSettings);

// Sessions - Get user's active login sessions
router.get('/sessions', apiLimiter, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Try to get sessions from database if table exists
    let sessions = [];
    try {
      const result = await pool.query(`
        SELECT id, device_type, browser, os, ip_address, location, 
               created_at as logged_in_at, last_active_at, is_current
        FROM user_sessions 
        WHERE user_id = $1 
        ORDER BY is_current DESC, last_active_at DESC
        LIMIT 10
      `, [userId]);
      
      sessions = result.rows.map(session => ({
        id: session.id,
        device: session.device_type || 'Desktop',
        browser: session.browser || 'Unknown',
        os: session.os || 'Unknown',
        ip: session.ip_address || 'Unknown',
        location: session.location || 'Unknown',
        loggedInAt: session.logged_in_at,
        lastActive: session.last_active_at,
        current: session.is_current || false,
      }));
    } catch (dbError) {
      // Table might not exist, that's okay - we'll return current session
      console.log('Sessions table not found, returning current session only');
    }
    
    // If no sessions found, return current session based on request
    if (sessions.length === 0) {
      const userAgent = req.headers['user-agent'] || '';
      const ip = req.ip || req.connection?.remoteAddress || 'Unknown';
      
      let device = 'Desktop';
      let browser = 'Unknown';
      let os = 'Unknown';
      
      // Parse user agent
      if (userAgent.includes('Mobile')) device = 'Mobile';
      else if (userAgent.includes('Tablet')) device = 'Tablet';
      
      if (userAgent.includes('Chrome')) browser = 'Chrome';
      else if (userAgent.includes('Firefox')) browser = 'Firefox';
      else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
      else if (userAgent.includes('Edge')) browser = 'Edge';
      
      if (userAgent.includes('Windows')) os = 'Windows';
      else if (userAgent.includes('Mac')) os = 'macOS';
      else if (userAgent.includes('Linux') && !userAgent.includes('Android')) os = 'Linux';
      else if (userAgent.includes('Android')) os = 'Android';
      else if (userAgent.includes('iPhone') || userAgent.includes('iPad')) os = 'iOS';
      
      sessions = [{
        id: 'current',
        device: device,
        browser: browser,
        os: os,
        ip: ip.replace('::ffff:', ''),
        location: 'Current Location',
        loggedInAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        current: true,
      }];
    }
    
    res.json({ success: true, sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    // Return fallback session on error
    const userAgent = req.headers['user-agent'] || '';
    const ip = req.ip || 'Unknown';
    
    res.json({
      success: true,
      sessions: [{
        id: 'current',
        device: userAgent.includes('Mobile') ? 'Mobile' : 'Desktop',
        browser: userAgent.includes('Chrome') ? 'Chrome' : 
                 userAgent.includes('Firefox') ? 'Firefox' : 
                 userAgent.includes('Safari') ? 'Safari' : 'Unknown',
        os: userAgent.includes('Windows') ? 'Windows' : 
            userAgent.includes('Mac') ? 'macOS' : 
            userAgent.includes('Linux') ? 'Linux' : 'Unknown',
        ip: ip.replace('::ffff:', ''),
        location: 'Current Session',
        loggedInAt: new Date().toISOString(),
        lastActive: new Date().toISOString(),
        current: true,
      }]
    });
  }
});

// MT5 Accounts
router.get('/mt5-accounts', apiLimiter, getMT5Accounts);
router.post('/mt5-accounts', apiLimiter, addMT5Account);

// Robot Configurations
router.get('/robot-configs', apiLimiter, getRobotConfigs);
router.put('/robot-configs/:robotId', apiLimiter, updateRobotConfig);

export default router;
