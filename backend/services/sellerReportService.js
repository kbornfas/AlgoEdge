/**
 * Seller Report Service
 * Generates and sends monthly reports to sellers
 */

import pool from '../config/database.js';
import { sendEmail } from './emailService.js';
import cron from 'node-cron';

/**
 * Get seller monthly statistics
 */
async function getSellerMonthlyStats(sellerId, startDate, endDate) {
  // Total earnings for the month
  const earningsResult = await pool.query(`
    SELECT 
      COALESCE(SUM(amount), 0) as total_earnings,
      COUNT(*) as total_transactions
    FROM wallet_transactions
    WHERE user_id = $1 
      AND transaction_type = 'sale_earning'
      AND created_at >= $2 
      AND created_at < $3
  `, [sellerId, startDate, endDate]);

  // Product sales breakdown
  const productSalesResult = await pool.query(`
    SELECT 
      COALESCE(mp.title, 'Unknown Product') as product_name,
      COUNT(*) as sales_count,
      SUM(wt.amount) as revenue
    FROM wallet_transactions wt
    LEFT JOIN marketplace_products mp ON mp.seller_id = $1
    WHERE wt.user_id = $1 
      AND wt.transaction_type = 'sale_earning'
      AND wt.created_at >= $2 
      AND wt.created_at < $3
    GROUP BY mp.title
    ORDER BY revenue DESC
    LIMIT 10
  `, [sellerId, startDate, endDate]);

  // New customers this month
  const customersResult = await pool.query(`
    SELECT COUNT(DISTINCT buyer_id) as new_customers
    FROM marketplace_purchases
    WHERE seller_id = $1
      AND created_at >= $2 
      AND created_at < $3
  `, [sellerId, startDate, endDate]);

  // Reviews received this month
  const reviewsResult = await pool.query(`
    SELECT 
      COUNT(*) as total_reviews,
      ROUND(AVG(rating)::numeric, 1) as avg_rating
    FROM marketplace_reviews mr
    JOIN marketplace_products mp ON mr.product_id = mp.id
    WHERE mp.seller_id = $1
      AND mr.created_at >= $2 
      AND mr.created_at < $3
  `, [sellerId, startDate, endDate]);

  // Comparison with previous month
  const prevStartDate = new Date(startDate);
  prevStartDate.setMonth(prevStartDate.getMonth() - 1);
  const prevEndDate = new Date(startDate);

  const prevEarningsResult = await pool.query(`
    SELECT COALESCE(SUM(amount), 0) as prev_earnings
    FROM wallet_transactions
    WHERE user_id = $1 
      AND transaction_type = 'sale_earning'
      AND created_at >= $2 
      AND created_at < $3
  `, [sellerId, prevStartDate, prevEndDate]);

  const currentEarnings = parseFloat(earningsResult.rows[0]?.total_earnings || 0);
  const prevEarnings = parseFloat(prevEarningsResult.rows[0]?.prev_earnings || 0);
  const growthPercent = prevEarnings > 0 
    ? ((currentEarnings - prevEarnings) / prevEarnings * 100).toFixed(1)
    : currentEarnings > 0 ? 100 : 0;

  return {
    totalEarnings: currentEarnings,
    totalTransactions: parseInt(earningsResult.rows[0]?.total_transactions || 0),
    productSales: productSalesResult.rows,
    newCustomers: parseInt(customersResult.rows[0]?.new_customers || 0),
    totalReviews: parseInt(reviewsResult.rows[0]?.total_reviews || 0),
    avgRating: parseFloat(reviewsResult.rows[0]?.avg_rating || 0),
    prevEarnings,
    growthPercent,
  };
}

/**
 * Generate HTML email template for seller monthly report
 */
function generateSellerReportEmail(seller, stats, monthName, year) {
  const growthColor = parseFloat(stats.growthPercent) >= 0 ? '#22c55e' : '#ef4444';
  const growthIcon = parseFloat(stats.growthPercent) >= 0 ? '📈' : '📉';
  
  const productRows = stats.productSales.length > 0 
    ? stats.productSales.map(p => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #334155;">${p.product_name}</td>
          <td style="padding: 12px; border-bottom: 1px solid #334155; text-align: center;">${p.sales_count}</td>
          <td style="padding: 12px; border-bottom: 1px solid #334155; text-align: right; color: #22c55e;">$${parseFloat(p.revenue || 0).toFixed(2)}</td>
        </tr>
      `).join('')
    : '<tr><td colspan="3" style="padding: 12px; text-align: center; color: #94a3b8;">No sales this month</td></tr>';

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
          <h1 style="color: #8b5cf6; margin: 0 0 10px 0; font-size: 28px;">📊 Monthly Seller Report</h1>
          <p style="color: #94a3b8; margin: 0; font-size: 16px;">${monthName} ${year}</p>
        </div>

        <!-- Greeting -->
        <div style="background: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #334155;">
          <p style="color: #e2e8f0; margin: 0; font-size: 16px;">
            Hi <strong style="color: #8b5cf6;">${seller.full_name || seller.username}</strong>,
          </p>
          <p style="color: #94a3b8; margin: 10px 0 0 0; font-size: 14px;">
            Here's your performance summary for ${monthName} ${year}.
          </p>
        </div>

        <!-- Key Metrics -->
        <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 20px;">
          <div style="flex: 1; min-width: 120px; background: linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%); border-radius: 12px; padding: 20px; text-align: center; border: 1px solid rgba(34, 197, 94, 0.2);">
            <div style="color: #22c55e; font-size: 28px; font-weight: bold;">$${stats.totalEarnings.toFixed(2)}</div>
            <div style="color: #94a3b8; font-size: 12px; margin-top: 5px;">TOTAL EARNINGS</div>
          </div>
          <div style="flex: 1; min-width: 120px; background: linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%); border-radius: 12px; padding: 20px; text-align: center; border: 1px solid rgba(139, 92, 246, 0.2);">
            <div style="color: #8b5cf6; font-size: 28px; font-weight: bold;">${stats.totalTransactions}</div>
            <div style="color: #94a3b8; font-size: 12px; margin-top: 5px;">TOTAL SALES</div>
          </div>
        </div>

        <div style="display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 20px;">
          <div style="flex: 1; min-width: 120px; background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%); border-radius: 12px; padding: 20px; text-align: center; border: 1px solid rgba(59, 130, 246, 0.2);">
            <div style="color: #3b82f6; font-size: 28px; font-weight: bold;">${stats.newCustomers}</div>
            <div style="color: #94a3b8; font-size: 12px; margin-top: 5px;">NEW CUSTOMERS</div>
          </div>
          <div style="flex: 1; min-width: 120px; background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%); border-radius: 12px; padding: 20px; text-align: center; border: 1px solid rgba(245, 158, 11, 0.2);">
            <div style="color: #f59e0b; font-size: 28px; font-weight: bold;">⭐ ${stats.avgRating || 'N/A'}</div>
            <div style="color: #94a3b8; font-size: 12px; margin-top: 5px;">${stats.totalReviews} REVIEWS</div>
          </div>
        </div>

        <!-- Growth Comparison -->
        <div style="background: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #334155; text-align: center;">
          <p style="color: #94a3b8; margin: 0 0 10px 0; font-size: 14px;">Compared to last month</p>
          <div style="color: ${growthColor}; font-size: 24px; font-weight: bold;">
            ${growthIcon} ${stats.growthPercent >= 0 ? '+' : ''}${stats.growthPercent}%
          </div>
          <p style="color: #64748b; margin: 10px 0 0 0; font-size: 12px;">
            Previous month: $${stats.prevEarnings.toFixed(2)}
          </p>
        </div>

        <!-- Product Breakdown -->
        <div style="background: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 20px; border: 1px solid #334155;">
          <h3 style="color: #e2e8f0; margin: 0 0 15px 0; font-size: 16px;">📦 Product Performance</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 2px solid #334155;">
                <th style="padding: 12px; text-align: left; color: #94a3b8; font-size: 12px;">PRODUCT</th>
                <th style="padding: 12px; text-align: center; color: #94a3b8; font-size: 12px;">SALES</th>
                <th style="padding: 12px; text-align: right; color: #94a3b8; font-size: 12px;">REVENUE</th>
              </tr>
            </thead>
            <tbody style="color: #e2e8f0; font-size: 14px;">
              ${productRows}
            </tbody>
          </table>
        </div>

        <!-- CTA -->
        <div style="text-align: center; margin-bottom: 20px;">
          <a href="${process.env.FRONTEND_URL}/dashboard/seller" 
             style="display: inline-block; background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); color: white; text-decoration: none; padding: 14px 30px; border-radius: 8px; font-weight: 600; font-size: 14px;">
            View Full Analytics →
          </a>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px; color: #64748b; font-size: 12px;">
          <p style="margin: 0;">Thank you for being a seller on AlgoEdge!</p>
          <p style="margin: 10px 0 0 0;">
            <a href="${process.env.FRONTEND_URL}" style="color: #8b5cf6; text-decoration: none;">AlgoEdge</a> •
            <a href="${process.env.FRONTEND_URL}/settings" style="color: #8b5cf6; text-decoration: none;">Settings</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

/**
 * Send monthly reports to all active sellers
 */
export async function sendMonthlySellerReports() {
  console.log('📊 Starting monthly seller report generation...');
  
  try {
    // Calculate date range for previous month
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthName = startOfMonth.toLocaleString('default', { month: 'long' });
    const year = startOfMonth.getFullYear();

    // Get all active sellers
    const sellersResult = await pool.query(`
      SELECT id, username, email, full_name
      FROM users
      WHERE is_seller = true 
        AND is_blocked = false
        AND email IS NOT NULL
    `);

    console.log(`Found ${sellersResult.rows.length} active sellers`);

    let sentCount = 0;
    let errorCount = 0;

    for (const seller of sellersResult.rows) {
      try {
        // Get stats for this seller
        const stats = await getSellerMonthlyStats(seller.id, startOfMonth, endOfMonth);

        // Only send if they had any activity
        if (stats.totalEarnings > 0 || stats.totalTransactions > 0 || stats.newCustomers > 0) {
          const emailHtml = generateSellerReportEmail(seller, stats, monthName, year);

          await sendEmail({
            to: seller.email,
            subject: `📊 Your ${monthName} Seller Report - AlgoEdge`,
            html: emailHtml,
          });

          console.log(`✅ Sent report to ${seller.email}`);
          sentCount++;
        } else {
          console.log(`⏭️ Skipped ${seller.email} - no activity`);
        }
      } catch (error) {
        console.error(`❌ Failed to send report to ${seller.email}:`, error.message);
        errorCount++;
      }
    }

    console.log(`📊 Monthly seller reports complete: ${sentCount} sent, ${errorCount} failed`);
    return { sentCount, errorCount };
  } catch (error) {
    console.error('❌ Monthly seller reports error:', error);
    throw error;
  }
}

/**
 * Start the monthly seller report scheduler
 * Runs on the 1st of each month at 10 AM UTC
 */
export function startSellerReportScheduler() {
  // Run at 10:00 AM UTC on the 1st of every month
  cron.schedule('0 10 1 * *', async () => {
    console.log('⏰ Monthly seller report scheduler triggered');
    try {
      await sendMonthlySellerReports();
    } catch (error) {
      console.error('❌ Seller report scheduler error:', error);
    }
  }, {
    timezone: 'UTC'
  });
  
  console.log('📊 Seller report scheduler started (1st of month at 10 AM UTC)');
}

/**
 * Manual trigger for testing
 */
export async function triggerSellerReports() {
  console.log('🔧 Manually triggering seller reports...');
  return await sendMonthlySellerReports();
}
