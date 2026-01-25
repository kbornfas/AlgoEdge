import express from 'express';
import pool from '../config/database.js';
import { requireAdmin } from '../middleware/adminAuth.js';
import { logAuditAction } from '../services/auditService.js';

const router = express.Router();

/**
 * GET /api/admin/affiliate/overview
 * Get affiliate program overview statistics
 */
router.get('/overview', requireAdmin, async (req, res) => {
  try {
    // Get overall stats
    const statsResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT u.id) as total_affiliates,
        COUNT(DISTINCT CASE WHEN ref.id IS NOT NULL THEN u.id END) as active_affiliates,
        COUNT(ref.id) as total_referrals,
        COUNT(CASE WHEN s.status = 'active' THEN 1 END) as paying_referrals,
        COALESCE(SUM(ac.amount), 0) as total_commissions,
        COALESCE(SUM(CASE WHEN ac.status = 'pending' THEN ac.amount END), 0) as pending_commissions,
        COALESCE(SUM(CASE WHEN ac.status = 'approved' THEN ac.amount END), 0) as approved_commissions,
        COALESCE(SUM(CASE WHEN ac.status = 'paid' THEN ac.amount END), 0) as paid_commissions
      FROM users u
      LEFT JOIN users ref ON ref.referred_by = u.id
      LEFT JOIN subscriptions s ON s.user_id = ref.id
      LEFT JOIN affiliate_commissions ac ON ac.affiliate_user_id = u.id
      WHERE u.referral_code IS NOT NULL
    `);

    // Get pending payouts
    const payoutsResult = await pool.query(`
      SELECT 
        COUNT(*) as pending_count,
        COALESCE(SUM(amount), 0) as pending_amount
      FROM affiliate_payouts
      WHERE status = 'pending'
    `);

    // Get recent activity
    const recentActivity = await pool.query(`
      SELECT 
        'commission' as type,
        ac.amount,
        ac.status,
        ac.created_at,
        u.username as affiliate,
        ref.username as referral
      FROM affiliate_commissions ac
      JOIN users u ON u.id = ac.affiliate_user_id
      JOIN users ref ON ref.id = ac.referred_user_id
      ORDER BY ac.created_at DESC
      LIMIT 10
    `);

    // Get fraud flags count
    const fraudResult = await pool.query(`
      SELECT COUNT(*) as unresolved_fraud
      FROM affiliate_fraud_flags
      WHERE resolved = FALSE
    `);

    res.json({
      stats: statsResult.rows[0],
      pendingPayouts: payoutsResult.rows[0],
      recentActivity: recentActivity.rows,
      unresolvedFraud: parseInt(fraudResult.rows[0].unresolved_fraud) || 0,
    });
  } catch (error) {
    console.error('Error fetching affiliate overview:', error);
    res.status(500).json({ error: 'Failed to fetch overview' });
  }
});

/**
 * GET /api/admin/affiliate/affiliates
 * List all affiliates with their stats
 */
router.get('/affiliates', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, sort = 'referrals', order = 'desc', tier } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        u.id,
        u.username,
        u.email,
        u.referral_code,
        u.affiliate_tier,
        u.affiliate_commission_rate,
        u.affiliate_blocked,
        u.created_at,
        COUNT(DISTINCT ref.id) as total_referrals,
        COUNT(DISTINCT CASE WHEN s.status = 'active' THEN ref.id END) as active_referrals,
        COALESCE(w.total_earned, 0) as total_earned,
        COALESCE(w.pending, 0) as pending,
        COALESCE(w.available_balance, 0) as available_balance,
        COALESCE(w.withdrawn, 0) as withdrawn
      FROM users u
      LEFT JOIN users ref ON ref.referred_by = u.id
      LEFT JOIN subscriptions s ON s.user_id = ref.id
      LEFT JOIN affiliate_wallets w ON w.user_id = u.id
      WHERE u.referral_code IS NOT NULL
    `;

    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      query += ` AND (u.username ILIKE $${paramCount} OR u.email ILIKE $${paramCount} OR u.referral_code ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (tier) {
      paramCount++;
      query += ` AND u.affiliate_tier = $${paramCount}`;
      params.push(tier);
    }

    query += ` GROUP BY u.id, w.total_earned, w.pending, w.available_balance, w.withdrawn`;

    // Sorting
    const sortColumns = {
      referrals: 'total_referrals',
      earnings: 'total_earned',
      balance: 'available_balance',
      created: 'u.created_at',
    };
    const sortColumn = sortColumns[sort] || 'total_referrals';
    query += ` ORDER BY ${sortColumn} ${order === 'asc' ? 'ASC' : 'DESC'}`;

    query += ` LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const affiliates = await pool.query(query, params);

    // Get total count
    const countQuery = `
      SELECT COUNT(DISTINCT u.id) 
      FROM users u 
      WHERE u.referral_code IS NOT NULL
      ${search ? `AND (u.username ILIKE $1 OR u.email ILIKE $1 OR u.referral_code ILIKE $1)` : ''}
      ${tier ? `AND u.affiliate_tier = $${search ? 2 : 1}` : ''}
    `;
    const countParams = [];
    if (search) countParams.push(`%${search}%`);
    if (tier) countParams.push(tier);
    
    const countResult = await pool.query(countQuery, countParams);

    res.json({
      affiliates: affiliates.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit),
    });
  } catch (error) {
    console.error('Error fetching affiliates:', error);
    res.status(500).json({ error: 'Failed to fetch affiliates' });
  }
});

/**
 * GET /api/admin/affiliate/affiliates/:id
 * Get detailed affiliate info
 */
router.get('/affiliates/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Get affiliate details
    const affiliateResult = await pool.query(`
      SELECT 
        u.*,
        w.total_earned,
        w.pending,
        w.available_balance,
        w.withdrawn,
        w.held
      FROM users u
      LEFT JOIN affiliate_wallets w ON w.user_id = u.id
      WHERE u.id = $1
    `, [id]);

    if (affiliateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Affiliate not found' });
    }

    const affiliate = affiliateResult.rows[0];
    delete affiliate.password_hash; // Remove sensitive data

    // Get referrals
    const referrals = await pool.query(`
      SELECT 
        u.id, u.username, u.email, u.created_at,
        s.plan, s.status as subscription_status,
        COALESCE(SUM(ac.amount), 0) as total_commission
      FROM users u
      LEFT JOIN subscriptions s ON s.user_id = u.id
      LEFT JOIN affiliate_commissions ac ON ac.referred_user_id = u.id AND ac.affiliate_user_id = $1
      WHERE u.referred_by = $1
      GROUP BY u.id, s.plan, s.status
      ORDER BY u.created_at DESC
      LIMIT 50
    `, [id]);

    // Get commissions
    const commissions = await pool.query(`
      SELECT ac.*, ref.username as referral_username
      FROM affiliate_commissions ac
      JOIN users ref ON ref.id = ac.referred_user_id
      WHERE ac.affiliate_user_id = $1
      ORDER BY ac.created_at DESC
      LIMIT 50
    `, [id]);

    // Get payouts
    const payouts = await pool.query(`
      SELECT * FROM affiliate_payouts
      WHERE user_id = $1
      ORDER BY requested_at DESC
    `, [id]);

    // Get fraud flags
    const fraudFlags = await pool.query(`
      SELECT * FROM affiliate_fraud_flags
      WHERE user_id = $1
      ORDER BY created_at DESC
    `, [id]);

    // Get audit log
    const auditLog = await pool.query(`
      SELECT * FROM affiliate_audit_logs
      WHERE target_user_id = $1 OR actor_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [id]);

    res.json({
      affiliate,
      referrals: referrals.rows,
      commissions: commissions.rows,
      payouts: payouts.rows,
      fraudFlags: fraudFlags.rows,
      auditLog: auditLog.rows,
    });
  } catch (error) {
    console.error('Error fetching affiliate details:', error);
    res.status(500).json({ error: 'Failed to fetch affiliate details' });
  }
});

/**
 * PATCH /api/admin/affiliate/affiliates/:id
 * Update affiliate settings (tier, rate, block status)
 */
router.patch('/affiliates/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { tier, commissionRate, blocked, blockedReason } = req.body;
    const adminId = req.user.id;

    // Get current values for audit
    const currentResult = await pool.query(
      'SELECT affiliate_tier, affiliate_commission_rate, affiliate_blocked, affiliate_blocked_reason FROM users WHERE id = $1',
      [id]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const oldValues = currentResult.rows[0];
    const updates = [];
    const values = [];
    let paramCount = 0;

    if (tier !== undefined) {
      paramCount++;
      updates.push(`affiliate_tier = $${paramCount}`);
      values.push(tier);
    }

    if (commissionRate !== undefined) {
      paramCount++;
      updates.push(`affiliate_commission_rate = $${paramCount}`);
      values.push(commissionRate);
    }

    if (blocked !== undefined) {
      paramCount++;
      updates.push(`affiliate_blocked = $${paramCount}`);
      values.push(blocked);
      
      if (blocked) {
        paramCount++;
        updates.push(`affiliate_blocked_at = NOW()`);
        updates.push(`affiliate_blocked_reason = $${paramCount}`);
        values.push(blockedReason || 'Blocked by admin');
      } else {
        updates.push(`affiliate_blocked_at = NULL`);
        updates.push(`affiliate_blocked_reason = NULL`);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    paramCount++;
    values.push(id);

    await pool.query(
      `UPDATE users SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${paramCount}`,
      values
    );

    // Log the action
    await logAuditAction({
      action: 'affiliate_settings_updated',
      actorId: adminId,
      targetUserId: parseInt(id),
      entityType: 'user',
      entityId: parseInt(id),
      oldValues,
      newValues: { tier, commissionRate, blocked, blockedReason },
      req,
    });

    res.json({ success: true, message: 'Affiliate updated successfully' });
  } catch (error) {
    console.error('Error updating affiliate:', error);
    res.status(500).json({ error: 'Failed to update affiliate' });
  }
});

/**
 * GET /api/admin/affiliate/payouts
 * List all payout requests
 */
router.get('/payouts', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        p.*,
        u.username,
        u.email,
        u.affiliate_tier
      FROM affiliate_payouts p
      JOIN users u ON u.id = p.user_id
    `;

    const params = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      query += ` WHERE p.status = $${paramCount}`;
      params.push(status);
    }

    query += ` ORDER BY p.requested_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const payouts = await pool.query(query, params);

    const countQuery = `
      SELECT COUNT(*) FROM affiliate_payouts
      ${status ? 'WHERE status = $1' : ''}
    `;
    const countResult = await pool.query(countQuery, status ? [status] : []);

    res.json({
      payouts: payouts.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit),
    });
  } catch (error) {
    console.error('Error fetching payouts:', error);
    res.status(500).json({ error: 'Failed to fetch payouts' });
  }
});

/**
 * POST /api/admin/affiliate/payouts/:id/approve
 * Approve a payout request
 */
router.post('/payouts/:id/approve', requireAdmin, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { transactionId, notes } = req.body;
    const adminId = req.user.id;

    await client.query('BEGIN');

    // Get payout details
    const payoutResult = await client.query(
      'SELECT * FROM affiliate_payouts WHERE id = $1 AND status = $2',
      [id, 'pending']
    );

    if (payoutResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pending payout not found' });
    }

    const payout = payoutResult.rows[0];

    // Calculate fee (optional: can add processing fees)
    const feeAmount = 0; // Can implement fee structure here
    const netAmount = payout.amount - feeAmount;

    // Update payout status
    await client.query(`
      UPDATE affiliate_payouts 
      SET status = 'completed', 
          processed_at = NOW(), 
          processed_by = $1,
          transaction_id = $2,
          admin_notes = $3,
          fee_amount = $4,
          net_amount = $5
      WHERE id = $6
    `, [adminId, transactionId, notes, feeAmount, netAmount, id]);

    // Update commissions status
    await client.query(`
      UPDATE affiliate_commissions 
      SET status = 'paid', paid_at = NOW()
      WHERE payout_id = $1
    `, [id]);

    // Update wallet - move from held to withdrawn
    await client.query(`
      SELECT add_wallet_transaction($1, 'withdrawal_completed', $2, 'payout', $3, 'Payout approved and processed', $4)
    `, [payout.user_id, payout.amount, id, adminId]);

    // Log the action
    await client.query(`
      INSERT INTO affiliate_audit_logs (action, actor_id, target_user_id, entity_type, entity_id, new_values, ip_address)
      VALUES ('payout_approved', $1, $2, 'payout', $3, $4, $5)
    `, [adminId, payout.user_id, id, JSON.stringify({ amount: payout.amount, transactionId }), req.ip]);

    await client.query('COMMIT');

    res.json({ success: true, message: 'Payout approved successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error approving payout:', error);
    res.status(500).json({ error: 'Failed to approve payout' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/admin/affiliate/payouts/:id/reject
 * Reject a payout request
 */
router.post('/payouts/:id/reject', requireAdmin, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    if (!reason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    await client.query('BEGIN');

    // Get payout details
    const payoutResult = await client.query(
      'SELECT * FROM affiliate_payouts WHERE id = $1 AND status = $2',
      [id, 'pending']
    );

    if (payoutResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pending payout not found' });
    }

    const payout = payoutResult.rows[0];

    // Update payout status
    await client.query(`
      UPDATE affiliate_payouts 
      SET status = 'rejected', 
          processed_at = NOW(), 
          processed_by = $1,
          rejection_reason = $2
      WHERE id = $3
    `, [adminId, reason, id]);

    // Revert commissions to approved status
    await client.query(`
      UPDATE affiliate_commissions 
      SET status = 'approved', payout_id = NULL
      WHERE payout_id = $1
    `, [id]);

    // Update wallet - move from held back to available
    await client.query(`
      SELECT add_wallet_transaction($1, 'withdrawal_rejected', $2, 'payout', $3, $4, $5)
    `, [payout.user_id, payout.amount, id, `Payout rejected: ${reason}`, adminId]);

    // Log the action
    await client.query(`
      INSERT INTO affiliate_audit_logs (action, actor_id, target_user_id, entity_type, entity_id, new_values, ip_address)
      VALUES ('payout_rejected', $1, $2, 'payout', $3, $4, $5)
    `, [adminId, payout.user_id, id, JSON.stringify({ amount: payout.amount, reason }), req.ip]);

    await client.query('COMMIT');

    res.json({ success: true, message: 'Payout rejected' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error rejecting payout:', error);
    res.status(500).json({ error: 'Failed to reject payout' });
  } finally {
    client.release();
  }
});

/**
 * GET /api/admin/affiliate/fraud-flags
 * List fraud flags
 */
router.get('/fraud-flags', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, resolved } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        f.*,
        u.username,
        u.email,
        resolver.username as resolved_by_username
      FROM affiliate_fraud_flags f
      JOIN users u ON u.id = f.user_id
      LEFT JOIN users resolver ON resolver.id = f.resolved_by
    `;

    const params = [];
    let paramCount = 0;

    if (resolved !== undefined) {
      paramCount++;
      query += ` WHERE f.resolved = $${paramCount}`;
      params.push(resolved === 'true');
    }

    query += ` ORDER BY f.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    params.push(limit, offset);

    const flags = await pool.query(query, params);

    const countQuery = `
      SELECT COUNT(*) FROM affiliate_fraud_flags
      ${resolved !== undefined ? `WHERE resolved = $1` : ''}
    `;
    const countResult = await pool.query(countQuery, resolved !== undefined ? [resolved === 'true'] : []);

    res.json({
      fraudFlags: flags.rows,
      total: parseInt(countResult.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(countResult.rows[0].count / limit),
    });
  } catch (error) {
    console.error('Error fetching fraud flags:', error);
    res.status(500).json({ error: 'Failed to fetch fraud flags' });
  }
});

/**
 * POST /api/admin/affiliate/fraud-flags/:id/resolve
 * Resolve a fraud flag
 */
router.post('/fraud-flags/:id/resolve', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, action } = req.body;
    const adminId = req.user.id;

    const result = await pool.query(`
      UPDATE affiliate_fraud_flags 
      SET resolved = TRUE, 
          resolved_by = $1, 
          resolved_at = NOW(),
          resolution_notes = $2
      WHERE id = $3
      RETURNING *
    `, [adminId, notes || `Action taken: ${action}`, id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fraud flag not found' });
    }

    // If action is to block user
    if (action === 'block') {
      await pool.query(`
        UPDATE users 
        SET affiliate_blocked = TRUE, 
            affiliate_blocked_at = NOW(),
            affiliate_blocked_reason = $1
        WHERE id = $2
      `, [notes || 'Blocked due to fraud', result.rows[0].user_id]);
    }

    // Log the action
    await logAuditAction({
      action: 'fraud_flag_resolved',
      actorId: adminId,
      targetUserId: result.rows[0].user_id,
      entityType: 'fraud_flag',
      entityId: parseInt(id),
      newValues: { notes, action },
      req,
    });

    res.json({ success: true, message: 'Fraud flag resolved' });
  } catch (error) {
    console.error('Error resolving fraud flag:', error);
    res.status(500).json({ error: 'Failed to resolve fraud flag' });
  }
});

/**
 * GET /api/admin/affiliate/export
 * Export affiliate data as CSV
 */
router.get('/export', requireAdmin, async (req, res) => {
  try {
    const { type = 'affiliates', startDate, endDate } = req.query;

    let query;
    let filename;

    switch (type) {
      case 'affiliates':
        query = `
          SELECT 
            u.id, u.username, u.email, u.referral_code, u.affiliate_tier,
            u.affiliate_commission_rate, u.created_at,
            COUNT(DISTINCT ref.id) as total_referrals,
            COALESCE(w.total_earned, 0) as total_earned,
            COALESCE(w.available_balance, 0) as available_balance,
            COALESCE(w.withdrawn, 0) as withdrawn
          FROM users u
          LEFT JOIN users ref ON ref.referred_by = u.id
          LEFT JOIN affiliate_wallets w ON w.user_id = u.id
          WHERE u.referral_code IS NOT NULL
          GROUP BY u.id, w.total_earned, w.available_balance, w.withdrawn
          ORDER BY total_earned DESC
        `;
        filename = 'affiliates_export.csv';
        break;

      case 'commissions':
        query = `
          SELECT 
            ac.id, ac.amount, ac.commission_rate, ac.status,
            ac.created_at, ac.unlock_date, ac.paid_at,
            aff.username as affiliate_username, aff.email as affiliate_email,
            ref.username as referral_username
          FROM affiliate_commissions ac
          JOIN users aff ON aff.id = ac.affiliate_user_id
          JOIN users ref ON ref.id = ac.referred_user_id
          ${startDate ? `WHERE ac.created_at >= '${startDate}'` : ''}
          ${endDate ? `${startDate ? 'AND' : 'WHERE'} ac.created_at <= '${endDate}'` : ''}
          ORDER BY ac.created_at DESC
        `;
        filename = 'commissions_export.csv';
        break;

      case 'payouts':
        query = `
          SELECT 
            p.id, p.amount, p.payout_method, p.status,
            p.requested_at, p.processed_at, p.transaction_id,
            u.username, u.email
          FROM affiliate_payouts p
          JOIN users u ON u.id = p.user_id
          ${startDate ? `WHERE p.requested_at >= '${startDate}'` : ''}
          ${endDate ? `${startDate ? 'AND' : 'WHERE'} p.requested_at <= '${endDate}'` : ''}
          ORDER BY p.requested_at DESC
        `;
        filename = 'payouts_export.csv';
        break;

      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }

    const result = await pool.query(query);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'No data to export' });
    }

    // Convert to CSV
    const headers = Object.keys(result.rows[0]).join(',');
    const rows = result.rows.map(row => 
      Object.values(row).map(val => 
        typeof val === 'string' && val.includes(',') ? `"${val}"` : val
      ).join(',')
    );
    const csv = [headers, ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

/**
 * POST /api/admin/affiliate/commissions/:id/approve
 * Manually approve a commission
 */
router.post('/commissions/:id/approve', requireAdmin, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    await client.query('BEGIN');

    const commissionResult = await client.query(
      'SELECT * FROM affiliate_commissions WHERE id = $1 AND status = $2',
      [id, 'pending']
    );

    if (commissionResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pending commission not found' });
    }

    const commission = commissionResult.rows[0];

    // Update commission status
    await client.query(
      'UPDATE affiliate_commissions SET status = $1, updated_at = NOW() WHERE id = $2',
      ['approved', id]
    );

    // Update wallet
    await client.query(`
      SELECT add_wallet_transaction($1, 'commission_approved', $2, 'commission', $3, 'Manually approved by admin', $4)
    `, [commission.affiliate_user_id, commission.amount, id, adminId]);

    // Log the action
    await client.query(`
      INSERT INTO affiliate_audit_logs (action, actor_id, target_user_id, entity_type, entity_id, new_values, ip_address)
      VALUES ('commission_manually_approved', $1, $2, 'commission', $3, $4, $5)
    `, [adminId, commission.affiliate_user_id, id, JSON.stringify({ amount: commission.amount }), req.ip]);

    await client.query('COMMIT');

    res.json({ success: true, message: 'Commission approved' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error approving commission:', error);
    res.status(500).json({ error: 'Failed to approve commission' });
  } finally {
    client.release();
  }
});

/**
 * POST /api/admin/affiliate/run-approval-job
 * Manually trigger the commission approval job
 */
router.post('/run-approval-job', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT approve_pending_commissions()');
    const approvedCount = result.rows[0].approve_pending_commissions;

    res.json({ 
      success: true, 
      message: `Approved ${approvedCount} commissions`,
      count: approvedCount 
    });
  } catch (error) {
    console.error('Error running approval job:', error);
    res.status(500).json({ error: 'Failed to run approval job' });
  }
});

export default router;
