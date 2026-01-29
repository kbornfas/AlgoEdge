import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get user's wishlist
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT w.id, w.created_at,
              mp.id as product_id, mp.name, mp.description, mp.price, 
              mp.image_url, mp.category, mp.seller_id,
              u.username as seller_username,
              wpa.target_price, wpa.notified as price_alert_active
       FROM wishlist w
       JOIN marketplace_products mp ON w.product_id = mp.id
       JOIN users u ON mp.seller_id = u.id
       LEFT JOIN wishlist_price_alerts wpa ON w.product_id = wpa.product_id AND w.user_id = wpa.user_id
       WHERE w.user_id = $1
       ORDER BY w.created_at DESC`,
      [req.user.userId]
    );

    res.json({ items: result.rows });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ error: 'Failed to fetch wishlist' });
  }
});

// Add product to wishlist
router.post('/', authenticate, async (req, res) => {
  try {
    const { product_id } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: 'Product ID required' });
    }

    // Check if product exists
    const productCheck = await pool.query(
      'SELECT id FROM marketplace_products WHERE id = $1',
      [product_id]
    );

    if (productCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const result = await pool.query(
      `INSERT INTO wishlist (user_id, product_id) 
       VALUES ($1, $2) 
       ON CONFLICT (user_id, product_id) DO NOTHING
       RETURNING *`,
      [req.user.userId, product_id]
    );

    res.json({ item: result.rows[0] || { message: 'Already in wishlist' } });
  } catch (error) {
    console.error('Error adding to wishlist:', error);
    res.status(500).json({ error: 'Failed to add to wishlist' });
  }
});

// Remove product from wishlist
router.delete('/:productId', authenticate, async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await pool.query(
      'DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2 RETURNING *',
      [req.user.userId, productId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not in wishlist' });
    }

    res.json({ message: 'Removed from wishlist' });
  } catch (error) {
    console.error('Error removing from wishlist:', error);
    res.status(500).json({ error: 'Failed to remove from wishlist' });
  }
});

// Set price alert for wishlist item
router.post('/price-alert', authenticate, async (req, res) => {
  try {
    const { product_id, target_price } = req.body;

    if (!product_id || !target_price) {
      return res.status(400).json({ error: 'Product ID and target price required' });
    }

    // Get current product price
    const product = await pool.query(
      'SELECT price FROM marketplace_products WHERE id = $1',
      [product_id]
    );

    if (product.rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const result = await pool.query(
      `INSERT INTO wishlist_price_alerts (user_id, product_id, target_price, current_price)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, product_id) 
       DO UPDATE SET target_price = $3, current_price = $4, notified = false
       RETURNING *`,
      [req.user.userId, product_id, target_price, product.rows[0].price]
    );

    res.json({ alert: result.rows[0] });
  } catch (error) {
    console.error('Error setting price alert:', error);
    res.status(500).json({ error: 'Failed to set price alert' });
  }
});

// Delete price alert
router.delete('/price-alert/:productId', authenticate, async (req, res) => {
  try {
    const { productId } = req.params;

    await pool.query(
      'DELETE FROM wishlist_price_alerts WHERE user_id = $1 AND product_id = $2',
      [req.user.userId, productId]
    );

    res.json({ message: 'Price alert removed' });
  } catch (error) {
    console.error('Error removing price alert:', error);
    res.status(500).json({ error: 'Failed to remove price alert' });
  }
});

// Check if product is in wishlist
router.get('/check/:productId', authenticate, async (req, res) => {
  try {
    const { productId } = req.params;

    const result = await pool.query(
      'SELECT id FROM wishlist WHERE user_id = $1 AND product_id = $2',
      [req.user.userId, productId]
    );

    res.json({ in_wishlist: result.rows.length > 0 });
  } catch (error) {
    console.error('Error checking wishlist:', error);
    res.status(500).json({ error: 'Failed to check wishlist' });
  }
});

export default router;
