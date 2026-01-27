import express from 'express';
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

// MT5 Accounts
router.get('/mt5-accounts', apiLimiter, getMT5Accounts);
router.post('/mt5-accounts', apiLimiter, addMT5Account);

// Robot Configurations
router.get('/robot-configs', apiLimiter, getRobotConfigs);
router.put('/robot-configs/:robotId', apiLimiter, updateRobotConfig);

export default router;
