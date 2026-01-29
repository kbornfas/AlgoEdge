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

// API response indicator format
interface APIIndicator {
  value: string | number;
  signal: string;
  color: string;
}

interface APIIndicatorsResponse {
  rsi: APIIndicator;
  macd: APIIndicator;
  movingAverage: APIIndicator;
  bollingerBands: APIIndicator;
  stochastic: APIIndicator;
  adx: APIIndicator;
  source?: string;
  lastSignal?: {
    type: string;
    confidence: number;
    time: string;
  } | null;
}

// Transform API response to display format
function transformIndicators(apiIndicators: APIIndicatorsResponse): MarketIndicator[] {
  return [
    { name: 'RSI (14)', value: apiIndicators.rsi.value, signal: apiIndicators.rsi.signal, color: apiIndicators.rsi.color },
    { name: 'MACD', value: apiIndicators.macd.value, signal: apiIndicators.macd.signal, color: apiIndicators.macd.color },
    { name: 'Moving Average', value: apiIndicators.movingAverage.value, signal: apiIndicators.movingAverage.signal, color: apiIndicators.movingAverage.color },
    { name: 'Bollinger Bands', value: apiIndicators.bollingerBands.value, signal: apiIndicators.bollingerBands.signal, color: apiIndicators.bollingerBands.color },
    { name: 'Stochastic', value: apiIndicators.stochastic.value, signal: apiIndicators.stochastic.signal, color: apiIndicators.stochastic.color },
    { name: 'ADX', value: apiIndicators.adx.value, signal: apiIndicators.adx.signal, color: apiIndicators.adx.color },
  ];
}

// Fallback function for when API is unavailable
function getDefaultIndicators(): MarketIndicator[] {
  return [
    { name: 'RSI (14)', value: 50, signal: 'Neutral', color: '#FFA500' },
    { name: 'MACD', value: 'Neutral', signal: 'Hold', color: '#FFA500' },
    { name: 'Moving Average', value: 'Neutral', signal: 'Hold', color: '#FFA500' },
    { name: 'Bollinger Bands', value: 'Middle Band', signal: 'Neutral', color: '#FFA500' },
    { name: 'Stochastic', value: 50, signal: 'Neutral', color: '#FFA500' },
    { name: 'ADX', value: 25, signal: 'Moderate', color: '#FFA500' },
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
  const [indicators, setIndicators] = useState<MarketIndicator[]>(getDefaultIndicators());
  const [indicatorsLoading, setIndicatorsLoading] = useState(false);
  const [selectedPair, setSelectedPair] = useState('EURUSD');

  const [alertSettings, setAlertSettings] = useState<AlertSetting[]>([
    { type: 'New Signal', enabled: true, conditions: ['All Symbols'] },
    { type: 'Take Profit Hit', enabled: true, conditions: ['Portfolio Only'] },
    { type: 'Stop Loss Hit', enabled: true, conditions: ['Portfolio Only'] },
    { type: 'High Confidence', enabled: true, conditions: ['Above 85%'] },
    { type: 'News Events', enabled: false, conditions: ['Major Only'] },
  ]);

  // Fetch market indicators from API
  const fetchIndicators = useCallback(async (symbol: string) => {
    setIndicatorsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/signals/indicators/${symbol}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.indicators) {
          setIndicators(transformIndicators(data.indicators));
        } else {
          setIndicators(getDefaultIndicators());
        }
      } else {
        setIndicators(getDefaultIndicators());
      }
    } catch (error) {
      console.error('Error fetching indicators:', error);
      setIndicators(getDefaultIndicators());
    } finally {
      setIndicatorsLoading(false);
    }
  }, []);

  const fetchSignals = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // First try to fetch live MT5 positions
      if (token) {
        try {
          const mt5Response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/mt5/my-positions`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          if (mt5Response.ok) {
            const mt5Data = await mt5Response.json();
            if (mt5Data.signals && mt5Data.signals.length > 0) {
              // Use live MT5 positions as signals
              const mappedSignals: Signal[] = mt5Data.signals.map((s: any) => ({
                id: s.id,
                symbol: s.symbol,
                direction: s.direction,
                entryPrice: s.entryPrice,
                stopLoss: s.stopLoss,
                takeProfit1: s.takeProfit1,
                confidence: s.confidence || 100,
                timeframe: s.timeframe || 'LIVE',
                strategy: s.strategy || 'MT5 Live Trade',
                timestamp: s.timestamp || s.openTime,
                status: 'active',
                currentPrice: s.currentPrice,
                pnlPercent: s.pnlPercent,
              }));
              setSignals(mappedSignals);
              setLoading(false);
              setRefreshing(false);
              return;
            }
          }
        } catch (mt5Error) {
          console.log('MT5 positions not available, falling back to signals API');
        }
      }
      
      // Fallback to signals API
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

  // Fetch market indicators when pair changes or every 60 seconds
  useEffect(() => {
    // Initial fetch
    fetchIndicators(selectedPair);
    
    // Auto-refresh indicators every 60 seconds
    const interval = setInterval(() => fetchIndicators(selectedPair), 60000);
    return () => clearInterval(interval);
  }, [selectedPair, fetchIndicators]);

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
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: { xs: 2, md: 4 }, display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexDirection: { xs: 'column', sm: 'row' }, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' } }} fontWeight={700} gutterBottom>
            Trading Signals & Alerts
          </Typography>
          <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }} color="text.secondary">
            Real-time trading signals powered by AI and technical analysis
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: { xs: 1, md: 2 }, alignItems: 'center', width: { xs: '100%', sm: 'auto' }, justifyContent: { xs: 'space-between', sm: 'flex-end' } }}>
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
        </Box>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} sx={{ mb: { xs: 2, md: 4 } }}>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{
            background: `linear-gradient(135deg, ${alpha('#00C853', 0.1)} 0%, ${alpha('#00C853', 0.05)} 100%)`,
            border: `1px solid ${alpha('#00C853', 0.2)}`,
          }}>
            <CardContent sx={{ p: { xs: 1.5, md: 2 }, '&:last-child': { pb: { xs: 1.5, md: 2 } } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 } }}>
                <Box sx={{ p: { xs: 1, md: 1.5 }, borderRadius: 2, bgcolor: alpha('#00C853', 0.2) }}>
                  <Zap size={24} color="#00C853" />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontSize: { xs: '1.25rem', md: '2.125rem' } }} fontWeight={700}>{activeSignals.length}</Typography>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', md: '0.875rem' } }} color="text.secondary">Active Signals</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{
            background: `linear-gradient(135deg, ${alpha('#2196F3', 0.1)} 0%, ${alpha('#2196F3', 0.05)} 100%)`,
            border: `1px solid ${alpha('#2196F3', 0.2)}`,
          }}>
            <CardContent sx={{ p: { xs: 1.5, md: 2 }, '&:last-child': { pb: { xs: 1.5, md: 2 } } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 } }}>
                <Box sx={{ p: { xs: 1, md: 1.5 }, borderRadius: 2, bgcolor: alpha('#2196F3', 0.2) }}>
                  <Target size={24} color="#2196F3" />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontSize: { xs: '1.25rem', md: '2.125rem' } }} fontWeight={700}>78%</Typography>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', md: '0.875rem' } }} color="text.secondary">Win Rate (30d)</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{
            background: `linear-gradient(135deg, ${alpha('#9C27B0', 0.1)} 0%, ${alpha('#9C27B0', 0.05)} 100%)`,
            border: `1px solid ${alpha('#9C27B0', 0.2)}`,
          }}>
            <CardContent sx={{ p: { xs: 1.5, md: 2 }, '&:last-child': { pb: { xs: 1.5, md: 2 } } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 } }}>
                <Box sx={{ p: { xs: 1, md: 1.5 }, borderRadius: 2, bgcolor: alpha('#9C27B0', 0.2) }}>
                  <BarChart3 size={24} color="#9C27B0" />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontSize: { xs: '1.25rem', md: '2.125rem' } }} fontWeight={700}>156</Typography>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', md: '0.875rem' } }} color="text.secondary">Total Signals (30d)</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{
            background: `linear-gradient(135deg, ${alpha('#FF9800', 0.1)} 0%, ${alpha('#FF9800', 0.05)} 100%)`,
            border: `1px solid ${alpha('#FF9800', 0.2)}`,
          }}>
            <CardContent sx={{ p: { xs: 1.5, md: 2 }, '&:last-child': { pb: { xs: 1.5, md: 2 } } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 } }}>
                <Box sx={{ p: { xs: 1, md: 1.5 }, borderRadius: 2, bgcolor: alpha('#FF9800', 0.2) }}>
                  <DollarSign size={24} color="#FF9800" />
                </Box>
                <Box>
                  <Typography variant="h4" sx={{ fontSize: { xs: '1.25rem', md: '2.125rem' } }} fontWeight={700}>+24.5%</Typography>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', md: '0.875rem' } }} color="text.secondary">Avg Return (30d)</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Market Indicators */}
      <Card sx={{ mb: { xs: 2, md: 4 } }}>
        <CardContent sx={{ p: { xs: 1.5, md: 2 }, '&:last-child': { pb: { xs: 1.5, md: 2 } } }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 } }}>
            <Typography variant="h6" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '0.95rem', md: '1.25rem' } }}>
              <Activity size={20} />
              Market Indicators ({selectedPair})
              {indicatorsLoading && <RefreshCw size={16} className="animate-spin" style={{ marginLeft: 8 }} />}
            </Typography>
            <TextField
              select
              size="small"
              value={selectedPair}
              onChange={(e) => {
                setSelectedPair(e.target.value);
              }}
              sx={{ minWidth: 140 }}
              disabled={indicatorsLoading}
            >
              {/* Metals */}
              <MenuItem value="XAUUSD">XAU/USD (Gold)</MenuItem>
              <MenuItem value="XAGUSD">XAG/USD (Silver)</MenuItem>
              {/* Major Forex Pairs */}
              <MenuItem value="EURUSD">EUR/USD</MenuItem>
              <MenuItem value="GBPUSD">GBP/USD</MenuItem>
              <MenuItem value="USDJPY">USD/JPY</MenuItem>
              <MenuItem value="USDCHF">USD/CHF</MenuItem>
              <MenuItem value="AUDUSD">AUD/USD</MenuItem>
              <MenuItem value="USDCAD">USD/CAD</MenuItem>
              <MenuItem value="NZDUSD">NZD/USD</MenuItem>
              {/* Cross Pairs */}
              <MenuItem value="EURJPY">EUR/JPY</MenuItem>
              <MenuItem value="GBPJPY">GBP/JPY</MenuItem>
              <MenuItem value="EURGBP">EUR/GBP</MenuItem>
              <MenuItem value="EURAUD">EUR/AUD</MenuItem>
              <MenuItem value="AUDJPY">AUD/JPY</MenuItem>
              {/* Crypto */}
              <MenuItem value="BTCUSD">BTC/USD</MenuItem>
              <MenuItem value="ETHUSD">ETH/USD</MenuItem>
              {/* Indices */}
              <MenuItem value="US30">US30 (Dow)</MenuItem>
              <MenuItem value="US500">US500 (S&P)</MenuItem>
              <MenuItem value="NAS100">NAS100</MenuItem>
            </TextField>
          </Box>
          <Divider sx={{ my: { xs: 1, md: 2 } }} />
          <Grid container spacing={{ xs: 1, md: 2 }}>
            {indicators.map((indicator, index) => (
              <Grid item xs={4} sm={4} md={2} key={index}>
                <Box sx={{ 
                  p: { xs: 1, md: 2 }, 
                  borderRadius: 2, 
                  bgcolor: alpha(indicator.color, 0.1),
                  border: `1px solid ${alpha(indicator.color, 0.3)}`,
                  textAlign: 'center',
                  opacity: indicatorsLoading ? 0.7 : 1,
                  transition: 'opacity 0.2s',
                }}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: { xs: '0.6rem', md: '0.75rem' } }}>
                    {indicator.name}
                  </Typography>
                  <Typography variant="body1" fontWeight={600} sx={{ fontSize: { xs: '0.75rem', md: '1rem' } }}>
                    {indicator.value}
                  </Typography>
                  <Chip 
                    label={indicator.signal} 
                    size="small" 
                    sx={{ 
                      mt: { xs: 0.5, md: 1 }, 
                      bgcolor: alpha(indicator.color, 0.2),
                      color: indicator.color,
                      fontWeight: 600,
                      fontSize: { xs: '0.55rem', md: '0.7rem' },
                      height: { xs: 18, md: 24 },
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
        <CardContent sx={{ p: { xs: 1.5, md: 2 }, '&:last-child': { pb: { xs: 1.5, md: 2 } } }}>
          <Tabs 
            value={activeTab} 
            onChange={(_, v) => setActiveTab(v)}
            sx={{ mb: { xs: 2, md: 3 }, borderBottom: 1, borderColor: 'divider' }}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
          >
            <Tab 
              label={
                <Badge badgeContent={activeSignals.length} color="success">
                  <Box sx={{ pr: 2, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>Active Signals</Box>
                </Badge>
              }
              sx={{ minWidth: { xs: 'auto', md: 90 }, px: { xs: 1, md: 2 } }}
            />
            <Tab label="Signal History" sx={{ minWidth: { xs: 'auto', md: 90 }, px: { xs: 1, md: 2 }, fontSize: { xs: '0.75rem', md: '0.875rem' } }} />
            <Tab label="My Alerts" sx={{ minWidth: { xs: 'auto', md: 90 }, px: { xs: 1, md: 2 }, fontSize: { xs: '0.75rem', md: '0.875rem' } }} />
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
                <Grid container spacing={{ xs: 1.5, md: 2 }}>
                  {activeSignals.length === 0 ? (
                    <Grid item xs={12}>
                      <Alert severity="info" sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
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
                          <CardContent sx={{ p: { xs: 1.5, md: 2 }, '&:last-child': { pb: { xs: 1.5, md: 2 } } }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: { xs: 1.5, md: 2 } }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 1.5 } }}>
                                <Box
                                  sx={{
                                    width: { xs: 36, md: 48 },
                                    height: { xs: 36, md: 48 },
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
                                  <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>{signal.symbol}</Typography>
                                  <Chip
                                    label={signal.direction}
                                    size="small"
                                    sx={{
                                      bgcolor: getDirectionColor(signal.direction),
                                      color: '#fff',
                                      fontWeight: 700,
                                      fontSize: { xs: '0.65rem', md: '0.8125rem' },
                                      height: { xs: 20, md: 24 },
                                    }}
                                  />
                                </Box>
                              </Box>
                              <Box sx={{ textAlign: 'right' }}>
                                <Chip label={signal.timeframe} size="small" variant="outlined" sx={{ mb: 0.5, fontSize: { xs: '0.65rem', md: '0.8125rem' }, height: { xs: 20, md: 24 } }} />
                                <Typography variant="caption" display="block" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}>
                                  {signal.strategy}
                                </Typography>
                              </Box>
                            </Box>

                            <Grid container spacing={1} sx={{ mb: { xs: 1.5, md: 2 } }}>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}>Entry</Typography>
                                <Typography variant="body1" fontWeight={600} sx={{ fontSize: { xs: '0.8rem', md: '1rem' } }}>{signal.entryPrice}</Typography>
                              </Grid>
                              <Grid item xs={6}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}>Stop Loss</Typography>
                                <Typography variant="body1" fontWeight={600} color="error.main" sx={{ fontSize: { xs: '0.8rem', md: '1rem' } }}>{signal.stopLoss}</Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}>TP1</Typography>
                                <Typography variant="body2" fontWeight={600} color="success.main" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>{signal.takeProfit1}</Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}>TP2</Typography>
                                <Typography variant="body2" fontWeight={600} color="success.main" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>{signal.takeProfit2}</Typography>
                              </Grid>
                              <Grid item xs={4}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}>TP3</Typography>
                                <Typography variant="body2" fontWeight={600} color="success.main" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>{signal.takeProfit3}</Typography>
                              </Grid>
                            </Grid>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: { xs: 'wrap', sm: 'nowrap' }, gap: { xs: 0.5, md: 0 } }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, md: 1 } }}>
                                <Clock size={14} />
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}>
                                  {new Date(signal.timestamp).toLocaleTimeString()}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, md: 1 } }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}>Confidence:</Typography>
                                <Chip
                                  label={`${signal.confidence}%`}
                                  size="small"
                                  color={signal.confidence >= 85 ? 'success' : signal.confidence >= 70 ? 'warning' : 'default'}
                                  sx={{ fontWeight: 600, fontSize: { xs: '0.65rem', md: '0.8125rem' }, height: { xs: 20, md: 24 } }}
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
                <Box sx={{ overflowX: 'auto' }}>
                  {completedSignals.length === 0 ? (
                    <Alert severity="info" sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}>No signal history available yet.</Alert>
                  ) : (
                    completedSignals.map((signal) => (
                      <Box
                        key={signal.id}
                        sx={{
                          p: { xs: 1.5, md: 2 },
                          mb: 1,
                          borderRadius: 2,
                          bgcolor: 'background.default',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 } }}>
                          {signal.direction === 'BUY' ? (
                            <ArrowUpRight size={20} color="#00C853" />
                          ) : (
                            <ArrowDownRight size={20} color="#FF5252" />
                          )}
                          <Box>
                            <Typography fontWeight={600} sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>{signal.symbol}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}>
                              {signal.strategy} • {signal.timeframe}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip
                          label={signal.status.replace('_', ' ').toUpperCase()}
                          size="small"
                          color={getStatusColor(signal.status) as any}
                          sx={{ fontSize: { xs: '0.65rem', md: '0.8125rem' }, height: { xs: 20, md: 24 } }}
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
                        p: { xs: 1.5, md: 2 },
                        mb: 1,
                        borderRadius: 2,
                        bgcolor: 'background.default',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Box>
                        <Typography fontWeight={600} sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>{setting.type}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}>
                          {setting.conditions.join(' • ')}
                        </Typography>
                      </Box>
                      <Switch
                        checked={setting.enabled}
                        onChange={() => handleAlertToggle(index)}
                        color="success"
                        size="small"
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
      <Dialog 
        open={!!selectedSignal} 
        onClose={() => setSelectedSignal(null)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={typeof window !== 'undefined' && window.innerWidth < 600}
        sx={{
          '& .MuiDialog-paper': {
            m: { xs: 0, sm: 2 },
            maxHeight: { xs: '100%', sm: 'calc(100% - 64px)' },
          }
        }}
      >
        {selectedSignal && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, md: 2 }, fontSize: { xs: '1rem', md: '1.25rem' }, p: { xs: 2, md: 3 } }}>
              <Box
                sx={{
                  width: { xs: 32, md: 40 },
                  height: { xs: 32, md: 40 },
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
            <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
              <Grid container spacing={{ xs: 1.5, md: 2 }}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}>Entry Price</Typography>
                  <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>{selectedSignal.entryPrice}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}>Stop Loss</Typography>
                  <Typography variant="h6" fontWeight={700} color="error.main" sx={{ fontSize: { xs: '1rem', md: '1.25rem' } }}>{selectedSignal.stopLoss}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}>Take Profit 1</Typography>
                  <Typography variant="body1" fontWeight={600} color="success.main" sx={{ fontSize: { xs: '0.8rem', md: '1rem' } }}>{selectedSignal.takeProfit1}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}>Take Profit 2</Typography>
                  <Typography variant="body1" fontWeight={600} color="success.main" sx={{ fontSize: { xs: '0.8rem', md: '1rem' } }}>{selectedSignal.takeProfit2}</Typography>
                </Grid>
                <Grid item xs={4}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}>Take Profit 3</Typography>
                  <Typography variant="body1" fontWeight={600} color="success.main" sx={{ fontSize: { xs: '0.8rem', md: '1rem' } }}>{selectedSignal.takeProfit3}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}>Strategy</Typography>
                  <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>{selectedSignal.strategy}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}>Timeframe</Typography>
                  <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>{selectedSignal.timeframe}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}>Confidence</Typography>
                  <Typography variant="body1" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>{selectedSignal.confidence}%</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}>Generated At</Typography>
                  <Typography variant="body1" sx={{ fontSize: { xs: '0.75rem', md: '1rem' } }}>{new Date(selectedSignal.timestamp).toLocaleString()}</Typography>
                </Grid>
              </Grid>

              <Alert severity="info" sx={{ mt: { xs: 2, md: 3 }, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
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
      <Dialog 
        open={settingsOpen} 
        onClose={() => setSettingsOpen(false)} 
        maxWidth="sm" 
        fullWidth
        fullScreen={typeof window !== 'undefined' && window.innerWidth < 600}
        sx={{
          '& .MuiDialog-paper': {
            m: { xs: 0, sm: 2 },
            maxHeight: { xs: '100%', sm: 'calc(100% - 64px)' },
          }
        }}
      >
        <DialogTitle sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' }, p: { xs: 2, md: 3 } }}>Alert Settings</DialogTitle>
        <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: { xs: 2, md: 3 }, fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
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

          <Typography variant="subtitle2" gutterBottom sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}>Alert Types</Typography>
          {alertSettings.map((setting, index) => (
            <Box
              key={index}
              sx={{
                p: { xs: 1.5, md: 2 },
                mb: 1,
                borderRadius: 2,
                bgcolor: 'background.default',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Box>
                <Typography fontWeight={500} sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>{setting.type}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}>
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
        <DialogActions sx={{ p: { xs: 2, md: 3 } }}>
          <Button onClick={() => setSettingsOpen(false)} sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}>Cancel</Button>
          <Button variant="contained" onClick={() => setSettingsOpen(false)} sx={{ fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
            Save Settings
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
