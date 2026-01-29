/**
 * AlgoEdge Report Scheduler
 * Handles scheduled sending of reports (daily summaries, weekly reports)
 */

import { sendWeeklyReportsToAll } from './notificationService.js';
import { sendDailyReportsToAllUsers } from './emailService.js';
import { startSubscriptionReminderScheduler, stopSubscriptionReminderScheduler, runSubscriptionReminders } from './subscriptionReminderService.js';
import { startSellerReportScheduler, triggerSellerReports } from './sellerReportService.js';
import { startWeeklyTradingScheduler, triggerWeeklyTradingSummaries } from './weeklyTradingService.js';
import pool from '../config/database.js';

let weeklyReportInterval = null;
let dailyReportInterval = null;

/**
 * Calculate milliseconds until next scheduled time
 */
function msUntilTime(hour, minute, dayOfWeek = null) {
  const now = new Date();
  const target = new Date();
  
  target.setHours(hour, minute, 0, 0);
  
  // If dayOfWeek is specified (0=Sunday, 6=Saturday)
  if (dayOfWeek !== null) {
    const currentDay = now.getDay();
    let daysUntil = dayOfWeek - currentDay;
    if (daysUntil < 0 || (daysUntil === 0 && now >= target)) {
      daysUntil += 7;
    }
    target.setDate(target.getDate() + daysUntil);
  } else {
    // If target time already passed today, schedule for tomorrow
    if (now >= target) {
      target.setDate(target.getDate() + 1);
    }
  }
  
  return target - now;
}

/**
 * Start the weekly report scheduler
 * Sends weekly performance reports every Sunday at 9:00 AM UTC
 */
export function startWeeklyReportScheduler() {
  const WEEKLY_HOUR = 9; // 9:00 AM UTC
  const WEEKLY_MINUTE = 0;
  const WEEKLY_DAY = 0; // Sunday
  
  console.log('📅 Weekly report scheduler initialized');
  
  const scheduleNextWeekly = () => {
    const msUntil = msUntilTime(WEEKLY_HOUR, WEEKLY_MINUTE, WEEKLY_DAY);
    const nextRun = new Date(Date.now() + msUntil);
    console.log(`📅 Next weekly report scheduled for: ${nextRun.toISOString()}`);
    
    weeklyReportInterval = setTimeout(async () => {
      console.log('📧 Running weekly report batch...');
      try {
        const result = await sendWeeklyReportsToAll();
        console.log(`✅ Weekly reports complete: ${result.sent} sent, ${result.failed} failed`);
      } catch (error) {
        console.error('❌ Weekly report error:', error.message);
      }
      // Schedule next week
      scheduleNextWeekly();
    }, msUntil);
  };
  
  scheduleNextWeekly();
}

/**
 * Start the daily report scheduler
 * Sends daily trade summaries at 11:00 PM UTC (end of trading day)
 */
export function startDailyReportScheduler() {
  const DAILY_HOUR = 23; // 11:00 PM UTC
  const DAILY_MINUTE = 0;
  
  console.log('📅 Daily report scheduler initialized');
  
  const scheduleNextDaily = () => {
    const msUntil = msUntilTime(DAILY_HOUR, DAILY_MINUTE);
    const nextRun = new Date(Date.now() + msUntil);
    console.log(`📅 Next daily report scheduled for: ${nextRun.toISOString()}`);
    
    dailyReportInterval = setTimeout(async () => {
      console.log('📧 Running daily report batch...');
      try {
        // Use the legacy function from emailService
        const result = await legacySendDaily(pool);
        console.log(`✅ Daily reports complete: ${result.sent} sent, ${result.failed} failed`);
      } catch (error) {
        console.error('❌ Daily report error:', error.message);
      }
      // Schedule next day
      scheduleNextDaily();
    }, msUntil);
  };
  
  scheduleNextDaily();
}

/**
 * Start all report schedulers
 */
export function startReportSchedulers() {
  console.log('\n📧 ========================================');
  console.log('📧 STARTING REPORT SCHEDULERS');
  console.log('📧 ========================================\n');
  
  startWeeklyReportScheduler();
  startDailyReportScheduler();
  startSubscriptionReminderScheduler();
  startSellerReportScheduler();
  startWeeklyTradingScheduler();
  
  console.log('✅ Report schedulers started successfully\n');
}

/**
 * Stop all report schedulers
 */
export function stopReportSchedulers() {
  if (weeklyReportInterval) {
    clearTimeout(weeklyReportInterval);
    weeklyReportInterval = null;
  }
  if (dailyReportInterval) {
    clearTimeout(dailyReportInterval);
    dailyReportInterval = null;
  }
  stopSubscriptionReminderScheduler();
  console.log('🛑 Report schedulers stopped');
}

/**
 * Manually trigger weekly reports (for testing)
 */
export async function triggerWeeklyReports() {
  console.log('📧 Manually triggering weekly reports...');
  return await sendWeeklyReportsToAll();
}

/**
 * Manually trigger daily reports (for testing)
 */
export async function triggerDailyReports() {
  console.log('📧 Manually triggering daily reports...');
  return await legacySendDaily(pool);
}

/**
 * Manually trigger subscription reminders (for testing)
 */
export async function triggerSubscriptionReminders() {
  console.log('📧 Manually triggering subscription reminders...');
  return await runSubscriptionReminders();
}

/**
 * Manually trigger seller reports (for testing)
 */
export async function triggerSellerMonthlyReports() {
  console.log('📧 Manually triggering seller monthly reports...');
  return await triggerSellerReports();
}

/**
 * Manually trigger weekly trading summaries (for testing)
 */
export async function triggerTradingSummaries() {
  console.log('📧 Manually triggering weekly trading summaries...');
  return await triggerWeeklyTradingSummaries();
}

export default {
  startReportSchedulers,
  stopReportSchedulers,
  triggerWeeklyReports,
  triggerDailyReports,
  triggerSubscriptionReminders,
  triggerSellerMonthlyReports,
  triggerTradingSummaries,
};
