import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// Get all glossary terms with optional search and category filter
router.get('/', async (req, res) => {
  try {
    const { search, category, limit = 100 } = req.query;

    let query = 'SELECT * FROM trading_glossary WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (search) {
      query += ` AND (term ILIKE $${paramIndex} OR definition ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    query += ` ORDER BY term ASC LIMIT $${paramIndex}`;
    params.push(Math.min(parseInt(limit) || 100, 500));

    const result = await pool.query(query, params);

    res.json({ terms: result.rows });
  } catch (error) {
    console.error('Error fetching glossary:', error);
    res.status(500).json({ error: 'Failed to fetch glossary' });
  }
});

// Get single term by ID or slug
router.get('/:identifier', async (req, res) => {
  try {
    const { identifier } = req.params;
    
    // Try to parse as number for ID, otherwise treat as term name
    const isNumeric = !isNaN(identifier);
    
    const result = await pool.query(
      isNumeric 
        ? 'SELECT * FROM trading_glossary WHERE id = $1'
        : 'SELECT * FROM trading_glossary WHERE term ILIKE $1',
      [isNumeric ? parseInt(identifier) : identifier]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Term not found' });
    }

    // Increment view count
    await pool.query(
      'UPDATE trading_glossary SET view_count = view_count + 1 WHERE id = $1',
      [result.rows[0].id]
    );

    res.json({ term: result.rows[0] });
  } catch (error) {
    console.error('Error fetching term:', error);
    res.status(500).json({ error: 'Failed to fetch term' });
  }
});

// Get all categories
router.get('/meta/categories', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT category, COUNT(*) as count 
       FROM trading_glossary 
       WHERE category IS NOT NULL 
       GROUP BY category 
       ORDER BY category ASC`
    );

    res.json({ categories: result.rows });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// Search glossary with full-text search
router.get('/search/full-text', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Search query required' });
    }

    const result = await pool.query(
      `SELECT *, 
              ts_rank(to_tsvector('english', term || ' ' || definition), plainto_tsquery('english', $1)) as rank
       FROM trading_glossary
       WHERE to_tsvector('english', term || ' ' || definition) @@ plainto_tsquery('english', $1)
       ORDER BY rank DESC
       LIMIT 20`,
      [q]
    );

    res.json({ terms: result.rows });
  } catch (error) {
    console.error('Error searching glossary:', error);
    res.status(500).json({ error: 'Failed to search glossary' });
  }
});

export default router;
