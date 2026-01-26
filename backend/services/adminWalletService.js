/**
 * Admin Wallet Service
 * Handles all platform revenue tracking and admin wallet operations
 */
import pool from '../config/database.js';

/**
 * Add a transaction to the admin wallet
 * @param {string} type - Transaction type: 'marketplace_commission', 'verification_fee', 'withdrawal_fee', 'subscription_revenue', 'affiliate_payout', 'refund', 'manual_adjustment'
 * @param {number} amount - Amount (positive for income, negative for outgoing)
 * @param {string} description - Description of the transaction
 * @param {string} referenceType - Type of reference: 'purchase', 'verification', 'withdrawal', 'subscription', 'payout'
 * @param {number} referenceId - ID of the related record
 * @param {number} userId - User involved in this transaction
 * @param {number} createdBy - Admin who made manual adjustment (optional)
 */
export async function addAdminWalletTransaction(type, amount, description, referenceType = null, referenceId = null, userId = null, createdBy = null) {
  try {
    // Ensure admin wallet exists
    await pool.query(`
      INSERT INTO admin_wallet (id, balance, total_revenue) 
      VALUES (1, 0.00, 0.00)
      ON CONFLICT (id) DO NOTHING
    `);

    // Get current balance
    const walletResult = await pool.query('SELECT balance FROM admin_wallet WHERE id = 1');
    const currentBalance = parseFloat(walletResult.rows[0]?.balance || 0);
    const newBalance = currentBalance + parseFloat(amount);

    // Update admin wallet balance and totals
    await pool.query(`
      UPDATE admin_wallet SET 
        balance = $1,
        total_revenue = CASE 
          WHEN $2 > 0 THEN total_revenue + $2 
          ELSE total_revenue 
        END,
        total_marketplace_commission = CASE 
          WHEN $3 = 'marketplace_commission' THEN total_marketplace_commission + $2 
          ELSE total_marketplace_commission 
        END,
        total_verification_fees = CASE 
          WHEN $3 = 'verification_fee' THEN total_verification_fees + $2 
          ELSE total_verification_fees 
        END,
        total_withdrawal_fees = CASE 
          WHEN $3 = 'withdrawal_fee' THEN total_withdrawal_fees + $2 
          ELSE total_withdrawal_fees 
        END,
        total_subscription_revenue = CASE 
          WHEN $3 = 'subscription_revenue' THEN total_subscription_revenue + $2 
          ELSE total_subscription_revenue 
        END,
        total_payouts = CASE 
          WHEN $3 = 'affiliate_payout' THEN total_payouts + ABS($2)
          ELSE total_payouts 
        END,
        total_refunds = CASE 
          WHEN $3 = 'refund' THEN total_refunds + ABS($2)
          ELSE total_refunds 
        END,
        updated_at = NOW()
      WHERE id = 1
    `, [newBalance, amount, type]);

    // Insert transaction record
    const txResult = await pool.query(`
      INSERT INTO admin_wallet_transactions (
        type, amount, balance_before, balance_after, 
        description, reference_type, reference_id, user_id, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, [type, amount, currentBalance, newBalance, description, referenceType, referenceId, userId, createdBy]);

    console.log(`Admin wallet updated: ${type} ${amount >= 0 ? '+' : ''}$${amount.toFixed(2)} - ${description}`);
    return txResult.rows[0];
  } catch (error) {
    console.error('Error updating admin wallet:', error);
    // Don't throw - this shouldn't block the main transaction
    return null;
  }
}

/**
 * Get admin wallet balance and stats
 */
export async function getAdminWalletStats() {
  try {
    const result = await pool.query('SELECT * FROM admin_wallet WHERE id = 1');
    if (result.rows.length === 0) {
      return {
        balance: 0,
        total_revenue: 0,
        total_marketplace_commission: 0,
        total_verification_fees: 0,
        total_withdrawal_fees: 0,
        total_subscription_revenue: 0,
        total_payouts: 0,
        total_refunds: 0,
      };
    }
    return result.rows[0];
  } catch (error) {
    console.error('Error getting admin wallet stats:', error);
    return null;
  }
}

/**
 * Get admin wallet transaction history
 */
export async function getAdminWalletTransactions(page = 1, limit = 50, type = null) {
  try {
    const offset = (page - 1) * limit;
    let query = `
      SELECT awt.*, u.username, u.email 
      FROM admin_wallet_transactions awt
      LEFT JOIN users u ON awt.user_id = u.id
    `;
    const params = [];

    if (type) {
      query += ` WHERE awt.type = $1`;
      params.push(type);
    }

    query += ` ORDER BY awt.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const transactions = await pool.query(query, params);

    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM admin_wallet_transactions';
    if (type) {
      countQuery += ' WHERE type = $1';
    }
    const countResult = await pool.query(countQuery, type ? [type] : []);

    return {
      transactions: transactions.rows,
      total: parseInt(countResult.rows[0].count),
      page,
      totalPages: Math.ceil(countResult.rows[0].count / limit),
    };
  } catch (error) {
    console.error('Error getting admin wallet transactions:', error);
    return { transactions: [], total: 0, page: 1, totalPages: 0 };
  }
}

export default {
  addAdminWalletTransaction,
  getAdminWalletStats,
  getAdminWalletTransactions,
};
