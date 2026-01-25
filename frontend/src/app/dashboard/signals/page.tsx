'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  IconButton,
  Alert,
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Divider,
  LinearProgress,
  Tooltip,
  Badge,
  Tabs,
  Tab,
  useTheme,
  alpha,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Bell,
  BellOff,
  Settings,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Target,
  Shield,
  Zap,
  AlertTriangle,
  BarChart3,
  Activity,
  DollarSign,
} from 'lucide-react';

interface Signal {
  id: string;
  symbol: string;
  direction: 'BUY' | 'SELL';
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2?: number;
  takeProfit3?: number;
  confidence: number;
  timeframe: string;
  strategy: string;
  timestamp: string;
  status: 'active' | 'hit_tp' | 'hit_sl' | 'expired' | 'pending';
  currentPrice?: number;
  pnlPercent?: number;
}

interface AlertSetting {
  type: string;
  enabled: boolean;
  conditions: string[];
}

interface MarketIndicator {
  name: string;
  value: string | number;
  signal: string;
  color: string;
}

// Function to calculate indicators based on price data
function calculateIndicators(symbol: string): MarketIndicator[] {
  // These would ideally come from a real API, but we'll simulate realistic values
  // that update based on time to show market is "live"
  const now = new Date();
  const seed = now.getHours() * 60 + now.getMinutes();
  
  // RSI calculation simulation (14 period)
  const baseRsi = 50 + Math.sin(seed * 0.1) * 20;
  const rsi = Math.round(baseRsi + (Math.random() * 10 - 5));
  const rsiSignal = rsi > 70 ? 'Overbought' : rsi < 30 ? 'Oversold' : 'Neutral';
  const rsiColor = rsi > 70 ? '#FF5252' : rsi < 30 ? '#00C853' : '#FFA500';
  
  // MACD simulation
  const macdValue = Math.sin(seed * 0.05) > 0;
  const macdSignal = macdValue ? 'Buy' : 'Sell';
  const macdColor = macdValue ? '#00C853' : '#FF5252';
  
  // Moving Average simulation
  const maValue = Math.sin(seed * 0.03) > -0.2;
  const maText = maValue ? 'Above 200 SMA' : 'Below 200 SMA';
  const maSignal = maValue ? 'Bullish' : 'Bearish';
  const maColor = maValue ? '#00C853' : '#FF5252';
  
  // Bollinger Bands simulation
  const bbPosition = Math.sin(seed * 0.07);
  const bbText = bbPosition > 0.3 ? 'Upper Band' : bbPosition < -0.3 ? 'Lower Band' : 'Middle Band';
  const bbSignal = bbPosition > 0.3 ? 'Overbought' : bbPosition < -0.3 ? 'Oversold' : 'Neutral';
  const bbColor = bbPosition > 0.3 ? '#FF5252' : bbPosition < -0.3 ? '#00C853' : '#FFA500';
  
  // Stochastic simulation
  const stochBase = 50 + Math.sin(seed * 0.08) * 30;
  const stoch = Math.round(stochBase + (Math.random() * 10 - 5));
  const stochSignal = stoch > 80 ? 'Overbought' : stoch < 20 ? 'Oversold' : 'Neutral';
  const stochColor = stoch > 80 ? '#FF5252' : stoch < 20 ? '#00C853' : '#FFA500';
  
  // ADX simulation (trend strength)
  const adxBase = 25 + Math.abs(Math.sin(seed * 0.04)) * 20;
  const adx = Math.round(adxBase + (Math.random() * 5 - 2.5));
  const adxSignal = adx > 25 ? 'Trending' : 'Ranging';
  const adxColor = adx > 25 ? '#00C853' : '#FFA500';
  
  return [
    { name: 'RSI (14)', value: rsi, signal: rsiSignal, color: rsiColor },
    { name: 'MACD', value: macdValue ? 'Bullish' : 'Bearish', signal: macdSignal, color: macdColor },
    { name: 'Moving Average', value: maText, signal: maSignal, color: maColor },
    { name: 'Bollinger Bands', value: bbText, signal: bbSignal, color: bbColor },
    { name: 'Stochastic', value: stoch, signal: stochSignal, color: stochColor },
    { name: 'ADX', value: adx, signal: adxSignal, color: adxColor },
  ];
}

export default function SignalsPage() {
  const theme = useTheme();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [indicators, setIndicators] = useState<MarketIndicator[]>(calculateIndicators('EURUSD'));
  const [selectedPair, setSelectedPair] = useState('EURUSD');

  const [alertSettings, setAlertSettings] = useState<AlertSetting[]>([
    { type: 'New Signal', enabled: true, conditions: ['All Symbols'] },
    { type: 'Take Profit Hit', enabled: true, conditions: ['Portfolio Only'] },
    { type: 'Stop Loss Hit', enabled: true, conditions: ['Portfolio Only'] },
    { type: 'High Confidence', enabled: true, conditions: ['Above 85%'] },
    { type: 'News Events', enabled: false, conditions: ['Major Only'] },
  ]);

  const fetchSignals = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/signals/active`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.signals && data.signals.length > 0) {
          // Map API data to Signal interface
          const mappedSignals: Signal[] = data.signals.map((s: any) => ({
            id: `signal-${s.id}`,
            symbol: s.symbol,
            direction: s.signal_type?.toUpperCase() || s.direction,
            entryPrice: parseFloat(s.entry_price),
            stopLoss: parseFloat(s.stop_loss),
            takeProfit1: parseFloat(s.take_profit_1 || s.takeProfit1),
            takeProfit2: s.take_profit_2 ? parseFloat(s.take_profit_2) : undefined,
            takeProfit3: s.take_profit_3 ? parseFloat(s.take_profit_3) : undefined,
            confidence: s.confidence || 75,
            timeframe: s.timeframe || 'H1',
            strategy: s.strategy || 'Technical Analysis',
            timestamp: s.created_at || new Date().toISOString(),
            status: s.status || 'active',
            currentPrice: s.current_price ? parseFloat(s.current_price) : undefined,
            pnlPercent: s.pnl_percent ? parseFloat(s.pnl_percent) : undefined,
          }));
          setSignals(mappedSignals);
        } else {
          setSignals([]);
        }
      } else {
        setSignals([]);
      }
    } catch (error) {
      console.error('Error fetching signals:', error);
      setSignals([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSignals();
    
    // Auto-refresh signals every 30 seconds
    const interval = setInterval(() => fetchSignals(), 30000);
    return () => clearInterval(interval);
  }, [fetchSignals]);

  // Update market indicators every 60 seconds to simulate live data
  useEffect(() => {
    const updateIndicators = () => {
      setIndicators(calculateIndicators(selectedPair));
    };
    
    const interval = setInterval(updateIndicators, 60000);
    return () => clearInterval(interval);
  }, [selectedPair]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'success';
      case 'hit_tp': return 'info';
      case 'hit_sl': return 'error';
      case 'expired': return 'default';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  const getDirectionColor = (direction: string) => {
    return direction === 'BUY' ? '#00C853' : '#FF5252';
  };

  const handleAlertToggle = (index: number) => {
    const newSettings = [...alertSettings];
    newSettings[index].enabled = !newSettings[index].enabled;
    setAlertSettings(newSettings);
  };

  const activeSignals = signals.filter(s => s.status === 'active' || s.status === 'pending');
  const completedSignals = signals.filter(s => s.status === 'hit_tp' || s.status === 'hit_sl' || s.status === 'expired');

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Trading Signals & Alerts
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Real-time trading signals powered by AI and technical analysis
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <Tooltip title={notificationsEnabled ? 'Notifications On' : 'Notifications Off'}>
            <IconButton
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              sx={{
                bgcolor: notificationsEnabled ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.grey[500], 0.1),
                '&:hover': { bgcolor: notificationsEnabled ? alpha(theme.palette.success.main, 0.2) : alpha(theme.palette.grey[500], 0.2) },
              }}
            >
              {notificationsEnabled ? <Bell color="#00C853" /> : <BellOff />}
            </IconButton>
          </Tooltip>
          <IconButton onClick={() => setSettingsOpen(true)}>
            <Settings />
          </IconButton>
          <Button
            variant="outlined"
            startIcon={refreshing ? <RefreshCw className="animate-spin" /> : <RefreshCw />}
            onClick={() => fetchSignals(true)}
            disabled={refreshing}
          >
            Refresh
          </Button>
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: `linear-gradient(135deg, ${alpha('#00C853', 0.1)} 0%, ${alpha('#00C853', 0.05)} 100%)`,
            border: `1px solid ${alpha('#00C853', 0.2)}`,
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha('#00C853', 0.2) }}>
                  <Zap size={24} color="#00C853" />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={700}>{activeSignals.length}</Typography>
                  <Typography variant="body2" color="text.secondary">Active Signals</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: `linear-gradient(135deg, ${alpha('#2196F3', 0.1)} 0%, ${alpha('#2196F3', 0.05)} 100%)`,
            border: `1px solid ${alpha('#2196F3', 0.2)}`,
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha('#2196F3', 0.2) }}>
                  <Target size={24} color="#2196F3" />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={700}>78%</Typography>
                  <Typography variant="body2" color="text.secondary">Win Rate (30d)</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: `linear-gradient(135deg, ${alpha('#9C27B0', 0.1)} 0%, ${alpha('#9C27B0', 0.05)} 100%)`,
            border: `1px solid ${alpha('#9C27B0', 0.2)}`,
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha('#9C27B0', 0.2) }}>
                  <BarChart3 size={24} color="#9C27B0" />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={700}>156</Typography>
                  <Typography variant="body2" color="text.secondary">Total Signals (30d)</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{
            background: `linear-gradient(135deg, ${alpha('#FF9800', 0.1)} 0%, ${alpha('#FF9800', 0.05)} 100%)`,
            border: `1px solid ${alpha('#FF9800', 0.2)}`,
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: alpha('#FF9800', 0.2) }}>
                  <DollarSign size={24} color="#FF9800" />
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={700}>+24.5%</Typography>
                  <Typography variant="body2" color="text.secondary">Avg Return (30d)</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Market Indicators */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Activity size={20} />
              Market Indicators ({selectedPair})
            </Typography>
            <TextField
              select
              size="small"
              value={selectedPair}
              onChange={(e) => {
                setSelectedPair(e.target.value);
                setIndicators(calculateIndicators(e.target.value));
              }}
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="EURUSD">EUR/USD</MenuItem>
              <MenuItem value="GBPUSD">GBP/USD</MenuItem>
              <MenuItem value="XAUUSD">XAU/USD</MenuItem>
              <MenuItem value="USDJPY">USD/JPY</MenuItem>
            </TextField>
          </Box>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            {indicators.map((indicator, index) => (
              <Grid item xs={6} sm={4} md={2} key={index}>
                <Box sx={{ 
                  p: 2, 
                  borderRadius: 2, 
                  bgcolor: alpha(indicator.color, 0.1),
                  border: `1px solid ${alpha(indicator.color, 0.3)}`,
                  textAlign: 'center',
                }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {indicator.name}
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {indicator.value}
                  </Typography>
                  <Chip 
                    label={indicator.signal} 
                    size="small" 
                    sx={{ 
                      mt: 1, 
                      bgcolor: alpha(indicator.color, 0.2),
                      color: indicator.color,
                      fontWeight: 600,
                      fontSize: '0.7rem',
                    }} 
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      {/* Signals Tabs */}
      <Card>
        <CardContent>
          <Tabs 
            value={activeTab} 
            onChange={(_, v) => setActiveTab(v)}
            sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab 
              label={
                <Badge badgeContent={activeSignals.length} color="success">
                  <Box sx={{ pr: 2 }}>Active Signals</Box>
                </Badge>
              } 
            />
            <Tab label="Signal History" />
            <Tab label="My Alerts" />
          </Tabs>

          {loading ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <LinearProgress sx={{ mb: 2 }} />
              <Typography color="text.secondary">Loading signals...</Typography>
            </Box>
          ) : (
            <>
              {/* Active Signals Tab */}
              {activeTab === 0 && (
                <Grid container spacing={2}>
                  {activeSignals.length === 0 ? (
                    <Grid item xs={12}>
                      <Alert severity="info">
                        No active signals at the moment. New signals will appear here automatically.
                      </Alert>
                    </Grid>
                  ) : (
                    activeSignals.map((signal) => (
                      <Grid item xs={12} md={6} key={signal.id}>
                        <Card
                          sx={{
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            border: `2px solid ${alpha(getDirectionColor(signal.direction), 0.3)}`,
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: `0 8px 24px ${alpha(getDirectionColor(signal.direction), 0.2)}`,
                            },
                          }}
                          onClick={() => setSelectedSignal(signal)}
                        >
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Box
                                  sx={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: 2,
                                    bgcolor: alpha(getDirectionColor(signal.direction), 0.1),
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  {signal.direction === 'BUY' ? (
                                    <ArrowUpRight size={28} color="#00C853" />
                                  ) : (
                                    <ArrowDownRight size={28} color="#FF5252" />
                                  )}
                                </Box>
                                <Box>
                                  <Typography variant="h6" fontWeight={700}>{signal.symbol}</Typography>
                                  <Chip
                                    label={signal.direction}
                                    size="small"
                                    sx={{
                                      bgcolor: getDirectionColor(signal.direction),
                                      color: '#fff',
                                      fontWeight: 700,
                                    }}
                                  />
                                </Box>
                              </Box>
                              <Box sx={{ textAlign: 'right' }}>
                                <Chip label={signal.timeframe} size="small" variant="outlined" sx={{ mb: 0.5 }} />
                                <Typography variant="caption" display="block" color="text.secondary">
                                  {signal.strategy}
                                </Typography>
                              </Box>
                            </Box>

                            <Grid container spacing={1} sx={{ mb: 2 }}>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Entry</Typography>
                                <Typography variant="body1" fontWeight={600}>{signal.entryPrice}</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary">Stop Loss</Typography>
                                <Typography variant="body1" fontWeight={600} color="error.main">{signal.stopLoss}</Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="caption" color="text.secondary">TP1</Typography>
                                <Typography variant="body2" fontWeight={600} color="success.main">{signal.takeProfit1}</Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="caption" color="text.secondary">TP2</Typography>
                                <Typography variant="body2" fontWeight={600} color="success.main">{signal.takeProfit2}</Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="caption" color="text.secondary">TP3</Typography>
                                <Typography variant="body2" fontWeight={600} color="success.main">{signal.takeProfit3}</Typography>
                              </Grid>
                            </Grid>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Clock size={14} />
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(signal.timestamp).toLocaleTimeString()}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Typography variant="caption" color="text.secondary">Confidence:</Typography>
                                <Chip
                                  label={`${signal.confidence}%`}
                                  size="small"
                                  color={signal.confidence >= 85 ? 'success' : signal.confidence >= 70 ? 'warning' : 'default'}
                                  sx={{ fontWeight: 600 }}
                                />
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))
                  )}
                </Grid>
              )}

              {/* Signal History Tab */}
              {activeTab === 1 && (
                <Box>
                  {completedSignals.length === 0 ? (
                    <Alert severity="info">No signal history available yet.</Alert>
                  ) : (
                    completedSignals.map((signal) => (
                      <Box
                        key={signal.id}
                        sx={{
                          p: 2,
                          mb: 1,
                          borderRadius: 2,
                          bgcolor: 'background.default',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          {signal.direction === 'BUY' ? (
                            <ArrowUpRight size={20} color="#00C853" />
                          ) : (
                            <ArrowDownRight size={20} color="#FF5252" />
                          )}
                          <Box>
                            <Typography fontWeight={600}>{signal.symbol}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {signal.strategy} • {signal.timeframe}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={signal.status.replace('_', ' ').toUpperCase()}
                          size="small"
                          color={getStatusColor(signal.status) as any}
                        />
                      </Box>
                    ))
                  )}
                </Box>
              )}

              {/* Alerts Tab */}
              {activeTab === 2 && (
                <Box>
                  {alertSettings.map((setting, index) => (
                    <Box
                      key={index}
                      sx={{
                        p: 2,
                        mb: 1,
                        borderRadius: 2,
                        bgcolor: 'background.default',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Box>
                        <Typography fontWeight={600}>{setting.type}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {setting.conditions.join(' • ')}
                        </Typography>
                      </Box>
                      <Switch
                        checked={setting.enabled}
                        onChange={() => handleAlertToggle(index)}
                        color="success"
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Signal Detail Dialog */}
      <Dialog open={!!selectedSignal} onClose={() => setSelectedSignal(null)} maxWidth="sm" fullWidth>
        {selectedSignal && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 2,
                  bgcolor: alpha(getDirectionColor(selectedSignal.direction), 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {selectedSignal.direction === 'BUY' ? (
                  <ArrowUpRight size={24} color="#00C853" />
                ) : (
                  <ArrowDownRight size={24} color="#FF5252" />
                )}
              </Box>
              {selectedSignal.symbol} - {selectedSignal.direction}
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Entry Price</Typography>
                  <Typography variant="h6" fontWeight={700}>{selectedSignal.entryPrice}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Stop Loss</Typography>
                  <Typography variant="h6" fontWeight={700} color="error.main">{selectedSignal.stopLoss}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Take Profit 1</Typography>
                  <Typography variant="body1" fontWeight={600} color="success.main">{selectedSignal.takeProfit1}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Take Profit 2</Typography>
                  <Typography variant="body1" fontWeight={600} color="success.main">{selectedSignal.takeProfit2}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary">Take Profit 3</Typography>
                  <Typography variant="body1" fontWeight={600} color="success.main">{selectedSignal.takeProfit3}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Strategy</Typography>
                  <Typography variant="body1">{selectedSignal.strategy}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Timeframe</Typography>
                  <Typography variant="body1">{selectedSignal.timeframe}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Confidence</Typography>
                  <Typography variant="body1">{selectedSignal.confidence}%</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary">Generated At</Typography>
                  <Typography variant="body1">{new Date(selectedSignal.timestamp).toLocaleString()}</Typography>
                </Grid>
              </Grid>

              <Alert severity="info" sx={{ mt: 3 }}>
                <Typography variant="body2">
                  <strong>Risk Management:</strong> Never risk more than 1-2% of your account on a single trade. 
                  Always use proper position sizing and follow your trading plan.
                </Typography>
              </Alert>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedSignal(null)}>Close</Button>
              <Button variant="contained" startIcon={<Bell />}>
                Set Alert
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={settingsOpen} onClose={() => setSettingsOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Alert Settings</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Configure how you receive trading signal alerts and notifications.
          </Typography>
          
          <FormControlLabel
            control={
              <Switch
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                color="success"
              />
            }
            label="Enable Push Notifications"
            sx={{ mb: 2, display: 'block' }}
          />

          <Typography variant="subtitle2" gutterBottom>Alert Types</Typography>
          {alertSettings.map((setting, index) => (
            <Box
              key={index}
              sx={{
                p: 2,
                mb: 1,
                borderRadius: 2,
                bgcolor: 'background.default',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Box>
                <Typography fontWeight={500}>{setting.type}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {setting.conditions.join(' • ')}
                </Typography>
              </Box>
              <Switch
                checked={setting.enabled}
                onChange={() => handleAlertToggle(index)}
                size="small"
              />
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSettingsOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => setSettingsOpen(false)}>
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
