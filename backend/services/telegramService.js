/**
 * AlgoEdge Telegram Service
 * Handles Telegram bot integration for trade alerts and notifications
 */

import fetch from 'node-fetch';
import crypto from 'crypto';
import pool from '../config/database.js';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_BOT_USERNAME = process.env.TELEGRAM_BOT_USERNAME || 'Algoedge_rs_bot';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

/**
 * Send a message to a Telegram chat
 */
export async function sendTelegramMessage(chatId, message, options = {}) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.warn('⚠️ Telegram bot token not configured');
    return false;
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: options.parseMode || 'HTML',
        disable_web_page_preview: options.disablePreview ?? true,
        ...options,
      }),
    });

    const data = await response.json();
    
    if (!data.ok) {
      console.error('Telegram API error:', data.description);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    return false;
  }
}

/**
 * Generate a unique connection token for a user
 */
export function generateConnectionToken(userId) {
  const payload = `${userId}-${Date.now()}`;
  const token = crypto.createHmac('sha256', process.env.JWT_SECRET || 'secret')
    .update(payload)
    .digest('hex')
    .substring(0, 32);
  return token;
}

/**
 * Create a deep link for user to connect their Telegram
 */
export function getTelegramConnectLink(connectionToken) {
  return `https://t.me/${TELEGRAM_BOT_USERNAME}?start=${connectionToken}`;
}

/**
 * Store pending connection token
 */
export async function storePendingConnection(userId, token) {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  await pool.query(
    `INSERT INTO telegram_pending_connections (user_id, token, expires_at)
     VALUES ($1, $2, $3)
     ON CONFLICT (user_id) DO UPDATE SET token = $2, expires_at = $3`,
    [userId, token, expiresAt]
  );
}

/**
 * Verify and complete Telegram connection
 */
export async function completeTelegramConnection(token, chatId, telegramUsername) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    console.log(`📱 Attempting Telegram connection with token: ${token.substring(0, 8)}...`);
    console.log(`📱 Chat ID: ${chatId}, Username: ${telegramUsername}`);

    // Find pending connection
    const result = await client.query(
      `SELECT user_id FROM telegram_pending_connections 
       WHERE token = $1 AND expires_at > NOW()`,
      [token]
    );

    if (result.rows.length === 0) {
      console.log('❌ No pending connection found for token');
      await client.query('ROLLBACK');
      return { success: false, error: 'Invalid or expired token' };
    }

    const userId = result.rows[0].user_id;
    console.log(`📱 Found pending connection for user ID: ${userId}`);

    // Update user settings with Telegram chat ID (using UPSERT to handle missing rows)
    const upsertResult = await client.query(
      `INSERT INTO user_settings (user_id, telegram_chat_id, telegram_alerts, telegram_username)
       VALUES ($1, $2, true, $3)
       ON CONFLICT (user_id) DO UPDATE 
       SET telegram_chat_id = $2, telegram_alerts = true, telegram_username = $3
       RETURNING *`,
      [userId, chatId.toString(), telegramUsername]
    );
    console.log(`📱 Upsert result:`, upsertResult.rows[0]);

    // Delete pending connection
    await client.query(
      'DELETE FROM telegram_pending_connections WHERE user_id = $1',
      [userId]
    );

    await client.query('COMMIT');
    console.log(`✅ Telegram connection completed for user ${userId}`);

    // Get user info for welcome message
    const userResult = await pool.query(
      'SELECT username, email FROM users WHERE id = $1',
      [userId]
    );
    const user = userResult.rows[0];

    return { success: true, userId, username: user?.username };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Failed to complete Telegram connection:', error);
    return { success: false, error: 'Connection failed' };
  } finally {
    client.release();
  }
}

/**
 * Disconnect user's Telegram
 */
export async function disconnectTelegram(userId) {
  try {
    // Get chat ID before disconnecting to send goodbye message
    const result = await pool.query(
      'SELECT telegram_chat_id FROM user_settings WHERE user_id = $1',
      [userId]
    );
    
    const chatId = result.rows[0]?.telegram_chat_id;

    // Clear Telegram settings
    await pool.query(
      `UPDATE user_settings 
       SET telegram_chat_id = NULL, telegram_alerts = false, telegram_username = NULL
       WHERE user_id = $1`,
      [userId]
    );

    // Send goodbye message if we had a chat ID
    if (chatId) {
      await sendTelegramMessage(chatId, 
        '👋 <b>Disconnected from AlgoEdge</b>\n\n' +
        'Your Telegram has been unlinked from your AlgoEdge account.\n\n' +
        'You will no longer receive trade alerts here.\n' +
        'To reconnect, visit Settings in your AlgoEdge dashboard.'
      );
    }

    return true;
  } catch (error) {
    console.error('Failed to disconnect Telegram:', error);
    return false;
  }
}

/**
 * Check if user has Telegram connected
 */
export async function getTelegramStatus(userId) {
  try {
    const result = await pool.query(
      `SELECT telegram_chat_id, telegram_alerts, telegram_username 
       FROM user_settings WHERE user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return { connected: false };
    }

    const settings = result.rows[0];
    return {
      connected: !!settings.telegram_chat_id,
      chatId: settings.telegram_chat_id,
      alertsEnabled: settings.telegram_alerts,
      username: settings.telegram_username,
    };
  } catch (error) {
    console.error('Failed to get Telegram status:', error);
    return { connected: false };
  }
}

// ============================================
// TRADE ALERT TEMPLATES
// ============================================

/**
 * Send trade opened alert via Telegram
 */
export async function sendTradeOpenedTelegram(userId, trade) {
  const status = await getTelegramStatus(userId);
  if (!status.connected || !status.alertsEnabled) return false;

  const isGold = trade.symbol?.includes('XAU');
  const emoji = isGold ? '🥇' : '🥈';
  const direction = trade.type?.toLowerCase() === 'buy' ? '🟢 BUY' : '🔴 SELL';

  const message = `
${emoji} <b>NEW TRADE OPENED</b> ${emoji}

${direction} <b>${trade.symbol}</b>

📊 <b>Trade Details:</b>
├ 💰 Entry: <code>${trade.openPrice}</code>
├ 🎯 Take Profit: <code>${trade.takeProfit || 'Not set'}</code>
├ 🛡️ Stop Loss: <code>${trade.stopLoss || 'Not set'}</code>
├ 📦 Lot Size: <code>${trade.lotSize}</code>
└ 🤖 Robot: <code>${trade.robotName || 'Manual'}</code>

⏰ ${new Date().toLocaleString('en-US', { timeZone: 'UTC' })} UTC

<i>AlgoEdge Trading Bot</i>
`.trim();

  return await sendTelegramMessage(status.chatId, message);
}

/**
 * Send trade closed alert via Telegram
 */
export async function sendTradeClosedTelegram(userId, trade) {
  const status = await getTelegramStatus(userId);
  if (!status.connected || !status.alertsEnabled) return false;

  const profit = parseFloat(trade.profit || 0);
  const isProfit = profit >= 0;
  const profitEmoji = isProfit ? '💰' : '📉';
  const resultText = isProfit ? '✅ PROFIT' : '❌ LOSS';
  const isGold = trade.symbol?.includes('XAU');
  const emoji = isGold ? '🥇' : '🥈';

  const message = `
${emoji} <b>TRADE CLOSED</b> ${emoji}

${resultText} on <b>${trade.symbol}</b>

📊 <b>Results:</b>
├ 💵 Entry: <code>${trade.openPrice}</code>
├ 💵 Exit: <code>${trade.closePrice}</code>
├ ${profitEmoji} P/L: <code>${isProfit ? '+' : ''}$${profit.toFixed(2)}</code>
├ 📈 Pips: <code>${trade.pips || 'N/A'}</code>
├ 📦 Lots: <code>${trade.lotSize}</code>
└ ⏱️ Duration: <code>${trade.duration || 'N/A'}</code>

${isProfit ? '🎉 Great trade!' : '💪 Better luck next time!'}

<i>AlgoEdge Trading Bot</i>
`.trim();

  return await sendTelegramMessage(status.chatId, message);
}

/**
 * Send daily summary via Telegram
 */
export async function sendDailySummaryTelegram(userId, stats) {
  const status = await getTelegramStatus(userId);
  if (!status.connected || !status.alertsEnabled) return false;

  const profit = parseFloat(stats.totalProfit || 0);
  const isProfit = profit >= 0;

  const message = `
📊 <b>DAILY TRADING SUMMARY</b> 📊

📅 ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}

📈 <b>Performance:</b>
├ 📊 Total Trades: <code>${stats.totalTrades}</code>
├ ✅ Winners: <code>${stats.winners}</code>
├ ❌ Losers: <code>${stats.losers}</code>
├ 🎯 Win Rate: <code>${stats.winRate}%</code>
└ ${isProfit ? '💰' : '📉'} P/L: <code>${isProfit ? '+' : ''}$${profit.toFixed(2)}</code>

${isProfit ? '🎉 Great day!' : '💪 Tomorrow is a new day!'}

<i>AlgoEdge Trading Bot</i>
`.trim();

  return await sendTelegramMessage(status.chatId, message);
}

/**
 * Send welcome message when user connects Telegram
 */
export async function sendWelcomeMessage(chatId, username) {
  const message = `
🎉 <b>Welcome to AlgoEdge, ${username}!</b> 🎉

Your Telegram is now connected to your AlgoEdge account.

📱 <b>You'll receive alerts for:</b>
├ 🟢 New trades opened
├ 🔴 Trades closed (with P/L)
├ 📊 Daily summaries
└ 📰 Market news (if enabled)

⚙️ <b>Commands:</b>
/status - Check connection status
/mute - Temporarily mute alerts
/unmute - Resume alerts
/help - Show help

Happy trading! 📈💰

<i>AlgoEdge Trading Bot</i>
`.trim();

  return await sendTelegramMessage(chatId, message);
}

/**
 * Handle incoming Telegram webhook updates
 */
export async function handleTelegramWebhook(update) {
  try {
    const message = update.message;
    if (!message || !message.text) return { handled: false };

    const chatId = message.chat.id;
    const text = message.text.trim();
    const telegramUsername = message.from?.username || message.from?.first_name || 'User';

    // Handle /start command with connection token
    if (text.startsWith('/start ')) {
      const token = text.split(' ')[1];
      
      if (token) {
        const result = await completeTelegramConnection(token, chatId, telegramUsername);
        
        if (result.success) {
          await sendWelcomeMessage(chatId, result.username || telegramUsername);
          return { handled: true, action: 'connected', userId: result.userId };
        } else {
          await sendTelegramMessage(chatId, 
            '❌ <b>Connection Failed</b>\n\n' +
            'The connection link has expired or is invalid.\n\n' +
            'Please generate a new link from your AlgoEdge dashboard:\n' +
            'Settings → Telegram Integration → Connect Telegram'
          );
          return { handled: true, action: 'failed', error: result.error };
        }
      }
    }

    // Handle /start without token
    if (text === '/start') {
      await sendTelegramMessage(chatId,
        '👋 <b>Welcome to AlgoEdge Bot!</b>\n\n' +
        'To connect your account:\n' +
        '1. Log in to your AlgoEdge dashboard\n' +
        '2. Go to Settings → Telegram Integration\n' +
        '3. Click "Connect Telegram"\n' +
        '4. Click the generated link\n\n' +
        'Need help? Contact support at algoedge.co.ke'
      );
      return { handled: true, action: 'start_no_token' };
    }

    // Handle /status command
    if (text === '/status') {
      console.log(`📱 Status check for chat ID: ${chatId} (type: ${typeof chatId})`);
      
      // Check if this chat is connected to any user - try both string and number formats
      const chatIdStr = chatId.toString();
      const result = await pool.query(
        `SELECT u.username, us.telegram_alerts, us.telegram_chat_id 
         FROM user_settings us 
         JOIN users u ON u.id = us.user_id 
         WHERE us.telegram_chat_id = $1 OR us.telegram_chat_id = $2`,
        [chatIdStr, chatId]
      );

      console.log(`📱 Status query result: ${result.rows.length} rows found`);
      if (result.rows.length > 0) {
        console.log(`📱 Found connection:`, result.rows[0]);
      }

      if (result.rows.length > 0) {
        const user = result.rows[0];
        await sendTelegramMessage(chatId,
          `✅ <b>Connected</b>\n\n` +
          `Account: <code>${user.username}</code>\n` +
          `Alerts: ${user.telegram_alerts ? '🔔 Enabled' : '🔕 Disabled'}`
        );
      } else {
        // Debug: Check what's in user_settings for telegram
        const debugResult = await pool.query(
          `SELECT user_id, telegram_chat_id, telegram_username FROM user_settings WHERE telegram_chat_id IS NOT NULL LIMIT 5`
        );
        console.log(`📱 Debug - All telegram connections:`, debugResult.rows);
        console.log(`📱 Looking for chat ID: ${chatIdStr}`);
        
        await sendTelegramMessage(chatId,
          '❌ <b>Not Connected</b>\n\n' +
          'This Telegram is not linked to any AlgoEdge account.\n' +
          'Connect via Settings → Telegram Integration'
        );
      }
      return { handled: true, action: 'status' };
    }

    // Handle /mute command
    if (text === '/mute') {
      await pool.query(
        `UPDATE user_settings SET telegram_alerts = false WHERE telegram_chat_id = $1`,
        [chatId.toString()]
      );
      await sendTelegramMessage(chatId, '🔕 Alerts muted. Use /unmute to resume.');
      return { handled: true, action: 'muted' };
    }

    // Handle /unmute command
    if (text === '/unmute') {
      await pool.query(
        `UPDATE user_settings SET telegram_alerts = true WHERE telegram_chat_id = $1`,
        [chatId.toString()]
      );
      await sendTelegramMessage(chatId, '🔔 Alerts resumed!');
      return { handled: true, action: 'unmuted' };
    }

    // Handle /help command
    if (text === '/help') {
      await sendTelegramMessage(chatId,
        '📚 <b>AlgoEdge Bot Help</b>\n\n' +
        '<b>Commands:</b>\n' +
        '/start - Start the bot\n' +
        '/status - Check connection status\n' +
        '/mute - Mute all alerts\n' +
        '/unmute - Unmute alerts\n' +
        '/help - Show this help\n\n' +
        '<b>Need support?</b>\n' +
        'Visit: algoedge.co.ke\n' +
        'Email: support@algoedge.co.ke'
      );
      return { handled: true, action: 'help' };
    }

    return { handled: false };
  } catch (error) {
    console.error('Error handling Telegram webhook:', error);
    return { handled: false, error: error.message };
  }
}

// ============================================
// AFFILIATE NOTIFICATION TEMPLATES
// ============================================

/**
 * Send new referral notification via Telegram
 */
export async function sendNewReferralTelegram(userId, referral) {
  const status = await getTelegramStatus(userId);
  if (!status.connected || !status.alertsEnabled) return false;

  const message = `
🎉 <b>NEW REFERRAL!</b> 🎉

Someone just signed up using your referral link!

👤 <b>Referral Details:</b>
├ Username: <code>${referral.username}</code>
└ Joined: ${new Date().toLocaleDateString()}

💰 You'll earn <b>10% commission</b> on all their payments!

Keep sharing your link to grow your earnings 🚀

<i>AlgoEdge Affiliate Program</i>
`.trim();

  return await sendTelegramMessage(status.chatId, message);
}

/**
 * Send commission earned notification via Telegram
 */
export async function sendCommissionEarnedTelegram(userId, commission) {
  const status = await getTelegramStatus(userId);
  if (!status.connected || !status.alertsEnabled) return false;

  const message = `
💰 <b>COMMISSION EARNED!</b> 💰

You just earned a commission from a referral payment!

📊 <b>Commission Details:</b>
├ Amount: <code>$${parseFloat(commission.amount).toFixed(2)}</code>
├ Rate: <code>${commission.rate}%</code>
├ Referral: <code>${commission.referralUsername}</code>
└ Plan: <code>${commission.plan}</code>

Your commission is now pending approval and will be available for withdrawal soon.

Total Available Balance: <b>$${parseFloat(commission.totalAvailable || 0).toFixed(2)}</b>

<i>AlgoEdge Affiliate Program</i>
`.trim();

  return await sendTelegramMessage(status.chatId, message);
}

/**
 * Send payout processed notification via Telegram
 */
export async function sendPayoutProcessedTelegram(userId, payout) {
  const status = await getTelegramStatus(userId);
  if (!status.connected || !status.alertsEnabled) return false;

  const statusEmoji = payout.status === 'completed' ? '✅' : '❌';
  const statusText = payout.status === 'completed' ? 'APPROVED' : 'REJECTED';

  const message = `
${statusEmoji} <b>PAYOUT ${statusText}</b> ${statusEmoji}

Your payout request has been processed!

💸 <b>Payout Details:</b>
├ Amount: <code>$${parseFloat(payout.amount).toFixed(2)}</code>
├ Method: <code>${payout.method}</code>
├ Status: <code>${payout.status}</code>
${payout.transactionId ? `└ Transaction ID: <code>${payout.transactionId}</code>` : ''}

${payout.status === 'completed' 
  ? '🎉 Funds have been sent to your account!' 
  : '📝 ' + (payout.notes || 'Please contact support for more information.')}

<i>AlgoEdge Affiliate Program</i>
`.trim();

  return await sendTelegramMessage(status.chatId, message);
}

/**
 * Send generic notification via Telegram
 */
export async function sendNotificationTelegram(userId, title, message, emoji = '📢') {
  const status = await getTelegramStatus(userId);
  if (!status.connected || !status.alertsEnabled) return false;

  const formattedMessage = `
${emoji} <b>${title}</b> ${emoji}

${message}

<i>AlgoEdge</i>
`.trim();

  return await sendTelegramMessage(status.chatId, formattedMessage);
}

export default {
  sendTelegramMessage,
  generateConnectionToken,
  getTelegramConnectLink,
  storePendingConnection,
  completeTelegramConnection,
  disconnectTelegram,
  getTelegramStatus,
  sendTradeOpenedTelegram,
  sendTradeClosedTelegram,
  sendDailySummaryTelegram,
  sendWelcomeMessage,
  handleTelegramWebhook,
  sendNewReferralTelegram,
  sendCommissionEarnedTelegram,
  sendPayoutProcessedTelegram,
  sendNotificationTelegram,
};
