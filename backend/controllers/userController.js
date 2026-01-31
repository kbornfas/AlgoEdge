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
              u.is_verified, u.has_blue_badge, u.two_fa_enabled, u.created_at, u.bio, u.date_of_birth,
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

    // Combine is_verified and has_blue_badge
    const user = result.rows[0];
    user.is_verified = user.is_verified === true || user.has_blue_badge === true;

    res.json({ user });
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

    let settings;
    if (result.rows.length === 0) {
      // Create default settings if not exist
      const defaultTradingPrefs = {
        defaultRiskPercent: 2,
        maxDailyTrades: 10,
        maxDailyLossPercent: 5,
        maxLotSize: 0.5,
        defaultLotSize: 0.01,
        tradingHoursStart: '00:00',
        tradingHoursEnd: '23:59',
        timezone: 'UTC',
        autoStopOnDailyLoss: true,
        weekendTrading: false,
        newsFilterEnabled: true,
        newsFilterMinutes: 30,
        maxOpenTrades: 5,
        trailingStopEnabled: false,
        trailingStopPips: 20,
        breakEvenEnabled: false,
        breakEvenPips: 10,
        defaultTakeProfit: 50,
        defaultStopLoss: 25,
        partialCloseEnabled: false,
        partialClosePercent: 50,
        partialClosePips: 30,
      };
      
      const defaultAppearance = {
        theme: 'dark',
        accentColor: 'blue',
        compactMode: false,
        showProfitInPips: false,
        showPercentageGain: true,
        animationsEnabled: true,
        chartDefaultTimeframe: '1H',
        dashboardLayout: 'default',
        sidebarCollapsed: false,
      };
      
      const defaultLocalization = {
        language: 'en',
        currency: 'USD',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: '12h',
        numberFormat: 'en-US',
      };
      
      const defaultPrivacy = {
        profilePublic: false,
        showOnLeaderboard: true,
        shareTradeHistory: false,
        allowDataAnalytics: true,
        hideBalance: false,
        twoClickTrade: true,
        confirmBeforeClose: true,
        sessionTimeout: 30,
      };

      const newSettings = await pool.query(
        `INSERT INTO user_settings (user_id, trading_prefs, appearance, localization, privacy) 
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [userId, JSON.stringify(defaultTradingPrefs), JSON.stringify(defaultAppearance), 
         JSON.stringify(defaultLocalization), JSON.stringify(defaultPrivacy)]
      );
      settings = newSettings.rows[0];
    } else {
      settings = result.rows[0];
    }

    // Format the response with parsed JSONB fields
    const formattedSettings = {
      ...settings,
      tradingPrefs: typeof settings.trading_prefs === 'string' 
        ? JSON.parse(settings.trading_prefs) 
        : settings.trading_prefs || {},
      appearance: typeof settings.appearance === 'string' 
        ? JSON.parse(settings.appearance) 
        : settings.appearance || {},
      localization: typeof settings.localization === 'string' 
        ? JSON.parse(settings.localization) 
        : settings.localization || {},
      privacy: typeof settings.privacy === 'string' 
        ? JSON.parse(settings.privacy) 
        : settings.privacy || {},
    };

    res.json({ settings: formattedSettings });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
};

// Update User Settings
export const updateSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Support both camelCase and snake_case from frontend
    const {
      // Notification settings
      email_notifications, emailNotifications,
      trade_alerts, tradeAlerts,
      daily_reports, dailyReports,
      weekly_reports, weeklyReports,
      market_news, marketNews,
      telegram_alerts, telegramAlerts,
      telegram_chat_id, telegramChatId,
      // Complex settings (JSONB)
      tradingPrefs, trading_prefs,
      appearance,
      localization,
      privacy,
      notifications,
      // Simple settings
      timezone,
      theme,
      risk_level, riskLevel,
      stop_loss_percent, stopLossPercent,
      take_profit_percent, takeProfitPercent,
      auto_close_profit, autoCloseProfit,
    } = req.body;

    // Build dynamic update query based on what was provided
    const updates = [];
    const values = [];
    let paramIndex = 1;

    // Handle notification settings
    const finalEmailNotifications = email_notifications ?? emailNotifications ?? (notifications?.emailNotifications);
    if (finalEmailNotifications !== undefined) {
      updates.push(`email_notifications = $${paramIndex++}`);
      values.push(finalEmailNotifications);
    }

    const finalTradeAlerts = trade_alerts ?? tradeAlerts ?? (notifications?.tradeAlerts);
    if (finalTradeAlerts !== undefined) {
      updates.push(`trade_alerts = $${paramIndex++}`);
      values.push(finalTradeAlerts);
    }

    const finalDailyReports = daily_reports ?? dailyReports ?? (notifications?.dailyReports);
    if (finalDailyReports !== undefined) {
      updates.push(`daily_reports = $${paramIndex++}`);
      values.push(finalDailyReports);
    }

    const finalWeeklyReports = weekly_reports ?? weeklyReports ?? (notifications?.weeklyReports);
    if (finalWeeklyReports !== undefined) {
      updates.push(`weekly_reports = $${paramIndex++}`);
      values.push(finalWeeklyReports);
    }

    const finalMarketNews = market_news ?? marketNews ?? (notifications?.marketNews);
    if (finalMarketNews !== undefined) {
      updates.push(`market_news = $${paramIndex++}`);
      values.push(finalMarketNews);
    }

    const finalTelegramAlerts = telegram_alerts ?? telegramAlerts ?? (notifications?.telegramAlerts);
    if (finalTelegramAlerts !== undefined) {
      updates.push(`telegram_alerts = $${paramIndex++}`);
      values.push(finalTelegramAlerts);
    }

    const finalTelegramChatId = telegram_chat_id ?? telegramChatId ?? (notifications?.telegramChatId);
    if (finalTelegramChatId !== undefined) {
      updates.push(`telegram_chat_id = $${paramIndex++}`);
      values.push(finalTelegramChatId);
    }

    // Handle JSONB fields
    const finalTradingPrefs = tradingPrefs ?? trading_prefs;
    if (finalTradingPrefs !== undefined) {
      updates.push(`trading_prefs = $${paramIndex++}`);
      values.push(JSON.stringify(finalTradingPrefs));
    }

    if (appearance !== undefined) {
      updates.push(`appearance = $${paramIndex++}`);
      values.push(JSON.stringify(appearance));
    }

    if (localization !== undefined) {
      updates.push(`localization = $${paramIndex++}`);
      values.push(JSON.stringify(localization));
    }

    if (privacy !== undefined) {
      updates.push(`privacy = $${paramIndex++}`);
      values.push(JSON.stringify(privacy));
    }

    // Handle simple fields
    if (timezone !== undefined) {
      updates.push(`timezone = $${paramIndex++}`);
      values.push(timezone);
    }

    if (theme !== undefined) {
      updates.push(`theme = $${paramIndex++}`);
      values.push(theme);
    }

    const finalRiskLevel = risk_level ?? riskLevel;
    if (finalRiskLevel !== undefined) {
      updates.push(`risk_level = $${paramIndex++}`);
      values.push(finalRiskLevel);
    }

    const finalStopLossPercent = stop_loss_percent ?? stopLossPercent;
    if (finalStopLossPercent !== undefined) {
      updates.push(`stop_loss_percent = $${paramIndex++}`);
      values.push(finalStopLossPercent);
    }

    const finalTakeProfitPercent = take_profit_percent ?? takeProfitPercent;
    if (finalTakeProfitPercent !== undefined) {
      updates.push(`take_profit_percent = $${paramIndex++}`);
      values.push(finalTakeProfitPercent);
    }

    const finalAutoCloseProfit = auto_close_profit ?? autoCloseProfit;
    if (finalAutoCloseProfit !== undefined) {
      updates.push(`auto_close_profit = $${paramIndex++}`);
      values.push(finalAutoCloseProfit);
    }

    // Always update the timestamp
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    // Add user_id to values
    values.push(userId);

    // First, ensure user settings exist
    const existingSettings = await pool.query(
      'SELECT id FROM user_settings WHERE user_id = $1',
      [userId]
    );

    if (existingSettings.rows.length === 0) {
      // Create settings first
      await pool.query('INSERT INTO user_settings (user_id) VALUES ($1)', [userId]);
    }

    // Now update
    const result = await pool.query(
      `UPDATE user_settings 
       SET ${updates.join(', ')}
       WHERE user_id = $${paramIndex}
       RETURNING *`,
      values
    );

    auditLog(userId, 'SETTINGS_UPDATED', req.body, req);

    // Format the response
    const settings = result.rows[0];
    const formattedSettings = {
      ...settings,
      tradingPrefs: typeof settings.trading_prefs === 'string' 
        ? JSON.parse(settings.trading_prefs) 
        : settings.trading_prefs || {},
      appearance: typeof settings.appearance === 'string' 
        ? JSON.parse(settings.appearance) 
        : settings.appearance || {},
      localization: typeof settings.localization === 'string' 
        ? JSON.parse(settings.localization) 
        : settings.localization || {},
      privacy: typeof settings.privacy === 'string' 
        ? JSON.parse(settings.privacy) 
        : settings.privacy || {},
    };

    res.json({ settings: formattedSettings, message: 'Settings saved successfully' });
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
