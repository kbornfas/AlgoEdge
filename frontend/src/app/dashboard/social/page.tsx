'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Avatar,
  IconButton,
  TextField,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { MessageSquare, Heart, Send, TrendingUp, Users, Image as ImageIcon } from 'lucide-react';

interface SocialPost {
  id: number;
  user_id: number;
  username: string;
  content: string;
  media_url: string | null;
  visibility: string;
  like_count: number;
  comment_count: number;
  user_liked: boolean;
  created_at: string;
  related_trade_id: number | null;
}

interface Comment {
  id: number;
  user_id: number;
  username: string;
  content: string;
  created_at: string;
}

export default function SocialFeedPage() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [feedFilter, setFeedFilter] = useState('public');
  const [createDialog, setCreateDialog] = useState(false);
  const [newPost, setNewPost] = useState({ content: '', visibility: 'public' });
  const [commentsDialog, setCommentsDialog] = useState<{ open: boolean; postId: number | null; comments: Comment[] }>({
    open: false,
    postId: null,
    comments: [],
  });
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    fetchFeed();
  }, [feedFilter]);

  const fetchFeed = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/social?filter=${feedFilter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Failed to fetch feed:', error);
    }
  };

  const createPost = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/social`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPost),
      });
      setCreateDialog(false);
      setNewPost({ content: '', visibility: 'public' });
      fetchFeed();
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  const toggleLike = async (postId: number) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/social/${postId}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchFeed();
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const openComments = async (postId: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/social/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCommentsDialog({ open: true, postId, comments: data.post.comments || [] });
      }
    } catch (error) {
      console.error('Failed to fetch comments:', error);
    }
  };

  const postComment = async () => {
    if (!commentText.trim() || !commentsDialog.postId) return;

    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/social/${commentsDialog.postId}/comment`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: commentText }),
      });
      setCommentText('');
      openComments(commentsDialog.postId);
      fetchFeed();
    } catch (error) {
      console.error('Failed to post comment:', error);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'Just now';
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', py: { xs: 2, md: 4 }, px: { xs: 1.5, sm: 2, md: 4 }, overflowX: 'hidden', width: '100%', maxWidth: '100vw' }}>
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        {/* Header */}
        <Stack spacing={{ xs: 2, md: 0 }} sx={{ mb: { xs: 2, md: 3 } }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Stack direction="row" alignItems="center" spacing={{ xs: 1.5, md: 2 }}>
              <Box sx={{ p: { xs: 1, md: 1.5 }, bgcolor: 'rgba(236, 72, 153, 0.2)', borderRadius: 2 }}>
                <Users size={20} color="#EC4899" />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
                  Social Feed
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: { xs: '0.8rem', md: '0.875rem' }, display: { xs: 'none', sm: 'block' } }}>
                  Connect with traders worldwide
                </Typography>
              </Box>
            </Stack>

            <Button
              variant="contained"
              onClick={() => setCreateDialog(true)}
              sx={{ bgcolor: '#EC4899', display: { xs: 'none', sm: 'flex' } }}
              startIcon={<Send size={18} />}
            >
              Create Post
            </Button>
          </Stack>
          
          <Button
            variant="contained"
            fullWidth
            onClick={() => setCreateDialog(true)}
            sx={{ bgcolor: '#EC4899', display: { xs: 'flex', sm: 'none' }, py: 1.5 }}
            startIcon={<Send size={18} />}
          >
            Create Post
          </Button>
        </Stack>

        {/* Feed Filter */}
        <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
          <Chip
            label="Following"
            icon={<Users size={14} />}
            onClick={() => setFeedFilter('following')}
            sx={{
              bgcolor: feedFilter === 'following' ? '#EC4899' : 'rgba(255,255,255,0.05)',
              color: 'white',
              fontWeight: 600,
            }}
          />
          <Chip
            label="Public"
            icon={<TrendingUp size={14} />}
            onClick={() => setFeedFilter('public')}
            sx={{
              bgcolor: feedFilter === 'public' ? '#EC4899' : 'rgba(255,255,255,0.05)',
              color: 'white',
              fontWeight: 600,
            }}
          />
        </Stack>

        {/* Posts */}
        <Stack spacing={2}>
          {posts.map((post) => (
            <Card key={post.id} sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <CardContent>
                {/* Post Header */}
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Avatar sx={{ bgcolor: '#EC4899' }}>{post.username[0]?.toUpperCase()}</Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ color: 'white', fontWeight: 600 }}>
                      {post.username}
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                      {formatTime(post.created_at)}
                    </Typography>
                  </Box>
                  <Chip
                    label={post.visibility}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.05)',
                      color: 'rgba(255,255,255,0.7)',
                      fontSize: '0.7rem',
                    }}
                  />
                </Stack>

                {/* Post Content */}
                <Typography sx={{ color: 'rgba(255,255,255,0.9)', mb: 2, lineHeight: 1.6 }}>
                  {post.content}
                </Typography>

                {/* Post Media */}
                {post.media_url && (
                  <Box
                    sx={{
                      width: '100%',
                      height: 300,
                      bgcolor: 'rgba(255,255,255,0.05)',
                      borderRadius: 2,
                      mb: 2,
                      backgroundImage: `url(${post.media_url})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  />
                )}

                {/* Post Actions */}
                <Stack direction="row" spacing={{ xs: 1.5, md: 2 }} alignItems="center">
                  <IconButton
                    onClick={() => toggleLike(post.id)}
                    sx={{
                      color: post.user_liked ? '#EF4444' : 'rgba(255,255,255,0.5)',
                      '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' },
                    }}
                  >
                    <Heart size={20} fill={post.user_liked ? '#EF4444' : 'none'} />
                  </IconButton>
                  <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                    {post.like_count}
                  </Typography>

                  <IconButton
                    onClick={() => openComments(post.id)}
                    sx={{
                      color: 'rgba(255,255,255,0.5)',
                      '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.1)' },
                    }}
                  >
                    <MessageSquare size={20} />
                  </IconButton>
                  <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                    {post.comment_count}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>

        {posts.length === 0 && (
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <Users size={56} color="rgba(255,255,255,0.15)" />
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', mt: 2, mb: 2 }}>
                No posts yet
              </Typography>
              <Button variant="contained" onClick={() => setCreateDialog(true)} sx={{ bgcolor: '#EC4899' }}>
                Create First Post
              </Button>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Create Post Dialog */}
      <Dialog open={createDialog} onClose={() => setCreateDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { bgcolor: '#1A1F2E' } }}>
        <DialogTitle sx={{ color: 'white' }}>Create Post</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder="What's on your mind?"
            value={newPost.content}
            onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
            sx={{
              mb: 2,
              '& .MuiInputBase-root': { color: 'white' },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
            }}
          />
          <FormControl fullWidth>
            <InputLabel sx={{ color: 'rgba(255,255,255,0.5)' }}>Visibility</InputLabel>
            <Select
              value={newPost.visibility}
              onChange={(e) => setNewPost({ ...newPost, visibility: e.target.value })}
              label="Visibility"
              sx={{
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
              }}
            >
              <MenuItem value="public">Public</MenuItem>
              <MenuItem value="followers">Followers Only</MenuItem>
              <MenuItem value="private">Private</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialog(false)} sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Cancel
          </Button>
          <Button onClick={createPost} variant="contained" sx={{ bgcolor: '#EC4899' }}>
            Post
          </Button>
        </DialogActions>
      </Dialog>

      {/* Comments Dialog */}
      <Dialog
        open={commentsDialog.open}
        onClose={() => setCommentsDialog({ open: false, postId: null, comments: [] })}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#1A1F2E' } }}
      >
        <DialogTitle sx={{ color: 'white' }}>Comments</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mb: 2 }}>
            {commentsDialog.comments.map((comment) => (
              <Box key={comment.id} sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                <Stack direction="row" spacing={1.5} alignItems="start">
                  <Avatar sx={{ bgcolor: '#3B82F6', width: 32, height: 32 }}>
                    {comment.username[0]?.toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>
                        {comment.username}
                      </Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                        {formatTime(comment.created_at)}
                      </Typography>
                    </Stack>
                    <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem', mt: 0.5 }}>
                      {comment.content}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            ))}
          </Stack>

          <Stack direction="row" spacing={1}>
            <TextField
              fullWidth
              placeholder="Write a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && postComment()}
              sx={{
                '& .MuiInputBase-root': { color: 'white' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
              }}
            />
            <Button onClick={postComment} variant="contained" sx={{ bgcolor: '#3B82F6' }}>
              <Send size={18} />
            </Button>
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
