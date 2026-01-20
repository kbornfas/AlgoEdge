'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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

  const fetchAnalytics = useCallback(async (showRefresh = false) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    if (showRefresh) setRefreshing(true);

    try {
      const response = await fetch('/api/trades/analytics', {
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
  }, [router]);

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
      const response = await fetch('/api/trades/admin/kill-switch/reset', {
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
      <Box sx={{ p: 3 }}>
        <Skeleton variant="rectangular" height={200} sx={{ mb: 2, borderRadius: 2 }} />
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
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
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            📊 Signal Analytics
          </Typography>
          <Typography variant="body2" color="text.secondary">
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
          sx={{ mb: 3 }}
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
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Zap size={20} color="white" />
                <Typography variant="body2" sx={{ ml: 1, color: 'rgba(255,255,255,0.8)' }}>
                  Signals Today
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold" color="white">
                {analytics?.today.signals || 0}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Total: {analytics?.totalSignals || 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Target size={20} color="white" />
                <Typography variant="body2" sx={{ ml: 1, color: 'rgba(255,255,255,0.8)' }}>
                  Trades Today
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold" color="white">
                {analytics?.today.trades || 0}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Win Rate: {analytics?.today.winRate || 'N/A'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%', background: parseFloat(analytics?.today.profit || '0') >= 0 
            ? 'linear-gradient(135deg, #00b09b 0%, #96c93d 100%)'
            : 'linear-gradient(135deg, #eb3349 0%, #f45c43 100%)' 
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                {parseFloat(analytics?.today.profit || '0') >= 0 ? (
                  <TrendingUp size={20} color="white" />
                ) : (
                  <TrendingDown size={20} color="white" />
                )}
                <Typography variant="body2" sx={{ ml: 1, color: 'rgba(255,255,255,0.8)' }}>
                  Today's P&L
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold" color="white">
                ${analytics?.today.profit || '0.00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                {getKillSwitchIcon()}
                <Typography variant="body2" sx={{ ml: 1 }} color="text.secondary">
                  Protection Status
                </Typography>
              </Box>
              <Chip
                label={analytics?.protectionStatus.killSwitch.active 
                  ? `${analytics.protectionStatus.killSwitch.level?.toUpperCase()} ACTIVE`
                  : 'NORMAL'}
                color={getKillSwitchColor()}
                sx={{ fontWeight: 'bold', mt: 1 }}
              />
              <Typography variant="caption" display="block" sx={{ mt: 1 }} color="text.secondary">
                Losses: {analytics?.protectionStatus.equity.consecutiveLosses || 0} consecutive
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Strategy Performance & Active Positions */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Strategy Performance Table */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                📈 Strategy Performance
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Strategy</TableCell>
                      <TableCell align="center">Signals</TableCell>
                      <TableCell align="center">Trades</TableCell>
                      <TableCell align="center">Win Rate</TableCell>
                      <TableCell align="center">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {strategyPerformance && Object.entries(strategyPerformance).map(([strategy, stats]) => (
                      <TableRow key={strategy} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {strategy}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          {stats.signals || 0}
                        </TableCell>
                        <TableCell align="center">
                          {stats.totalTrades}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={stats.winRate}
                            size="small"
                            color={parseFloat(stats.winRate) >= 60 ? 'success' : parseFloat(stats.winRate) >= 50 ? 'warning' : 'error'}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            label={stats.totalTrades > 10 ? 'Active' : 'Limited Data'}
                            size="small"
                            color={stats.totalTrades > 10 ? 'success' : 'default'}
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
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                🎯 Active Management
              </Typography>
              
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Partial Profit Active
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {analytics?.activePositions.partial || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  positions with partial closes pending
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Smart Trailing Active
                </Typography>
                <Typography variant="h4" fontWeight="bold">
                  {analytics?.activePositions.trailing || 0}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  positions being trailed
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Protection Configuration */}
      <Grid container spacing={3}>
        {/* Profit Maximization Status - New Section */}
        <Grid item xs={12}>
          <Card sx={{ background: 'linear-gradient(135deg, rgba(46, 125, 50, 0.1) 0%, rgba(76, 175, 80, 0.1) 100%)' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                🚀 Profit Maximization Engine
                <Chip 
                  label={analytics?.profitMaximization?.isHighVolume ? 'HIGH VOLUME SESSION' : analytics?.profitMaximization?.isLowVolume ? 'LOW VOLUME' : 'NORMAL'} 
                  color={analytics?.profitMaximization?.isHighVolume ? 'success' : analytics?.profitMaximization?.isLowVolume ? 'warning' : 'default'}
                  size="small"
                />
              </Typography>
              
              <Grid container spacing={2}>
                {/* Current Session */}
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper' }}>
                    <Typography variant="body2" color="text.secondary">Current Session</Typography>
                    <Typography variant="h6" fontWeight="bold">
                      {analytics?.profitMaximization?.currentSession || 'N/A'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Confidence boost: +{analytics?.profitMaximization?.confidenceBoost || 0}%
                    </Typography>
                  </Box>
                </Grid>

                {/* Active Filters */}
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>Active Filters</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      <Chip 
                        label="HTF Trend" 
                        size="small" 
                        color={analytics?.profitMaximization?.htfTrendFilter === 'Active' ? 'success' : 'default'}
                        variant={analytics?.profitMaximization?.htfTrendFilter === 'Active' ? 'filled' : 'outlined'}
                      />
                      <Chip 
                        label="ADX" 
                        size="small" 
                        color={analytics?.profitMaximization?.trendStrengthFilter === 'Active' ? 'success' : 'default'}
                        variant={analytics?.profitMaximization?.trendStrengthFilter === 'Active' ? 'filled' : 'outlined'}
                      />
                      <Chip 
                        label="Momentum" 
                        size="small" 
                        color={analytics?.profitMaximization?.momentumExplosion === 'Active' ? 'success' : 'default'}
                        variant={analytics?.profitMaximization?.momentumExplosion === 'Active' ? 'filled' : 'outlined'}
                      />
                    </Box>
                  </Box>
                </Grid>

                {/* Profit Protection */}
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>Profit Protection</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      <Chip 
                        label="Profit Lock" 
                        size="small" 
                        color={analytics?.profitMaximization?.profitLock === 'Active' ? 'success' : 'default'}
                        variant={analytics?.profitMaximization?.profitLock === 'Active' ? 'filled' : 'outlined'}
                      />
                      <Chip 
                        label="Re-entry" 
                        size="small" 
                        color={analytics?.profitMaximization?.reentryLogic === 'Active' ? 'success' : 'default'}
                        variant={analytics?.profitMaximization?.reentryLogic === 'Active' ? 'filled' : 'outlined'}
                      />
                    </Box>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      Runners active: {analytics?.activePositions?.runners || 0}
                    </Typography>
                  </Box>
                </Grid>

                {/* Streak Status */}
                <Grid item xs={12} sm={6} md={3}>
                  <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'background.paper' }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>Symbol Streaks</Typography>
                    {analytics?.profitMaximization?.streaks && Object.keys(analytics.profitMaximization.streaks).length > 0 ? (
                      Object.entries(analytics.profitMaximization.streaks).map(([symbol, streak]) => (
                        <Box key={symbol} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption">{symbol}</Typography>
                          <Box>
                            {streak.consecutiveWins > 0 && (
                              <Chip label={`${streak.consecutiveWins}W`} size="small" color="success" sx={{ height: 20, fontSize: '0.65rem' }} />
                            )}
                            {streak.consecutiveLosses > 0 && (
                              <Chip label={`${streak.consecutiveLosses}L`} size="small" color="error" sx={{ height: 20, fontSize: '0.65rem' }} />
                            )}
                          </Box>
                        </Box>
                      ))
                    ) : (
                      <Typography variant="caption" color="text.secondary">No streak data yet</Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                🛡️ Kill Switch Config
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Soft Drawdown</Typography>
                  <Chip label={analytics?.config.killSwitch.softDrawdown} size="small" color="warning" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Hard Drawdown</Typography>
                  <Chip label={analytics?.config.killSwitch.hardDrawdown} size="small" color="error" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Emergency</Typography>
                  <Chip label={analytics?.config.killSwitch.emergencyDrawdown} size="small" color="error" variant="filled" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Max Session Losses</Typography>
                  <Typography variant="body2">{analytics?.config.killSwitch.maxLossesPerSession}</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                📈 Partial Profit Levels
              </Typography>
              {analytics?.config.partialProfit.levels.map((level, idx) => (
                <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    +{level.atr} ATR
                  </Typography>
                  <Box>
                    <Chip label={`${(level.closePercent * 100).toFixed(0)}%`} size="small" sx={{ mr: 0.5 }} />
                    <Typography variant="caption" color="text.secondary">
                      SL → {level.moveSlTo}
                    </Typography>
                  </Box>
                </Box>
              ))}
              <Divider sx={{ my: 1 }} />
              <Typography variant="caption" color="text.secondary">
                Min profit: ${analytics?.config.partialProfit.minProfitDollars}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                💎 Equity Protection
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Min Equity</Typography>
                  <Chip label={analytics?.config.equityProtection.minEquityPercent} size="small" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Max Floating Loss</Typography>
                  <Chip label={analytics?.config.equityProtection.maxFloatingLoss} size="small" color="warning" />
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="body2" color="text.secondary">Peak Drawdown Limit</Typography>
                  <Chip label={analytics?.config.equityProtection.peakDrawdownLimit} size="small" />
                </Box>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Typography variant="caption" color="text.secondary">
                Trailing activates after {analytics?.config.trailing.activateAfterATR} ATR profit
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Multi-Timeframe Strategy Configuration */}
        <Grid item xs={12}>
          <Card sx={{ background: 'linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(66, 165, 245, 0.05) 100%)' }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                📊 Multi-Timeframe Strategy Engine
                <Chip label="8 Strategies" color="primary" size="small" />
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Each strategy operates on its optimal timeframe to capture different market moves
              </Typography>
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'action.hover' }}>
                      <TableCell><strong>Strategy</strong></TableCell>
                      <TableCell align="center"><strong>Timeframe</strong></TableCell>
                      <TableCell><strong>Description</strong></TableCell>
                      <TableCell align="center"><strong>SL/TP</strong></TableCell>
                      <TableCell align="center"><strong>Max Hold</strong></TableCell>
                      <TableCell align="center"><strong>Trading Hours</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analytics?.config.strategyTimeframes?.map((strat) => (
                      <TableRow key={strat.strategy} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {strat.strategy}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Chip 
                            label={strat.timeframe.toUpperCase()} 
                            size="small" 
                            color={
                              strat.timeframe === 'm1' || strat.timeframe === 'm5' ? 'error' :
                              strat.timeframe === 'm15' || strat.timeframe === 'm30' ? 'warning' :
                              strat.timeframe === 'h1' ? 'info' : 'success'
                            }
                            variant="filled"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption" color="text.secondary">
                            {strat.description}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="caption">
                            {strat.slMultiplier}x / {strat.tpMultiplier}x ATR
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="caption">
                            {strat.maxHoldingPeriod}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="caption" color="text.secondary">
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

              <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Chip label="M1-M5" size="small" color="error" variant="filled" />
                  <Typography variant="caption">Scalping</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Chip label="M15-M30" size="small" color="warning" variant="filled" />
                  <Typography variant="caption">Intraday</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Chip label="H1" size="small" color="info" variant="filled" />
                  <Typography variant="caption">Day Trading</Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Chip label="H4" size="small" color="success" variant="filled" />
                  <Typography variant="caption">Swing Trading</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Last Updated */}
      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          <Clock size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          Last updated: {analytics?.lastUpdated ? new Date(analytics.lastUpdated).toLocaleString() : 'N/A'}
        </Typography>
      </Box>
    </Box>
  );
}
