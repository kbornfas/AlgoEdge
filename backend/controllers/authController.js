import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import pool from '../config/database.js';
import { sendEmail, generateVerificationCode, sendVerificationCodeEmail, sendVerificationCodeSMS } from '../services/emailService.js';
import { auditLog } from '../middleware/audit.js';
import { sendNewReferralTelegram } from '../services/telegramService.js';

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};


// Register - with OTP email verification
export const register = async (req, res) => {
  const client = await pool.connect();
  try {
    const { username, firstName, lastName, email, password, referralCode } = req.body;
    
    // Support both username field or firstName+lastName
    const finalUsername = username || (firstName && lastName ? `${firstName.trim()} ${lastName.trim()}` : null);
    
    if (!finalUsername || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Strong password validation
    const passwordErrors = [];
    if (password.length < 8) {
      passwordErrors.push('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password)) {
      passwordErrors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      passwordErrors.push('Password must contain at least one lowercase letter');
    }
    if (!/[0-9]/.test(password)) {
      passwordErrors.push('Password must contain at least one number');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      passwordErrors.push('Password must contain at least one special character (!@#$%^&*...)');
    }
    
    if (passwordErrors.length > 0) {
      return res.status(400).json({ 
        error: 'Password does not meet security requirements',
        details: passwordErrors.map(msg => ({ field: 'password', message: msg }))
      });
    }
    
    await client.query('BEGIN');
    // Check if user exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, finalUsername]
    );
    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'User already exists' });
    }

    // Check referral code if provided
    let referrerId = null;
    if (referralCode) {
      const referrerResult = await client.query(
        'SELECT id, username FROM users WHERE referral_code = $1',
        [referralCode.toUpperCase()]
      );
      if (referrerResult.rows.length > 0) {
        referrerId = referrerResult.rows[0].id;
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);
    
    // Generate OTP code
    const otpCode = generateVerificationCode();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Generate unique referral code for new user (retry if collision)
    let newReferralCode;
    let attempts = 0;
    while (attempts < 5) {
      newReferralCode = 'ALGO' + Math.random().toString(36).substring(2, 8).toUpperCase();
      const existingCode = await client.query(
        'SELECT id FROM users WHERE referral_code = $1',
        [newReferralCode]
      );
      if (existingCode.rows.length === 0) break;
      attempts++;
    }
    
    // Create user with OTP (not verified yet)
    const result = await client.query(
      `INSERT INTO users (username, email, password_hash, is_verified, verification_token, verification_expires, referred_by, referral_code)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, username, email, created_at`,
      [finalUsername, email, passwordHash, false, otpCode, otpExpires, referrerId, newReferralCode]
    );
    const user = result.rows[0];
    // Create default subscription
    await client.query(
      'INSERT INTO subscriptions (user_id, plan, status) VALUES ($1, $2, $3)',
      [user.id, 'free', 'active']
    );
    // Create default settings
    await client.query(
      'INSERT INTO user_settings (user_id) VALUES ($1)',
      [user.id]
    );
    await client.query('COMMIT');

    // Notify referrer via Telegram if they have it connected
    if (referrerId) {
      try {
        await sendNewReferralTelegram(referrerId, { username: finalUsername });
      } catch (err) {
        console.warn('Failed to send referral notification:', err);
      }
    }
    
    // Send OTP verification email
    const emailSent = await sendVerificationCodeEmail(email, finalUsername, otpCode, 10);
    
    if (!emailSent) {
      console.warn(`⚠️  OTP email failed for ${email}, but registration completed`);
    }
    
    // Audit log
    auditLog(user.id, 'USER_REGISTERED', { email, username: finalUsername, referredBy: referrerId }, req);
    
    res.status(201).json({
      message: 'Registration successful! Please check your email for the verification code.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isVerified: false
      },
      requiresVerification: true
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  } finally {
    client.release();
  }
};


// Remove verifyRegistration endpoint (no longer needed)

// Login
export const login = async (req, res) => {
  try {
    const { username, password, twoFACode } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Get user
    const result = await pool.query(
      `SELECT id, username, email, password_hash, two_fa_enabled, two_fa_secret, is_verified, COALESCE(role, 'user') as role
       FROM users WHERE username = $1 OR email = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No account found with this email. Please register first.', notFound: true });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    // Check if email is verified - if not, send new OTP and redirect to verification
    if (!user.is_verified) {
      // Generate new OTP
      const otpCode = generateVerificationCode();
      const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
      
      await pool.query(
        'UPDATE users SET verification_token = $1, verification_expires = $2 WHERE id = $3',
        [otpCode, otpExpires, user.id]
      );
      
      // Send OTP email
      await sendVerificationCodeEmail(user.email, user.username, otpCode, 10);
      
      return res.status(200).json({
        requiresVerification: true,
        email: user.email,
        message: 'Please verify your email. A new verification code has been sent.'
      });
    }

    // Check 2FA
    if (user.two_fa_enabled) {
      if (!twoFACode) {
        return res.status(200).json({ requires2FA: true });
      }

      const isValid2FA = speakeasy.totp.verify({
        secret: user.two_fa_secret,
        encoding: 'base32',
        token: twoFACode,
      });

      if (!isValid2FA) {
        return res.status(401).json({ error: 'Invalid 2FA code' });
      }
    }

    // Update last login
    await pool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Check subscription status - ONLY paid plans count as active
    const subscriptionResult = await pool.query(
      `SELECT * FROM subscriptions 
       WHERE user_id = $1 
       AND status = 'active' 
       AND plan != 'free'
       ORDER BY created_at DESC LIMIT 1`,
      [user.id]
    );
    
    // Also check subscription_status field on user - must be 'active' with a non-null plan
    const userStatusResult = await pool.query(
      'SELECT subscription_status, subscription_plan FROM users WHERE id = $1',
      [user.id]
    );
    const userStatus = userStatusResult.rows[0]?.subscription_status;
    const userPlan = userStatusResult.rows[0]?.subscription_plan;
    const hasPaidUserSubscription = userStatus === 'active' && userPlan && userPlan !== 'free';
    
    // Admin bypass - always has access (case-insensitive email comparison)
    const adminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
    const isAdmin = user.email?.toLowerCase() === adminEmail || user.role === 'admin';
    const hasActiveSubscription = isAdmin || subscriptionResult.rows.length > 0 || hasPaidUserSubscription;
    
    console.log('Login check:', { email: user.email, adminEmail, isAdmin, role: user.role, hasActiveSubscription, userPlan });

    // Generate token
    const token = generateToken(user.id);

    // Audit log
    auditLog(user.id, 'USER_LOGIN', { username }, req);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isVerified: user.is_verified,
        role: user.role,
        is_admin: isAdmin,
      },
      hasActiveSubscription,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Verify Email
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;

    const result = await pool.query(
      `UPDATE users 
       SET is_verified = true, verification_token = NULL, verification_expires = NULL
       WHERE verification_token = $1 AND verification_expires > NOW()
       RETURNING id, email`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
};

// Request Password Reset
// Request Password Reset (send real code to email)
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    // Check if user exists
    const result = await pool.query(
      'SELECT id, username, email FROM users WHERE email = $1',
      [email]
    );
    if (result.rows.length === 0) {
      // Always return success to prevent email enumeration
      return res.json({ message: 'If the email exists, a reset code has been sent' });
    }
    const user = result.rows[0];
    // Generate 6-digit code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    // Store code in database
    await pool.query(
      `UPDATE users 
       SET reset_code = $1, reset_code_expires = $2, reset_code_attempts = 0
       WHERE id = $3`,
      [code, expiresAt, user.id]
    );
    // Send code via email
    await sendVerificationCodeEmail(user.email, user.username, code, 10);
    // Always return success to prevent email enumeration
    res.json({ message: 'If the email exists, a reset code has been sent' });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Request failed' });
  }
};

// Reset Password
// Reset Password (verify code, then reset)
export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, code, and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    // Find user and check code
    const result = await pool.query(
      'SELECT id, reset_code, reset_code_expires, reset_code_attempts FROM users WHERE email = $1',
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or code' });
    }
    const user = result.rows[0];
    if (!user.reset_code) {
      return res.status(400).json({ error: 'No reset code found. Please request a new one.' });
    }
    if (new Date() > new Date(user.reset_code_expires)) {
      await pool.query(
        'UPDATE users SET reset_code = NULL, reset_code_expires = NULL WHERE id = $1',
        [user.id]
      );
      return res.status(400).json({ error: 'Reset code expired. Please request a new one.' });
    }
    if (user.reset_code_attempts >= 5) {
      await pool.query(
        'UPDATE users SET reset_code = NULL, reset_code_expires = NULL WHERE id = $1',
        [user.id]
      );
      return res.status(429).json({ error: 'Too many attempts. Please request a new code.' });
    }
    if (user.reset_code !== code) {
      await pool.query(
        'UPDATE users SET reset_code_attempts = reset_code_attempts + 1 WHERE id = $1',
        [user.id]
      );
      const attemptsLeft = 5 - (user.reset_code_attempts + 1);
      return res.status(400).json({ error: 'Invalid reset code', attemptsLeft });
    }
    // Code is valid - reset password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);
    await pool.query(
      `UPDATE users 
       SET password_hash = $1, reset_code = NULL, reset_code_expires = NULL, reset_code_attempts = 0
       WHERE id = $2`,
      [passwordHash, user.id]
    );
    res.json({ message: 'Password reset successful' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Reset failed' });
  }
};

// Setup 2FA
export const setup2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const username = req.user.username;

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `AlgoEdge (${username})`,
      length: 32,
    });

    // Generate high-quality QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });

    // Store secret temporarily (will be confirmed on verification)
    await pool.query(
      'UPDATE users SET two_fa_secret = $1 WHERE id = $2',
      [secret.base32, userId]
    );

    res.json({
      secret: secret.base32,
      qrCode,
    });
  } catch (error) {
    console.error('2FA setup error:', error);
    res.status(500).json({ error: '2FA setup failed' });
  }
};

// Verify and Enable 2FA
export const verify2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const { token } = req.body;

    const result = await pool.query(
      'SELECT two_fa_secret FROM users WHERE id = $1',
      [userId]
    );

    const secret = result.rows[0].two_fa_secret;

    const isValid = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token,
    });

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid 2FA code' });
    }

    await pool.query(
      'UPDATE users SET two_fa_enabled = true WHERE id = $1',
      [userId]
    );

    auditLog(userId, '2FA_ENABLED', {}, req);

    res.json({ message: '2FA enabled successfully' });
  } catch (error) {
    console.error('2FA verification error:', error);
    res.status(500).json({ error: '2FA verification failed' });
  }
};

// Disable 2FA
export const disable2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const { password } = req.body;

    // Verify password
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    const isValidPassword = await bcrypt.compare(password, result.rows[0].password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    await pool.query(
      'UPDATE users SET two_fa_enabled = false, two_fa_secret = NULL WHERE id = $1',
      [userId]
    );

    auditLog(userId, '2FA_DISABLED', {}, req);

    res.json({ message: '2FA disabled successfully' });
  } catch (error) {
    console.error('2FA disable error:', error);
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
};

// Send Verification Code (Email or SMS)
export const sendVerificationCode = async (req, res) => {
  try {
    const { email, phone, method = 'email' } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ error: 'Email or phone number required' });
    }

    // Check if user exists
    const userQuery = email 
      ? 'SELECT id, username, email, phone FROM users WHERE email = $1'
      : 'SELECT id, username, email, phone FROM users WHERE phone = $1';
    
    const result = await pool.query(userQuery, [email || phone]);

    if (result.rows.length === 0) {
      // Don't reveal if user exists
      return res.json({ message: 'Verification code sent if account exists' });
    }

    const user = result.rows[0];

    // Generate 6-digit code
    const code = generateVerificationCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store code in database
    await pool.query(
      `UPDATE users 
       SET verification_token = $1, verification_expires = $2
       WHERE id = $3`,
      [code, expiresAt, user.id]
    );

    // Send code via selected method
    if (method === 'sms' && user.phone) {
      await sendVerificationCodeSMS(user.phone, code, 10);
      console.log(`📱 Verification code sent via SMS to ${user.phone}`);
    } else {
      await sendVerificationCodeEmail(user.email, user.username, code, 10);
      console.log(`📧 Verification code sent via email to ${user.email}`);
    }

    // Audit log
    auditLog(user.id, 'VERIFICATION_CODE_SENT', { method, destination: email || phone }, req);

    res.json({ 
      message: 'Verification code sent',
      method,
      expiresIn: 600 // seconds
    });
  } catch (error) {
    console.error('Send verification code error:', error);
    res.status(500).json({ error: 'Failed to send verification code' });
  }
};

// Verify Code
export const verifyCode = async (req, res) => {
  try {
    const { email, phone, code } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ error: 'Email or phone number required' });
    }

    if (!code) {
      return res.status(400).json({ error: 'Verification code required' });
    }

    // Find user
    const userQuery = email
      ? 'SELECT id, username, email, verification_token, verification_expires FROM users WHERE email = $1'
      : 'SELECT id, username, email, verification_token, verification_expires FROM users WHERE phone = $1';
    
    const result = await pool.query(userQuery, [email || phone]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Check if code exists
    if (!user.verification_token) {
      return res.status(400).json({ error: 'No verification code found. Please request a new one.' });
    }

    // Check if code expired
    if (new Date() > new Date(user.verification_expires)) {
      await pool.query(
        'UPDATE users SET verification_token = NULL, verification_expires = NULL WHERE id = $1',
        [user.id]
      );
      return res.status(400).json({ error: 'Verification code expired. Please request a new one.' });
    }

    // Verify code
    if (user.verification_token !== code) {
      return res.status(400).json({ 
        error: 'Invalid verification code'
      });
    }

    // Code is valid - clear it and mark user as verified
    await pool.query(
      `UPDATE users 
       SET verification_token = NULL, 
           verification_expires = NULL,
           is_verified = true
       WHERE id = $1`,
      [user.id]
    );

    // Generate JWT token
    const token = generateToken(user.id);

    // Audit log
    auditLog(user.id, 'VERIFICATION_CODE_VERIFIED', { email, phone }, req);

    res.json({ 
      message: 'Verification successful',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isVerified: true
      }
    });
  } catch (error) {
    console.error('Verify code error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
};

export default {
  register,
  login,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  setup2FA,
  verify2FA,
  disable2FA,
  sendVerificationCode,
  verifyCode,
};
