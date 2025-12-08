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
} from '../controllers/userController.js';
import { requireAdmin } from '../middleware/auth.js';
// Admin: List all users
router.get('/admin/all', requireAdmin, listAllUsers);

// Admin: Block/unblock user
router.patch('/admin/:userId/block', requireAdmin, setUserBlocked);
import { authenticate } from '../middleware/auth.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

// Profile
router.get('/profile', apiLimiter, getProfile);
router.put('/profile', apiLimiter, updateProfile);

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
