'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  CircularProgress,
  TextField,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  Bell,
  Plus,
  TrendingUp,
  TrendingDown,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface Alert {
  id: number;
  symbol: string;
  alert_type: string;
  target_price: number;
  current_price: number | null;
  message: string | null;
  is_active: boolean;
  triggered: boolean;
  triggered_at: string | null;
  created_at: string;
}

const POPULAR_PAIRS = [
  'EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD',
  'XAUUSD', 'XAGUSD', 'BTCUSD', 'ETHUSD',
];

export default function PriceAlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  
  // Form state
  const [symbol, setSymbol] = useState('EURUSD');
  const [alertType, setAlertType] = useState('above');
  const [targetPrice, setTargetPrice] = useState('');
  const [message, setMessage] = useState('');
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  useEffect(() => {
    fetchAlerts();
  }, [showActiveOnly]);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = showActiveOnly ? '?active=true' : '';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/alerts${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/alerts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbol,
          alert_type: alertType,
          target_price: parseFloat(targetPrice),
          message: message || null,
        }),
      });
      
      if (res.ok) {
        setDialogOpen(false);
        resetForm();
        fetchAlerts();
      }
    } catch (error) {
      console.error('Failed to create alert:', error);
    }
  };

  const handleUpdate = async () => {
    if (!editingAlert) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/alerts/${editingAlert.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_price: parseFloat(targetPrice),
          message: message || null,
        }),
      });
      
      if (res.ok) {
        setDialogOpen(false);
        setEditingAlert(null);
        resetForm();
        fetchAlerts();
      }
    } catch (error) {
      console.error('Failed to update alert:', error);
    }
  };

  const toggleActive = async (alert: Alert) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/alerts/${alert.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: !alert.is_active }),
      });
      fetchAlerts();
    } catch (error) {
      console.error('Failed to toggle alert:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this alert?')) return;
    
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/alerts/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchAlerts();
    } catch (error) {
      console.error('Failed to delete alert:', error);
    }
  };

  const openEditDialog = (alert: Alert) => {
    setEditingAlert(alert);
    setSymbol(alert.symbol);
    setAlertType(alert.alert_type);
    setTargetPrice(alert.target_price.toString());
    setMessage(alert.message || '');
    setDialogOpen(true);
  };

  const resetForm = () => {
    setSymbol('EURUSD');
    setAlertType('above');
    setTargetPrice('');
    setMessage('');
    setEditingAlert(null);
  };

  const activeAlerts = alerts.filter(a => a.is_active && !a.triggered);
  const triggeredAlerts = alerts.filter(a => a.triggered);

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', py: { xs: 2, md: 4 }, px: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: 900, mx: 'auto' }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box sx={{ p: 1.5, bgcolor: 'rgba(245, 158, 11, 0.2)', borderRadius: 2 }}>
              <Bell size={24} color="#F59E0B" />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                Price Alerts
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
                {activeAlerts.length} active alerts
              </Typography>
            </Box>
          </Stack>
          <Button
            variant="contained"
            startIcon={<Plus size={18} />}
            onClick={() => { resetForm(); setDialogOpen(true); }}
            sx={{
              bgcolor: '#F59E0B',
              '&:hover': { bgcolor: '#D97706' },
            }}
          >
            New Alert
          </Button>
        </Stack>

        {/* Filter */}
        <FormControlLabel
          control={
            <Switch
              checked={showActiveOnly}
              onChange={(e) => setShowActiveOnly(e.target.checked)}
              sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#F59E0B' } }}
            />
          }
          label={<Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>Show active only</Typography>}
          sx={{ mb: 2 }}
        />

        {/* Alerts List */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#F59E0B' }} />
          </Box>
        ) : alerts.length === 0 ? (
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <Bell size={56} color="rgba(255,255,255,0.15)" />
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', mt: 2 }}>
                No alerts yet. Create your first price alert!
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={2}>
            {alerts.map((alert) => (
              <Card
                key={alert.id}
                sx={{
                  bgcolor: alert.triggered
                    ? 'rgba(34, 197, 94, 0.05)'
                    : alert.is_active
                    ? 'rgba(255,255,255,0.02)'
                    : 'rgba(255,255,255,0.01)',
                  border: alert.triggered
                    ? '1px solid rgba(34, 197, 94, 0.3)'
                    : '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <CardContent>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ flex: 1 }}>
                      <Box
                        sx={{
                          p: 1.5,
                          bgcolor:
                            alert.alert_type === 'above'
                              ? 'rgba(34, 197, 94, 0.2)'
                              : 'rgba(239, 68, 68, 0.2)',
                          borderRadius: 2,
                        }}
                      >
                        {alert.alert_type === 'above' ? (
                          <TrendingUp size={20} color="#22C55E" />
                        ) : (
                          <TrendingDown size={20} color="#EF4444" />
                        )}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                          <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '1.1rem' }}>
                            {alert.symbol}
                          </Typography>
                          <Chip
                            label={alert.alert_type}
                            size="small"
                            sx={{
                              bgcolor:
                                alert.alert_type === 'above'
                                  ? 'rgba(34, 197, 94, 0.2)'
                                  : 'rgba(239, 68, 68, 0.2)',
                              color: alert.alert_type === 'above' ? '#22C55E' : '#EF4444',
                              fontSize: '0.7rem',
                              textTransform: 'capitalize',
                            }}
                          />
                          {alert.triggered ? (
                            <Chip
                              icon={<CheckCircle size={14} />}
                              label="Triggered"
                              size="small"
                              sx={{ bgcolor: 'rgba(34, 197, 94, 0.2)', color: '#22C55E', fontSize: '0.7rem' }}
                            />
                          ) : !alert.is_active ? (
                            <Chip
                              label="Paused"
                              size="small"
                              sx={{ bgcolor: 'rgba(107, 114, 128, 0.2)', color: '#9CA3AF', fontSize: '0.7rem' }}
                            />
                          ) : null}
                        </Stack>
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem' }}>
                          Target: <strong>{alert.target_price.toFixed(5)}</strong>
                        </Typography>
                        {alert.message && (
                          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', mt: 0.5 }}>
                            {alert.message}
                          </Typography>
                        )}
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75 }}>
                          <Clock size={12} color="rgba(255,255,255,0.4)" />
                          <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                            {new Date(alert.created_at).toLocaleDateString()}
                          </Typography>
                        </Stack>
                      </Box>
                    </Stack>
                    <Stack direction="row" spacing={0.5}>
                      {!alert.triggered && (
                        <>
                          <Switch
                            checked={alert.is_active}
                            onChange={() => toggleActive(alert)}
                            size="small"
                            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#F59E0B' } }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => openEditDialog(alert)}
                            sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#3B82F6' } }}
                          >
                            <Edit size={18} />
                          </IconButton>
                        </>
                      )}
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(alert.id)}
                        sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: '#EF4444' } }}
                      >
                        <Trash2 size={18} />
                      </IconButton>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        )}
      </Box>

      {/* Create/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditingAlert(null); }}
        PaperProps={{ sx: { bgcolor: '#1A1F2E', minWidth: 400 } }}
      >
        <DialogTitle sx={{ color: 'white' }}>
          {editingAlert ? 'Edit Alert' : 'Create Price Alert'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <FormControl fullWidth disabled={!!editingAlert}>
              <InputLabel sx={{ color: 'rgba(255,255,255,0.5)' }}>Symbol</InputLabel>
              <Select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                label="Symbol"
                sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}
              >
                {POPULAR_PAIRS.map((pair) => (
                  <MenuItem key={pair} value={pair}>
                    {pair}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={!!editingAlert}>
              <InputLabel sx={{ color: 'rgba(255,255,255,0.5)' }}>Alert Type</InputLabel>
              <Select
                value={alertType}
                onChange={(e) => setAlertType(e.target.value)}
                label="Alert Type"
                sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}
              >
                <MenuItem value="above">Price Above</MenuItem>
                <MenuItem value="below">Price Below</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Target Price"
              type="number"
              value={targetPrice}
              onChange={(e) => setTargetPrice(e.target.value)}
              inputProps={{ step: 0.00001 }}
              sx={{
                '& .MuiInputBase-root': { color: 'white' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
              }}
            />

            <TextField
              label="Message (optional)"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              multiline
              rows={2}
              sx={{
                '& .MuiInputBase-root': { color: 'white' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setDialogOpen(false); setEditingAlert(null); }} sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Cancel
          </Button>
          <Button
            onClick={editingAlert ? handleUpdate : handleCreate}
            variant="contained"
            sx={{ bgcolor: '#F59E0B', '&:hover': { bgcolor: '#D97706' } }}
          >
            {editingAlert ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
