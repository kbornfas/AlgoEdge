import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
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
import { getUserSessions, revokeSession, revokeOtherSessions, parseUserAgent } from '../services/sessionService.js';
import { getUserActivities } from '../services/activityLogService.js';

const router = express.Router();

// Configure multer for profile image uploads
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/profiles';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `profile-${req.user?.id || 'unknown'}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const profileUpload = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed'));
  }
});

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

// Profile image upload - Store as base64 data URL in database
router.post('/profile/image', authenticate, apiLimiter, profileUpload.single('profile_image'), async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Read the file and convert to base64 data URL
    const fileBuffer = fs.readFileSync(req.file.path);
    const base64Image = fileBuffer.toString('base64');
    const mimeType = req.file.mimetype;
    const dataUrl = `data:${mimeType};base64,${base64Image}`;
    
    // Clean up the temp file
    try {
      fs.unlinkSync(req.file.path);
    } catch (e) {
      // Ignore cleanup errors
    }

    // Update user's profile_image in the database with the data URL
    await pool.query(
      'UPDATE users SET profile_image = $1, updated_at = NOW() WHERE id = $2',
      [dataUrl, userId]
    );

    console.log(`Profile image updated for user ${userId} (base64, ${Math.round(base64Image.length / 1024)}KB)`);

    res.json({
      success: true,
      profile_image: dataUrl,
      message: 'Profile image uploaded successfully'
    });
  } catch (error) {
    console.error('Profile image upload error:', error);
    res.status(500).json({ error: 'Failed to upload profile image' });
  }
});

// Settings
router.get('/settings', apiLimiter, getSettings);
router.put('/settings', apiLimiter, updateSettings);

// Sessions - Get user's active login sessions
router.get('/sessions', apiLimiter, async (req, res) => {
  try {
    const userId = req.user.id;
    const token = req.headers.authorization?.split(' ')[1];
    
    // Get all sessions for this user
    const sessions = await getUserSessions(userId, token);
    
    // If no sessions in DB, return current session as fallback
    if (sessions.length === 0) {
      const userAgent = req.headers['user-agent'] || '';
      const { deviceType, deviceName, browser, os } = parseUserAgent(userAgent);
      const ip = req.headers['x-forwarded-for']?.split(',')[0] || 
                 req.headers['x-real-ip'] || 
                 req.ip || 
                 'Unknown';
      
      return res.json({
        success: true,
        sessions: [{
          id: 'current',
          deviceType,
          deviceName,
          browser,
          os,
          ip: ip.replace('::ffff:', ''),
          location: null,
          lastActive: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          current: true,
        }]
      });
    }
    
    res.json({ success: true, sessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ success: false, error: 'Failed to get sessions' });
  }
});

// Revoke a specific session
router.delete('/sessions/:sessionId', apiLimiter, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;
    
    const success = await revokeSession(userId, parseInt(sessionId));
    
    if (success) {
      res.json({ success: true, message: 'Session revoked' });
    } else {
      res.status(404).json({ success: false, error: 'Session not found' });
    }
  } catch (error) {
    console.error('Revoke session error:', error);
    res.status(500).json({ success: false, error: 'Failed to revoke session' });
  }
});

// Revoke all other sessions
router.post('/sessions/revoke-others', apiLimiter, async (req, res) => {
  try {
    const userId = req.user.id;
    const token = req.headers.authorization?.split(' ')[1];
    
    await revokeOtherSessions(userId, token);
    res.json({ success: true, message: 'All other sessions revoked' });
  } catch (error) {
    console.error('Revoke other sessions error:', error);
    res.status(500).json({ success: false, error: 'Failed to revoke sessions' });
  }
});

// Activity / Login History
router.get('/activity', apiLimiter, async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 15, 50);
    const offset = (page - 1) * limit;
    const type = req.query.type; // Optional filter
    
    // Build options
    const options = { limit: limit + 1, offset }; // Get one extra to check if more exist
    if (type && type !== 'all') {
      options.types = [type];
    }
    
    const activities = await getUserActivities(userId, options);
    const hasMore = activities.length > limit;
    const results = hasMore ? activities.slice(0, limit) : activities;
    
    // Count total for pagination
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM activity_logs WHERE user_id = $1' + 
        (type && type !== 'all' ? ' AND activity_type = $2' : ''),
      type && type !== 'all' ? [userId, type] : [userId]
    );
    const total = parseInt(countResult.rows[0].count);
    
    res.json({
      success: true,
      activities: results,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore,
      },
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({ success: false, error: 'Failed to get activity' });
  }
});

// MT5 Accounts
router.get('/mt5-accounts', apiLimiter, getMT5Accounts);
router.post('/mt5-accounts', apiLimiter, addMT5Account);

// Robot Configurations
router.get('/robot-configs', apiLimiter, getRobotConfigs);
router.put('/robot-configs/:robotId', apiLimiter, updateRobotConfig);

export default router;
