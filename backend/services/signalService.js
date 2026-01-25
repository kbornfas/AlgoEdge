/**
 * AlgoEdge Signal Service
 * Broadcasts trading signals to subscribers via Telegram
 * 
 * SIGNAL PRIORITY SYSTEM:
 * - LOW: Basic signals for Starter tier
 * - MEDIUM: Standard signals for Basic+ tiers
 * - HIGH: Premium signals for Premium+ tiers
 * - VIP: Exclusive signals for VIP tier only
 * - EXCLUSIVE: Ultra-premium signals for VIP tier only
 * 
 * Signals are generated ONLY by the Trading Scheduler
 */

import pool from '../config/database.js';
import { sendTelegramMessage } from './telegramService.js';

// Signal priority levels
export const SIGNAL_PRIORITY = {
  LOW: 'LOW',           // Starter tier and above
  MEDIUM: 'MEDIUM',     // Basic tier and above
  HIGH: 'HIGH',         // Premium tier and above
  VIP: 'VIP',           // VIP tier only
  EXCLUSIVE: 'EXCLUSIVE' // VIP tier only (highest priority)
};

// Tier to priority access mapping
const TIER_PRIORITY_ACCESS = {
  'starter': ['LOW'],
  'basic': ['LOW', 'MEDIUM'],
  'premium': ['LOW', 'MEDIUM', 'HIGH'],
  'vip': ['LOW', 'MEDIUM', 'HIGH', 'VIP', 'EXCLUSIVE']
};

/**
 * Check if a tier can access a signal priority
 */
export function canTierAccessPriority(tierSlug, priority) {
  const allowedPriorities = TIER_PRIORITY_ACCESS[tierSlug] || [];
  return allowedPriorities.includes(priority);
}

/**
 * Get minimum tier required for a priority
 */
export function getMinTierForPriority(priority) {
  switch (priority) {
    case 'EXCLUSIVE':
    case 'VIP':
      return 'vip';
    case 'HIGH':
      return 'premium';
    case 'MEDIUM':
      return 'basic';
    case 'LOW':
    default:
      return 'starter';
  }
}

/**
 * Get all active signal tiers
 */
export async function getSignalTiers() {
  const result = await pool.query(
    `SELECT * FROM signal_tiers WHERE is_active = TRUE ORDER BY sort_order`
  );
  return result.rows;
}

/**
 * Get a specific signal tier by slug
 */
export async function getSignalTierBySlug(slug) {
  const result = await pool.query(
    `SELECT * FROM signal_tiers WHERE slug = $1 AND is_active = TRUE`,
    [slug]
  );
  return result.rows[0];
}

/**
 * Get user's current signal subscription
 */
export async function getUserSignalSubscription(userId) {
  const result = await pool.query(
    `SELECT ss.*, st.name as tier_name, st.slug as tier_slug, 
            st.features, st.max_signals_per_day, st.signal_delay_minutes,
            st.includes_entry, st.includes_sl_tp, st.includes_analysis, st.includes_vip_channel
     FROM signal_subscriptions ss
     JOIN signal_tiers st ON ss.tier_id = st.id
     WHERE ss.user_id = $1 AND ss.status = 'active'`,
    [userId]
  );
  return result.rows[0];
}

/**
 * Subscribe user to a signal tier
 */
export async function subscribeToSignals(userId, tierSlug, telegramChatId = null, stripeSubscriptionId = null) {
  const tier = await getSignalTierBySlug(tierSlug);
  if (!tier) {
    throw new Error('Invalid subscription tier');
  }

  // Check if user already has a subscription
  const existing = await getUserSignalSubscription(userId);
  
  const periodStart = new Date();
  const periodEnd = new Date();
  periodEnd.setMonth(periodEnd.getMonth() + 1); // 1 month subscription

  if (existing) {
    // Update existing subscription
    await pool.query(
      `UPDATE signal_subscriptions 
       SET tier_id = $1, status = 'active', stripe_subscription_id = $2,
           current_period_start = $3, current_period_end = $4,
           telegram_chat_id = COALESCE($5, telegram_chat_id),
           updated_at = CURRENT_TIMESTAMP
       WHERE user_id = $6`,
      [tier.id, stripeSubscriptionId, periodStart, periodEnd, telegramChatId, userId]
    );
  } else {
    // Create new subscription
    await pool.query(
      `INSERT INTO signal_subscriptions 
       (user_id, tier_id, status, stripe_subscription_id, current_period_start, current_period_end, telegram_chat_id)
       VALUES ($1, $2, 'active', $3, $4, $5, $6)`,
      [userId, tier.id, stripeSubscriptionId, periodStart, periodEnd, telegramChatId]
    );
  }

  return { success: true, tier };
}

/**
 * Cancel signal subscription
 */
export async function cancelSignalSubscription(userId) {
  await pool.query(
    `UPDATE signal_subscriptions SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
     WHERE user_id = $1`,
    [userId]
  );
  return { success: true };
}

/**
 * Create a new trading signal (ONLY called by Trading Scheduler)
 * @param {Object} signalData - Signal data from trading scheduler
 * @param {string} signalData.priority - Signal priority (LOW, MEDIUM, HIGH, VIP, EXCLUSIVE)
 */
export async function createSignal(signalData) {
  const {
    masterAccountId,
    signalType,
    symbol,
    entryPrice,
    stopLoss,
    takeProfit1,
    takeProfit2,
    takeProfit3,
    analysis,
    timeframe,
    confidence,
    priority = 'MEDIUM', // Default to MEDIUM priority
    source = 'trading_scheduler'
  } = signalData;

  // Calculate risk/reward
  let riskReward = null;
  if (entryPrice && stopLoss && takeProfit1) {
    const risk = Math.abs(entryPrice - stopLoss);
    const reward = Math.abs(takeProfit1 - entryPrice);
    riskReward = risk > 0 ? (reward / risk).toFixed(2) : null;
  }

  // Determine minimum tier required for this signal
  const minTierSlug = getMinTierForPriority(priority);

  const result = await pool.query(
    `INSERT INTO trading_signals 
     (master_account_id, signal_type, symbol, entry_price, stop_loss, 
      take_profit_1, take_profit_2, take_profit_3, risk_reward, analysis, 
      timeframe, confidence, priority, min_tier_slug, source)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
     RETURNING *`,
    [masterAccountId || 1, signalType, symbol, entryPrice, stopLoss, 
     takeProfit1, takeProfit2, takeProfit3, riskReward, analysis, 
     timeframe, confidence || 'MEDIUM', priority, minTierSlug, source]
  );

  const signal = result.rows[0];
  
  console.log(`📡 Signal created: ${symbol} ${signalType} | Priority: ${priority} | Min Tier: ${minTierSlug}`);
  
  // Broadcast to eligible subscribers only
  await broadcastSignal(signal);
  
  return signal;
}

/**
 * Broadcast signal to all eligible subscribers based on their tier
 * Only subscribers whose tier can access the signal's priority will receive it
 */
export async function broadcastSignal(signal) {
  const signalPriority = signal.priority || 'MEDIUM';
  
  // Get all active subscribers with their tier info
  // Filter by tier that can access this signal's priority
  const subscribers = await pool.query(
    `SELECT ss.*, st.*, u.email, st.slug as tier_slug,
            (SELECT telegram_chat_id FROM users u2 WHERE u2.id = ss.user_id) as user_telegram_chat_id
     FROM signal_subscriptions ss
     JOIN signal_tiers st ON ss.tier_id = st.id
     JOIN users u ON ss.user_id = u.id
     WHERE ss.status = 'active'
       AND (ss.current_period_end IS NULL OR ss.current_period_end > NOW())
       AND (st.max_signals_per_day IS NULL OR ss.signals_received_today < st.max_signals_per_day OR ss.last_signal_date != CURRENT_DATE)
       AND st.slug IN (
         SELECT tier_slug FROM signal_tier_priorities 
         WHERE $1 = ANY(allowed_priorities)
       )`,
    [signalPriority]
  );

  console.log(`📤 Broadcasting ${signalPriority} priority signal to ${subscribers.rows.length} eligible subscribers`);

  const deliveries = [];

  for (const sub of subscribers.rows) {
    try {
      // Double-check tier can access this priority (belt and suspenders)
      if (!canTierAccessPriority(sub.tier_slug, signalPriority)) {
        continue;
      }

      const telegramChatId = sub.telegram_chat_id || sub.user_telegram_chat_id;
      
      if (!telegramChatId) {
        console.log(`⚠️ User ${sub.user_id} has no Telegram connected`);
        continue;
      }

      // Apply delay for lower tiers
      const delayMs = (sub.signal_delay_minutes || 0) * 60 * 1000;
      
      // Format the signal message based on tier
      const message = formatSignalMessage(signal, sub);
      
      // Schedule delivery (with delay if needed)
      if (delayMs > 0) {
        setTimeout(async () => {
          await deliverSignal(signal, sub, telegramChatId, message);
        }, delayMs);
        console.log(`⏰ Scheduled delivery to ${sub.tier_slug} tier with ${sub.signal_delay_minutes}min delay`);
      } else {
        await deliverSignal(signal, sub, telegramChatId, message);
      }

      deliveries.push({ userId: sub.user_id, tier: sub.name, priority: signalPriority });
      
      // Update signals received count
      await pool.query(
        `UPDATE signal_subscriptions 
         SET signals_received_today = CASE 
           WHEN last_signal_date = CURRENT_DATE THEN signals_received_today + 1 
           ELSE 1 
         END,
         last_signal_date = CURRENT_DATE
         WHERE user_id = $1`,
        [sub.user_id]
      );
    } catch (error) {
      console.error(`Failed to deliver signal to user ${sub.user_id}:`, error);
    }
  }

  // Also broadcast to tier channels
  await broadcastToChannels(signal);

  return deliveries;
}

/**
 * Deliver signal to a specific user
 */
async function deliverSignal(signal, subscription, chatId, message) {
  const success = await sendTelegramMessage(chatId, message, { parseMode: 'HTML' });
  
  if (success) {
    // Record delivery
    await pool.query(
      `INSERT INTO signal_deliveries (signal_id, user_id, tier_id, delivery_method)
       VALUES ($1, $2, $3, 'telegram')`,
      [signal.id, subscription.user_id, subscription.tier_id]
    );
  }
  
  return success;
}

/**
 * Broadcast signal to tier-specific Telegram channels
 */
async function broadcastToChannels(signal) {
  const channels = await pool.query(
    `SELECT sc.*, st.includes_analysis, st.includes_sl_tp
     FROM signal_channels sc
     JOIN signal_tiers st ON sc.tier_id = st.id
     WHERE sc.is_active = TRUE`
  );

  for (const channel of channels.rows) {
    const message = formatSignalMessage(signal, channel);
    await sendTelegramMessage(channel.channel_id, message, { parseMode: 'HTML' });
  }
}

/**
 * Format signal message based on subscription tier
 */
function formatSignalMessage(signal, subscription) {
  const emoji = signal.signal_type === 'BUY' ? '🟢' : signal.signal_type === 'SELL' ? '🔴' : '⚪';
  const confidenceEmoji = {
    'VERY_HIGH': '🔥🔥🔥',
    'HIGH': '🔥🔥',
    'MEDIUM': '🔥',
    'LOW': '⚡'
  }[signal.confidence] || '🔥';

  // Priority badge
  const priorityBadge = {
    'EXCLUSIVE': '💎 EXCLUSIVE',
    'VIP': '👑 VIP',
    'HIGH': '⭐ HIGH PRIORITY',
    'MEDIUM': '📈 STANDARD',
    'LOW': '📊 BASIC'
  }[signal.priority] || '📈 STANDARD';

  let message = `
${emoji} <b>ALGOEDGE SIGNAL</b> ${emoji}
${priorityBadge}

📊 <b>${signal.symbol}</b>
📈 Action: <b>${signal.signal_type}</b>
💰 Entry: <b>${signal.entry_price}</b>
`;

  // Add SL/TP if tier includes it
  if (subscription.includes_sl_tp) {
    message += `
🛑 Stop Loss: <b>${signal.stop_loss}</b>
✅ Take Profit 1: <b>${signal.take_profit_1}</b>`;
    
    if (signal.take_profit_2) {
      message += `\n✅ Take Profit 2: <b>${signal.take_profit_2}</b>`;
    }
    if (signal.take_profit_3) {
      message += `\n✅ Take Profit 3: <b>${signal.take_profit_3}</b>`;
    }
    
    if (signal.risk_reward) {
      message += `\n📐 Risk/Reward: <b>1:${signal.risk_reward}</b>`;
    }
  }

  // Add analysis if tier includes it
  if (subscription.includes_analysis && signal.analysis) {
    message += `

📝 <b>Analysis:</b>
${signal.analysis}`;
  }

  message += `

⏰ ${signal.timeframe || 'Multi-TF'} | ${confidenceEmoji} ${signal.confidence || 'MEDIUM'} Confidence

⚠️ <i>Risk management is key. Never risk more than 1-2% per trade.</i>

🔗 <a href="https://algoedge.app">AlgoEdge Trading</a>`;

  return message;
}

/**
 * Update signal status (TP hit, SL hit, etc.)
 */
export async function updateSignalStatus(signalId, status, resultPips = null) {
  await pool.query(
    `UPDATE trading_signals 
     SET status = $1, result_pips = $2, closed_at = CURRENT_TIMESTAMP
     WHERE id = $3`,
    [status, resultPips, signalId]
  );

  // Get the signal
  const signal = await pool.query(`SELECT * FROM trading_signals WHERE id = $1`, [signalId]);
  
  if (signal.rows[0]) {
    // Broadcast update to subscribers
    await broadcastSignalUpdate(signal.rows[0], status, resultPips);
  }
}

/**
 * Broadcast signal update (TP hit, SL hit, close)
 */
async function broadcastSignalUpdate(signal, status, resultPips) {
  const statusEmoji = {
    'tp1_hit': '✅',
    'tp2_hit': '✅✅',
    'tp3_hit': '✅✅✅',
    'sl_hit': '❌',
    'closed': '🔒'
  }[status] || '📢';

  const resultText = resultPips > 0 ? `+${resultPips} pips` : `${resultPips} pips`;

  const message = `
${statusEmoji} <b>SIGNAL UPDATE</b> ${statusEmoji}

📊 <b>${signal.symbol}</b> - ${signal.signal_type}
📌 Status: <b>${status.replace('_', ' ').toUpperCase()}</b>
${resultPips !== null ? `💰 Result: <b>${resultText}</b>` : ''}

🔗 <a href="https://algoedge.app">AlgoEdge Trading</a>`;

  // Get all users who received this signal
  const deliveries = await pool.query(
    `SELECT DISTINCT sd.user_id, ss.telegram_chat_id, 
            (SELECT telegram_chat_id FROM users WHERE id = sd.user_id) as user_telegram_chat_id
     FROM signal_deliveries sd
     JOIN signal_subscriptions ss ON sd.user_id = ss.user_id
     WHERE sd.signal_id = $1`,
    [signal.id]
  );

  for (const delivery of deliveries.rows) {
    const chatId = delivery.telegram_chat_id || delivery.user_telegram_chat_id;
    if (chatId) {
      await sendTelegramMessage(chatId, message, { parseMode: 'HTML' });
    }
  }
}

/**
 * Get signal history
 */
export async function getSignalHistory(limit = 50, offset = 0) {
  const result = await pool.query(
    `SELECT ts.*, ma.name as master_account_name,
            (SELECT COUNT(*) FROM signal_deliveries WHERE signal_id = ts.id) as deliveries_count
     FROM trading_signals ts
     LEFT JOIN master_accounts ma ON ts.master_account_id = ma.id
     ORDER BY ts.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return result.rows;
}

/**
 * Get signal statistics
 */
export async function getSignalStats() {
  const result = await pool.query(`
    SELECT 
      COUNT(*) as total_signals,
      COUNT(CASE WHEN status LIKE 'tp%' THEN 1 END) as winning_signals,
      COUNT(CASE WHEN status = 'sl_hit' THEN 1 END) as losing_signals,
      COALESCE(SUM(result_pips), 0) as total_pips,
      COALESCE(AVG(result_pips) FILTER (WHERE result_pips IS NOT NULL), 0) as avg_pips,
      COUNT(DISTINCT DATE(created_at)) as trading_days
    FROM trading_signals
    WHERE created_at > NOW() - INTERVAL '30 days'
  `);

  const stats = result.rows[0];
  const winRate = stats.total_signals > 0 
    ? ((stats.winning_signals / (stats.winning_signals + stats.losing_signals)) * 100).toFixed(1)
    : 0;

  return {
    ...stats,
    win_rate: winRate
  };
}

/**
 * Get subscriber count by tier
 */
export async function getSubscriberStats() {
  const result = await pool.query(`
    SELECT st.name, st.slug, COUNT(ss.id) as subscriber_count
    FROM signal_tiers st
    LEFT JOIN signal_subscriptions ss ON st.id = ss.tier_id AND ss.status = 'active'
    WHERE st.is_active = TRUE
    GROUP BY st.id, st.name, st.slug
    ORDER BY st.sort_order
  `);
  return result.rows;
}

export default {
  SIGNAL_PRIORITY,
  canTierAccessPriority,
  getMinTierForPriority,
  getSignalTiers,
  getSignalTierBySlug,
  getUserSignalSubscription,
  subscribeToSignals,
  cancelSignalSubscription,
  createSignal,
  broadcastSignal,
  updateSignalStatus,
  getSignalHistory,
  getSignalStats,
  getSubscriberStats
};
