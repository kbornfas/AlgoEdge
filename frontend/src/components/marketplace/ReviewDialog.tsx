'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Rating,
  Box,
  Typography,
  Stack,
  Alert,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon, Star } from '@mui/icons-material';

interface ReviewDialogProps {
  open: boolean;
  onClose: () => void;
  itemType: 'bot' | 'product' | 'signal';
  itemId: number;
  itemName: string;
  onSuccess?: () => void;
}

interface ReviewFormData {
  rating: number;
  title: string;
  review: string;
}

export default function ReviewDialog({
  open,
  onClose,
  itemType,
  itemId,
  itemName,
  onSuccess,
}: ReviewDialogProps) {
  const [formData, setFormData] = useState<ReviewFormData>({
    rating: 5,
    title: '',
    review: '',
  });
  const [loading, setLoading] = useState(false);
  const [checkLoading, setCheckLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const [existingReview, setExistingReview] = useState<any>(null);
  const [isEdit, setIsEdit] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    if (open) {
      checkReviewStatus();
    }
  }, [open, itemType, itemId]);

  const checkReviewStatus = async () => {
    try {
      setCheckLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to leave a review');
        return;
      }

      const response = await fetch(
        `${API_URL}/api/marketplace/reviews/${itemType}/${itemId}/check`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) throw new Error('Failed to check review status');

      const data = await response.json();
      setCanReview(data.canReview);
      setHasReviewed(data.hasReviewed);
      
      if (data.existingReview) {
        setExistingReview(data.existingReview);
        setIsEdit(true);
        setFormData({
          rating: data.existingReview.rating,
          title: data.existingReview.title || '',
          review: data.existingReview.review || '',
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCheckLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (formData.review.trim().length < 10) {
      setError('Review must be at least 10 characters long');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');

      const url = isEdit && existingReview
        ? `${API_URL}/api/marketplace/reviews/${itemType}/${existingReview.id}`
        : `${API_URL}/api/marketplace/reviews/${itemType}/${itemId}`;

      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit review');
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({ rating: 5, title: '', review: '' });
        onSuccess?.();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existingReview) return;
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${API_URL}/api/marketplace/reviews/${itemType}/${existingReview.id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error('Failed to delete review');

      onClose();
      onSuccess?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (checkLoading) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        </DialogContent>
      </Dialog>
    );
  }

  if (!canReview && !hasReviewed) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography>Leave a Review</Typography>
            <IconButton onClick={onClose}><CloseIcon /></IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info">
            You must purchase this item before you can leave a review.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">
            {isEdit ? 'Edit Your Review' : 'Leave a Review'}
          </Typography>
          <IconButton onClick={onClose}><CloseIcon /></IconButton>
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Review {isEdit ? 'updated' : 'submitted'} successfully!
          </Alert>
        )}

        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          {itemName}
        </Typography>

        <Box sx={{ mb: 3, mt: 2 }}>
          <Typography gutterBottom>Your Rating</Typography>
          <Rating
            value={formData.rating}
            onChange={(_, value) => setFormData(prev => ({ ...prev, rating: value || 5 }))}
            size="large"
            icon={<Star fontSize="inherit" color="primary" />}
            emptyIcon={<Star fontSize="inherit" />}
          />
        </Box>

        <TextField
          fullWidth
          label="Review Title (Optional)"
          value={formData.title}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          sx={{ mb: 2 }}
          placeholder="Summarize your experience"
        />

        <TextField
          fullWidth
          label="Your Review"
          value={formData.review}
          onChange={(e) => setFormData(prev => ({ ...prev, review: e.target.value }))}
          multiline
          rows={4}
          required
          placeholder="Share your experience with this product (minimum 10 characters)"
          helperText={`${formData.review.length}/10 minimum characters`}
          error={formData.review.length > 0 && formData.review.length < 10}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        {isEdit && existingReview && (
          <Button color="error" onClick={handleDelete} disabled={loading}>
            Delete
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading || formData.review.length < 10}
          startIcon={loading ? <CircularProgress size={16} /> : null}
        >
          {loading ? 'Submitting...' : isEdit ? 'Update Review' : 'Submit Review'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
