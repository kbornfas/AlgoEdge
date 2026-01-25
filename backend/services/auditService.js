import pool from '../config/database.js';

/**
 * Audit Service - Centralized logging for compliance
 */

/**
 * Log an audit action to the affiliate_audit_logs table
 */
export async function logAuditAction({
  action,
  actorId = null,
  targetUserId = null,
  entityType = null,
  entityId = null,
  oldValues = null,
  newValues = null,
  metadata = null,
  req = null,
}) {
  try {
    const ipAddress = req?.ip || req?.headers?.['x-forwarded-for'] || req?.connection?.remoteAddress || null;
    const userAgent = req?.headers?.['user-agent'] || null;

    await pool.query(`
      INSERT INTO affiliate_audit_logs (
        action, actor_id, target_user_id, entity_type, entity_id,
        old_values, new_values, ip_address, user_agent, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `, [
      action,
      actorId,
      targetUserId,
      entityType,
      entityId,
      oldValues ? JSON.stringify(oldValues) : null,
      newValues ? JSON.stringify(newValues) : null,
      ipAddress,
      userAgent,
      metadata ? JSON.stringify(metadata) : null,
    ]);

    return true;
  } catch (error) {
    console.error('Failed to log audit action:', error);
    return false;
  }
}

/**
 * Log commission events
 */
export async function logCommissionEvent(type, commission, actorId = null, req = null) {
  const actionMap = {
    created: 'commission_created',
    approved: 'commission_approved',
    paid: 'commission_paid',
    cancelled: 'commission_cancelled',
    refunded: 'commission_refunded',
  };

  return logAuditAction({
    action: actionMap[type] || `commission_${type}`,
    actorId,
    targetUserId: commission.affiliate_user_id,
    entityType: 'commission',
    entityId: commission.id,
    newValues: {
      amount: commission.amount,
      rate: commission.commission_rate,
      status: commission.status,
      referredUserId: commission.referred_user_id,
    },
    req,
  });
}

/**
 * Log payout events
 */
export async function logPayoutEvent(type, payout, actorId = null, req = null, details = {}) {
  const actionMap = {
    requested: 'payout_requested',
    approved: 'payout_approved',
    rejected: 'payout_rejected',
    processing: 'payout_processing',
    completed: 'payout_completed',
    failed: 'payout_failed',
  };

  return logAuditAction({
    action: actionMap[type] || `payout_${type}`,
    actorId,
    targetUserId: payout.user_id,
    entityType: 'payout',
    entityId: payout.id,
    newValues: {
      amount: payout.amount,
      method: payout.payout_method,
      status: payout.status,
      ...details,
    },
    req,
  });
}

/**
 * Log fraud detection events
 */
export async function logFraudEvent(userId, fraudType, evidence, severity = 'medium', req = null) {
  try {
    // Create fraud flag
    const result = await pool.query(`
      INSERT INTO affiliate_fraud_flags (user_id, flag_type, severity, description, evidence)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, [userId, fraudType, severity, `Automated fraud detection: ${fraudType}`, JSON.stringify(evidence)]);

    // Update user's fraud score
    const scoreIncrease = severity === 'critical' ? 50 : severity === 'high' ? 25 : severity === 'medium' ? 10 : 5;
    
    await pool.query(`
      UPDATE users 
      SET fraud_score = COALESCE(fraud_score, 0) + $1,
          fraud_flags = COALESCE(fraud_flags, '[]'::jsonb) || $2::jsonb
      WHERE id = $3
    `, [scoreIncrease, JSON.stringify([{ type: fraudType, flagId: result.rows[0].id, timestamp: new Date() }]), userId]);

    // Log audit
    await logAuditAction({
      action: 'fraud_detected',
      targetUserId: userId,
      entityType: 'fraud_flag',
      entityId: result.rows[0].id,
      newValues: { fraudType, severity, evidence },
      req,
    });

    // Auto-block if fraud score exceeds threshold
    const userResult = await pool.query('SELECT fraud_score FROM users WHERE id = $1', [userId]);
    if (userResult.rows[0]?.fraud_score >= 100) {
      await pool.query(`
        UPDATE users 
        SET affiliate_blocked = TRUE, 
            affiliate_blocked_at = NOW(),
            affiliate_blocked_reason = 'Auto-blocked: High fraud score'
        WHERE id = $1 AND affiliate_blocked = FALSE
      `, [userId]);

      await logAuditAction({
        action: 'affiliate_auto_blocked',
        targetUserId: userId,
        entityType: 'user',
        entityId: userId,
        newValues: { reason: 'High fraud score', score: userResult.rows[0].fraud_score },
        req,
      });
    }

    return result.rows[0].id;
  } catch (error) {
    console.error('Failed to log fraud event:', error);
    return null;
  }
}

/**
 * Log user affiliate actions
 */
export async function logUserAffiliateAction(action, userId, details = {}, req = null) {
  return logAuditAction({
    action,
    actorId: userId,
    targetUserId: userId,
    entityType: 'user',
    entityId: userId,
    newValues: details,
    req,
  });
}

/**
 * Check for fraud patterns on registration
 */
export async function checkRegistrationFraud(referrerId, referredData, req = null) {
  const flags = [];
  const ipAddress = req?.ip || req?.headers?.['x-forwarded-for'] || null;

  // Check 1: Self-referral by email pattern
  if (referredData.email && referrerId) {
    const referrerResult = await pool.query('SELECT email FROM users WHERE id = $1', [referrerId]);
    const referrerEmail = referrerResult.rows[0]?.email;
    
    if (referrerEmail) {
      // Check for similar email patterns (e.g., user1@gmail.com and user2@gmail.com)
      const referrerBase = referrerEmail.split('@')[0].replace(/\d+$/, '');
      const referredBase = referredData.email.split('@')[0].replace(/\d+$/, '');
      
      if (referrerBase === referredBase && referredData.email !== referrerEmail) {
        flags.push({
          type: 'similar_email_pattern',
          severity: 'medium',
          evidence: { referrerEmail, referredEmail: referredData.email },
        });
      }
    }
  }

  // Check 2: Same IP address
  if (ipAddress && referrerId) {
    const ipCheck = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND (signup_ip = $2 OR last_login_ip = $2)',
      [referrerId, ipAddress]
    );
    
    if (ipCheck.rows.length > 0) {
      flags.push({
        type: 'duplicate_ip',
        severity: 'high',
        evidence: { ip: ipAddress, referrerId },
      });
    }
  }

  // Check 3: Rapid signups from referrer
  if (referrerId) {
    const recentCount = await pool.query(`
      SELECT COUNT(*) FROM users 
      WHERE referred_by = $1 AND created_at > NOW() - INTERVAL '1 hour'
    `, [referrerId]);
    
    if (parseInt(recentCount.rows[0].count) >= 5) {
      flags.push({
        type: 'rapid_signups',
        severity: 'medium',
        evidence: { count: recentCount.rows[0].count, interval: '1 hour' },
      });
    }
  }

  // Check 4: Referrer already blocked
  if (referrerId) {
    const blockedCheck = await pool.query(
      'SELECT affiliate_blocked FROM users WHERE id = $1 AND affiliate_blocked = TRUE',
      [referrerId]
    );
    
    if (blockedCheck.rows.length > 0) {
      flags.push({
        type: 'blocked_referrer',
        severity: 'critical',
        evidence: { referrerId },
      });
    }
  }

  return flags;
}

/**
 * Process fraud flags for a user
 */
export async function processFraudFlags(userId, flags, req = null) {
  for (const flag of flags) {
    await logFraudEvent(userId, flag.type, flag.evidence, flag.severity, req);
  }
  
  return flags.length;
}

export default {
  logAuditAction,
  logCommissionEvent,
  logPayoutEvent,
  logFraudEvent,
  logUserAffiliateAction,
  checkRegistrationFraud,
  processFraudFlags,
};
