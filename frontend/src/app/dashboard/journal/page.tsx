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
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Rating,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from '@mui/material';
import { BookOpen, Edit, Save, Plus, X, TrendingUp, TrendingDown, Tag } from 'lucide-react';

interface Trade {
  id: number;
  symbol: string;
  trade_type: string;
  entry_price: number;
  exit_price: number;
  profit_loss: number;
  notes: string | null;
  tags: string | null;
  setup_rating: number | null;
  emotion: string | null;
  opened_at: string;
  closed_at: string | null;
}

const EMOTIONS = ['calm', 'confident', 'fearful', 'greedy', 'revenge', 'rushed'];
const EMOTION_COLORS: Record<string, string> = {
  calm: '#22C55E',
  confident: '#3B82F6',
  fearful: '#EF4444',
  greedy: '#F59E0B',
  revenge: '#EC4899',
  rushed: '#F97316',
};

export default function TradingJournalPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Form state
  const [notes, setNotes] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [rating, setRating] = useState<number | null>(null);
  const [emotion, setEmotion] = useState('');
  const [newTag, setNewTag] = useState('');

  useEffect(() => {
    fetchTrades();
    fetchTags();
  }, []);

  const fetchTrades = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/journal/journal`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTrades(data.trades || []);
      }
    } catch (error) {
      console.error('Failed to fetch trades:', error);
    }
  };

  const fetchTags = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/journal/tags`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTags(data.tags?.map((t: any) => t.name) || []);
      }
    } catch (error) {
      console.error('Failed to fetch tags:', error);
    }
  };

  const openEdit = (trade: Trade) => {
    setEditingTrade(trade);
    setNotes(trade.notes || '');
    setSelectedTags(trade.tags ? trade.tags.split(',').map(t => t.trim()) : []);
    setRating(trade.setup_rating);
    setEmotion(trade.emotion || '');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingTrade) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/journal/${editingTrade.id}/journal`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notes,
          tags: selectedTags.join(', '),
          setup_rating: rating,
          emotion,
        }),
      });
      setDialogOpen(false);
      fetchTrades();
    } catch (error) {
      console.error('Failed to save:', error);
    }
  };

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const createTag = async () => {
    if (!newTag.trim() || tags.includes(newTag)) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/journal/tags`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newTag }),
      });
      setTags([...tags, newTag]);
      addTag(newTag);
      setNewTag('');
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', py: { xs: 2, md: 4 }, px: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Box sx={{ p: 1.5, bgcolor: 'rgba(59, 130, 246, 0.2)', borderRadius: 2 }}>
            <BookOpen size={24} color="#3B82F6" />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
              Trading Journal
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
              Add notes, tags, and ratings to your trades
            </Typography>
          </Box>
        </Stack>

        {/* Trades List */}
        <Stack spacing={2}>
          {trades.map((trade) => (
            <Card key={trade.id} sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Stack direction="row" spacing={2} sx={{ flex: 1 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        bgcolor: trade.profit_loss >= 0 ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        borderRadius: 2,
                      }}
                    >
                      {trade.profit_loss >= 0 ? <TrendingUp size={20} color="#22C55E" /> : <TrendingDown size={20} color="#EF4444" />}
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '1.05rem' }}>
                          {trade.symbol}
                        </Typography>
                        <Chip
                          label={trade.trade_type}
                          size="small"
                          sx={{
                            bgcolor: trade.trade_type === 'buy' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                            color: trade.trade_type === 'buy' ? '#22C55E' : '#EF4444',
                            fontSize: '0.7rem',
                            textTransform: 'uppercase',
                          }}
                        />
                        <Typography
                          sx={{
                            color: trade.profit_loss >= 0 ? '#22C55E' : '#EF4444',
                            fontWeight: 600,
                            fontSize: '0.95rem',
                          }}
                        >
                          {trade.profit_loss >= 0 ? '+' : ''}{trade.profit_loss?.toFixed(2) || '0.00'}
                        </Typography>
                      </Stack>

                      {trade.setup_rating && (
                        <Rating value={trade.setup_rating} readOnly size="small" sx={{ mb: 0.5 }} />
                      )}

                      {trade.tags && (
                        <Stack direction="row" spacing={0.5} sx={{ mb: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                          {trade.tags.split(',').map((tag, i) => (
                            <Chip
                              key={i}
                              label={tag.trim()}
                              size="small"
                              icon={<Tag size={12} />}
                              sx={{
                                bgcolor: 'rgba(139, 92, 246, 0.2)',
                                color: '#8B5CF6',
                                fontSize: '0.7rem',
                                height: 22,
                              }}
                            />
                          ))}
                        </Stack>
                      )}

                      {trade.emotion && (
                        <Chip
                          label={trade.emotion}
                          size="small"
                          sx={{
                            bgcolor: `${EMOTION_COLORS[trade.emotion] || '#6B7280'}20`,
                            color: EMOTION_COLORS[trade.emotion] || '#6B7280',
                            fontSize: '0.7rem',
                            textTransform: 'capitalize',
                          }}
                        />
                      )}

                      {trade.notes && (
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', mt: 1, fontStyle: 'italic' }}>
                          "{trade.notes}"
                        </Typography>
                      )}

                      <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', mt: 1 }}>
                        {new Date(trade.opened_at).toLocaleString()}
                      </Typography>
                    </Box>
                  </Stack>
                  <IconButton
                    onClick={() => openEdit(trade)}
                    sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#3B82F6' } }}
                  >
                    <Edit size={18} />
                  </IconButton>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>

        {trades.length === 0 && (
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <BookOpen size={56} color="rgba(255,255,255,0.15)" />
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', mt: 2 }}>
                No trades to journal yet
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} PaperProps={{ sx: { bgcolor: '#1A1F2E', minWidth: 500 } }}>
        <DialogTitle sx={{ color: 'white' }}>Edit Trade Journal</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <Box>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 1, fontSize: '0.875rem' }}>Setup Rating</Typography>
              <Rating value={rating} onChange={(_, v) => setRating(v)} size="large" />
            </Box>

            <FormControl fullWidth>
              <InputLabel sx={{ color: 'rgba(255,255,255,0.5)' }}>Emotion</InputLabel>
              <Select
                value={emotion}
                onChange={(e) => setEmotion(e.target.value)}
                label="Emotion"
                sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}
              >
                <MenuItem value="">None</MenuItem>
                {EMOTIONS.map((e) => (
                  <MenuItem key={e} value={e}>
                    {e.charAt(0).toUpperCase() + e.slice(1)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 1, fontSize: '0.875rem' }}>Tags</Typography>
              <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                {selectedTags.map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onDelete={() => removeTag(tag)}
                    deleteIcon={<X size={14} />}
                    sx={{ bgcolor: 'rgba(139, 92, 246, 0.2)', color: '#8B5CF6' }}
                  />
                ))}
              </Stack>
              <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                {tags.filter(t => !selectedTags.includes(t)).map((tag) => (
                  <Chip
                    key={tag}
                    label={tag}
                    onClick={() => addTag(tag)}
                    icon={<Plus size={14} />}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.05)',
                      color: 'rgba(255,255,255,0.7)',
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'rgba(139, 92, 246, 0.15)' },
                    }}
                  />
                ))}
              </Stack>
              <Stack direction="row" spacing={1}>
                <TextField
                  size="small"
                  placeholder="New tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && createTag()}
                  sx={{
                    '& .MuiInputBase-root': { color: 'white' },
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                  }}
                />
                <Button onClick={createTag} variant="outlined" size="small" sx={{ color: '#8B5CF6', borderColor: '#8B5CF6' }}>
                  Add
                </Button>
              </Stack>
            </Box>

            <TextField
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
          <Button onClick={handleSave} variant="contained" startIcon={<Save size={18} />} sx={{ bgcolor: '#3B82F6' }}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
