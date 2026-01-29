'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  TextField,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  CircularProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from '@mui/material';
import {
  MessageSquare,
  Plus,
  ThumbsUp,
  Bug,
  Lightbulb,
  TrendingUp,
  HelpCircle,
  Clock,
  CheckCircle,
} from 'lucide-react';

interface Feedback {
  id: number;
  type: string;
  category: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  votes: number;
  vote_count: number;
  comment_count: number;
  user_voted: boolean;
  username: string;
  created_at: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  bug: { icon: <Bug size={18} />, color: '#EF4444', label: 'Bug Report' },
  feature: { icon: <Lightbulb size={18} />, color: '#8B5CF6', label: 'Feature Request' },
  improvement: { icon: <TrendingUp size={18} />, color: '#3B82F6', label: 'Improvement' },
  question: { icon: <HelpCircle size={18} />, color: '#10B981', label: 'Question' },
};

const STATUS_COLORS: Record<string, string> = {
  pending: '#6B7280',
  reviewing: '#3B82F6',
  planned: '#8B5CF6',
  in_progress: '#F59E0B',
  completed: '#22C55E',
  declined: '#EF4444',
};

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  
  // Form state
  const [type, setType] = useState('feature');
  const [category, setCategory] = useState('trading');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetchFeedback();
  }, [activeTab]);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = activeTab === 1 ? '?my=true' : '';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/feedback${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFeedback(data.feedback || []);
      }
    } catch (error) {
      console.error('Failed to fetch feedback:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/feedback`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          category,
          title,
          description,
          browser_info: navigator.userAgent,
        }),
      });
      
      if (res.ok) {
        setDialogOpen(false);
        setTitle('');
        setDescription('');
        fetchFeedback();
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  };

  const handleVote = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/feedback/${id}/vote`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchFeedback();
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', py: { xs: 2, md: 4 }, px: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box sx={{ p: 1.5, bgcolor: 'rgba(139, 92, 246, 0.2)', borderRadius: 2 }}>
              <MessageSquare size={24} color="#8B5CF6" />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                Feedback & Suggestions
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
                Help us improve AlgoEdge
              </Typography>
            </Box>
          </Stack>
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => setDialogOpen(true)}
            sx={{ bgcolor: '#8B5CF6', '&:hover': { bgcolor: '#7C3AED' } }}
          >
            Submit Feedback
          </Button>
        </Stack>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{
            mb: 3,
            '& .MuiTab-root': { color: 'rgba(255,255,255,0.5)', textTransform: 'none' },
            '& .Mui-selected': { color: '#8B5CF6' },
            '& .MuiTabs-indicator': { bgcolor: '#8B5CF6' },
          }}
        >
          <Tab label="All Feedback" />
          <Tab label="My Submissions" />
        </Tabs>

        {/* Feedback List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#8B5CF6' }} />
          </Box>
        ) : feedback.length === 0 ? (
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <MessageSquare size={56} color="rgba(255,255,255,0.15)" />
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', mt: 2 }}>
                {activeTab === 1 ? 'You haven\'t submitted any feedback yet' : 'No feedback yet'}
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={2}>
            {feedback.map((item) => {
              const config = TYPE_CONFIG[item.type] || TYPE_CONFIG.feature;
              
              return (
                <Card
                  key={item.id}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                  }}
                >
                  <CardContent>
                    <Stack direction="row" spacing={2}>
                      {/* Vote Button */}
                      <Stack alignItems="center" spacing={0.5} sx={{ minWidth: 50 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleVote(item.id)}
                          sx={{
                            bgcolor: item.user_voted ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.05)',
                            color: item.user_voted ? '#8B5CF6' : 'rgba(255,255,255,0.5)',
                            '&:hover': { bgcolor: 'rgba(139, 92, 246, 0.3)' },
                          }}
                        >
                          <ThumbsUp size={16} />
                        </IconButton>
                        <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>
                          {item.vote_count || 0}
                        </Typography>
                      </Stack>

                      {/* Content */}
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <Chip
                            label={config.label}
                            size="small"
                            sx={{
                              bgcolor: `${config.color}20`,
                              color: config.color,
                              fontSize: '0.7rem',
                            }}
                          />
                          <Chip
                            label={item.status.replace('_', ' ')}
                            size="small"
                            sx={{
                              bgcolor: `${STATUS_COLORS[item.status]}20`,
                              color: STATUS_COLORS[item.status],
                              fontSize: '0.7rem',
                              textTransform: 'capitalize',
                            }}
                          />
                          {item.status === 'completed' && (
                            <CheckCircle size={14} color="#22C55E" />
                          )}
                        </Stack>

                        <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '1.05rem', mb: 0.5 }}>
                          {item.title}
                        </Typography>

                        <Typography
                          sx={{
                            color: 'rgba(255,255,255,0.7)',
                            fontSize: '0.9rem',
                            mb: 1,
                            lineHeight: 1.5,
                          }}
                        >
                          {item.description.length > 200
                            ? `${item.description.substring(0, 200)}...`
                            : item.description}
                        </Typography>

                        <Stack direction="row" spacing={2} alignItems="center">
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Clock size={12} color="rgba(255,255,255,0.4)" />
                            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                              {formatDate(item.created_at)}
                            </Typography>
                          </Stack>
                          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                            by {item.username}
                          </Typography>
                          {item.comment_count > 0 && (
                            <Chip
                              label={`${item.comment_count} comments`}
                              size="small"
                              sx={{
                                bgcolor: 'rgba(255,255,255,0.05)',
                                color: 'rgba(255,255,255,0.5)',
                                fontSize: '0.7rem',
                              }}
                            />
                          )}
                        </Stack>
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        )}
      </Box>

      {/* Submit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        PaperProps={{ sx: { bgcolor: '#1A1F2E', minWidth: 500 } }}
      >
        <DialogTitle sx={{ color: 'white' }}>Submit Feedback</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: 'rgba(255,255,255,0.5)' }}>Type</InputLabel>
              <Select
                value={type}
                onChange={(e) => setType(e.target.value)}
                label="Type"
                sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}
              >
                <MenuItem value="bug">Bug Report</MenuItem>
                <MenuItem value="feature">Feature Request</MenuItem>
                <MenuItem value="improvement">Improvement</MenuItem>
                <MenuItem value="question">Question</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel sx={{ color: 'rgba(255,255,255,0.5)' }}>Category</InputLabel>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                label="Category"
                sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}
              >
                <MenuItem value="trading">Trading</MenuItem>
                <MenuItem value="ui">User Interface</MenuItem>
                <MenuItem value="performance">Performance</MenuItem>
                <MenuItem value="account">Account</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              sx={{
                '& .MuiInputBase-root': { color: 'white' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
              }}
            />

            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              multiline
              rows={4}
              sx={{
                '& .MuiInputBase-root': { color: 'white' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!title.trim() || !description.trim()}
            sx={{ bgcolor: '#8B5CF6', '&:hover': { bgcolor: '#7C3AED' } }}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
