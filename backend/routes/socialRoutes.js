import express from 'express';
import pool from '../config/database.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get social feed (posts from followed users + own posts)
router.get('/', authenticate, async (req, res) => {
  try {
    const { limit = 50, offset = 0, filter = 'following' } = req.query;

    let query;
    let params;

    if (filter === 'following') {
      // Posts from users the current user follows + own posts
      query = `
        SELECT sp.*, 
               u.username, u.profile_photo_url,
               EXISTS(SELECT 1 FROM social_post_likes WHERE post_id = sp.id AND user_id = $1) as user_liked
        FROM social_posts sp
        JOIN users u ON sp.user_id = u.id
        WHERE (sp.user_id IN (SELECT following_id FROM user_follows WHERE follower_id = $1)
               OR sp.user_id = $1)
          AND (sp.visibility = 'public' OR sp.visibility = 'followers')
        ORDER BY sp.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      params = [req.user.userId, limit, offset];
    } else {
      // Public posts from everyone
      query = `
        SELECT sp.*, 
               u.username, u.profile_photo_url,
               EXISTS(SELECT 1 FROM social_post_likes WHERE post_id = sp.id AND user_id = $1) as user_liked
        FROM social_posts sp
        JOIN users u ON sp.user_id = u.id
        WHERE sp.visibility = 'public'
        ORDER BY sp.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      params = [req.user.userId, limit, offset];
    }

    const result = await pool.query(query, params);

    res.json({ posts: result.rows });
  } catch (error) {
    console.error('Error fetching feed:', error);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

// Create a post
router.post('/', authenticate, async (req, res) => {
  try {
    const { post_type, content, media_url, visibility = 'followers', trade_id } = req.body;

    if (!content || !post_type) {
      return res.status(400).json({ error: 'Content and post type required' });
    }

    const result = await pool.query(
      `INSERT INTO social_posts (user_id, post_type, content, media_url, visibility, trade_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [req.user.userId, post_type, content, media_url, visibility, trade_id]
    );

    res.json({ post: result.rows[0] });
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Get single post with comments
router.get('/:postId', authenticate, async (req, res) => {
  try {
    const { postId } = req.params;

    const postResult = await pool.query(
      `SELECT sp.*, 
              u.username, u.profile_photo_url,
              EXISTS(SELECT 1 FROM social_post_likes WHERE post_id = sp.id AND user_id = $1) as user_liked
       FROM social_posts sp
       JOIN users u ON sp.user_id = u.id
       WHERE sp.id = $2`,
      [req.user.userId, postId]
    );

    if (postResult.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const commentsResult = await pool.query(
      `SELECT spc.*, u.username, u.profile_photo_url
       FROM social_post_comments spc
       JOIN users u ON spc.user_id = u.id
       WHERE spc.post_id = $1
       ORDER BY spc.created_at ASC`,
      [postId]
    );

    res.json({
      post: postResult.rows[0],
      comments: commentsResult.rows
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Like/unlike a post
router.post('/:postId/like', authenticate, async (req, res) => {
  try {
    const { postId } = req.params;

    // Check if already liked
    const existing = await pool.query(
      'SELECT id FROM social_post_likes WHERE post_id = $1 AND user_id = $2',
      [postId, req.user.userId]
    );

    if (existing.rows.length > 0) {
      // Unlike
      await pool.query(
        'DELETE FROM social_post_likes WHERE post_id = $1 AND user_id = $2',
        [postId, req.user.userId]
      );
      res.json({ liked: false });
    } else {
      // Like
      await pool.query(
        'INSERT INTO social_post_likes (post_id, user_id) VALUES ($1, $2)',
        [postId, req.user.userId]
      );
      res.json({ liked: true });
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

// Add comment to post
router.post('/:postId/comment', authenticate, async (req, res) => {
  try {
    const { postId } = req.params;
    const { comment_text } = req.body;

    if (!comment_text) {
      return res.status(400).json({ error: 'Comment text required' });
    }

    const result = await pool.query(
      `INSERT INTO social_post_comments (post_id, user_id, comment_text)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [postId, req.user.userId, comment_text]
    );

    res.json({ comment: result.rows[0] });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// Delete own post
router.delete('/:postId', authenticate, async (req, res) => {
  try {
    const { postId } = req.params;

    const result = await pool.query(
      'DELETE FROM social_posts WHERE id = $1 AND user_id = $2 RETURNING *',
      [postId, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found or unauthorized' });
    }

    res.json({ message: 'Post deleted' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// Delete own comment
router.delete('/:postId/comment/:commentId', authenticate, async (req, res) => {
  try {
    const { commentId } = req.params;

    const result = await pool.query(
      'DELETE FROM social_post_comments WHERE id = $1 AND user_id = $2 RETURNING *',
      [commentId, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Comment not found or unauthorized' });
    }

    res.json({ message: 'Comment deleted' });
  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// Get user's posts
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT sp.*, u.username, u.profile_photo_url
       FROM social_posts sp
       JOIN users u ON sp.user_id = u.id
       WHERE sp.user_id = $1 AND sp.visibility != 'private'
       ORDER BY sp.created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    res.json({ posts: result.rows });
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ error: 'Failed to fetch user posts' });
  }
});

export default router;
