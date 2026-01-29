import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get reviews for a seller
router.get('/seller/:sellerId', async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { limit = 20, offset = 0, sort = 'recent' } = req.query;

    const sortOptions = {
      recent: 'sr.created_at DESC',
      helpful: 'sr.helpful_count DESC, sr.created_at DESC',
      rating_high: 'sr.rating DESC, sr.created_at DESC',
      rating_low: 'sr.rating ASC, sr.created_at DESC',
    };

    const orderBy = sortOptions[sort] || sortOptions.recent;

    const reviews = await pool.query(
      `SELECT sr.*, u.username, u.profile_photo_url,
              mp.name as product_name
       FROM seller_reviews sr
       JOIN users u ON sr.reviewer_id = u.id
       LEFT JOIN marketplace_products mp ON sr.product_id = mp.id
       WHERE sr.seller_id = $1
       ORDER BY ${orderBy}
       LIMIT $2 OFFSET $3`,
      [sellerId, limit, offset]
    );

    const summary = await pool.query(
      'SELECT * FROM seller_review_summary WHERE seller_id = $1',
      [sellerId]
    );

    res.json({
      reviews: reviews.rows,
      summary: summary.rows[0] || { total_reviews: 0, avg_rating: 0 },
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
});

// Submit a review
router.post('/', authenticate, async (req, res) => {
  try {
    const { seller_id, product_id, rating, title, review_text } = req.body;

    if (!seller_id || !rating || !review_text) {
      return res.status(400).json({ error: 'Seller, rating, and review text required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    // Check if user purchased from seller
    const purchase = await pool.query(
      `SELECT od.id FROM order_details od
       JOIN marketplace_products mp ON od.product_id = mp.id
       WHERE od.user_id = $1 AND mp.seller_id = $2 AND od.status = 'completed'
       LIMIT 1`,
      [req.user.userId, seller_id]
    );

    const verified_purchase = purchase.rows.length > 0;

    const result = await pool.query(
      `INSERT INTO seller_reviews 
       (seller_id, reviewer_id, product_id, rating, title, review_text, verified_purchase)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (seller_id, reviewer_id, product_id) 
       DO UPDATE SET rating = $4, title = $5, review_text = $6, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [seller_id, req.user.userId, product_id, rating, title, review_text, verified_purchase]
    );

    res.json({ review: result.rows[0] });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// Mark review as helpful
router.post('/:id/helpful', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Toggle helpful
    const existing = await pool.query(
      'SELECT id FROM review_helpfulness WHERE review_id = $1 AND user_id = $2',
      [id, req.user.userId]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        'DELETE FROM review_helpfulness WHERE review_id = $1 AND user_id = $2',
        [id, req.user.userId]
      );
      res.json({ marked_helpful: false });
    } else {
      await pool.query(
        'INSERT INTO review_helpfulness (review_id, user_id) VALUES ($1, $2)',
        [id, req.user.userId]
      );
      res.json({ marked_helpful: true });
    }
  } catch (error) {
    console.error('Error toggling helpful:', error);
    res.status(500).json({ error: 'Failed to toggle helpful' });
  }
});

// Delete own review
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM seller_reviews WHERE id = $1 AND reviewer_id = $2 RETURNING *',
      [id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Review not found or unauthorized' });
    }

    res.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
});

export default router;
