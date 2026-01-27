// List all users (admin only)
export const listAllUsers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, full_name, phone, country, timezone, is_verified, two_fa_enabled, created_at, is_blocked,
              subscription_status, subscription_plan, subscription_expires_at
       FROM users
       ORDER BY created_at DESC`
    );
    res.json({ users: result.rows });
  } catch (error) {
    console.error('List all users error:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
};

// Block or unblock a user (admin only)
export const setUserBlocked = async (req, res) => {
  try {
    const { userId } = req.params;
    const { block } = req.body;
    const result = await pool.query(
      `UPDATE users SET is_blocked = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, username, is_blocked`,
      [!!block, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    auditLog(req.user.id, block ? 'USER_BLOCKED' : 'USER_UNBLOCKED', { userId }, req);
    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Set user blocked error:', error);
    res.status(500).json({ error: 'Failed to update user status' });
  }
};
import pool from '../config/database.js';
import { auditLog } from '../middleware/audit.js';
import bcrypt from 'bcryptjs';
import { sendVerificationCodeEmail, generateVerificationCode } from '../services/emailService.js';

// Send Password Change Code (to user's email)
export const sendPasswordChangeCode = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user email
    const userResult = await pool.query(
      'SELECT email, username FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { email, username } = userResult.rows[0];

    // Generate 6-digit code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store code in database
    await pool.query(
      `INSERT INTO verification_codes (user_id, code, type, expires_at)
       VALUES ($1, $2, 'password_change', $3)
       ON CONFLICT (user_id, type) DO UPDATE SET code = $2, expires_at = $3, created_at = CURRENT_TIMESTAMP`,
      [userId, code, expiresAt]
    );

    // Send email
    await sendVerificationCodeEmail(email, username || 'User', code, 10);

    res.json({ message: 'Verification code sent to your email', email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3') });
  } catch (error) {
    console.error('Send password change code error:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
};

// Change Password (with email verification code)
export const changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { code, newPassword } = req.body;

    if (!code || !newPassword) {
      return res.status(400).json({ error: 'Verification code and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    // Verify the code
    const codeResult = await pool.query(
      `SELECT * FROM verification_codes 
       WHERE user_id = $1 AND code = $2 AND type = 'password_change' AND expires_at > NOW()`,
      [userId, code]
    );

    if (codeResult.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // Delete used code
    await pool.query(
      `DELETE FROM verification_codes WHERE user_id = $1 AND type = 'password_change'`,
      [userId]
    );

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, userId]
    );

    auditLog(userId, 'PASSWORD_CHANGED', {}, req);

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
};

// Get User Profile
export const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT u.id, u.username, u.email, u.full_name, u.phone, u.country, u.timezone,
              u.is_verified, u.two_fa_enabled, u.created_at, u.bio, u.date_of_birth,
              u.profile_picture as avatar_url,
              s.plan, s.status as subscription_status, s.current_period_end
       FROM users u
       LEFT JOIN subscriptions s ON u.id = s.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

// Update User Profile
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { full_name, fullName, phone, country, timezone, bio, date_of_birth, dateOfBirth } = req.body;
    
    // Support both camelCase and snake_case
    const finalFullName = full_name || fullName;
    const finalDateOfBirth = date_of_birth || dateOfBirth;

    const result = await pool.query(
      `UPDATE users 
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           country = COALESCE($3, country),
           timezone = COALESCE($4, timezone),
           bio = COALESCE($5, bio),
           date_of_birth = COALESCE($6, date_of_birth),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING id, username, email, full_name, phone, country, timezone, bio, date_of_birth, profile_picture as avatar_url`,
      [finalFullName, phone, country, timezone, bio, finalDateOfBirth, userId]
    );

    auditLog(userId, 'PROFILE_UPDATED', req.body, req);

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

// Get User Settings
export const getSettings = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      'SELECT * FROM user_settings WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      // Create default settings if not exist
      const newSettings = await pool.query(
        'INSERT INTO user_settings (user_id) VALUES ($1) RETURNING *',
        [userId]
      );
      return res.json({ settings: newSettings.rows[0] });
    }

    res.json({ settings: result.rows[0] });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
};

// Update User Settings
export const updateSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      email_notifications,
      trade_alerts,
      daily_reports,
      weekly_reports,
      market_news,
      telegram_alerts,
      telegram_chat_id,
      timezone,
      trading_prefs,
      risk_level,
      stop_loss_percent,
      take_profit_percent,
      auto_close_profit,
      theme,
    } = req.body;

    const result = await pool.query(
      `UPDATE user_settings 
       SET email_notifications = COALESCE($1, email_notifications),
           trade_alerts = COALESCE($2, trade_alerts),
           daily_reports = COALESCE($3, daily_reports),
           weekly_reports = COALESCE($4, weekly_reports),
           market_news = COALESCE($5, market_news),
           telegram_alerts = COALESCE($6, telegram_alerts),
           telegram_chat_id = COALESCE($7, telegram_chat_id),
           timezone = COALESCE($8, timezone),
           trading_prefs = COALESCE($9, trading_prefs),
           risk_level = COALESCE($10, risk_level),
           stop_loss_percent = COALESCE($11, stop_loss_percent),
           take_profit_percent = COALESCE($12, take_profit_percent),
           auto_close_profit = COALESCE($13, auto_close_profit),
           theme = COALESCE($14, theme),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $15
       RETURNING *`,
      [
        email_notifications,
        trade_alerts,
        daily_reports,
        weekly_reports,
        market_news,
        telegram_alerts,
        telegram_chat_id,
        timezone,
        trading_prefs ? JSON.stringify(trading_prefs) : null,
        risk_level,
        stop_loss_percent,
        take_profit_percent,
        auto_close_profit,
        theme,
        userId,
      ]
    );

    auditLog(userId, 'SETTINGS_UPDATED', req.body, req);

    res.json({ settings: result.rows[0] });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

// Get User's MT5 Accounts
export const getMT5Accounts = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT id, account_id, server, is_demo, is_connected, balance, equity, last_sync, created_at
       FROM mt5_accounts WHERE user_id = $1`,
      [userId]
    );

    res.json({ accounts: result.rows });
  } catch (error) {
    console.error('Get MT5 accounts error:', error);
    res.status(500).json({ error: 'Failed to get MT5 accounts' });
  }
};

// Add MT5 Account
export const addMT5Account = async (req, res) => {
  try {
    const userId = req.user.id;
    const { account_id, server, api_key, api_secret, is_demo } = req.body;

    if (!account_id || !server) {
      return res.status(400).json({ error: 'Account ID and server are required' });
    }

    // Check subscription limits
    const subscription = await pool.query(
      'SELECT plan FROM subscriptions WHERE user_id = $1',
      [userId]
    );

    const accountCount = await pool.query(
      'SELECT COUNT(*) FROM mt5_accounts WHERE user_id = $1',
      [userId]
    );

    const plan = subscription.rows[0]?.plan || 'free';
    const maxAccounts = plan === 'free' ? 1 : plan === 'pro' ? 3 : 999;

    if (parseInt(accountCount.rows[0].count) >= maxAccounts) {
      return res.status(403).json({ error: `Your plan allows maximum ${maxAccounts} account(s)` });
    }

    const result = await pool.query(
      `INSERT INTO mt5_accounts (user_id, account_id, server, api_key, api_secret, is_demo)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, account_id, server, is_demo, created_at`,
      [userId, account_id, server, api_key, api_secret, is_demo || false]
    );

    auditLog(userId, 'MT5_ACCOUNT_ADDED', { account_id, server }, req);

    res.status(201).json({ account: result.rows[0] });
  } catch (error) {
    console.error('Add MT5 account error:', error);
    res.status(500).json({ error: 'Failed to add MT5 account' });
  }
};

// Get Robot Configurations
export const getRobotConfigs = async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(
      `SELECT urc.*, tr.name, tr.description, tr.strategy, tr.timeframe, tr.risk_level, tr.win_rate
       FROM user_robot_configs urc
       JOIN trading_robots tr ON urc.robot_id = tr.id
       WHERE urc.user_id = $1`,
      [userId]
    );

    res.json({ configs: result.rows });
  } catch (error) {
    console.error('Get robot configs error:', error);
    res.status(500).json({ error: 'Failed to get robot configurations' });
  }
};

// Update Robot Configuration
export const updateRobotConfig = async (req, res) => {
  try {
    const userId = req.user.id;
    const { robot_id, is_enabled, settings } = req.body;

    const result = await pool.query(
      `INSERT INTO user_robot_configs (user_id, robot_id, is_enabled, settings)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, robot_id) 
       DO UPDATE SET is_enabled = $3, settings = $4, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, robot_id, is_enabled, JSON.stringify(settings || {})]
    );

    auditLog(userId, 'ROBOT_CONFIG_UPDATED', { robot_id, is_enabled }, req);

    res.json({ config: result.rows[0] });
  } catch (error) {
    console.error('Update robot config error:', error);
    res.status(500).json({ error: 'Failed to update robot configuration' });
  }
};

export default {
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
};
