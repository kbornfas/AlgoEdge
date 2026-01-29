/**
 * Subscription Reminder Service
 * Sends email/telegram reminders before subscription expires
 */

import pool from '../config/database.js';
import { sendEmail } from './emailService.js';
import { sendNotificationTelegram } from './telegramService.js';

/**
 * Get users whose subscriptions expire in X days
 */
async function getUsersExpiringIn(days) {
  const result = await pool.query(`
    SELECT 
      u.id, u.email, u.username, u.full_name, u.telegram_chat_id,
      u.subscription_plan, u.subscription_expires_at,
      us.email_notifications, us.telegram_notifications
    FROM users u
    LEFT JOIN user_settings us ON u.id = us.user_id
    WHERE u.subscription_status = 'active'
      AND u.subscription_expires_at IS NOT NULL
      AND u.subscription_expires_at::date = (CURRENT_DATE + INTERVAL '${days} days')::date
      AND u.subscription_plan IS NOT NULL
      AND u.subscription_plan != 'free'
  `);
  return result.rows;
}

/**
 * Generate subscription reminder email HTML
 */
function generateReminderEmailHtml(user, daysRemaining) {
  const frontendUrl = process.env.FRONTEND_URL || 'https://algoedgehub.com';
  const urgencyColor = daysRemaining <= 1 ? '#EF4444' : daysRemaining <= 3 ? '#F59E0B' : '#3B82F6';
  const urgencyText = daysRemaining <= 1 ? 'EXPIRES TOMORROW' : daysRemaining <= 3 ? 'EXPIRING SOON' : 'REMINDER';
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #0f172a; font-family: 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; overflow: hidden; border: 1px solid #334155;">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, ${urgencyColor} 0%, ${urgencyColor}dd 100%); padding: 30px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800;">
                    ⏰ ${urgencyText}
                  </h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
                    Your AlgoEdge subscription expires in ${daysRemaining} day${daysRemaining > 1 ? 's' : ''}
                  </p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <h2 style="color: white; margin: 0 0 20px 0; font-size: 22px;">
                    Hi ${user.full_name || user.username || 'Trader'},
                  </h2>
                  
                  <p style="color: #94a3b8; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                    Your <strong style="color: #10B981;">${user.subscription_plan}</strong> subscription is expiring soon. 
                    Don't lose access to your premium trading features!
                  </p>
                  
                  <!-- Features Box -->
                  <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.3); border-radius: 12px; padding: 25px; margin: 25px 0;">
                    <h3 style="color: #10B981; margin: 0 0 15px 0; font-size: 16px;">
                      🔐 You'll lose access to:
                    </h3>
                    <ul style="color: #94a3b8; margin: 0; padding-left: 20px; line-height: 2;">
                      <li>Live MT5 Trading Signals</li>
                      <li>Advanced Analytics Dashboard</li>
                      <li>Automated Trading Bots</li>
                      <li>Priority Signal Alerts</li>
                      <li>Premium Market Analysis</li>
                    </ul>
                  </div>
                  
                  <!-- Expiry Info -->
                  <div style="background: rgba(239, 68, 68, 0.1); border-left: 4px solid ${urgencyColor}; padding: 15px 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                    <p style="color: #f87171; font-size: 14px; margin: 0;">
                      <strong>Expiration Date:</strong> ${new Date(user.subscription_expires_at).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                  </div>
                  
                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 35px 0;">
                    <a href="${frontendUrl}/auth/pricing" 
                       style="display: inline-block; background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);">
                      Renew Now - Keep Trading
                    </a>
                  </div>
                  
                  <p style="color: #64748b; font-size: 14px; text-align: center; margin: 20px 0 0 0;">
                    Questions? Reply to this email or contact support@algoedgehub.com
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background: #0f172a; padding: 25px; border-top: 1px solid #334155; text-align: center;">
                  <p style="color: #64748b; font-size: 12px; margin: 0;">
                    AlgoEdge Trading Platform<br>
                    <a href="${frontendUrl}" style="color: #10B981; text-decoration: none;">algoedgehub.com</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

/**
 * Send subscription reminder email
 */
async function sendReminderEmail(user, daysRemaining) {
  const urgencyText = daysRemaining <= 1 ? '⚠️ EXPIRES TOMORROW' : daysRemaining <= 3 ? '⏰ Expiring Soon' : '📅 Reminder';
  const subject = `${urgencyText} - Your AlgoEdge Subscription Expires in ${daysRemaining} Day${daysRemaining > 1 ? 's' : ''}`;
  const html = generateReminderEmailHtml(user, daysRemaining);
  
  return sendEmail(user.email, subject, html);
}

/**
 * Send subscription reminder via Telegram
 */
async function sendReminderTelegram(user, daysRemaining) {
  if (!user.telegram_chat_id) return false;
  
  const emoji = daysRemaining <= 1 ? '🚨' : daysRemaining <= 3 ? '⚠️' : '📅';
  const urgency = daysRemaining <= 1 ? 'EXPIRES TOMORROW!' : daysRemaining <= 3 ? 'Expiring Soon' : 'Subscription Reminder';
  
  const message = `${emoji} *${urgency}*

Your AlgoEdge subscription expires in *${daysRemaining} day${daysRemaining > 1 ? 's' : ''}*!

📋 *Plan:* ${user.subscription_plan}
📆 *Expires:* ${new Date(user.subscription_expires_at).toLocaleDateString()}

Don't lose access to:
• Live MT5 Trading Signals
• Advanced Analytics
• Automated Trading Bots

👉 Renew now at algoedgehub.com/auth/pricing`;

  return sendNotificationTelegram(user.id, urgency, message, emoji);
}

/**
 * Process subscription reminders for a specific day threshold
 */
async function processRemindersForDay(days) {
  console.log(`📧 Checking for subscriptions expiring in ${days} day(s)...`);
  
  const users = await getUsersExpiringIn(days);
  console.log(`   Found ${users.length} user(s) with subscriptions expiring in ${days} day(s)`);
  
  let emailsSent = 0;
  let telegramsSent = 0;
  let errors = 0;
  
  for (const user of users) {
    try {
      // Send email if enabled
      if (user.email_notifications !== false) {
        const emailResult = await sendReminderEmail(user, days);
        if (emailResult) emailsSent++;
      }
      
      // Send telegram if enabled and connected
      if (user.telegram_notifications !== false && user.telegram_chat_id) {
        const telegramResult = await sendReminderTelegram(user, days);
        if (telegramResult) telegramsSent++;
      }
      
      // Log the reminder sent
      await pool.query(`
        INSERT INTO notification_logs (user_id, type, title, body, status, metadata)
        VALUES ($1, 'subscription_reminder', $2, $3, 'sent', $4)
      `, [
        user.id,
        `Subscription expires in ${days} day(s)`,
        `Reminder sent for ${user.subscription_plan} plan`,
        JSON.stringify({ days_remaining: days, plan: user.subscription_plan })
      ]);
      
    } catch (error) {
      console.error(`   Error sending reminder to user ${user.id}:`, error.message);
      errors++;
    }
  }
  
  return { users: users.length, emailsSent, telegramsSent, errors };
}

/**
 * Run all subscription reminders (7, 3, 1 day)
 */
export async function runSubscriptionReminders() {
  console.log('\n📧 ========================================');
  console.log('📧 RUNNING SUBSCRIPTION REMINDERS');
  console.log('📧 ========================================\n');
  
  const results = {
    day7: await processRemindersForDay(7),
    day3: await processRemindersForDay(3),
    day1: await processRemindersForDay(1),
  };
  
  console.log('\n📊 Subscription Reminder Summary:');
  console.log(`   7-day reminders: ${results.day7.users} users, ${results.day7.emailsSent} emails, ${results.day7.telegramsSent} telegrams`);
  console.log(`   3-day reminders: ${results.day3.users} users, ${results.day3.emailsSent} emails, ${results.day3.telegramsSent} telegrams`);
  console.log(`   1-day reminders: ${results.day1.users} users, ${results.day1.emailsSent} emails, ${results.day1.telegramsSent} telegrams`);
  console.log('');
  
  return results;
}

/**
 * Start the subscription reminder scheduler
 * Runs daily at 9:00 AM UTC
 */
let reminderInterval = null;

export function startSubscriptionReminderScheduler() {
  const REMINDER_HOUR = 9; // 9:00 AM UTC
  const REMINDER_MINUTE = 0;
  
  console.log('📅 Subscription reminder scheduler initialized');
  
  const scheduleNext = () => {
    const now = new Date();
    const target = new Date();
    target.setUTCHours(REMINDER_HOUR, REMINDER_MINUTE, 0, 0);
    
    // If target time already passed today, schedule for tomorrow
    if (now >= target) {
      target.setDate(target.getDate() + 1);
    }
    
    const msUntil = target - now;
    console.log(`📅 Next subscription reminder check: ${target.toISOString()}`);
    
    reminderInterval = setTimeout(async () => {
      try {
        await runSubscriptionReminders();
      } catch (error) {
        console.error('❌ Subscription reminder error:', error.message);
      }
      // Schedule next day
      scheduleNext();
    }, msUntil);
  };
  
  scheduleNext();
}

export function stopSubscriptionReminderScheduler() {
  if (reminderInterval) {
    clearTimeout(reminderInterval);
    reminderInterval = null;
  }
  console.log('🛑 Subscription reminder scheduler stopped');
}

export default {
  runSubscriptionReminders,
  startSubscriptionReminderScheduler,
  stopSubscriptionReminderScheduler,
};
