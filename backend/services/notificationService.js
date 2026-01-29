/**
 * AlgoEdge Notification Service
 * Handles all user notifications (email, telegram) with creative templates
 * Respects user settings - only sends if user has enabled the notification type
 */

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import pool from '../config/database.js';

dotenv.config();

// Brand colors
const BRAND_GREEN = '#10B981';
const BRAND_DARK = '#059669';
const SUCCESS_GREEN = '#10B981';
const ERROR_RED = '#EF4444';
const WARNING_AMBER = '#F59E0B';
const INFO_BLUE = '#3B82F6';

// SMTP Configuration
const isSmtpConfigured = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASSWORD;

const transporter = isSmtpConfigured ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: parseInt(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
}) : null;

// Verify on startup
if (transporter) {
  transporter.verify()
    .then(() => console.log('✅ Notification service ready'))
    .catch((err) => console.log('⚠️  Email verification pending:', err.message));
}

/**
 * Get user notification settings
 */
async function getUserSettings(userId) {
  try {
    const result = await pool.query(
      `SELECT us.*, u.email, u.username, u.full_name
       FROM user_settings us
       JOIN users u ON us.user_id = u.id
       WHERE us.user_id = $1`,
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching user settings:', error.message);
    return null;
  }
}

/**
 * Base email template wrapper
 */
function emailWrapper(content, preheader = '') {
  const currentYear = new Date().getFullYear();
  const frontendUrl = process.env.FRONTEND_URL || 'https://algoedge.com';
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>AlgoEdge</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body { margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; }
      .mobile-padding { padding: 20px !important; }
      .stat-box { display: block !important; width: 100% !important; margin-bottom: 10px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #111827;">
  ${preheader ? `<div style="display:none;font-size:1px;color:#111827;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</div>` : ''}
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #111827;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" class="container" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #1F2937; border-radius: 16px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);">
          ${content}
          <!-- Footer -->
          <tr>
            <td style="background-color: #111827; padding: 30px; text-align: center; border-top: 1px solid #374151;">
              <p style="color: #9CA3AF; font-size: 14px; margin: 0 0 15px 0;">
                <a href="${frontendUrl}/dashboard" style="color: ${BRAND_GREEN}; text-decoration: none; margin: 0 10px;">Dashboard</a>
                <span style="color: #4B5563;">•</span>
                <a href="${frontendUrl}/dashboard/settings" style="color: ${BRAND_GREEN}; text-decoration: none; margin: 0 10px;">Settings</a>
                <span style="color: #4B5563;">•</span>
                <a href="https://wa.me/254704618663" style="color: ${BRAND_GREEN}; text-decoration: none; margin: 0 10px;">Support</a>
              </p>
              <p style="color: #6B7280; font-size: 12px; margin: 0 0 10px 0;">
                © ${currentYear} AlgoEdge. Automated Trading Platform.
              </p>
              <p style="color: #4B5563; font-size: 11px; margin: 0;">
                You received this because you have notifications enabled.
                <a href="${frontendUrl}/dashboard/settings" style="color: #6B7280;">Manage preferences</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Send raw email
 */
async function sendRawEmail(to, subject, html) {
  if (!transporter) {
    console.log(`📧 Email would be sent to ${to}: ${subject}`);
    return false;
  }
  
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"AlgoEdge" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    console.log(`✅ Email sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to send email to ${to}:`, error.message);
    return false;
  }
}

// =====================================================
// TRADE ALERT EMAILS
// =====================================================

/**
 * Send trade opened alert
 */
export async function sendTradeOpenedAlert(userId, trade) {
  try {
    const settings = await getUserSettings(userId);
    if (!settings || !settings.email_notifications || !settings.trade_alerts) {
      console.log(`⏭️  Trade alert skipped for user ${userId} - notifications disabled`);
      return false;
    }
    
    const { email, username, full_name } = settings;
    const name = full_name || username;
    const isPrecious = trade.pair?.includes('XAU') || trade.pair?.includes('XAG');
    const metalEmoji = trade.pair?.includes('XAU') ? '🥇' : trade.pair?.includes('XAG') ? '🥈' : '💹';
    const typeColor = trade.type?.toLowerCase() === 'buy' ? SUCCESS_GREEN : ERROR_RED;
    const typeEmoji = trade.type?.toLowerCase() === 'buy' ? '📈' : '📉';
    
    const content = `
      <!-- Header -->
      <tr>
        <td style="background: linear-gradient(135deg, ${BRAND_GREEN} 0%, ${BRAND_DARK} 100%); padding: 40px 30px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 15px;">${typeEmoji}</div>
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Trade Opened!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
            ${trade.robot || 'AlgoEdge Bot'} • ${new Date().toLocaleString('en-US', { timeZone: settings.timezone || 'UTC' })}
          </p>
        </td>
      </tr>
      <!-- Body -->
      <tr>
        <td class="mobile-padding" style="padding: 40px 30px;">
          <h2 style="color: white; margin: 0 0 20px 0; font-size: 22px;">Hi ${name}! 👋</h2>
          <p style="color: #D1D5DB; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Great news! A new ${trade.type?.toUpperCase()} position has been opened on your account. Here are the details:
          </p>
          
          <!-- Trade Card -->
          <div style="background: linear-gradient(135deg, #111827 0%, #1F2937 100%); border-radius: 12px; padding: 25px; margin-bottom: 30px; border: 1px solid #374151;">
            <div style="display: flex; align-items: center; margin-bottom: 20px;">
              <span style="font-size: 36px; margin-right: 15px;">${metalEmoji}</span>
              <div>
                <h3 style="color: white; margin: 0; font-size: 24px; font-weight: 700;">${trade.pair || trade.symbol}</h3>
                <span style="display: inline-block; background: ${typeColor}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 5px;">
                  ${trade.type?.toUpperCase()}
                </span>
              </div>
            </div>
            
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #374151;">
                  <span style="color: #9CA3AF; font-size: 14px;">Entry Price</span>
                </td>
                <td style="padding: 12px 0; border-bottom: 1px solid #374151; text-align: right;">
                  <span style="color: white; font-size: 16px; font-weight: 600;">${Number(trade.open_price || trade.entryPrice).toFixed(isPrecious ? 2 : 5)}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #374151;">
                  <span style="color: #9CA3AF; font-size: 14px;">Volume</span>
                </td>
                <td style="padding: 12px 0; border-bottom: 1px solid #374151; text-align: right;">
                  <span style="color: white; font-size: 16px; font-weight: 600;">${trade.volume} Lots</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0; border-bottom: 1px solid #374151;">
                  <span style="color: #9CA3AF; font-size: 14px;">Stop Loss</span>
                </td>
                <td style="padding: 12px 0; border-bottom: 1px solid #374151; text-align: right;">
                  <span style="color: ${ERROR_RED}; font-size: 16px; font-weight: 600;">${Number(trade.stop_loss || trade.stopLoss).toFixed(isPrecious ? 2 : 5)}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 12px 0;">
                  <span style="color: #9CA3AF; font-size: 14px;">Take Profit</span>
                </td>
                <td style="padding: 12px 0; text-align: right;">
                  <span style="color: ${SUCCESS_GREEN}; font-size: 16px; font-weight: 600;">${Number(trade.take_profit || trade.takeProfit).toFixed(isPrecious ? 2 : 5)}</span>
                </td>
              </tr>
            </table>
          </div>
          
          ${trade.reason ? `
          <div style="background: #1E3A5F; border-left: 4px solid ${INFO_BLUE}; padding: 15px; border-radius: 4px; margin-bottom: 30px;">
            <p style="color: ${INFO_BLUE}; font-size: 12px; font-weight: 600; margin: 0 0 5px 0; text-transform: uppercase;">Strategy Signal</p>
            <p style="color: #D1D5DB; font-size: 14px; margin: 0;">${trade.reason}</p>
          </div>
          ` : ''}
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'https://algoedge.com'}/dashboard/trades" style="display: inline-block; background: ${BRAND_GREEN}; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              View Trade →
            </a>
          </div>
        </td>
      </tr>
    `;
    
    const html = emailWrapper(content, `New ${trade.type?.toUpperCase()} trade opened on ${trade.pair}`);
    return await sendRawEmail(email, `${typeEmoji} Trade Opened: ${trade.pair} ${trade.type?.toUpperCase()}`, html);
  } catch (error) {
    console.error('Error sending trade opened alert:', error.message);
    return false;
  }
}

/**
 * Send trade closed alert
 */
export async function sendTradeClosedAlert(userId, trade) {
  try {
    const settings = await getUserSettings(userId);
    if (!settings || !settings.email_notifications || !settings.trade_alerts) {
      console.log(`⏭️  Trade alert skipped for user ${userId} - notifications disabled`);
      return false;
    }
    
    const { email, username, full_name } = settings;
    const name = full_name || username;
    const profit = parseFloat(trade.profit) || 0;
    const isProfit = profit >= 0;
    const isPrecious = trade.pair?.includes('XAU') || trade.pair?.includes('XAG');
    const resultEmoji = isProfit ? '🎉' : '📊';
    const resultColor = isProfit ? SUCCESS_GREEN : ERROR_RED;
    const resultText = isProfit ? 'Profit' : 'Loss';
    
    const content = `
      <!-- Header -->
      <tr>
        <td style="background: linear-gradient(135deg, ${resultColor} 0%, ${isProfit ? '#047857' : '#B91C1C'} 100%); padding: 40px 30px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 15px;">${resultEmoji}</div>
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Trade Closed!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
            ${trade.robot || 'AlgoEdge Bot'} • ${new Date().toLocaleString('en-US', { timeZone: settings.timezone || 'UTC' })}
          </p>
        </td>
      </tr>
      <!-- Body -->
      <tr>
        <td class="mobile-padding" style="padding: 40px 30px;">
          <h2 style="color: white; margin: 0 0 20px 0; font-size: 22px;">${isProfit ? 'Congratulations' : 'Hey'} ${name}! ${isProfit ? '🎊' : '💪'}</h2>
          <p style="color: #D1D5DB; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            ${isProfit 
              ? 'Your trade has closed in profit! Great execution by the AlgoEdge trading bot.' 
              : 'A trade has closed. Remember, losses are part of trading - our risk management is protecting your capital.'}
          </p>
          
          <!-- Result Card -->
          <div style="background: linear-gradient(135deg, ${isProfit ? '#064E3B' : '#7F1D1D'} 0%, #111827 100%); border-radius: 12px; padding: 30px; margin-bottom: 30px; text-align: center; border: 1px solid ${isProfit ? '#065F46' : '#991B1B'};">
            <p style="color: ${isProfit ? '#6EE7B7' : '#FCA5A5'}; font-size: 14px; font-weight: 600; margin: 0 0 10px 0; text-transform: uppercase;">
              ${resultText}
            </p>
            <p style="color: white; font-size: 48px; font-weight: 900; margin: 0;">
              ${isProfit ? '+' : ''}$${profit.toFixed(2)}
            </p>
            <p style="color: #9CA3AF; font-size: 14px; margin: 10px 0 0 0;">
              ${trade.pair} • ${trade.type?.toUpperCase()} • ${trade.volume} Lots
            </p>
          </div>
          
          <!-- Trade Details -->
          <div style="background: #111827; border-radius: 12px; padding: 20px; border: 1px solid #374151;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #374151;">
                  <span style="color: #9CA3AF; font-size: 14px;">Entry Price</span>
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #374151; text-align: right;">
                  <span style="color: white; font-size: 15px;">${Number(trade.open_price).toFixed(isPrecious ? 2 : 5)}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #374151;">
                  <span style="color: #9CA3AF; font-size: 14px;">Exit Price</span>
                </td>
                <td style="padding: 10px 0; border-bottom: 1px solid #374151; text-align: right;">
                  <span style="color: white; font-size: 15px;">${Number(trade.close_price).toFixed(isPrecious ? 2 : 5)}</span>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0;">
                  <span style="color: #9CA3AF; font-size: 14px;">Duration</span>
                </td>
                <td style="padding: 10px 0; text-align: right;">
                  <span style="color: white; font-size: 15px;">${calculateDuration(trade.open_time, trade.close_time)}</span>
                </td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'https://algoedge.com'}/dashboard/trades" style="display: inline-block; background: ${BRAND_GREEN}; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              View Trade History →
            </a>
          </div>
        </td>
      </tr>
    `;
    
    const html = emailWrapper(content, `Trade closed with ${isProfit ? 'profit' : 'loss'}: ${isProfit ? '+' : ''}$${profit.toFixed(2)}`);
    return await sendRawEmail(email, `${resultEmoji} Trade Closed: ${isProfit ? '+' : ''}$${profit.toFixed(2)} on ${trade.pair}`, html);
  } catch (error) {
    console.error('Error sending trade closed alert:', error.message);
    return false;
  }
}

// =====================================================
// WEEKLY REPORT EMAIL
// =====================================================

/**
 * Send weekly trading report
 */
export async function sendWeeklyReport(userId, stats) {
  try {
    const settings = await getUserSettings(userId);
    if (!settings || !settings.email_notifications || !settings.weekly_reports) {
      console.log(`⏭️  Weekly report skipped for user ${userId} - notifications disabled`);
      return false;
    }
    
    const { email, username, full_name } = settings;
    const name = full_name || username;
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekStartStr = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const weekEndStr = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    const totalProfit = stats.totalProfit || 0;
    const isPositive = totalProfit >= 0;
    const winRate = stats.winRate || 0;
    
    const content = `
      <!-- Header -->
      <tr>
        <td style="background: linear-gradient(135deg, #1E3A8A 0%, #7C3AED 100%); padding: 40px 30px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 15px;">📊</div>
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Weekly Performance Report</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
            ${weekStartStr} - ${weekEndStr}
          </p>
        </td>
      </tr>
      <!-- Body -->
      <tr>
        <td class="mobile-padding" style="padding: 40px 30px;">
          <h2 style="color: white; margin: 0 0 20px 0; font-size: 22px;">Hi ${name}! 👋</h2>
          <p style="color: #D1D5DB; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Here's your weekly trading summary. ${isPositive && stats.totalTrades > 0 ? 'Great work this week!' : 'Every week is a learning opportunity!'}
          </p>
          
          <!-- Main Stat -->
          <div style="background: linear-gradient(135deg, ${isPositive ? '#064E3B' : '#7F1D1D'} 0%, #111827 100%); border-radius: 16px; padding: 30px; margin-bottom: 25px; text-align: center; border: 2px solid ${isPositive ? SUCCESS_GREEN : ERROR_RED};">
            <p style="color: ${isPositive ? '#6EE7B7' : '#FCA5A5'}; font-size: 14px; font-weight: 600; margin: 0 0 10px 0; text-transform: uppercase;">
              Weekly ${isPositive ? 'Profit' : 'Loss'}
            </p>
            <p style="color: white; font-size: 56px; font-weight: 900; margin: 0; line-height: 1;">
              ${isPositive ? '+' : ''}$${Math.abs(totalProfit).toFixed(2)}
            </p>
            <p style="color: #9CA3AF; font-size: 14px; margin: 15px 0 0 0;">
              ${stats.totalTrades || 0} trades executed
            </p>
          </div>
          
          <!-- Stats Grid -->
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 25px;">
            <tr>
              <td class="stat-box" style="width: 50%; padding-right: 8px;">
                <div style="background: #111827; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #374151;">
                  <p style="color: #9CA3AF; font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase;">Win Rate</p>
                  <p style="color: ${winRate >= 50 ? SUCCESS_GREEN : WARNING_AMBER}; font-size: 32px; font-weight: 900; margin: 0;">${winRate.toFixed(1)}%</p>
                </div>
              </td>
              <td class="stat-box" style="width: 50%; padding-left: 8px;">
                <div style="background: #111827; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #374151;">
                  <p style="color: #9CA3AF; font-size: 12px; margin: 0 0 8px 0; text-transform: uppercase;">Avg Trade</p>
                  <p style="color: white; font-size: 32px; font-weight: 900; margin: 0;">$${(stats.avgTrade || 0).toFixed(2)}</p>
                </div>
              </td>
            </tr>
          </table>
          
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
            <tr>
              <td class="stat-box" style="width: 33.33%; padding-right: 5px;">
                <div style="background: #111827; border-radius: 8px; padding: 15px; text-align: center; border: 1px solid #374151;">
                  <p style="color: #9CA3AF; font-size: 11px; margin: 0 0 5px 0;">WINNERS</p>
                  <p style="color: ${SUCCESS_GREEN}; font-size: 24px; font-weight: 700; margin: 0;">${stats.winners || 0}</p>
                </div>
              </td>
              <td class="stat-box" style="width: 33.33%; padding: 0 5px;">
                <div style="background: #111827; border-radius: 8px; padding: 15px; text-align: center; border: 1px solid #374151;">
                  <p style="color: #9CA3AF; font-size: 11px; margin: 0 0 5px 0;">LOSERS</p>
                  <p style="color: ${ERROR_RED}; font-size: 24px; font-weight: 700; margin: 0;">${stats.losers || 0}</p>
                </div>
              </td>
              <td class="stat-box" style="width: 33.33%; padding-left: 5px;">
                <div style="background: #111827; border-radius: 8px; padding: 15px; text-align: center; border: 1px solid #374151;">
                  <p style="color: #9CA3AF; font-size: 11px; margin: 0 0 5px 0;">BEST TRADE</p>
                  <p style="color: ${SUCCESS_GREEN}; font-size: 24px; font-weight: 700; margin: 0;">$${(stats.bestTrade || 0).toFixed(0)}</p>
                </div>
              </td>
            </tr>
          </table>
          
          <!-- Tip -->
          <div style="background: linear-gradient(135deg, #1E3A5F 0%, #1F2937 100%); border-left: 4px solid ${INFO_BLUE}; padding: 20px; border-radius: 4px; margin-bottom: 30px;">
            <p style="color: ${INFO_BLUE}; font-size: 12px; font-weight: 600; margin: 0 0 8px 0; text-transform: uppercase;">💡 Weekly Tip</p>
            <p style="color: #D1D5DB; font-size: 14px; margin: 0; line-height: 1.5;">
              ${getRandomTradingTip()}
            </p>
          </div>
          
          <div style="text-align: center;">
            <a href="${process.env.FRONTEND_URL || 'https://algoedge.com'}/dashboard" style="display: inline-block; background: linear-gradient(135deg, ${BRAND_GREEN} 0%, ${BRAND_DARK} 100%); color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              View Full Report →
            </a>
          </div>
        </td>
      </tr>
    `;
    
    const html = emailWrapper(content, `Your weekly trading report: ${isPositive ? '+' : ''}$${totalProfit.toFixed(2)}`);
    
    // Update last_weekly_report timestamp
    await pool.query(
      'UPDATE user_settings SET last_weekly_report = NOW() WHERE user_id = $1',
      [userId]
    );
    
    return await sendRawEmail(email, `📊 Weekly Report: ${isPositive ? '+' : ''}$${totalProfit.toFixed(2)} | ${stats.totalTrades} Trades`, html);
  } catch (error) {
    console.error('Error sending weekly report:', error.message);
    return false;
  }
}

// =====================================================
// MARKET NEWS EMAIL
// =====================================================

/**
 * Send market news/insights email
 */
export async function sendMarketNews(userId, newsData) {
  try {
    const settings = await getUserSettings(userId);
    if (!settings || !settings.email_notifications || !settings.market_news) {
      return false;
    }
    
    const { email, username, full_name } = settings;
    const name = full_name || username;
    
    const content = `
      <!-- Header -->
      <tr>
        <td style="background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 40px 30px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 15px;">📰</div>
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 700;">Market Update</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
            ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </p>
        </td>
      </tr>
      <!-- Body -->
      <tr>
        <td class="mobile-padding" style="padding: 40px 30px;">
          <h2 style="color: white; margin: 0 0 20px 0; font-size: 22px;">Hi ${name}! 👋</h2>
          <p style="color: #D1D5DB; font-size: 16px; line-height: 1.6; margin: 0 0 30px 0;">
            Here's what's moving the precious metals markets today:
          </p>
          
          ${newsData.items?.map(item => `
            <div style="background: #111827; border-radius: 12px; padding: 20px; margin-bottom: 15px; border: 1px solid #374151;">
              <h3 style="color: white; margin: 0 0 10px 0; font-size: 18px;">${item.title}</h3>
              <p style="color: #9CA3AF; font-size: 14px; margin: 0 0 10px 0; line-height: 1.5;">${item.summary}</p>
              <span style="color: #6B7280; font-size: 12px;">${item.source} • ${item.time}</span>
            </div>
          `).join('') || ''}
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'https://algoedge.com'}/dashboard" style="display: inline-block; background: ${BRAND_GREEN}; color: white; padding: 16px 40px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">
              View Dashboard →
            </a>
          </div>
        </td>
      </tr>
    `;
    
    const html = emailWrapper(content, 'Latest precious metals market updates');
    return await sendRawEmail(email, `📰 Market Update: ${newsData.headline || 'Precious Metals News'}`, html);
  } catch (error) {
    console.error('Error sending market news:', error.message);
    return false;
  }
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

function calculateDuration(startTime, endTime) {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const diff = end - start;
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

function getRandomTradingTip() {
  const tips = [
    "Gold often moves inversely to the US Dollar. Keep an eye on USD strength indicators for better trade timing.",
    "Silver is more volatile than gold but offers higher reward potential. Adjust your position sizing accordingly.",
    "Major economic news releases (NFP, FOMC) can cause significant precious metals volatility. Our bot factors this in!",
    "Precious metals tend to perform well during periods of market uncertainty and inflation concerns.",
    "Consistency beats perfection. A 55% win rate with proper risk management can be highly profitable.",
    "The best traders focus on risk management first, profits second. Never risk more than 2% per trade.",
    "London and New York session overlaps often provide the best liquidity for gold trading.",
    "Patience is key. Not every day needs to be a trading day. Quality over quantity!",
    "Review your losing trades - they often teach more than winning ones.",
    "Gold typically sees increased activity during Asian market hours due to physical demand.",
  ];
  return tips[Math.floor(Math.random() * tips.length)];
}

/**
 * Calculate weekly stats for a user
 */
export async function calculateWeeklyStats(userId) {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_trades,
        COUNT(*) FILTER (WHERE profit > 0) as winners,
        COUNT(*) FILTER (WHERE profit < 0) as losers,
        COALESCE(SUM(profit), 0) as total_profit,
        COALESCE(AVG(profit), 0) as avg_trade,
        COALESCE(MAX(profit), 0) as best_trade,
        COALESCE(MIN(profit), 0) as worst_trade
      FROM trades
      WHERE user_id = $1
      AND status = 'closed'
      AND close_time >= $2
    `, [userId, weekAgo]);
    
    const data = result.rows[0];
    const totalTrades = parseInt(data.total_trades) || 0;
    const winners = parseInt(data.winners) || 0;
    
    return {
      totalTrades,
      winners,
      losers: parseInt(data.losers) || 0,
      totalProfit: parseFloat(data.total_profit) || 0,
      avgTrade: parseFloat(data.avg_trade) || 0,
      bestTrade: parseFloat(data.best_trade) || 0,
      worstTrade: parseFloat(data.worst_trade) || 0,
      winRate: totalTrades > 0 ? (winners / totalTrades) * 100 : 0,
    };
  } catch (error) {
    console.error('Error calculating weekly stats:', error.message);
    return null;
  }
}

/**
 * Send weekly reports to all eligible users
 */
export async function sendWeeklyReportsToAll() {
  try {
    console.log('📧 Starting weekly report batch...');
    
    // Get users with weekly reports enabled
    const usersResult = await pool.query(`
      SELECT us.user_id, u.email, u.username
      FROM user_settings us
      JOIN users u ON us.user_id = u.id
      WHERE u.is_verified = true
      AND us.email_notifications = true
      AND us.weekly_reports = true
      AND (us.last_weekly_report IS NULL OR us.last_weekly_report < NOW() - INTERVAL '6 days')
    `);
    
    const users = usersResult.rows;
    console.log(`📊 Found ${users.length} users for weekly reports`);
    
    let sent = 0;
    let failed = 0;
    
    for (const user of users) {
      const stats = await calculateWeeklyStats(user.user_id);
      if (stats && stats.totalTrades > 0) {
        const success = await sendWeeklyReport(user.user_id, stats);
        if (success) sent++;
        else failed++;
      }
      // Small delay between emails
      await new Promise(r => setTimeout(r, 500));
    }
    
    console.log(`✅ Weekly reports: ${sent} sent, ${failed} failed`);
    return { sent, failed, total: users.length };
  } catch (error) {
    console.error('❌ Weekly report batch error:', error.message);
    return { sent: 0, failed: 0, error: error.message };
  }
}

// ===================================================
// IN-APP NOTIFICATIONS
// ===================================================

export const InAppNotificationTypes = {
  SIGNAL: 'signal',
  TRADE: 'trade',
  SYSTEM: 'system',
  PROMO: 'promo',
  ALERT: 'alert',
  SECURITY: 'security',
  SUBSCRIPTION: 'subscription',
  WALLET: 'wallet',
  MARKETPLACE: 'marketplace',
};

/**
 * Create an in-app notification for a user
 */
export async function createInAppNotification({
  userId,
  type,
  title,
  message,
  icon = null,
  link = null,
  metadata = null,
}) {
  try {
    const result = await pool.query(`
      INSERT INTO in_app_notifications (user_id, type, title, message, icon, link, metadata, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      RETURNING *
    `, [userId, type, title, message, icon, link, metadata ? JSON.stringify(metadata) : null]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Failed to create in-app notification:', error.message);
    return null;
  }
}

/**
 * Create notifications for multiple users
 */
export async function createBulkInAppNotifications(userIds, notification) {
  if (!userIds || userIds.length === 0) return true;
  
  try {
    const values = userIds.map((userId, idx) => {
      const offset = idx * 7;
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, NOW())`;
    }).join(',');
    
    const params = userIds.flatMap(userId => [
      userId,
      notification.type,
      notification.title,
      notification.message,
      notification.icon || null,
      notification.link || null,
      notification.metadata ? JSON.stringify(notification.metadata) : null,
    ]);
    
    await pool.query(`
      INSERT INTO in_app_notifications (user_id, type, title, message, icon, link, metadata, created_at)
      VALUES ${values}
    `, params);
    
    return true;
  } catch (error) {
    console.error('Failed to create bulk notifications:', error.message);
    return false;
  }
}

/**
 * Get in-app notifications for a user
 */
export async function getInAppNotifications(userId, options = {}) {
  const { limit = 20, offset = 0, unreadOnly = false } = options;
  
  let query = `
    SELECT id, type, title, message, icon, link, metadata, read, read_at, created_at
    FROM in_app_notifications
    WHERE user_id = $1
  `;
  
  if (unreadOnly) {
    query += ` AND read = false`;
  }
  
  query += ` ORDER BY created_at DESC LIMIT $2 OFFSET $3`;
  
  const result = await pool.query(query, [userId, limit, offset]);
  return result.rows;
}

/**
 * Get unread notification count
 */
export async function getUnreadNotificationCount(userId) {
  const result = await pool.query(
    'SELECT COUNT(*) FROM in_app_notifications WHERE user_id = $1 AND read = false',
    [userId]
  );
  return parseInt(result.rows[0].count);
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(userId, notificationId) {
  const result = await pool.query(`
    UPDATE in_app_notifications 
    SET read = true, read_at = NOW() 
    WHERE id = $1 AND user_id = $2
    RETURNING *
  `, [notificationId, userId]);
  
  return result.rowCount > 0;
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(userId) {
  const result = await pool.query(`
    UPDATE in_app_notifications 
    SET read = true, read_at = NOW() 
    WHERE user_id = $1 AND read = false
    RETURNING id
  `, [userId]);
  
  return result.rowCount;
}

/**
 * Delete a notification
 */
export async function deleteInAppNotification(userId, notificationId) {
  const result = await pool.query(
    'DELETE FROM in_app_notifications WHERE id = $1 AND user_id = $2 RETURNING id',
    [notificationId, userId]
  );
  return result.rowCount > 0;
}

/**
 * Clear all notifications for a user
 */
export async function clearAllInAppNotifications(userId) {
  const result = await pool.query(
    'DELETE FROM in_app_notifications WHERE user_id = $1 RETURNING id',
    [userId]
  );
  return result.rowCount;
}

export default {
  sendTradeOpenedAlert,
  sendTradeClosedAlert,
  sendWeeklyReport,
  sendMarketNews,
  calculateWeeklyStats,
  sendWeeklyReportsToAll,
  // In-app notifications
  InAppNotificationTypes,
  createInAppNotification,
  createBulkInAppNotifications,
  getInAppNotifications,
  getUnreadNotificationCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteInAppNotification,
  clearAllInAppNotifications,
};
