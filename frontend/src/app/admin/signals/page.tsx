'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  useTheme,
  alpha,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack
} from '@mui/material';
import {
  Send as SendIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';

const symbols = [
  'XAUUSD', 'XAGUSD', 'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'NZDUSD',
  'USDCAD', 'EURGBP', 'EURJPY', 'GBPJPY', 'BTCUSD', 'ETHUSD', 'US30', 'NAS100'
];

const timeframes = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1'];
const confidenceLevels = ['LOW', 'MEDIUM', 'HIGH', 'VERY_HIGH'];

interface Signal {
  id: number;
  signal_type: string;
  symbol: string;
  entry_price: number;
  stop_loss: number;
  take_profit_1: number;
  status: string;
  result_pips?: number;
  created_at: string;
  deliveries_count: number;
}

interface SubscriberStats {
  name: string;
  slug: string;
  subscriber_count: number;
}

export default function AdminSignalsPage() {
  const theme = useTheme();
  const router = useRouter();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [subscriberStats, setSubscriberStats] = useState<SubscriberStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [updateDialog, setUpdateDialog] = useState<Signal | null>(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [updatePips, setUpdatePips] = useState('');

  const [formData, setFormData] = useState({
    symbol: 'XAUUSD',
    signalType: 'BUY',
    entryPrice: '',
    stopLoss: '',
    takeProfit1: '',
    takeProfit2: '',
    takeProfit3: '',
    analysis: '',
    timeframe: 'H1',
    confidence: 'HIGH'
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    try {
      // Fetch signal history
      const sigRes = await fetch(`${API_URL}/api/signals/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const sigData = await sigRes.json();
      setSignals(sigData.signals || []);

      // Fetch subscriber stats
      const subRes = await fetch(`${API_URL}/api/signals/admin/subscribers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscriberStats(subData.stats || []);
      }
    } catch (err) {
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setError('');
    setSuccess('');

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/signals/admin/quick-signal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send signal');
      }

      setSuccess(data.message || 'Signal sent successfully!');
      setFormData(prev => ({
        ...prev,
        entryPrice: '',
        stopLoss: '',
        takeProfit1: '',
        takeProfit2: '',
        takeProfit3: '',
        analysis: ''
      }));
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleUpdateSignal = async () => {
    if (!updateDialog) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_URL}/api/signals/admin/${updateDialog.id}/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status: updateStatus,
          resultPips: updatePips ? parseFloat(updatePips) : null
        })
      });

      if (!res.ok) throw new Error('Failed to update signal');

      setSuccess('Signal updated!');
      setUpdateDialog(null);
      setUpdateStatus('');
      setUpdatePips('');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const totalSubscribers = subscriberStats.reduce((sum, s) => sum + Number(s.subscriber_count), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#3B82F6';
      case 'tp1_hit':
      case 'tp2_hit':
      case 'tp3_hit': return '#22C55E';
      case 'sl_hit': return '#EF4444';
      case 'closed': return '#64748B';
      default: return '#94A3B8';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh' }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, pl: { xs: 6, md: 0 } }}>
          <Box>
            <Typography variant="h4" fontWeight={700}>
              Signal Management
            </Typography>
            <Typography color="text.secondary">
              Create and manage trading signals
            </Typography>
          </Box>
          <IconButton onClick={fetchData}>
            <RefreshIcon />
          </IconButton>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Grid container spacing={3}>
          {/* Subscriber Stats */}
          <Grid item xs={12}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={2.4}>
                <Paper sx={{ p: 2, borderRadius: 2, textAlign: 'center' }}>
                  <PeopleIcon sx={{ color: 'primary.main', mb: 1 }} />
                  <Typography variant="h4" fontWeight={700}>{totalSubscribers}</Typography>
                  <Typography color="text.secondary" variant="body2">Total Subscribers</Typography>
                </Paper>
              </Grid>
              {subscriberStats.map((stat) => (
                <Grid item xs={6} sm={3} md={2.4} key={stat.slug}>
                  <Paper sx={{ p: 2, borderRadius: 2, textAlign: 'center' }}>
                    <Typography variant="h5" fontWeight={700}>{stat.subscriber_count}</Typography>
                    <Typography color="text.secondary" variant="body2">{stat.name}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Grid>

          {/* New Signal Form */}
          <Grid item xs={12} md={5}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  🚀 Send New Signal
                </Typography>
                <Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>
                  This will broadcast to all {totalSubscribers} subscribers
                </Typography>

                <form onSubmit={handleSubmit}>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        select
                        fullWidth
                        label="Symbol"
                        value={formData.symbol}
                        onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                      >
                        {symbols.map((s) => (
                          <MenuItem key={s} value={s}>{s}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        select
                        fullWidth
                        label="Direction"
                        value={formData.signalType}
                        onChange={(e) => setFormData({ ...formData, signalType: e.target.value })}
                      >
                        <MenuItem value="BUY">🟢 BUY</MenuItem>
                        <MenuItem value="SELL">🔴 SELL</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Entry Price"
                        type="number"
                        required
                        value={formData.entryPrice}
                        onChange={(e) => setFormData({ ...formData, entryPrice: e.target.value })}
                        inputProps={{ step: 'any' }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Stop Loss"
                        type="number"
                        value={formData.stopLoss}
                        onChange={(e) => setFormData({ ...formData, stopLoss: e.target.value })}
                        inputProps={{ step: 'any' }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Take Profit 1"
                        type="number"
                        value={formData.takeProfit1}
                        onChange={(e) => setFormData({ ...formData, takeProfit1: e.target.value })}
                        inputProps={{ step: 'any' }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Take Profit 2"
                        type="number"
                        value={formData.takeProfit2}
                        onChange={(e) => setFormData({ ...formData, takeProfit2: e.target.value })}
                        inputProps={{ step: 'any' }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        fullWidth
                        label="Take Profit 3"
                        type="number"
                        value={formData.takeProfit3}
                        onChange={(e) => setFormData({ ...formData, takeProfit3: e.target.value })}
                        inputProps={{ step: 'any' }}
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        select
                        fullWidth
                        label="Timeframe"
                        value={formData.timeframe}
                        onChange={(e) => setFormData({ ...formData, timeframe: e.target.value })}
                      >
                        {timeframes.map((tf) => (
                          <MenuItem key={tf} value={tf}>{tf}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        select
                        fullWidth
                        label="Confidence"
                        value={formData.confidence}
                        onChange={(e) => setFormData({ ...formData, confidence: e.target.value })}
                      >
                        {confidenceLevels.map((c) => (
                          <MenuItem key={c} value={c}>{c.replace('_', ' ')}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Analysis (Premium/VIP only)"
                        multiline
                        rows={3}
                        value={formData.analysis}
                        onChange={(e) => setFormData({ ...formData, analysis: e.target.value })}
                        placeholder="Technical analysis explanation..."
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        fullWidth
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={sending || !formData.entryPrice}
                        startIcon={sending ? <CircularProgress size={20} /> : <SendIcon />}
                        sx={{
                          py: 1.5,
                          bgcolor: formData.signalType === 'BUY' ? '#22C55E' : '#EF4444',
                          '&:hover': {
                            bgcolor: formData.signalType === 'BUY' ? '#16A34A' : '#DC2626'
                          }
                        }}
                      >
                        {sending ? 'Broadcasting...' : `Send ${formData.signalType} Signal`}
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Signals */}
          <Grid item xs={12} md={7}>
            <Card sx={{ borderRadius: 3 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Recent Signals
                </Typography>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Signal</TableCell>
                        <TableCell>Entry</TableCell>
                        <TableCell>SL/TP</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Sent To</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {signals.slice(0, 10).map((signal) => (
                        <TableRow key={signal.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {signal.signal_type === 'BUY' ? (
                                <TrendingUpIcon sx={{ color: '#22C55E', fontSize: 20 }} />
                              ) : (
                                <TrendingDownIcon sx={{ color: '#EF4444', fontSize: 20 }} />
                              )}
                              <Box>
                                <Typography variant="body2" fontWeight={600}>
                                  {signal.symbol}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(signal.created_at).toLocaleString()}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>{signal.entry_price}</TableCell>
                          <TableCell>
                            <Typography variant="caption" color="error.main">
                              SL: {signal.stop_loss || '-'}
                            </Typography>
                            <br />
                            <Typography variant="caption" color="success.main">
                              TP: {signal.take_profit_1 || '-'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={signal.status.replace('_', ' ')}
                              size="small"
                              sx={{
                                bgcolor: alpha(getStatusColor(signal.status), 0.1),
                                color: getStatusColor(signal.status),
                                fontWeight: 600,
                                fontSize: '0.65rem'
                              }}
                            />
                            {signal.result_pips !== null && (
                              <Typography
                                variant="caption"
                                display="block"
                                sx={{ color: signal.result_pips! > 0 ? '#22C55E' : '#EF4444' }}
                              >
                                {signal.result_pips! > 0 ? '+' : ''}{signal.result_pips} pips
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={`${signal.deliveries_count} users`}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <IconButton
                              size="small"
                              onClick={() => {
                                setUpdateDialog(signal);
                                setUpdateStatus(signal.status);
                                setUpdatePips(signal.result_pips?.toString() || '');
                              }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Update Dialog */}
        <Dialog open={!!updateDialog} onClose={() => setUpdateDialog(null)} maxWidth="xs" fullWidth>
          <DialogTitle>Update Signal Status</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                select
                fullWidth
                label="Status"
                value={updateStatus}
                onChange={(e) => setUpdateStatus(e.target.value)}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="tp1_hit">TP1 Hit</MenuItem>
                <MenuItem value="tp2_hit">TP2 Hit</MenuItem>
                <MenuItem value="tp3_hit">TP3 Hit</MenuItem>
                <MenuItem value="sl_hit">SL Hit</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
              </TextField>
              <TextField
                fullWidth
                label="Result (pips)"
                type="number"
                value={updatePips}
                onChange={(e) => setUpdatePips(e.target.value)}
                placeholder="e.g., 50 or -25"
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUpdateDialog(null)}>Cancel</Button>
            <Button variant="contained" onClick={handleUpdateSignal}>
              Update & Notify
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
