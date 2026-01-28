'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PullToRefresh from '@/components/PullToRefresh';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Chip,
  LinearProgress,
  Alert,
  AlertTitle,
  Skeleton,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
  Shield,
  RefreshCw,
  BarChart3,
  Target,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';

interface AnalyticsDashboard {
  totalSignals: number;
  today: {
    signals: number;
    trades: number;
    winRate: string;
    profit: string;
  };
  signalsByStrategy: Record<string, number>;
  signalsBySymbol: Record<string, number>;
  strategyPerformance: Record<string, {
    winRate: string;
    totalTrades: number;
  }>;
  killSwitchStatus: {
    active: boolean;
    level: string | null;
    recoveryMode: boolean;
    consecutiveLosses: number;
  };
  protectionStatus: {
    killSwitch: {
      active: boolean;
      level: string | null;
      triggeredAt: string | null;
      recoveryMode: boolean;
      recoveryProgress: string | null;
    };
    equity: {
      peakEquity: number;
      dailyStartEquity: number;
      consecutiveLosses: number;
      sessionLossCount: number;
    };
  };
  profitMaximization?: {
    currentSession: string | null;
    confidenceBoost: number;
    riskMultiplier: number;
    isHighVolume: boolean;
    isLowVolume: boolean;
    htfTrendFilter: string;
    trendStrengthFilter: string;
    momentumExplosion: string;
    profitLock: string;
    reentryLogic: string;
    streaks: Record<string, { consecutiveWins: number; consecutiveLosses: number; lastResult: string }>;
    runnersActive: number;
  };
  config: {
    killSwitch: {
      softDrawdown: string;
      hardDrawdown: string;
      emergencyDrawdown: string;
      maxLossesPerSession: number;
    };
    partialProfit: {
      levels: Array<{ atr: number; closePercent: number; moveSlTo: string }>;
      minProfitDollars: number;
    };
    trailing: {
      activateAfterATR: number;
      baseTrailATR: number;
    };
    equityProtection: {
      minEquityPercent: string;
      maxFloatingLoss: string;
      peakDrawdownLimit: string;
    };
    profitMax?: {
      htfTimeframe: string;
      htfEMAPeriod: number;
      minADXForTrend: number;
      strongTrendADX: number;
      breakevenTriggerATR: number;
      maxReentries: number;
      reentryCooldownMin: number;
    };
    strategyTimeframes?: Array<{
      strategy: string;
      timeframe: string;
      description: string;
      slMultiplier: number;
      tpMultiplier: number;
      maxHoldingPeriod: string;
      tradingHours: string;
    }>;
  };
  activePositions: {
    partial: number;
    trailing: number;
    runners?: number;
  };
  lastUpdated: string;
}

interface StrategyPerformance {
  [key: string]: {
    totalTrades: number;
    wins: number;
    losses: number;
    winRate: string;
    signals: number;
  };
}

export default function AnalyticsPage() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState<AnalyticsDashboard | null>(null);
  const [strategyPerformance, setStrategyPerformance] = useState<StrategyPerformance | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const fetchAnalytics = useCallback(async (showRefresh = false) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    if (showRefresh) setRefreshing(true);

    try {
      const response = await fetch(`${backendUrl}/api/trades/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }

      const data = await response.json();
      setAnalytics(data.dashboard);
      setStrategyPerformance(data.strategyPerformance);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router, backendUrl]);

  useEffect(() => {
    fetchAnalytics();
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => fetchAnalytics(), 30000);
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  const handleResetKillSwitch = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch(`${backendUrl}/api/trades/admin/kill-switch/reset`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        fetchAnalytics(true);
      }
    } catch (err) {
      console.error('Failed to reset kill switch:', err);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
        <Skeleton variant="rectangular" sx={{ mb: 2, borderRadius: 2, height: { xs: 120, sm: 160, md: 200 } }} />
        <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={6} sm={6} md={3} key={i}>
              <Skeleton variant="rectangular" sx={{ borderRadius: 2, height: { xs: 100, sm: 110, md: 120 } }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
        <Alert severity="error">
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      </Box>
    );
  }

  const getKillSwitchColor = () => {
    if (!analytics?.protectionStatus.killSwitch.active) return 'success';
    switch (analytics.protectionStatus.killSwitch.level) {
      case 'emergency': return 'error';
      case 'hard': return 'error';
      case 'soft': return 'warning';
      default: return 'success';
    }
  };

  const getKillSwitchIcon = () => {
    if (!analytics?.protectionStatus.killSwitch.active) return <CheckCircle />;
    switch (analytics.protectionStatus.killSwitch.level) {
      case 'emergency': return <AlertTriangle />;
      case 'hard': return <XCircle />;
      case 'soft': return <AlertCircle />;
      default: return <CheckCircle />;
    }
  };

  return (
    <PullToRefresh onRefresh={() => fetchAnalytics(true)}>
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, overflow: 'hidden', maxWidth: '100vw' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: { xs: 2, sm: 3 }, gap: { xs: 1, sm: 0 } }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' } }}>
            📊 Signal Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
            Real-time strategy performance and protection system status
          </Typography>
        </Box>
        <IconButton
          onClick={() => fetchAnalytics(true)}
          disabled={refreshing}
          sx={{ bgcolor: 'background.paper' }}
        >
          <RefreshCw className={refreshing ? 'animate-spin' : ''} />
        </IconButton>
      </Box>

      {/* Kill Switch Status Banner */}
      {analytics?.protectionStatus.killSwitch.active && (
        <Alert
          severity={analytics.protectionStatus.killSwitch.level === 'emergency' ? 'error' : 'warning'}
          sx={{ mb: { xs: 2, sm: 3 }, '& .MuiAlert-message': { fontSize: { xs: '0.8rem', sm: '0.875rem' } } }}
          action={
            <Button color="inherit" size="small" onClick={handleResetKillSwitch}>
              RESET
            </Button>
          }
        >
          <AlertTitle>
            🛡️ Kill Switch Active - {analytics.protectionStatus.killSwitch.level?.toUpperCase()}
          </AlertTitle>
          {analytics.protectionStatus.killSwitch.recoveryMode
            ? `Recovery Mode: ${analytics.protectionStatus.killSwitch.recoveryProgress}`
            : `Trading paused due to ${analytics.protectionStatus.killSwitch.level} drawdown limit`}
        </Alert>
      )}

      {/* Today's Stats */}
      <Grid container spacing={{ xs: 1, sm: 2, md: 3 }} sx={{ mb: { xs: 2, sm: 3 } }}>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', minWidth: 0 }}>
            <CardContent sx={{ p: { xs: 1, sm: 2 }, '&:last-child': { pb: { xs: 1, sm: 2 } } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 0.5, sm: 1 } }}>
                <Zap size={14} color="white" />
                <Typography variant="body2" sx={{ ml: 0.5, color: 'rgba(255,255,255,0.8)', fontSize: { xs: '0.6rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}>
                  Signals Today
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold" color="white" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' } }}>
                {analytics?.today.signals || 0}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: { xs: '0.55rem', sm: '0.75rem' } }}>
                Total: {analytics?.totalSignals || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', minWidth: 0 }}>
            <CardContent sx={{ p: { xs: 1, sm: 2 }, '&:last-child': { pb: { xs: 1, sm: 2 } } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 0.5, sm: 1 } }}>
                <Target size={14} color="white" />
                <Typography variant="body2" sx={{ ml: 0.5, color: 'rgba(255,255,255,0.8)', fontSize: { xs: '0.6rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}>
                  Trades Today
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold" color="white" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' } }}>
                {analytics?.today.trades || 0}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: { xs: '0.55rem', sm: '0.75rem' } }}>
                Win Rate: {analytics?.today.winRate || 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ height: '100%', background: parseFloat(analytics?.today.profit || '0') >= 0 
            ? 'linear-gradient(135deg, #00b09b 0%, #96c93d 100%)'
            : 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)', minWidth: 0
          }}>
            <CardContent sx={{ p: { xs: 1, sm: 2 }, '&:last-child': { pb: { xs: 1, sm: 2 } } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 0.5, sm: 1 } }}>
                {parseFloat(analytics?.today.profit || '0') >= 0 ? (
                  <TrendingUp size={14} color="white" />
                ) : (
                  <TrendingDown size={14} color="white" />
                )}
                <Typography variant="body2" sx={{ ml: 0.5, color: 'rgba(255,255,255,0.8)', fontSize: { xs: '0.6rem', sm: '0.875rem' }, whiteSpace: 'nowrap' }}>
                  Today's P&L
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold" color="white" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '3rem' } }}>
                ${analytics?.today.profit || '0.00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ height: '100%', minWidth: 0 }}>
            <CardContent sx={{ p: { xs: 1, sm: 2 }, '&:last-child': { pb: { xs: 1, sm: 2 } } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 0.5, sm: 1 }, flexWrap: 'wrap' }}>
                {getKillSwitchIcon()}
                <Typography variant="body2" sx={{ ml: 0.5, fontSize: { xs: '0.55rem', sm: '0.875rem' } }} color="text.secondary">
                  Protection Status
                </Typography>
              </Box>
              <Chip
                label={analytics?.protectionStatus.killSwitch.active 
                  ? `${analytics.protectionStatus.killSwitch.level?.toUpperCase()} ACTIVE`
                  : 'NORMAL'}
                color={getKillSwitchColor()}
                sx={{ fontWeight: 'bold', mt: { xs: 0.5, sm: 1 }, fontSize: { xs: '0.55rem', sm: '0.8125rem' } }}
                size="small"
              />
              <Typography variant="caption" display="block" sx={{ mt: { xs: 0.5, sm: 1 }, fontSize: { xs: '0.5rem', sm: '0.75rem' } }} color="text.secondary">
                Losses: {analytics?.protectionStatus.equity.consecutiveLosses || 0} consecutive
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Strategy Performance & Active Positions */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} sx={{ mb: { xs: 2, sm: 3 } }}>
        {/* Strategy Performance Table */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                📈 Strategy Performance
              </Typography>
              <TableContainer sx={{ maxWidth: '100%', overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: { xs: 400, sm: 'auto' } }}>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, p: { xs: 1, sm: 2 } }}>Strategy</TableCell>
                      <TableCell align="center" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, p: { xs: 1, sm: 2 } }}>Signals</TableCell>
                      <TableCell align="center" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, p: { xs: 1, sm: 2 } }}>Trades</TableCell>
                      <TableCell align="center" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, p: { xs: 1, sm: 2 } }}>Win Rate</TableCell>
                      <TableCell align="center" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, p: { xs: 1, sm: 2 } }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {strategyPerformance && Object.entries(strategyPerformance).map(([strategy, stats]) => (
                      <TableRow key={strategy} hover>
                        <TableCell sx={{ p: { xs: 1, sm: 2 } }}>
                          <Typography variant="body2" fontWeight="medium" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                            {strategy}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ p: { xs: 1, sm: 2 }, fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                          {stats.signals || 0}
                        </TableCell>
                        <TableCell align="center" sx={{ p: { xs: 1, sm: 2 }, fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>
                          {stats.totalTrades}
                        </TableCell>
                        <TableCell align="center" sx={{ p: { xs: 1, sm: 2 } }}>
                          <Chip
                            label={stats.winRate}
                            size="small"
                            color={parseFloat(stats.winRate) >= 60 ? 'success' : parseFloat(stats.winRate) >= 50 ? 'warning' : 'error'}
                            variant="outlined"
                            sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' }, height: { xs: 20, sm: 24 } }}
                          />
                        </TableCell>
                        <TableCell align="center" sx={{ p: { xs: 1, sm: 2 } }}>
                          <Chip
                            label={stats.totalTrades > 10 ? 'Active' : 'Limited Data'}
                            size="small"
                            color={stats.totalTrades > 10 ? 'success' : 'default'}
                            sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' }, height: { xs: 20, sm: 24 } }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!strategyPerformance || Object.keys(strategyPerformance).length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography variant="body2" color="text.secondary">
                            No strategy data yet. Trading needs to be active.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Position Management */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                🎯 Active Management
              </Typography>
              
              <Box sx={{ mb: { xs: 1.5, sm: 2 } }}>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Partial Profit Active
                </Typography>
                <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
                  {analytics?.activePositions.partial || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                  positions with partial closes pending
                </Typography>
              </Box>

              <Divider sx={{ my: { xs: 1.5, sm: 2 } }} />

              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Smart Trailing Active
                </Typography>
                <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>
                  {analytics?.activePositions.trailing || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                  positions being trailed
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Protection Configuration */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }}>
        {/* Profit Maximization Status - New Section */}
        <Grid item xs={12}>
          <Card sx={{ background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.1) 0%, rgba(76, 175, 80, 0.1) 100%)' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                🚀 Profit Maximization Engine
                <Chip 
                  label={analytics?.profitMaximization?.isHighVolume ? 'HIGH VOLUME SESSION' : analytics?.profitMaximization?.isLowVolume ? 'LOW VOLUME' : 'NORMAL'} 
                  color={analytics?.profitMaximization?.isHighVolume ? 'success' : analytics?.profitMaximization?.isLowVolume ? 'warning' : 'default'}
                  size="small"
                  sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                />
              </Typography>
              
              <Grid container spacing={{ xs: 1, sm: 2 }}>
                {/* Current Session */}
                <Grid item xs={6} sm={6} md={3}>
                  <Box sx={{ p: { xs: 1, sm: 2 }, borderRadius: 2, bgcolor: 'background.paper' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>Current Session</Typography>
                    <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '0.9rem', sm: '1.25rem' } }}>
                      {analytics?.profitMaximization?.currentSession || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>
                      Confidence boost: +{analytics?.profitMaximization?.confidenceBoost || 0}%
                    </Typography>
                  </Box>
                </Grid>

                {/* Active Filters */}
                <Grid item xs={6} sm={6} md={3}>
                  <Box sx={{ p: { xs: 1, sm: 2 }, borderRadius: 2, bgcolor: 'background.paper' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>Active Filters</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      <Chip 
                        label="HTF Trend" 
                        size="small" 
                        color={analytics?.profitMaximization?.htfTrendFilter === 'Active' ? 'success' : 'default'}
                        variant={analytics?.profitMaximization?.htfTrendFilter === 'Active' ? 'filled' : 'outlined'}
                        sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' }, height: { xs: 20, sm: 24 } }}
                      />
                      <Chip 
                        label="ADX" 
                        size="small" 
                        color={analytics?.profitMaximization?.trendStrengthFilter === 'Active' ? 'success' : 'default'}
                        variant={analytics?.profitMaximization?.trendStrengthFilter === 'Active' ? 'filled' : 'outlined'}
                        sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' }, height: { xs: 20, sm: 24 } }}
                      />
                      <Chip 
                        label="Momentum" 
                        size="small" 
                        color={analytics?.profitMaximization?.momentumExplosion === 'Active' ? 'success' : 'default'}
                        variant={analytics?.profitMaximization?.momentumExplosion === 'Active' ? 'filled' : 'outlined'}
                        sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' }, height: { xs: 20, sm: 24 } }}
                      />
                    </Box>
                  </Box>
                </Grid>

                {/* Profit Protection */}
                <Grid item xs={6} sm={6} md={3}>
                  <Box sx={{ p: { xs: 1, sm: 2 }, borderRadius: 2, bgcolor: 'background.paper' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>Profit Protection</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      <Chip 
                        label="Profit Lock" 
                        size="small" 
                        color={analytics?.profitMaximization?.profitLock === 'Active' ? 'success' : 'default'}
                        variant={analytics?.profitMaximization?.profitLock === 'Active' ? 'filled' : 'outlined'}
                        sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' }, height: { xs: 20, sm: 24 } }}
                      />
                      <Chip 
                        label="Re-entry" 
                        size="small" 
                        color={analytics?.profitMaximization?.reentryLogic === 'Active' ? 'success' : 'default'}
                        variant={analytics?.profitMaximization?.reentryLogic === 'Active' ? 'filled' : 'outlined'}
                        sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' }, height: { xs: 20, sm: 24 } }}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>
                      Runners active: {analytics?.activePositions?.runners || 0}
                    </Typography>
                  </Box>
                </Grid>

                {/* Streak Status */}
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ p: { xs: 1, sm: 2 }, borderRadius: 2, bgcolor: 'background.paper' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' } }}>Symbol Streaks</Typography>
                    {analytics?.profitMaximization?.streaks && Object.keys(analytics.profitMaximization.streaks).length > 0 ? (
                      Object.entries(analytics.profitMaximization.streaks).map(([symbol, streak]) => (
                        <Box key={symbol} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>{symbol}</Typography>
                          <Box>
                            {streak.consecutiveWins > 0 && (
                              <Chip label={`${streak.consecutiveWins}W`} size="small" color="success" sx={{ height: { xs: 16, sm: 20 }, fontSize: { xs: '0.55rem', sm: '0.65rem' } }} />
                            )}
                            {streak.consecutiveLosses > 0 && (
                              <Chip label={`${streak.consecutiveLosses}L`} size="small" color="error" sx={{ height: { xs: 16, sm: 20 }, fontSize: { xs: '0.55rem', sm: '0.65rem' } }} />
                            )}
                          </Box>
                        </Box>
                      ))
                    ) : (
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>No streak data yet</Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                🛡️ Kill Switch Config
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.75, sm: 1 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Soft Drawdown</Typography>
                  <Chip label={analytics?.config.killSwitch.softDrawdown} size="small" color="warning" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, height: { xs: 20, sm: 24 } }} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Hard Drawdown</Typography>
                  <Chip label={analytics?.config.killSwitch.hardDrawdown} size="small" color="error" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, height: { xs: 20, sm: 24 } }} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Emergency</Typography>
                  <Chip label={analytics?.config.killSwitch.emergencyDrawdown} size="small" color="error" variant="filled" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, height: { xs: 20, sm: 24 } }} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Max Session Losses</Typography>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>{analytics?.config.killSwitch.maxLossesPerSession}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                📈 Partial Profit Levels
              </Typography>
              {analytics?.config.partialProfit.levels.map((level, idx) => (
                <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: { xs: 0.75, sm: 1 } }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    +{level.atr} ATR
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Chip label={`${(level.closePercent * 100).toFixed(0)}%`} size="small" sx={{ mr: 0.5, fontSize: { xs: '0.65rem', sm: '0.75rem' }, height: { xs: 20, sm: 24 } }} />
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                      SL → {level.moveSlTo}
                    </Typography>
                  </Box>
                </Box>
              ))}
              <Divider sx={{ my: { xs: 0.75, sm: 1 } }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                Min profit: ${analytics?.config.partialProfit.minProfitDollars}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                💎 Equity Protection
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 0.75, sm: 1 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Min Equity</Typography>
                  <Chip label={analytics?.config.equityProtection.minEquityPercent} size="small" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, height: { xs: 20, sm: 24 } }} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Max Floating Loss</Typography>
                  <Chip label={analytics?.config.equityProtection.maxFloatingLoss} size="small" color="warning" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, height: { xs: 20, sm: 24 } }} />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Peak Drawdown Limit</Typography>
                  <Chip label={analytics?.config.equityProtection.peakDrawdownLimit} size="small" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, height: { xs: 20, sm: 24 } }} />
                </Box>
              </Box>
              <Divider sx={{ my: { xs: 0.75, sm: 1 } }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                Trailing activates after {analytics?.config.trailing.activateAfterATR} ATR profit
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Multi-Timeframe Strategy Configuration */}
        <Grid item xs={12}>
          <Card sx={{ background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(66, 165, 245, 0.05) 100%)' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                📊 Multi-Timeframe Strategy Engine
                <Chip label="8 Strategies" color="primary" size="small" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }} />
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: { xs: 1.5, sm: 2 }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Each strategy operates on its optimal timeframe to capture different market moves
              </Typography>
              
              <TableContainer component={Paper} variant="outlined" sx={{ maxWidth: '100%', overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: { xs: 550, sm: 650, md: 'auto' } }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, p: { xs: 0.75, sm: 1, md: 2 } }}><strong>Strategy</strong></TableCell>
                      <TableCell align="center" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, p: { xs: 0.75, sm: 1, md: 2 } }}><strong>Timeframe</strong></TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, p: { xs: 0.75, sm: 1, md: 2 }, display: { xs: 'none', sm: 'table-cell' } }}><strong>Description</strong></TableCell>
                      <TableCell align="center" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, p: { xs: 0.75, sm: 1, md: 2 } }}><strong>SL/TP</strong></TableCell>
                      <TableCell align="center" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, p: { xs: 0.75, sm: 1, md: 2 } }}><strong>Max Hold</strong></TableCell>
                      <TableCell align="center" sx={{ fontSize: { xs: '0.7rem', sm: '0.875rem' }, p: { xs: 0.75, sm: 1, md: 2 }, display: { xs: 'none', md: 'table-cell' } }}><strong>Trading Hours</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analytics?.config.strategyTimeframes?.map((strat) => (
                      <TableRow key={strat.strategy} hover>
                        <TableCell sx={{ p: { xs: 0.75, sm: 1, md: 2 } }}>
                          <Typography variant="body2" fontWeight="medium" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' } }}>
                            {strat.strategy}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ p: { xs: 0.75, sm: 1, md: 2 } }}>
                          <Chip 
                            label={strat.timeframe.toUpperCase()} 
                            size="small" 
                            color={
                              strat.timeframe === 'm1' || strat.timeframe === 'm5' ? 'error' :
                              strat.timeframe === 'm15' || strat.timeframe === 'm30' ? 'warning' :
                              strat.timeframe === 'h1' ? 'info' : 'success'
                            }
                            variant="filled"
                            sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, height: { xs: 18, sm: 24 } }}
                          />
                        </TableCell>
                        <TableCell sx={{ p: { xs: 0.75, sm: 1, md: 2 }, display: { xs: 'none', sm: 'table-cell' } }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>
                            {strat.description}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ p: { xs: 0.75, sm: 1, md: 2 } }}>
                          <Typography variant="caption" sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>
                            {strat.slMultiplier}x / {strat.tpMultiplier}x ATR
                          </Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ p: { xs: 0.75, sm: 1, md: 2 } }}>
                          <Typography variant="caption" sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>
                            {strat.maxHoldingPeriod}
                          </Typography>
                        </TableCell>
                        <TableCell align="center" sx={{ p: { xs: 0.75, sm: 1, md: 2 }, display: { xs: 'none', md: 'table-cell' } }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>
                            {strat.tradingHours}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )) || (
                      <TableRow>
                        <TableCell colSpan={6} align="center">
                          <Typography variant="body2" color="text.secondary">
                            Loading strategy timeframes...
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mt: { xs: 1.5, sm: 2 }, display: 'flex', flexWrap: 'wrap', gap: { xs: 0.5, sm: 1 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Chip label="M1-M5" size="small" color="error" variant="filled" sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' }, height: { xs: 18, sm: 24 } }} />
                  <Typography variant="caption" sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>Scalping</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Chip label="M15-M30" size="small" color="warning" variant="filled" sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' }, height: { xs: 18, sm: 24 } }} />
                  <Typography variant="caption" sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>Intraday</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Chip label="H1" size="small" color="info" variant="filled" sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' }, height: { xs: 18, sm: 24 } }} />
                  <Typography variant="caption" sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>Day Trading</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Chip label="H4" size="small" color="success" variant="filled" sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' }, height: { xs: 18, sm: 24 } }} />
                  <Typography variant="caption" sx={{ fontSize: { xs: '0.6rem', sm: '0.75rem' } }}>Swing Trading</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Last Updated */}
      <Box sx={{ mt: { xs: 2, sm: 3 }, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
          <Clock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          Last updated: {analytics?.lastUpdated ? new Date(analytics.lastUpdated).toLocaleString() : 'N/A'}
        </Typography>
      </Box>
    </Box>
    </PullToRefresh>
  );
}
