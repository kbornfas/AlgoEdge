import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get all KB categories
router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM kb_categories ORDER BY display_order ASC, name ASC`
    );

    res.json({ categories: result.rows });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Get articles by category
router.get('/category/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { limit = 50 } = req.query;

    const result = await pool.query(
      `SELECT a.*, c.name as category_name, u.username as author_name
       FROM kb_articles a
       JOIN kb_categories c ON a.category_id = c.id
       LEFT JOIN users u ON a.author_id = u.id
       WHERE c.slug = $1 AND a.is_published = true
       ORDER BY a.featured DESC, a.published_at DESC
       LIMIT $2`,
      [slug, limit]
    );

    res.json({ articles: result.rows });
  } catch (error) {
    console.error('Error fetching articles:', error);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// Get single article by slug
router.get('/article/:slug', async (req, res) => {
  try {
    const { slug } = req.params;

    const result = await pool.query(
      `SELECT a.*, c.name as category_name, c.slug as category_slug, u.username as author_name
       FROM kb_articles a
       JOIN kb_categories c ON a.category_id = c.id
       LEFT JOIN users u ON a.author_id = u.id
       WHERE a.slug = $1 AND a.is_published = true`,
      [slug]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Increment view count
    await pool.query(
      'UPDATE kb_articles SET view_count = view_count + 1 WHERE id = $1',
      [result.rows[0].id]
    );

    res.json({ article: result.rows[0] });
  } catch (error) {
    console.error('Error fetching article:', error);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

// Search articles
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const result = await pool.query(
      `SELECT a.*, c.name as category_name,
              ts_rank(to_tsvector('english', a.title || ' ' || a.content), plainto_tsquery('english', $1)) as rank
       FROM kb_articles a
       JOIN kb_categories c ON a.category_id = c.id
       WHERE a.is_published = true
         AND to_tsvector('english', a.title || ' ' || a.content) @@ plainto_tsquery('english', $1)
       ORDER BY rank DESC
       LIMIT $2`,
      [q, limit]
    );

    res.json({ articles: result.rows });
  } catch (error) {
    console.error('Error searching articles:', error);
    res.status(500).json({ error: 'Failed to search articles' });
  }
});

// Get featured articles
router.get('/featured', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, c.name as category_name
       FROM kb_articles a
       JOIN kb_categories c ON a.category_id = c.id
       WHERE a.is_published = true AND a.featured = true
       ORDER BY a.published_at DESC
       LIMIT 5`
    );

    res.json({ articles: result.rows });
  } catch (error) {
    console.error('Error fetching featured articles:', error);
    res.status(500).json({ error: 'Failed to fetch featured articles' });
  }
});

// Mark article as helpful/not helpful
router.post('/article/:id/helpful', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_helpful } = req.body;

    if (typeof is_helpful !== 'boolean') {
      return res.status(400).json({ error: 'is_helpful must be boolean' });
    }

    const result = await pool.query(
      `INSERT INTO kb_article_helpful (article_id, user_id, is_helpful)
       VALUES ($1, $2, $3)
       ON CONFLICT (article_id, user_id) 
       DO UPDATE SET is_helpful = $3
       RETURNING *`,
      [id, req.user.userId, is_helpful]
    );

    res.json({ helpful: result.rows[0] });
  } catch (error) {
    console.error('Error marking article helpful:', error);
    res.status(500).json({ error: 'Failed to mark article helpful' });
  }
});

// Get popular articles
router.get('/popular', async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const result = await pool.query(
      `SELECT a.*, c.name as category_name
       FROM kb_articles a
       JOIN kb_categories c ON a.category_id = c.id
       WHERE a.is_published = true
       ORDER BY a.view_count DESC, a.helpful_count DESC
       LIMIT $1`,
      [limit]
    );

    res.json({ articles: result.rows });
  } catch (error) {
    console.error('Error fetching popular articles:', error);
    res.status(500).json({ error: 'Failed to fetch popular articles' });
  }
});

export default router;
