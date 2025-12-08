import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import pool from '../config/database.js';
import { sendEmail, generateVerificationCode, sendVerificationCodeEmail, sendVerificationCodeSMS } from '../services/emailService.js';
import { auditLog } from '../middleware/audit.js';

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};


// Register - direct registration, no email verification
export const register = async (req, res) => {
  const client = await pool.connect();
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    await client.query('BEGIN');
    // Check if user exists
    const existingUser = await client.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    );
    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'User already exists' });
    }
    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);
    // Create user
    const result = await client.query(
      `INSERT INTO users (username, email, password_hash, is_verified)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, created_at`,
      [username, email, passwordHash, true]
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
    // Generate JWT
    const token = generateToken(user.id);
    // Audit log
    auditLog(user.id, 'USER_REGISTERED', { email, username }, req);
    res.status(201).json({
      message: 'Registration successful! Welcome to AlgoEdge.',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        isVerified: true
      },
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
      `SELECT id, username, email, password_hash, two_fa_enabled, two_fa_secret, is_verified
       FROM users WHERE username = $1 OR email = $1`,
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
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
      },
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

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);

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
       SET verification_code = $1, verification_code_expires = $2, verification_code_attempts = 0
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
      ? 'SELECT id, username, email, verification_code, verification_code_expires, verification_code_attempts FROM users WHERE email = $1'
      : 'SELECT id, username, email, verification_code, verification_code_expires, verification_code_attempts FROM users WHERE phone = $1';
    
    const result = await pool.query(userQuery, [email || phone]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    // Check if code exists
    if (!user.verification_code) {
      return res.status(400).json({ error: 'No verification code found. Please request a new one.' });
    }

    // Check if code expired
    if (new Date() > new Date(user.verification_code_expires)) {
      await pool.query(
        'UPDATE users SET verification_code = NULL, verification_code_expires = NULL WHERE id = $1',
        [user.id]
      );
      return res.status(400).json({ error: 'Verification code expired. Please request a new one.' });
    }

    // Check attempts (max 5)
    if (user.verification_code_attempts >= 5) {
      await pool.query(
        'UPDATE users SET verification_code = NULL, verification_code_expires = NULL WHERE id = $1',
        [user.id]
      );
      return res.status(429).json({ error: 'Too many attempts. Please request a new code.' });
    }

    // Verify code
    if (user.verification_code !== code) {
      // Increment attempts
      await pool.query(
        'UPDATE users SET verification_code_attempts = verification_code_attempts + 1 WHERE id = $1',
        [user.id]
      );
      
      const attemptsLeft = 5 - (user.verification_code_attempts + 1);
      return res.status(400).json({ 
        error: 'Invalid verification code',
        attemptsLeft 
      });
    }

    // Code is valid - clear it and mark user as verified
    await pool.query(
      `UPDATE users 
       SET verification_code = NULL, 
           verification_code_expires = NULL, 
           verification_code_attempts = 0,
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
