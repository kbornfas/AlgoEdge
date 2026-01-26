import express from 'express';
import pool from '../config/database.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { addAdminWalletTransaction } from '../services/adminWalletService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads', 'verification');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${req.user.id}-${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
  }
});

// Verification fee amount
const VERIFICATION_FEE = 50.00;

// ============================================================================
// USER ENDPOINTS
// ============================================================================

// Get verification status
router.get('/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's verification status
    const userResult = await pool.query(
      `SELECT has_blue_badge, blue_badge_granted_at FROM users WHERE id = $1`,
      [userId]
    );

    // Get any pending verification request
    const requestResult = await pool.query(
      `SELECT * FROM seller_verification_requests WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1`,
      [userId]
    );

    const user = userResult.rows[0];
    const request = requestResult.rows[0];

    res.json({
      has_blue_badge: user?.has_blue_badge || false,
      badge_granted_at: user?.blue_badge_granted_at,
      verification_fee: VERIFICATION_FEE,
      verification_request: request ? {
        id: request.id,
        status: request.status,
        fee_paid: request.fee_paid,
        id_type: request.id_type,
        created_at: request.created_at,
        rejection_reason: request.rejection_reason,
      } : null,
    });
  } catch (error) {
    console.error('Error getting verification status:', error);
    res.status(500).json({ error: 'Failed to get verification status' });
  }
});

// Submit verification request (with documents)
router.post('/submit', 
  authenticateToken, 
  upload.fields([
    { name: 'id_front', maxCount: 1 },
    { name: 'id_back', maxCount: 1 },
    { name: 'selfie', maxCount: 1 }
  ]),
  async (req, res) => {
    const client = await pool.connect();
    
    try {
      const userId = req.user.id;
      const { id_type, payment_method, payment_reference } = req.body;
      const files = req.files;

      // Validate inputs
      if (!id_type || !['national_id', 'driving_license', 'passport'].includes(id_type)) {
        return res.status(400).json({ error: 'Invalid ID type. Must be national_id, driving_license, or passport' });
      }

      if (!files?.id_front?.[0] || !files?.id_back?.[0] || !files?.selfie?.[0]) {
        return res.status(400).json({ error: 'Please upload all required documents: ID front, ID back, and selfie' });
      }

      if (!payment_method || !['mpesa', 'airtel_money', 'crypto'].includes(payment_method)) {
        return res.status(400).json({ error: 'Invalid payment method. Must be mpesa, airtel_money, or crypto' });
      }

      if (!payment_reference) {
        return res.status(400).json({ error: 'Please provide payment reference/transaction ID' });
      }

      // Check if user already has blue badge
      const userCheck = await client.query(
        `SELECT has_blue_badge FROM users WHERE id = $1`,
        [userId]
      );

      if (userCheck.rows[0]?.has_blue_badge) {
        return res.status(400).json({ error: 'You already have a verified badge' });
      }

      // Check for existing pending request
      const existingRequest = await client.query(
        `SELECT id, status FROM seller_verification_requests WHERE user_id = $1 AND status IN ('pending', 'documents_submitted', 'fee_pending')`,
        [userId]
      );

      if (existingRequest.rows.length > 0) {
        return res.status(400).json({ error: 'You already have a pending verification request' });
      }

      await client.query('BEGIN');

      // Build file URLs
      const baseUrl = process.env.API_URL || 'http://localhost:3000';
      const idFrontUrl = `${baseUrl}/uploads/verification/${files.id_front[0].filename}`;
      const idBackUrl = `${baseUrl}/uploads/verification/${files.id_back[0].filename}`;
      const selfieUrl = `${baseUrl}/uploads/verification/${files.selfie[0].filename}`;

      // Create verification request
      const result = await client.query(
        `INSERT INTO seller_verification_requests 
         (user_id, id_type, id_front_url, id_back_url, selfie_url, 
          fee_payment_method, fee_payment_reference, fee_paid, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, FALSE, 'pending')
         RETURNING *`,
        [userId, id_type, idFrontUrl, idBackUrl, selfieUrl, payment_method, payment_reference]
      );

      await client.query('COMMIT');

      res.json({
        message: 'Verification request submitted successfully. Admin will review your documents and payment.',
        verification_fee: VERIFICATION_FEE,
        request: {
          id: result.rows[0].id,
          status: result.rows[0].status,
          created_at: result.rows[0].created_at,
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error submitting verification:', error);
      res.status(500).json({ error: 'Failed to submit verification request' });
    } finally {
      client.release();
    }
  }
);

// ============================================================================
// ADMIN ENDPOINTS
// ============================================================================

// Get all verification requests
router.get('/admin/requests', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        svr.*,
        u.username,
        u.email,
        u.created_at as user_created_at
      FROM seller_verification_requests svr
      JOIN users u ON svr.user_id = u.id
    `;
    const params = [];

    if (status) {
      query += ` WHERE svr.status = $1`;
      params.push(status);
    }

    query += ` ORDER BY svr.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) FROM seller_verification_requests`;
    const countParams = [];
    if (status) {
      countQuery += ` WHERE status = $1`;
      countParams.push(status);
    }
    const countResult = await pool.query(countQuery, countParams);

    // Get stats
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'pending') as pending,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) as total
      FROM seller_verification_requests
    `);

    res.json({
      requests: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit),
      },
      stats: statsResult.rows[0],
    });
  } catch (error) {
    console.error('Error fetching verification requests:', error);
    res.status(500).json({ error: 'Failed to fetch verification requests' });
  }
});

// Get single verification request details
router.get('/admin/requests/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        svr.*,
        u.username,
        u.email,
        u.created_at as user_created_at,
        reviewer.username as reviewer_username
      FROM seller_verification_requests svr
      JOIN users u ON svr.user_id = u.id
      LEFT JOIN users reviewer ON svr.reviewed_by = reviewer.id
      WHERE svr.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Verification request not found' });
    }

    res.json({ request: result.rows[0] });
  } catch (error) {
    console.error('Error fetching verification request:', error);
    res.status(500).json({ error: 'Failed to fetch verification request' });
  }
});

// Approve verification request
router.post('/admin/requests/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const { admin_notes } = req.body;

    await client.query('BEGIN');

    // Get the request
    const requestResult = await client.query(
      `SELECT * FROM seller_verification_requests WHERE id = $1 FOR UPDATE`,
      [id]
    );

    if (requestResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Verification request not found' });
    }

    const request = requestResult.rows[0];

    if (request.status === 'approved') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'This request has already been approved' });
    }

    // Update verification request
    await client.query(
      `UPDATE seller_verification_requests 
       SET status = 'approved', 
           fee_paid = TRUE,
           fee_paid_at = NOW(),
           reviewed_by = $1, 
           reviewed_at = NOW(),
           admin_notes = $2,
           updated_at = NOW()
       WHERE id = $3`,
      [adminId, admin_notes, id]
    );

    // Grant blue badge to user
    await client.query(
      `UPDATE users 
       SET has_blue_badge = TRUE, 
           blue_badge_granted_at = NOW(),
           verification_request_id = $1,
           is_verified = TRUE,
           verified_at = NOW()
       WHERE id = $2`,
      [id, request.user_id]
    );

    // Record platform earnings from verification fee
    await client.query(
      `INSERT INTO platform_earnings (source_type, source_id, amount, description)
       VALUES ('verification_fee', $1, $2, 'Seller verification fee')`,
      [id, VERIFICATION_FEE]
    );

    // Credit admin wallet with verification fee
    await addAdminWalletTransaction(
      'verification_fee',
      VERIFICATION_FEE,
      'Seller verification fee',
      'verification',
      id,
      request.user_id
    );

    await client.query('COMMIT');

    res.json({ 
      message: 'Verification approved! User has been granted the blue badge.',
      user_id: request.user_id,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error approving verification:', error);
    res.status(500).json({ error: 'Failed to approve verification' });
  } finally {
    client.release();
  }
});

// Reject verification request
router.post('/admin/requests/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  const client = await pool.connect();
  
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const { rejection_reason, admin_notes } = req.body;

    if (!rejection_reason) {
      return res.status(400).json({ error: 'Please provide a rejection reason' });
    }

    await client.query('BEGIN');

    // Get the request
    const requestResult = await client.query(
      `SELECT * FROM seller_verification_requests WHERE id = $1 FOR UPDATE`,
      [id]
    );

    if (requestResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Verification request not found' });
    }

    const request = requestResult.rows[0];

    if (request.status === 'approved') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Cannot reject an already approved request' });
    }

    // Update verification request
    await client.query(
      `UPDATE seller_verification_requests 
       SET status = 'rejected', 
           rejection_reason = $1,
           reviewed_by = $2, 
           reviewed_at = NOW(),
           admin_notes = $3,
           updated_at = NOW()
       WHERE id = $4`,
      [rejection_reason, adminId, admin_notes, id]
    );

    await client.query('COMMIT');

    res.json({ 
      message: 'Verification request rejected.',
      user_id: request.user_id,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error rejecting verification:', error);
    res.status(500).json({ error: 'Failed to reject verification' });
  } finally {
    client.release();
  }
});

export default router;
