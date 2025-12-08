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

// Register - Step 1: Send verification code
export const register = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { username, email, password } = req.body;

    // Validation
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

    // Generate 6-digit verification code
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store verification code in database
    await client.query(
      `INSERT INTO verification_codes (email, code, expires_at, type, metadata)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (email, type) 
       DO UPDATE SET code = $2, expires_at = $3, created_at = CURRENT_TIMESTAMP`,
      [email, verificationCode, verificationExpires, 'registration', JSON.stringify({ username, password_hash: passwordHash })]
    );

    await client.query('COMMIT');

    // Send verification code via email
    await sendVerificationCodeEmail(email, username, verificationCode);

    res.status(200).json({
      message: 'Verification code sent to your email',
      email: email,
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

// Verify Registration Code and Complete Registration
export const verifyRegistration = async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    await client.query('BEGIN');

    // Get verification code
    const codeResult = await client.query(
      `SELECT code, expires_at, metadata FROM verification_codes 
       WHERE email = $1 AND type = $2 AND used = false`,
      [email, 'registration']
    );

    if (codeResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    const { code: storedCode, expires_at, metadata } = codeResult.rows[0];

    // Check if code matches
    if (storedCode !== code) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Invalid verification code' });
    }

    // Check if expired
    if (new Date() > new Date(expires_at)) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Verification code has expired' });
    }

    // Parse metadata
    const { username, password_hash } = JSON.parse(metadata);

    // Create user
    const result = await client.query(
      `INSERT INTO users (username, email, password_hash, is_verified)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, created_at`,
      [username, email, password_hash, true]
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

    // Mark verification code as used
    await client.query(
      'UPDATE verification_codes SET used = true WHERE email = $1 AND type = $2',
      [email, 'registration']
    );

    await client.query('COMMIT');

    // Generate JWT
    const token = generateToken(user.id);

    // Audit log
    auditLog(user.id, 'USER_REGISTERED', { email, username }, req);

    // Send welcome email
    sendEmail(email, 'welcome', [username, process.env.FRONTEND_URL]);

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
    console.error('Verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  } finally {
    client.release();
  }
};

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
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    const resetToken = uuidv4();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    const result = await pool.query(
      `UPDATE users 
       SET reset_token = $1, reset_expires = $2
       WHERE email = $3
       RETURNING id, username, email`,
      [resetToken, resetExpires, email]
    );

    if (result.rows.length > 0) {
      const user = result.rows[0];
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      sendEmail(email, 'passwordReset', [user.username, resetUrl]);
    }

    // Always return success to prevent email enumeration
    res.json({ message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(500).json({ error: 'Request failed' });
  }
};

// Reset Password
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    const result = await pool.query(
      `UPDATE users 
       SET password_hash = $1, reset_token = NULL, reset_expires = NULL
       WHERE reset_token = $2 AND reset_expires > NOW()
       RETURNING id`,
      [passwordHash, token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

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
