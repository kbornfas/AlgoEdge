/**
 * Weekly Trading Summary Service
 * Sends weekly performance summaries to active traders
 */

import pool from '../config/database.js';
import { sendEmail } from './emailService.js';
import cron from 'node-cron';

/**
 * Get user's weekly trading statistics
 */
async function getUserWeeklyStats(userId, startDate, endDate) {
  // Get all trades from the week
  const tradesResult = await pool.query(`
    SELECT 
      COUNT(*) as total_trades,
      COUNT(*) FILTER (WHERE profit > 0) as winning_trades,
      COUNT(*) FILTER (WHERE profit < 0) as losing_trades,
      COUNT(*) FILTER (WHERE profit = 0) as breakeven_trades,
      COALESCE(SUM(profit), 0) as total_profit,
      COALESCE(AVG(profit), 0) as avg_profit,
      COALESCE(MAX(profit), 0) as best_trade,
      COALESCE(MIN(profit), 0) as worst_trade,
      COALESCE(SUM(CASE WHEN profit > 0 THEN profit ELSE 0 END), 0) as gross_profit,
      COALESCE(SUM(CASE WHEN profit < 0 THEN profit ELSE 0 END), 0) as gross_loss
    FROM trades
    WHERE user_id = $1 
      AND close_time >= $2 
      AND close_time < $3
  `, [userId, startDate, endDate]);

  // Get most traded pairs
  const pairsResult = await pool.query(`
    SELECT 
      symbol,
      COUNT(*) as trade_count,
      SUM(profit) as pair_profit
    FROM trades
    WHERE user_id = $1 
      AND close_time >= $2 
      AND close_time < $3
    GROUP BY symbol
    ORDER BY trade_count DESC
    LIMIT 5
  `, [userId, startDate, endDate]);

  // Get daily breakdown
  const dailyResult = await pool.query(`
    SELECT 
      DATE(close_time) as date,
      COUNT(*) as trades,
      SUM(profit) as profit
    FROM trades
    WHERE user_id = $1 
      AND close_time >= $2 
      AND close_time < $3
    GROUP BY DATE(close_time)
    ORDER BY date
  `, [userId, startDate, endDate]);

  // Previous week comparison
  const prevStartDate = new Date(startDate);
  prevStartDate.setDate(prevStartDate.getDate() - 7);
  const prevEndDate = new Date(startDate);

  const prevResult = await pool.query(`
    SELECT 
      COALESCE(SUM(profit), 0) as prev_profit,
      COUNT(*) as prev_trades
    FROM trades
    WHERE user_id = $1 
      AND close_time >= $2 
      AND close_time < $3
  `, [userId, prevStartDate, prevEndDate]);

  const stats = tradesResult.rows[0];
  const totalTrades = parseInt(stats.total_trades || 0);
  const winningTrades = parseInt(stats.winning_trades || 0);
  const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : 0;
  
  const grossProfit = parseFloat(stats.gross_profit || 0);
  const grossLoss = Math.abs(parseFloat(stats.gross_loss || 0));
  const profitFactor = grossLoss > 0 ? (grossProfit / grossLoss).toFixed(2) : grossProfit > 0 ? '∞' : '0';

  const currentProfit = parseFloat(stats.total_profit || 0);
  const prevProfit = parseFloat(prevResult.rows[0]?.prev_profit || 0);
  const profitChange = prevProfit !== 0 
    ? (((currentProfit - prevProfit) / Math.abs(prevProfit)) * 100).toFixed(1)
    : currentProfit > 0 ? 100 : 0;

  return {
    totalTrades,
    winningTrades,
    losingTrades: parseInt(stats.losing_trades || 0),
    breakevenTrades: parseInt(stats.breakeven_trades || 0),
    winRate,
    totalProfit: currentProfit,
    avgProfit: parseFloat(stats.avg_profit || 0),
    bestTrade: parseFloat(stats.best_trade || 0),
    worstTrade: parseFloat(stats.worst_trade || 0),
    profitFactor,
    topPairs: pairsResult.rows,
    dailyBreakdown: dailyResult.rows,
    prevWeekProfit: prevProfit,
    profitChange,
  };
}

/**
 * Generate HTML email template for weekly trading summary
 */
function generateWeeklyTradingEmail(user, stats, weekStart, weekEnd) {
  const profitColor = stats.totalProfit >= 0 ? '#22c55e' : '#ef4444';
  const changeColor = parseFloat(stats.profitChange) >= 0 ? '#22c55e' : '#ef4444';
  const changeIcon = parseFloat(stats.profitChange) >= 0 ? '📈' : '📉';

  const pairRows = stats.topPairs.length > 0
    ? stats.topPairs.map(p => {
        const pairProfit = parseFloat(p.pair_profit || 0);
        return `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #334155; color: #e2e8f0;">${p.symbol}</td>
            <td style="padding: 10px; border-bottom: 1px solid #334155; text-align: center; color: #94a3b8;">${p.trade_count}</td>
            <td style="padding: 10px; border-bottom: 1px solid #334155; text-align: right; color: ${pairProfit >= 0 ? '#22c55e' : '#ef4444'};">
              ${pairProfit >= 0 ? '+' : ''}$${pairProfit.toFixed(2)}
            </td>
          </tr>
        `;
      }).join('')
    : '<tr><td colspan="3" style="padding: 12px; text-align: center; color: #94a3b8;">No trades this week</td></tr>';

  const dailyBars = stats.dailyBreakdown.map(d => {
    const maxProfit = Math.max(...stats.dailyBreakdown.map(x => Math.abs(parseFloat(x.profit || 0))), 1);
    const profit = parseFloat(d.profit || 0);
    const height = Math.max((Math.abs(profit) / maxProfit) * 50, 5);
    const dayName = new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' });
    const barColor = profit >= 0 ? '#22c55e' : '#ef4444';
    
    return `
      <div style="flex: 1; text-align: center; min-width: 40px;">
        <div style="height: 60px; display: flex; align-items: flex-end; justify-content: center;">
          <div style="width: 20px; height: ${height}px; background: ${barColor}; border-radius: 3px 3px 0 0;"></div>
        </div>
        <div style="color: #64748b; font-size: 10px; margin-top: 5px;">${dayName}</div>
        <div style="color: ${barColor}; font-size: 10px;">${profit >= 0 ? '+' : ''}${profit.toFixed(0)}</div>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; padding: 30px; text-align: center; margin-bottom: 20px; border: 1px solid #334155;">
          <h1 style="color: #8b5cf6; margin: 0 0 10px 0; font-size: 28px;">📈 Weekly Trading Summary</h1>
          <p style="color: #94a3b8; margin: 0; font-size: 14px;">
            ${new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
            ${new Date(weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        </div>

        <!-- Greeting -->
        <div style="background: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #334155;">
          <p style="color: #e2e8f0; margin: 0; font-size: 16px;">
            Hi <strong style="color: #8b5cf6;">${user.full_name || user.username}</strong>,
          </p>
          <p style="color: #94a3b8; margin: 10px 0 0 0; font-size: 14px;">
            Here's your trading performance summary for the past week.
          </p>
        </div>

        <!-- Main Stats -->
        <div style="background: linear-gradient(135deg, ${profitColor}22 0%, ${profitColor}11 100%); border-radius: 16px; padding: 25px; margin-bottom: 20px; border: 1px solid ${profitColor}44; text-align: center;">
          <div style="color: #94a3b8; font-size: 14px; margin-bottom: 5px;">WEEKLY P/L</div>
          <div style="color: ${profitColor}; font-size: 36px; font-weight: bold;">
            ${stats.totalProfit >= 0 ? '+' : ''}$${stats.totalProfit.toFixed(2)}
          </div>
          <div style="color: ${changeColor}; font-size: 14px; margin-top: 10px;">
            ${changeIcon} ${parseFloat(stats.profitChange) >= 0 ? '+' : ''}${stats.profitChange}% vs last week
          </div>
        </div>

        <!-- Key Metrics Grid -->
        <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 20px;">
          <div style="flex: 1; min-width: 100px; background: #1e293b; border-radius: 10px; padding: 15px; text-align: center; border: 1px solid #334155;">
            <div style="color: #8b5cf6; font-size: 24px; font-weight: bold;">${stats.totalTrades}</div>
            <div style="color: #94a3b8; font-size: 11px;">TRADES</div>
          </div>
          <div style="flex: 1; min-width: 100px; background: #1e293b; border-radius: 10px; padding: 15px; text-align: center; border: 1px solid #334155;">
            <div style="color: #22c55e; font-size: 24px; font-weight: bold;">${stats.winRate}%</div>
            <div style="color: #94a3b8; font-size: 11px;">WIN RATE</div>
          </div>
          <div style="flex: 1; min-width: 100px; background: #1e293b; border-radius: 10px; padding: 15px; text-align: center; border: 1px solid #334155;">
            <div style="color: #f59e0b; font-size: 24px; font-weight: bold;">${stats.profitFactor}</div>
            <div style="color: #94a3b8; font-size: 11px;">PROFIT FACTOR</div>
          </div>
        </div>

        <!-- Win/Loss Breakdown -->
        <div style="background: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #334155;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
            <div style="text-align: center; flex: 1;">
              <div style="color: #22c55e; font-size: 20px; font-weight: bold;">${stats.winningTrades}</div>
              <div style="color: #94a3b8; font-size: 11px;">WINNERS</div>
            </div>
            <div style="text-align: center; flex: 1;">
              <div style="color: #ef4444; font-size: 20px; font-weight: bold;">${stats.losingTrades}</div>
              <div style="color: #94a3b8; font-size: 11px;">LOSERS</div>
            </div>
            <div style="text-align: center; flex: 1;">
              <div style="color: #94a3b8; font-size: 20px; font-weight: bold;">${stats.breakevenTrades}</div>
              <div style="color: #94a3b8; font-size: 11px;">BREAKEVEN</div>
            </div>
          </div>
          <div style="display: flex; gap: 5px;">
            <div style="flex: ${stats.winningTrades}; background: #22c55e; height: 8px; border-radius: 4px 0 0 4px;"></div>
            <div style="flex: ${stats.losingTrades}; background: #ef4444; height: 8px;"></div>
            <div style="flex: ${stats.breakevenTrades || 0.1}; background: #64748b; height: 8px; border-radius: 0 4px 4px 0;"></div>
          </div>
        </div>

        <!-- Daily Performance -->
        ${stats.dailyBreakdown.length > 0 ? `
        <div style="background: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #334155;">
          <h3 style="color: #e2e8f0; margin: 0 0 15px 0; font-size: 14px;">📊 Daily Performance</h3>
          <div style="display: flex; justify-content: space-between;">
            ${dailyBars}
          </div>
        </div>
        ` : ''}

        <!-- Top Pairs -->
        ${stats.topPairs.length > 0 ? `
        <div style="background: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #334155;">
          <h3 style="color: #e2e8f0; margin: 0 0 15px 0; font-size: 14px;">💱 Top Traded Pairs</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr>
                <th style="padding: 10px; text-align: left; color: #64748b; font-size: 11px; border-bottom: 1px solid #334155;">PAIR</th>
                <th style="padding: 10px; text-align: center; color: #64748b; font-size: 11px; border-bottom: 1px solid #334155;">TRADES</th>
                <th style="padding: 10px; text-align: right; color: #64748b; font-size: 11px; border-bottom: 1px solid #334155;">P/L</th>
              </tr>
            </thead>
            <tbody>
              ${pairRows}
            </tbody>
          </table>
        </div>
        ` : ''}

        <!-- Best/Worst Trade -->
        <div style="display: flex; gap: 12px; margin-bottom: 20px;">
          <div style="flex: 1; background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%); border-radius: 10px; padding: 15px; text-align: center; border: 1px solid rgba(34, 197, 94, 0.2);">
            <div style="color: #94a3b8; font-size: 11px; margin-bottom: 5px;">BEST TRADE</div>
            <div style="color: #22c55e; font-size: 18px; font-weight: bold;">+$${stats.bestTrade.toFixed(2)}</div>
          </div>
          <div style="flex: 1; background: linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%); border-radius: 10px; padding: 15px; text-align: center; border: 1px solid rgba(239, 68, 68, 0.2);">
            <div style="color: #94a3b8; font-size: 11px; margin-bottom: 5px;">WORST TRADE</div>
            <div style="color: #ef4444; font-size: 18px; font-weight: bold;">$${stats.worstTrade.toFixed(2)}</div>
          </div>
        </div>

        <!-- CTA -->
        <div style="text-align: center; margin-bottom: 20px;">
          <a href="${process.env.FRONTEND_URL}/dashboard/history" 
             style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 14px;">
            View Full History →
          </a>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #64748b; font-size: 12px;">
          <p style="margin: 0;">Keep up the great work! 🚀</p>
          <p style="margin: 10px 0 0 0;">
            <a href="${process.env.FRONTEND_URL}/settings" style="color: #8b5cf6; text-decoration: none;">Manage Notifications</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send weekly trading summaries to all active traders
 */
export async function sendWeeklyTradingSummaries() {
  console.log('📈 Starting weekly trading summary generation...');
  
  try {
    // Calculate date range for previous week (Monday to Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const weekEnd = new Date(now);
    weekEnd.setDate(now.getDate() - dayOfWeek); // Last Sunday
    weekEnd.setHours(23, 59, 59, 999);
    
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekEnd.getDate() - 6); // Previous Monday
    weekStart.setHours(0, 0, 0, 0);

    // Get users who had trades this week and have email notifications enabled
    const usersResult = await pool.query(`
      SELECT DISTINCT u.id, u.username, u.email, u.full_name
      FROM users u
      INNER JOIN trades t ON t.user_id = u.id
      WHERE t.close_time >= $1 
        AND t.close_time < $2
        AND u.email IS NOT NULL
        AND u.is_blocked = false
    `, [weekStart, weekEnd]);

    console.log(`Found ${usersResult.rows.length} users with trades this week`);

    let sentCount = 0;
    let errorCount = 0;

    for (const user of usersResult.rows) {
      try {
        // Get stats for this user
        const stats = await getUserWeeklyStats(user.id, weekStart, weekEnd);

        // Only send if they had trades
        if (stats.totalTrades > 0) {
          const emailHtml = generateWeeklyTradingEmail(user, stats, weekStart, weekEnd);

          await sendEmail({
            to: user.email,
            subject: `📈 Your Weekly Trading Summary - ${stats.totalProfit >= 0 ? '+' : ''}$${stats.totalProfit.toFixed(2)}`,
            html: emailHtml,
          });

          console.log(`✅ Sent weekly summary to ${user.email}`);
          sentCount++;
        }
      } catch (error) {
        console.error(`❌ Failed to send summary to ${user.email}:`, error.message);
        errorCount++;
      }
    }

    console.log(`📈 Weekly trading summaries complete: ${sentCount} sent, ${errorCount} failed`);
    return { sentCount, errorCount };
  } catch (error) {
    console.error('❌ Weekly trading summaries error:', error);
    throw error;
  }
}

/**
 * Start the weekly trading summary scheduler
 * Runs every Monday at 8 AM UTC
 */
export function startWeeklyTradingScheduler() {
  // Run at 8:00 AM UTC every Monday
  cron.schedule('0 8 * * 1', async () => {
    console.log('⏰ Weekly trading summary scheduler triggered');
    try {
      await sendWeeklyTradingSummaries();
    } catch (error) {
      console.error('❌ Weekly trading scheduler error:', error);
    }
  }, {
    timezone: 'UTC'
  });
  
  console.log('📈 Weekly trading summary scheduler started (Mondays at 8 AM UTC)');
}

/**
 * Manual trigger for testing
 */
export async function triggerWeeklyTradingSummaries() {
  console.log('🔧 Manually triggering weekly trading summaries...');
  return await sendWeeklyTradingSummaries();
}
