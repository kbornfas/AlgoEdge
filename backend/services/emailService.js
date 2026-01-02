import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create email transporter with standardized env vars
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true' || parseInt(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS || process.env.SMTP_PASSWORD, // Use SMTP_PASS (SMTP_PASSWORD deprecated)
  },
});

// Verify email configuration
transporter.verify((error) => {
  if (error) {
    console.log('❌ Email service not configured properly. Check SMTP settings.');
    console.log('   Required: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM');
  } else {
    console.log('✅ Email service ready');
  }
});

// Email templates
const emailTemplates = {
  welcome: (username, verificationUrl) => ({
    subject: 'Welcome to AlgoEdge!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to AlgoEdge!</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2>Hi ${username},</h2>
          <p>Thank you for joining AlgoEdge - Your Automated Trading Platform!</p>
          <p>To get started, please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
          <p style="margin-top: 30px; color: #6b7280;">This link will expire in 24 hours.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">
            If you didn't create an account, please ignore this email.
          </p>
        </div>
      </div>
    `,
  }),

  passwordReset: (username, resetUrl) => ({
    subject: 'Reset Your Password - AlgoEdge',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Password Reset Request</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2>Hi ${username},</h2>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
          <p style="margin-top: 30px; color: #6b7280;">This link will expire in 1 hour.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 12px;">
            If you didn't request a password reset, please ignore this email or contact support if you have concerns.
          </p>
        </div>
      </div>
    `,
  }),

  verificationCode: (username, code, expiryMinutes = 10) => ({
    subject: 'Your AlgoEdge Verification Code',
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verification Code</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
                    <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">🔐 Verification Code</h1>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px;">Hi ${username},</h2>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin: 0 0 30px 0;">
                      Thank you for registering with AlgoEdge! Use the code below to verify your email address and complete your registration.
                    </p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="text-align: center; padding: 30px 0;">
                          <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 3px solid #667eea; border-radius: 12px; padding: 30px; display: inline-block;">
                            <span style="font-size: 42px; font-weight: 900; color: #667eea; letter-spacing: 10px; font-family: 'Courier New', monospace;">${code}</span>
                          </div>
                        </td>
                      </tr>
                    </table>
                    <p style="text-align: center; color: #ef4444; font-weight: 600; font-size: 16px; margin: 20px 0;">
                      ⏰ This code expires in ${expiryMinutes} minutes
                    </p>
                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 30px 0; border-radius: 4px;">
                      <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.5;">
                        <strong>Security Tip:</strong> Never share this code with anyone. AlgoEdge staff will never ask for your verification code.
                      </p>
                    </div>
                    <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
                    <p style="color: #9ca3af; font-size: 13px; line-height: 1.5; margin: 0;">
                      If you didn't request this code, please ignore this email or contact support at 
                      <a href="mailto:support@algoedge.com" style="color: #667eea; text-decoration: none;">support@algoedge.com</a>
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 12px 12px;">
                    <p style="color: #6b7280; font-size: 13px; margin: 0 0 10px 0;">
                      © ${new Date().getFullYear()} AlgoEdge. All rights reserved.
                    </p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                      Automated Trading Platform | Built for Traders
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  }),

  dailyTradeSummary: (username, stats, trades) => ({
    subject: `📊 Daily Trading Summary - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
    html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Daily Trade Summary</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
          <tr>
            <td style="padding: 40px 20px;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 700px; margin: 0 auto; background-color: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
                    <h1 style="color: white; margin: 0 0 10px 0; font-size: 28px; font-weight: 700;">📊 Daily Trading Summary</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 16px;">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 22px;">Hi ${username},</h2>
                    <p style="color: #4b5563; font-size: 16px; line-height: 1.5; margin: 0 0 30px 0;">
                      Here's your trading performance summary for today. Keep up the great work!
                    </p>
                    
                    <!-- Performance Stats -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 30px;">
                      <tr>
                        <td style="width: 50%; padding: 20px; background: linear-gradient(135deg, ${stats.dailyProfit >= 0 ? '#d1fae5' : '#fee2e2'} 0%, ${stats.dailyProfit >= 0 ? '#a7f3d0' : '#fecaca'} 100%); border-radius: 8px; text-align: center;">
                          <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 13px; text-transform: uppercase; font-weight: 600;">Daily P/L</p>
                          <p style="margin: 0; font-size: 32px; font-weight: 900; color: ${stats.dailyProfit >= 0 ? '#059669' : '#dc2626'};">
                            ${stats.dailyProfit >= 0 ? '+' : ''}$${Math.abs(stats.dailyProfit).toFixed(2)}
                          </p>
                        </td>
                        <td style="width: 10px;"></td>
                        <td style="width: 50%; padding: 20px; background: linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%); border-radius: 8px; text-align: center;">
                          <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 13px; text-transform: uppercase; font-weight: 600;">Win Rate</p>
                          <p style="margin: 0; font-size: 32px; font-weight: 900; color: #0284c7;">${stats.winRate}%</p>
                        </td>
                      </tr>
                    </table>

                    <!-- Quick Stats Grid -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 30px;">
                      <tr>
                        <td style="width: 33.33%; padding: 15px; background-color: #f9fafb; border-radius: 8px; text-align: center;">
                          <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px;">Total Trades</p>
                          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #1f2937;">${stats.totalTrades}</p>
                        </td>
                        <td style="width: 5px;"></td>
                        <td style="width: 33.33%; padding: 15px; background-color: #f9fafb; border-radius: 8px; text-align: center;">
                          <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px;">Winners</p>
                          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #059669;">${stats.winningTrades}</p>
                        </td>
                        <td style="width: 5px;"></td>
                        <td style="width: 33.33%; padding: 15px; background-color: #f9fafb; border-radius: 8px; text-align: center;">
                          <p style="margin: 0 0 5px 0; color: #6b7280; font-size: 12px;">Losers</p>
                          <p style="margin: 0; font-size: 24px; font-weight: 700; color: #dc2626;">${stats.losingTrades}</p>
                        </td>
                      </tr>
                    </table>

                    ${trades && trades.length > 0 ? `
                    <!-- Recent Trades -->
                    <h3 style="color: #1f2937; margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">Recent Trades</h3>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f9fafb; border-radius: 8px; overflow: hidden;">
                      <thead>
                        <tr style="background-color: #e5e7eb;">
                          <th style="padding: 12px; text-align: left; color: #374151; font-size: 13px; font-weight: 600;">Symbol</th>
                          <th style="padding: 12px; text-align: left; color: #374151; font-size: 13px; font-weight: 600;">Type</th>
                          <th style="padding: 12px; text-align: right; color: #374151; font-size: 13px; font-weight: 600;">P/L</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${trades.slice(0, 5).map((trade, idx) => `
                          <tr style="${idx % 2 === 0 ? 'background-color: white;' : 'background-color: #f9fafb;'}">
                            <td style="padding: 12px; color: #1f2937; font-size: 14px; font-weight: 500;">${trade.pair || trade.symbol}</td>
                            <td style="padding: 12px; color: #6b7280; font-size: 14px;">${trade.type}</td>
                            <td style="padding: 12px; text-align: right; color: ${trade.profit >= 0 ? '#059669' : '#dc2626'}; font-size: 14px; font-weight: 600;">
                              ${trade.profit >= 0 ? '+' : ''}$${trade.profit?.toFixed(2) || '0.00'}
                            </td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                    ` : '<p style="color: #6b7280; font-size: 14px; text-align: center; padding: 20px; background-color: #f9fafb; border-radius: 8px;">No trades executed today</p>'}

                    <div style="margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 8px; border-left: 4px solid #f59e0b;">
                      <p style="color: #92400e; font-size: 14px; margin: 0; line-height: 1.5;">
                        <strong>💡 Trading Tip:</strong> Always monitor your risk management and never invest more than you can afford to lose.
                      </p>
                    </div>

                    <div style="text-align: center; margin-top: 30px;">
                      <a href="${process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://algoedge.com'}/dashboard" 
                         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
                        View Full Dashboard
                      </a>
                    </div>
                  </td>
                </tr>
                <tr>
                  <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #e5e7eb;">
                    <p style="color: #6b7280; font-size: 13px; margin: 0 0 10px 0;">
                      © ${new Date().getFullYear()} AlgoEdge. All rights reserved.
                    </p>
                    <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                      Automated Trading Platform | Built for Traders
                    </p>
                    <p style="color: #9ca3af; font-size: 11px; margin: 10px 0 0 0;">
                      <a href="${process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://algoedge.com'}/settings" style="color: #667eea; text-decoration: none;">Email Preferences</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `,
  }),

  smsVerificationCode: (code, expiryMinutes = 10) => ({
    text: `Your AlgoEdge verification code is: ${code}. Valid for ${expiryMinutes} minutes. Never share this code.`,
  }),

  tradeAlert: (username, trade) => ({
    subject: `Trade ${trade.status === 'open' ? 'Opened' : 'Closed'} - ${trade.pair}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Trade Alert</h1>
        </div>
        <div style="padding: 30px; background: #f9fafb;">
          <h2>Hi ${username},</h2>
          <p>A trade has been ${trade.status === 'open' ? 'opened' : 'closed'} by ${trade.robot}:</p>
          <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Pair:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${trade.pair}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Type:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${trade.type}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Volume:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${trade.volume}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Open Price:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${trade.open_price}</td>
              </tr>
              ${trade.close_price ? `
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;"><strong>Close Price:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${trade.close_price}</td>
              </tr>
              <tr>
                <td style="padding: 10px;"><strong>Profit/Loss:</strong></td>
                <td style="padding: 10px; color: ${trade.profit >= 0 ? '#10b981' : '#ef4444'}; font-weight: bold;">
                  ${trade.profit >= 0 ? '+' : ''}$${trade.profit?.toFixed(2)}
                </td>
              </tr>
              ` : ''}
            </table>
          </div>
          <p style="color: #6b7280;">Login to AlgoEdge to view more details.</p>
        </div>
      </div>
    `,
  }),
};

// Send email function
export const sendEmail = async (to, template, data) => {
  try {
    const emailContent = emailTemplates[template](...data);
    const fromAddress = process.env.SMTP_FROM || `"AlgoEdge" <${process.env.SMTP_USER}>`;
    
    await transporter.sendMail({
      from: fromAddress,
      to,
      subject: emailContent.subject,
      html: emailContent.html,
    });

    console.log(`✅ Email sent to ${to}: ${emailContent.subject}`);
    return true;
  } catch (error) {
    // Log error without exposing sensitive config
    console.error(`❌ Email error sending to ${to}:`, error.message);
    return false;
  }
};

// Generate random 6-digit verification code
export const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification code via email
export const sendVerificationCodeEmail = async (email, username, code, expiryMinutes = 10) => {
  try {
    await sendEmail(email, 'verificationCode', [username, code, expiryMinutes]);
    console.log(`✅ Verification code sent to ${email}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send verification code:`, error);
    return false;
  }
};

// Send verification code via SMS (placeholder - requires SMS service like Twilio)
export const sendVerificationCodeSMS = async (phoneNumber, code, expiryMinutes = 10) => {
  try {
    // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
    // For now, just log it
    const message = `Your AlgoEdge verification code is: ${code}. Valid for ${expiryMinutes} minutes. Never share this code.`;
    
    console.log(`📱 SMS would be sent to ${phoneNumber}: ${message}`);
    
    // Example Twilio integration (uncomment and configure when ready):
    /*
    const twilio = require('twilio');
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });
    */
    
    return true;
  } catch (error) {
    console.error(`❌ Failed to send SMS:`, error);
    return false;
  }
};

/**
 * Calculate daily trade statistics for a user
 * @param {number} userId - User ID
 * @param {Object} pool - Database pool connection
 * @returns {Object} Daily statistics
 */
export const calculateDailyStats = async (userId, pool) => {
  try {
    // Get trades from today using range query for better index usage
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const result = await pool.query(
      `SELECT 
        COUNT(*) as total_trades,
        COUNT(*) FILTER (WHERE profit > 0) as winning_trades,
        COUNT(*) FILTER (WHERE profit < 0) as losing_trades,
        COALESCE(SUM(profit), 0) as daily_profit
       FROM trades
       WHERE user_id = $1 
       AND status = 'closed'
       AND close_time >= $2 
       AND close_time < $3`,
      [userId, today, tomorrow]
    );

    const stats = result.rows[0];
    const totalTrades = parseInt(stats.total_trades) || 0;
    const winningTrades = parseInt(stats.winning_trades) || 0;
    const losingTrades = parseInt(stats.losing_trades) || 0;
    const dailyProfit = parseFloat(stats.daily_profit) || 0;
    
    // Calculate win rate (return as number for template flexibility)
    const winRate = totalTrades > 0 
      ? parseFloat(((winningTrades / totalTrades) * 100).toFixed(1))
      : 0.0;

    return {
      totalTrades,
      winningTrades,
      losingTrades,
      dailyProfit,
      winRate
    };
  } catch (error) {
    console.error('Error calculating daily stats:', error.message);
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      dailyProfit: 0,
      winRate: 0.0
    };
  }
};

/**
 * Get today's trades for a user
 * @param {number} userId - User ID
 * @param {Object} pool - Database pool connection
 * @returns {Array} Array of trade objects
 */
export const getTodaysTrades = async (userId, pool) => {
  try {
    // Use range query for better index usage
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const result = await pool.query(
      `SELECT 
        pair, 
        symbol, 
        type, 
        volume, 
        open_price, 
        close_price, 
        profit,
        close_time
       FROM trades
       WHERE user_id = $1 
       AND status = 'closed'
       AND close_time >= $2 
       AND close_time < $3
       ORDER BY close_time DESC
       LIMIT 10`,
      [userId, today, tomorrow]
    );

    return result.rows;
  } catch (error) {
    console.error('Error fetching today\'s trades:', error.message);
    return [];
  }
};

/**
 * Send daily trading summary email to a user
 * @param {number} userId - User ID
 * @param {string} email - User email address
 * @param {string} username - User username
 * @param {Object} pool - Database pool connection
 * @returns {boolean} Success status
 */
export const sendDailyTradeReport = async (userId, email, username, pool) => {
  try {
    // Check if user has email notifications enabled
    const settingsResult = await pool.query(
      'SELECT email_alerts, trade_notifications FROM user_settings WHERE user_id = $1',
      [userId]
    );

    if (settingsResult.rows.length === 0 || 
        !settingsResult.rows[0].email_alerts || 
        !settingsResult.rows[0].trade_notifications) {
      console.log(`⏭️  Daily report skipped for ${email} - notifications disabled`);
      return false;
    }

    // Get daily stats and trades
    const stats = await calculateDailyStats(userId, pool);
    const trades = await getTodaysTrades(userId, pool);

    // Only send if there's activity
    if (stats.totalTrades === 0) {
      console.log(`⏭️  Daily report skipped for ${email} - no trades today`);
      return false;
    }

    // Send email
    const success = await sendEmail(email, 'dailyTradeSummary', [username, stats, trades]);
    
    if (success) {
      console.log(`✅ Daily trade report sent to ${email}`);
    }
    
    return success;
  } catch (error) {
    console.error(`❌ Failed to send daily report to ${email}:`, error.message);
    return false;
  }
};

/**
 * Send daily reports to all active users with trades
 * @param {Object} pool - Database pool connection
 * @param {number} batchSize - Number of concurrent emails to send (default: 5)
 * @param {number} batchDelayMs - Delay between batches in milliseconds (default from env or 2000)
 * @returns {Object} Summary of sent reports
 */
export const sendDailyReportsToAllUsers = async (pool, batchSize = 5, batchDelayMs = null) => {
  try {
    console.log('📧 Starting daily trade report batch...');
    
    // Allow configuration via environment variable
    const delayMs = batchDelayMs || parseInt(process.env.EMAIL_BATCH_DELAY_MS) || 2000;
    
    // Use range query and EXISTS for better performance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Get all users with trades today and notifications enabled
    const usersResult = await pool.query(
      `SELECT DISTINCT u.id, u.email, u.username
       FROM users u
       JOIN user_settings us ON u.id = us.user_id
       WHERE u.is_verified = true
       AND us.email_alerts = true
       AND us.trade_notifications = true
       AND EXISTS (
         SELECT 1 FROM trades t
         WHERE t.user_id = u.id
         AND t.status = 'closed'
         AND t.close_time >= $1
         AND t.close_time < $2
       )`,
      [today, tomorrow]
    );

    const users = usersResult.rows;
    console.log(`📊 Found ${users.length} users with trades today`);

    let sent = 0;
    let failed = 0;

    // Process in batches for better performance
    for (let i = 0; i < users.length; i += batchSize) {
      const batch = users.slice(i, i + batchSize);
      
      const results = await Promise.allSettled(
        batch.map(user => sendDailyTradeReport(user.id, user.email, user.username, pool))
      );
      
      results.forEach(result => {
        if (result.status === 'fulfilled' && result.value) {
          sent++;
        } else {
          failed++;
        }
      });
      
      // Delay between batches to avoid rate limiting (configurable)
      if (i + batchSize < users.length) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }

    const summary = {
      total: users.length,
      sent,
      failed,
      timestamp: new Date().toISOString()
    };

    console.log(`✅ Daily report batch complete: ${sent} sent, ${failed} failed`);
    return summary;
  } catch (error) {
    console.error('❌ Daily report batch error:', error.message);
    return {
      total: 0,
      sent: 0,
      failed: 0,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

export default { 
  sendEmail, 
  emailTemplates, 
  generateVerificationCode,
  sendVerificationCodeEmail,
  sendVerificationCodeSMS,
  calculateDailyStats,
  getTodaysTrades,
  sendDailyTradeReport,
  sendDailyReportsToAllUsers
};
