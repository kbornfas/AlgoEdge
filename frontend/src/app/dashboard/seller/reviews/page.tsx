'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Card,
  CardContent,
  Avatar,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Pagination,
  Stack,
  Grid,
  Rating,
  Tabs,
  Tab,
  Divider,
} from '@mui/material';
import {
  Star as StarIcon,
  Reply as ReplyIcon,
  Close as CloseIcon,
  CheckCircle as ApprovedIcon,
  Schedule as PendingIcon,
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';

interface Review {
  id: number;
  type: string;
  item_id: number;
  item_name: string;
  item_slug: string;
  rating: number;
  review_text: string;
  status: string;
  seller_reply: string | null;
  created_at: string;
  updated_at: string;
  reviewer_id: number;
  reviewer_name: string;
  reviewer_avatar: string | null;
}

interface ReviewStats {
  total: number;
  average_rating: string;
  product_reviews: number;
  bot_reviews: number;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function SellerReviewsPage() {
  const { token } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const limit = 10;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const fetchReviews = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const response = await fetch(
        `${API_URL}/api/seller/reviews?page=${page}&limit=${limit}&filter=${filter}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (!response.ok) throw new Error('Failed to fetch reviews');
      
      const data = await response.json();
      setReviews(data.reviews || []);
      setStats(data.stats || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token, page, filter, API_URL]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleReply = async () => {
    if (!selectedReview || !replyText.trim()) return;
    
    try {
      setSubmittingReply(true);
      const response = await fetch(`${API_URL}/api/seller/reviews/${selectedReview.id}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          reply: replyText,
          type: selectedReview.type,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to submit reply');
      
      setSuccess('Reply added successfully!');
      setSelectedReview(null);
      setReplyText('');
      fetchReviews();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingReply(false);
    }
  };

  if (loading && reviews.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={4}>
        <StarIcon sx={{ fontSize: 32, color: '#EAB308' }} />
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Reviews & Ratings
          </Typography>
          <Typography color="text.secondary">
            Manage reviews on your products and bots
          </Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" fontWeight="bold" color="primary">
                {stats?.total || 0}
              </Typography>
              <Typography color="text.secondary">Total Reviews</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Stack direction="row" alignItems="center" justifyContent="center" spacing={1}>
                <Typography variant="h3" fontWeight="bold" color="#EAB308">
                  {stats?.average_rating || '0.0'}
                </Typography>
                <StarIcon sx={{ color: '#EAB308', fontSize: 28 }} />
              </Stack>
              <Typography color="text.secondary">Average Rating</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" fontWeight="bold" color="success.main">
                {stats?.product_reviews || 0}
              </Typography>
              <Typography color="text.secondary">Product Reviews</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Typography variant="h3" fontWeight="bold" color="info.main">
                {stats?.bot_reviews || 0}
              </Typography>
              <Typography color="text.secondary">Bot Reviews</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={filter}
          onChange={(_, value) => { setFilter(value); setPage(1); }}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label="All Reviews" value="all" />
          <Tab label="Approved" value="approved" />
          <Tab label="Pending" value="pending" />
        </Tabs>
      </Paper>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <StarIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No reviews yet
          </Typography>
          <Typography color="text.secondary">
            Reviews from your customers will appear here.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={3}>
          {reviews.map((review) => (
            <Paper key={`${review.type}-${review.id}`} sx={{ p: 3 }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="flex-start">
                <Avatar src={review.reviewer_avatar || undefined} sx={{ width: 56, height: 56 }}>
                  {review.reviewer_name?.charAt(0) || 'U'}
                </Avatar>
                <Box flex={1}>
                  <Stack direction="row" alignItems="center" spacing={2} flexWrap="wrap" mb={1}>
                    <Typography fontWeight={600}>{review.reviewer_name}</Typography>
                    <Rating value={review.rating} readOnly size="small" />
                    <Chip 
                      label={review.type} 
                      size="small" 
                      color={review.type === 'product' ? 'warning' : 'info'}
                    />
                    <Chip 
                      icon={review.status === 'approved' ? <ApprovedIcon /> : <PendingIcon />}
                      label={review.status}
                      size="small"
                      color={review.status === 'approved' ? 'success' : 'default'}
                    />
                  </Stack>
                  
                  <Typography variant="body2" color="text.secondary" mb={1}>
                    Reviewed: <strong>{review.item_name}</strong> on {formatDate(review.created_at)}
                  </Typography>
                  
                  <Typography sx={{ mb: 2 }}>{review.review_text}</Typography>

                  {review.seller_reply && (
                    <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 2, mb: 2 }}>
                      <Typography variant="subtitle2" fontWeight={600} color="primary" gutterBottom>
                        Your Reply:
                      </Typography>
                      <Typography variant="body2">{review.seller_reply}</Typography>
                    </Box>
                  )}

                  {!review.seller_reply && (
                    <Button
                      startIcon={<ReplyIcon />}
                      variant="outlined"
                      size="small"
                      onClick={() => {
                        setSelectedReview(review);
                        setReplyText('');
                      }}
                    >
                      Reply
                    </Button>
                  )}
                </Box>
              </Stack>
            </Paper>
          ))}
        </Stack>
      )}

      {/* Pagination */}
      {stats && stats.total > limit && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={Math.ceil(stats.total / limit)}
            page={page}
            onChange={(_, value) => setPage(value)}
            color="primary"
          />
        </Box>
      )}

      {/* Reply Dialog */}
      <Dialog
        open={!!selectedReview}
        onClose={() => setSelectedReview(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="h6">Reply to Review</Typography>
            <IconButton onClick={() => setSelectedReview(null)}>
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent dividers>
          {selectedReview && (
            <>
              <Box sx={{ mb: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                  <Avatar src={selectedReview.reviewer_avatar || undefined} sx={{ width: 32, height: 32 }}>
                    {selectedReview.reviewer_name?.charAt(0)}
                  </Avatar>
                  <Typography fontWeight={600}>{selectedReview.reviewer_name}</Typography>
                  <Rating value={selectedReview.rating} readOnly size="small" />
                </Stack>
                <Typography variant="body2" color="text.secondary" mb={1}>
                  On: {selectedReview.item_name}
                </Typography>
                <Typography>{selectedReview.review_text}</Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <TextField
                label="Your Reply"
                multiline
                rows={4}
                fullWidth
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Write a professional response to this review..."
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelectedReview(null)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleReply}
            disabled={!replyText.trim() || submittingReply}
            startIcon={submittingReply ? <CircularProgress size={16} /> : <ReplyIcon />}
          >
            {submittingReply ? 'Submitting...' : 'Submit Reply'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
