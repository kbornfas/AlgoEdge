'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  Slider,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
} from '@mui/material';
import {
  Bot,
  Play,
  Square,
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  Brain,
  BarChart3,
  X,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

// All available timeframes
const ALL_TIMEFRAMES = ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1', 'W1'];

interface Robot {
  id: string;
  name: string;
  description: string;
  strategy: string;
  timeframe: string;
  timeframes: string[];
  pairs: string[];
  riskLevel: string;
  winRate: number;
  isActive: boolean;
}

interface Trade {
  id: string;
  pair: string;
  type: 'BUY' | 'SELL';
  volume: number;
  openPrice: number;
  currentPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  profit: number;
  status: 'OPEN' | 'CLOSED' | 'PENDING';
  openTime: string;
  closeTime?: string;
  robotId?: string;
  robotName?: string;
}

interface RobotConfig {
  robotId: string;
  selectedTimeframe: string;
  selectedPairs: string[];
  riskPercent: number;
  isRunning: boolean;
}

// Default robots with all timeframes
const getDefaultRobots = (): Robot[] => [
  {
    id: 'algoedge-scalper',
    name: 'AlgoEdge Scalper',
    description: 'Ultra-fast scalping bot with AI-powered entry signals for volatile markets.',
    strategy: 'Scalping',
    timeframe: 'M1',
    timeframes: ['M1', 'M5'],
    pairs: ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD'],
    riskLevel: 'High',
    winRate: 73.5,
    isActive: true,
  },
  {
    id: 'algoedge-momentum',
    name: 'AlgoEdge Momentum',
    description: 'Momentum-based trading using RSI and MACD divergence for quick profits.',
    strategy: 'Momentum',
    timeframe: 'M5',
    timeframes: ['M5', 'M15'],
    pairs: ['EURUSD', 'GBPUSD', 'AUDUSD', 'USDCHF', 'XAUUSD'],
    riskLevel: 'High',
    winRate: 71.8,
    isActive: true,
  },
  {
    id: 'algoedge-trend-m15',
    name: 'AlgoEdge Trend Hunter',
    description: 'Smart trend-following robot using EMA crossovers and ADX filters.',
    strategy: 'Trend Following',
    timeframe: 'M15',
    timeframes: ['M15', 'M30', 'H1'],
    pairs: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'NZDUSD', 'XAUUSD'],
    riskLevel: 'Medium',
    winRate: 76.2,
    isActive: true,
  },
  {
    id: 'algoedge-breakout',
    name: 'AlgoEdge Breakout Pro',
    description: 'Identifies key support/resistance levels and trades breakouts.',
    strategy: 'Breakout',
    timeframe: 'M30',
    timeframes: ['M30', 'H1', 'H4'],
    pairs: ['EURUSD', 'GBPUSD', 'USDJPY', 'EURJPY', 'GBPJPY', 'XAUUSD'],
    riskLevel: 'Medium',
    winRate: 74.9,
    isActive: true,
  },
  {
    id: 'algoedge-swing-h1',
    name: 'AlgoEdge Swing Master',
    description: 'Swing trading system for capturing larger market moves over hours/days.',
    strategy: 'Swing Trading',
    timeframe: 'H1',
    timeframes: ['H1', 'H4', 'D1'],
    pairs: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'XAUUSD', 'XAGUSD'],
    riskLevel: 'Low',
    winRate: 79.3,
    isActive: true,
  },
  {
    id: 'algoedge-gold-hunter',
    name: 'AlgoEdge Gold Hunter',
    description: 'Specialized robot for XAUUSD with volatility-based entries.',
    strategy: 'Gold Trading',
    timeframe: 'H1',
    timeframes: ['M15', 'M30', 'H1', 'H4'],
    pairs: ['XAUUSD'],
    riskLevel: 'Medium',
    winRate: 77.6,
    isActive: true,
  },
  {
    id: 'algoedge-position-h4',
    name: 'AlgoEdge Position Trader',
    description: 'Long-term position trading robot for capturing major market trends.',
    strategy: 'Position Trading',
    timeframe: 'H4',
    timeframes: ['H4', 'D1', 'W1'],
    pairs: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCHF', 'NZDUSD', 'XAUUSD'],
    riskLevel: 'Low',
    winRate: 82.1,
    isActive: true,
  },
  {
    id: 'algoedge-daily-sniper',
    name: 'AlgoEdge Daily Sniper',
    description: 'Precision entries on daily charts with exceptionally high win rate.',
    strategy: 'Daily Trading',
    timeframe: 'D1',
    timeframes: ['D1', 'W1'],
    pairs: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'EURJPY', 'XAUUSD'],
    riskLevel: 'Low',
    winRate: 84.5,
    isActive: true,
  },
  {
    id: 'algoedge-grid-master',
    name: 'AlgoEdge Grid Master',
    description: 'Advanced grid trading system for ranging markets with auto grid sizing.',
    strategy: 'Grid Trading',
    timeframe: 'H1',
    timeframes: ['M30', 'H1', 'H4'],
    pairs: ['EURUSD', 'GBPUSD', 'AUDUSD', 'USDCHF'],
    riskLevel: 'Medium',
    winRate: 75.4,
    isActive: true,
  },
  {
    id: 'algoedge-news-trader',
    name: 'AlgoEdge News Trader',
    description: 'Capitalizes on high-impact news events with smart entry timing.',
    strategy: 'News Trading',
    timeframe: 'M5',
    timeframes: ['M1', 'M5', 'M15'],
    pairs: ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD'],
    riskLevel: 'High',
    winRate: 69.8,
    isActive: true,
  },
  {
    id: 'algoedge-martingale-pro',
    name: 'AlgoEdge Martingale Pro',
    description: 'Smart martingale with AI-based recovery zones and risk controls.',
    strategy: 'Martingale',
    timeframe: 'M15',
    timeframes: ['M15', 'M30', 'H1'],
    pairs: ['EURUSD', 'GBPUSD', 'USDJPY'],
    riskLevel: 'High',
    winRate: 71.2,
    isActive: true,
  },
  {
    id: 'algoedge-hedge-guardian',
    name: 'AlgoEdge Hedge Guardian',
    description: 'Hedging robot that minimizes drawdown with counter-positions.',
    strategy: 'Hedging',
    timeframe: 'H4',
    timeframes: ['H1', 'H4', 'D1'],
    pairs: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'XAUUSD'],
    riskLevel: 'Low',
    winRate: 78.9,
    isActive: true,
  },
];

export default function RobotsPage() {
  const [robots, setRobots] = useState<Robot[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [robotConfigs, setRobotConfigs] = useState<Record<string, RobotConfig>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedRobot, setSelectedRobot] = useState<Robot | null>(null);
  const [tradeDialogOpen, setTradeDialogOpen] = useState(false);
  const [startingRobots, setStartingRobots] = useState<Set<string>>(new Set());
  const [accountBalance, setAccountBalance] = useState<number>(0);
  const [accountEquity, setAccountEquity] = useState<number>(0);
  const [runningRobots, setRunningRobots] = useState<Set<string>>(new Set());

  // Get auth token from localStorage
  const getAuthHeaders = useCallback(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  }, []);

  // Load running robots from database (not localStorage)
  // The database is the source of truth for which robots are enabled
  useEffect(() => {
    // Running robots are now synced from the database via fetchRobots
    // Don't use localStorage as it can get out of sync
  }, []);

  // Running robots are synced from database, no need for localStorage persistence
  // This prevents state inconsistency between frontend and backend

  // Initialize configs for robots - sync running state from database
  const initializeConfigs = useCallback((robotList: Robot[], enabledRobotIds: Set<string>) => {
    const configs: Record<string, RobotConfig> = {};
    robotList.forEach((robot) => {
      configs[robot.id] = {
        robotId: robot.id,
        selectedTimeframe: robot.timeframe,
        selectedPairs: robot.pairs || [],
        riskPercent: 1,
        isRunning: enabledRobotIds.has(robot.id),
      };
    });
    setRobotConfigs(configs);
    // Sync runningRobots with database state
    setRunningRobots(enabledRobotIds);
  }, []);

  // Fetch robots from API - sync running state from database
  const fetchRobots = useCallback(async () => {
    try {
      const response = await fetch('/api/user/robots', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        const robotList = data.robots || [];
        
        // Get enabled robots from database response
        const enabledRobotIds = new Set<string>(
          robotList
            .filter((r: any) => r.status === 'running')
            .map((r: any) => r.id)
        );
        
        // Always use default robots for full data (timeframes, pairs, winRate, etc)
        // but merge with API status (running/stopped)
        const defaultRobots = getDefaultRobots();
        const mergedRobots = defaultRobots.map(defaultRobot => {
          const apiRobot = robotList.find((r: any) => r.id === defaultRobot.id);
          return {
            ...defaultRobot,
            status: apiRobot?.status || 'stopped',
            isAssigned: !!apiRobot,
          };
        });
        
        setRobots(mergedRobots);
        initializeConfigs(mergedRobots, enabledRobotIds);
      } else {
        const defaultRobots = getDefaultRobots();
        setRobots(defaultRobots);
        initializeConfigs(defaultRobots, new Set());
      }
    } catch (err) {
      console.error('Error fetching robots:', err);
      const defaultRobots = getDefaultRobots();
      setRobots(defaultRobots);
      initializeConfigs(defaultRobots, new Set());
    }
  }, [initializeConfigs, getAuthHeaders]);

  // Fetch open trades/positions with real-time prices
  const fetchTrades = useCallback(async () => {
    try {
      // Try to get live positions first (includes current prices and account info)
      const posResponse = await fetch('/api/user/positions', {
        headers: getAuthHeaders(),
      });
      
      if (posResponse.ok) {
        const posData = await posResponse.json();
        
        // Update account info from live data (this is the source of truth)
        if (posData.account) {
          setAccountBalance(posData.account.balance || 0);
          setAccountEquity(posData.account.equity || 0);
        }
        
        if (posData.positions && posData.positions.length > 0) {
          // Map positions to trade format for display
          const mappedTrades = posData.positions.map((p: any) => ({
            id: p.id,
            pair: p.symbol,
            type: p.type,
            volume: p.volume,
            openPrice: p.openPrice,
            currentPrice: p.currentPrice,
            profit: p.profit,
            robotName: p.robotName || p.comment || 'Unknown',
          }));
          setTrades(mappedTrades);
          return;
        } else {
          // No positions, clear trades
          setTrades([]);
          return;
        }
      }
      
      // Fallback to database trades only if positions endpoint fails
      const response = await fetch('/api/user/trades?status=OPEN', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setTrades(data.trades || []);
      }
    } catch (err) {
      console.error('Error fetching trades:', err);
    }
  }, [getAuthHeaders]);

  // Fetch account info only as fallback (positions endpoint is preferred)
  const fetchAccountInfo = useCallback(async () => {
    // Only fetch from DB if we don't have live account data
    // Live data comes from fetchTrades -> /api/user/positions
    try {
      const response = await fetch('/api/user/mt5-account', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        // Only update if we have zero balance (not yet fetched from live)
        if (data.account && accountBalance === 0) {
          setAccountBalance(data.account.balance || 0);
          setAccountEquity(data.account.equity || 0);
        }
      }
    } catch (err) {
      console.error('Error fetching account:', err);
    }
  }, [getAuthHeaders, accountBalance]);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchRobots(), fetchTrades()]);
      setLoading(false);
    };
    loadData();
  }, [fetchRobots, fetchTrades]);

  // Poll for real-time trade/P&L updates every 1 second
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTrades(); // This fetches live positions with current prices and P/L
    }, 1000); // 1 second for real-time price updates
    return () => clearInterval(interval);
  }, [fetchTrades]);

  // REMOVED: Frontend trading loop
  // Trading is now handled ONLY by the backend tradingScheduler
  // The frontend only:
  // 1. Starts/stops robots (sets isEnabled in database)
  // 2. Displays open positions and P/L
  // This prevents duplicate trading and ensures user control

  // Handle timeframe change for a robot
  const handleTimeframeChange = (robotId: string, timeframe: string) => {
    setRobotConfigs(prev => ({
      ...prev,
      [robotId]: {
        ...prev[robotId],
        selectedTimeframe: timeframe,
      },
    }));
  };

  // Handle risk change for a robot
  const handleRiskChange = (robotId: string, risk: number) => {
    setRobotConfigs(prev => ({
      ...prev,
      [robotId]: {
        ...prev[robotId],
        riskPercent: risk,
      },
    }));
  };

  // Start a robot
  const startRobot = async (robot: Robot) => {
    const config = robotConfigs[robot.id];
    if (!config) return;

    setStartingRobots(prev => new Set(prev).add(robot.id));
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/user/robots/${robot.id}/start`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          timeframe: config.selectedTimeframe,
          pairs: config.selectedPairs,
          riskPercent: config.riskPercent,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Mark robot as running
        setRunningRobots(prev => new Set(prev).add(robot.id));
        setRobotConfigs(prev => ({
          ...prev,
          [robot.id]: {
            ...prev[robot.id],
            isRunning: true,
          },
        }));

        // Show success message - trading is handled by backend
        setSuccess(`✅ ${robot.name} is now running! Trading will continue in the background even if you close the browser.`);

        // Refresh data
        fetchTrades();
        fetchRobots();
      } else {
        setError(data.error || 'Failed to start robot');
      }
    } catch (err) {
      console.error('Error starting robot:', err);
      setError('Failed to start robot. Please try again.');
    } finally {
      setStartingRobots(prev => {
        const newSet = new Set(prev);
        newSet.delete(robot.id);
        return newSet;
      });
    }
  };

  // Stop a robot - this also closes all open trades for this robot
  const stopRobot = async (robot: Robot) => {
    try {
      setError(null);
      const response = await fetch(`/api/user/robots/${robot.id}/stop`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (response.ok) {
        // Remove from running robots
        setRunningRobots(prev => {
          const newSet = new Set(prev);
          newSet.delete(robot.id);
          return newSet;
        });
        setRobotConfigs(prev => ({
          ...prev,
          [robot.id]: {
            ...prev[robot.id],
            isRunning: false,
          },
        }));
        
        const tradesClosed = data.tradesClosed || 0;
        if (tradesClosed > 0) {
          setSuccess(`${robot.name} stopped. ${tradesClosed} trade(s) closed.`);
        } else {
          setSuccess(`${robot.name} stopped.`);
        }
        
        // Refresh data
        fetchTrades();
        fetchRobots();
      } else {
        setError(data.error || 'Failed to stop robot');
      }
    } catch (err) {
      console.error('Error stopping robot:', err);
      setError('Failed to stop robot. Please try again.');
    }
  };

  // Get risk color
  const getRiskColor = (risk: string): 'success' | 'warning' | 'error' | 'default' => {
    switch (risk) {
      case 'Low': return 'success';
      case 'Medium': return 'warning';
      case 'High': return 'error';
      default: return 'default';
    }
  };

  // Get strategy icon
  const getStrategyIcon = (strategy: string) => {
    switch (strategy) {
      case 'Scalping':
      case 'News Trading':
        return <Zap size={24} />;
      case 'Trend Following':
      case 'Swing Trading':
      case 'Position Trading':
        return <TrendingUp size={24} />;
      case 'Breakout':
      case 'Momentum':
        return <BarChart3 size={24} />;
      default:
        return <Brain size={24} />;
    }
  };

  // Calculate total P/L
  const totalPL = trades.reduce((sum, trade) => sum + (trade.profit || 0), 0);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, px: { xs: 1, sm: 2, md: 3 }, overflow: 'hidden' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Bot size={40} />
          Trading Robots
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Select and configure AI-powered trading robots. Each robot supports multiple timeframes from M1 to W1.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {runningRobots.size > 0 && (
        <Alert 
          severity="info" 
          sx={{ mb: 3, overflow: 'hidden', '& .MuiAlert-message': { overflow: 'hidden', width: '100%' } }}
          action={
            <Button 
              color="inherit" 
              size="small"
              sx={{ whiteSpace: 'nowrap', minWidth: 'auto', fontSize: { xs: '0.7rem', sm: '0.875rem' } }}
              onClick={async () => {
                try {
                  setError(null);
                  const response = await fetch('/api/user/robots/stop-all', {
                    method: 'POST',
                    headers: getAuthHeaders(),
                  });
                  const data = await response.json();
                  if (response.ok) {
                    setRunningRobots(new Set());
                    const tradesClosed = data.tradesClosed || 0;
                    if (tradesClosed > 0) {
                      setSuccess(`All robots stopped. ${tradesClosed} trade(s) closed.`);
                    } else {
                      setSuccess('All robots stopped successfully');
                    }
                    fetchRobots();
                    fetchTrades();
                  } else {
                    setError(data.error || 'Failed to stop robots');
                  }
                } catch (err) {
                  setError('Failed to stop robots');
                }
              }}
            >
              Stop All & Close Trades
            </Button>
          }
        >
          <strong>{runningRobots.size} robot(s) running in background:</strong>{' '}
          {Array.from(runningRobots).map(id => {
            const robot = robots.find(r => r.id === id);
            return robot?.name || id;
          }).join(', ')}
          <br />
          <Typography variant="caption" sx={{ mt: 0.5, display: 'block' }}>
            Trading continues even when you close the browser. Click &quot;Stop All&quot; to stop trading and close all positions.
          </Typography>
        </Alert>
      )}

      {/* Account Summary */}
      <Card sx={{ mb: 4, background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 100%)', overflow: 'hidden' }}>
        <CardContent sx={{ px: { xs: 2, sm: 3 } }}>
          <Grid container spacing={{ xs: 2, sm: 3 }}>
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Account Balance
              </Typography>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                ${accountBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Account Equity
              </Typography>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 'bold', fontSize: { xs: '1.5rem', sm: '2rem' } }}>
                ${accountEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="subtitle2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Open P/L
              </Typography>
              <Typography 
                variant="h5" 
                sx={{ 
                  color: totalPL >= 0 ? '#4caf50' : '#f44336', 
                  fontWeight: 'bold',
                  fontSize: { xs: '1.5rem', sm: '2rem' }
                }}
              >
                {totalPL >= 0 ? '+' : ''}${totalPL.toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Open Trades Section */}
      {trades.length > 0 && (
        <Card sx={{ mb: 4, overflow: 'hidden' }}>
          <CardContent sx={{ px: { xs: 1, sm: 2, md: 3 } }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                <TrendingUp size={20} />
                Open Positions ({trades.length})
              </Typography>
              <IconButton onClick={fetchTrades} size="small">
                <RefreshCw size={18} />
              </IconButton>
            </Box>
            <TableContainer sx={{ overflowX: 'auto' }}>
              <Table size="small" sx={{ minWidth: 600 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>Robot</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>Pair</TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>Type</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Volume</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Open Price</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>Current</TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>P/L</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {trades.map((trade) => (
                    <TableRow key={trade.id}>
                      <TableCell>
                        <Chip 
                          label={trade.robotName || 'Manual'} 
                          size="small" 
                          color="primary" 
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{trade.pair}</TableCell>
                      <TableCell>
                        <Chip 
                          label={trade.type?.includes('BUY') ? 'BUY' : 'SELL'} 
                          size="small" 
                          color={trade.type?.includes('BUY') ? 'success' : 'error'}
                        />
                      </TableCell>
                      <TableCell align="right">{trade.volume}</TableCell>
                      <TableCell align="right">{trade.openPrice?.toFixed(5)}</TableCell>
                      <TableCell align="right">{trade.currentPrice?.toFixed(5) || '-'}</TableCell>
                      <TableCell 
                        align="right"
                        sx={{ 
                          color: (trade.profit || 0) >= 0 ? 'success.main' : 'error.main',
                          fontWeight: 'bold'
                        }}
                      >
                        {(trade.profit || 0) >= 0 ? '+' : ''}
                        ${(trade.profit || 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Timeframes Legend */}
      <Card sx={{ mb: 4, bgcolor: 'background.paper' }}>
        <CardContent sx={{ py: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Clock size={16} />
            Available Timeframes:
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {ALL_TIMEFRAMES.map((tf) => (
              <Chip 
                key={tf} 
                label={tf} 
                size="small" 
                variant="outlined"
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Robots Grid */}
      <Grid container spacing={3}>
        {robots.map((robot) => {
          const config = robotConfigs[robot.id] || {
            selectedTimeframe: robot.timeframe,
            riskPercent: 1,
            isRunning: false,
          };
          const isStarting = startingRobots.has(robot.id);
          const isRunning = runningRobots.has(robot.id);

          return (
            <Grid item xs={12} md={6} lg={4} key={robot.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  border: isRunning ? '2px solid' : '1px solid',
                  borderColor: isRunning ? 'success.main' : 'divider',
                  position: 'relative',
                  overflow: 'visible',
                }}
              >
                {isRunning && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -10,
                      right: 16,
                      bgcolor: 'success.main',
                      color: 'white',
                      px: 2,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                    }}
                  >
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: 'white',
                        animation: 'pulse 1.5s infinite',
                        '@keyframes pulse': {
                          '0%': { opacity: 1 },
                          '50%': { opacity: 0.4 },
                          '100%': { opacity: 1 },
                        },
                      }}
                    />
                    RUNNING
                  </Box>
                )}
                
                <CardContent>
                  {/* Robot Header */}
                  <Box display="flex" alignItems="flex-start" mb={2}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: `${getRiskColor(robot.riskLevel || 'Medium')}.main`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                        color: 'white',
                      }}
                    >
                      {getStrategyIcon(robot.strategy || 'Default')}
                    </Box>
                    <Box flex={1}>
                      <Typography variant="h6" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
                        {robot.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {robot.strategy || 'AI Trading'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Description */}
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                    {robot.description}
                  </Typography>

                  {/* Stats Row */}
                  <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                    <Chip 
                      label={`Win Rate: ${robot.winRate || 75}%`}
                      size="small"
                      color="success"
                      variant="outlined"
                      icon={<TrendingUp size={14} />}
                    />
                    <Chip 
                      label={robot.riskLevel || 'Medium'}
                      size="small"
                      color={getRiskColor(robot.riskLevel || 'Medium')}
                    />
                  </Box>

                  {/* Supported Timeframes - SELECT YOUR TIMEFRAME */}
                  <Typography variant="caption" color="text.secondary" display="block" mb={1} fontWeight="bold">
                    Select Timeframe:
                  </Typography>
                  <Box display="flex" gap={0.5} mb={2} flexWrap="wrap">
                    {(robot.timeframes || [robot.timeframe]).map((tf) => (
                      <Chip 
                        key={tf}
                        label={tf}
                        size="small"
                        variant={config.selectedTimeframe === tf ? 'filled' : 'outlined'}
                        color={config.selectedTimeframe === tf ? 'primary' : 'default'}
                        onClick={() => !isRunning && handleTimeframeChange(robot.id, tf)}
                        sx={{ 
                          cursor: isRunning ? 'not-allowed' : 'pointer',
                          fontWeight: config.selectedTimeframe === tf ? 'bold' : 'normal',
                        }}
                      />
                    ))}
                  </Box>

                  {/* Trading Pairs */}
                  <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                    Trading Pairs:
                  </Typography>
                  <Box display="flex" gap={0.5} mb={3} flexWrap="wrap">
                    {(robot.pairs || ['EURUSD']).slice(0, 4).map((pair) => (
                      <Chip 
                        key={pair}
                        label={pair}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    ))}
                    {(robot.pairs || []).length > 4 && (
                      <Chip 
                        label={`+${robot.pairs.length - 4}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>

                  {/* Risk Slider */}
                  <Typography variant="caption" color="text.secondary" gutterBottom display="block">
                    Risk per Trade: {config.riskPercent}%
                  </Typography>
                  <Slider
                    value={config.riskPercent}
                    onChange={(_, value) => handleRiskChange(robot.id, value as number)}
                    min={0.5}
                    max={5}
                    step={0.5}
                    marks={[
                      { value: 0.5, label: '0.5%' },
                      { value: 2.5, label: '2.5%' },
                      { value: 5, label: '5%' },
                    ]}
                    disabled={isRunning}
                    sx={{ mb: 2 }}
                  />

                  {/* Action Buttons */}
                  <Box display="flex" gap={1}>
                    {isRunning ? (
                      <Button
                        variant="outlined"
                        color="error"
                        fullWidth
                        onClick={() => stopRobot(robot)}
                        startIcon={<Square size={16} />}
                      >
                        Stop Robot
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        color="primary"
                        fullWidth
                        onClick={() => startRobot(robot)}
                        disabled={isStarting}
                        startIcon={isStarting ? <CircularProgress size={16} color="inherit" /> : <Play size={16} />}
                      >
                        {isStarting ? 'Starting...' : 'Start Robot'}
                      </Button>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Trade Signals Dialog */}
      <Dialog 
        open={tradeDialogOpen} 
        onClose={() => setTradeDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <CheckCircle color="green" size={24} />
              <Typography variant="h6">
                {selectedRobot?.name} - Started Successfully
              </Typography>
            </Box>
            <IconButton onClick={() => setTradeDialogOpen(false)}>
              <X size={20} />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="success" sx={{ mb: 2 }}>
            Robot started successfully! It is now analyzing the market.
          </Alert>
          <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              Robot Configuration:
            </Typography>
            <Typography variant="body2">
              • <strong>Timeframe:</strong> {robotConfigs[selectedRobot?.id || '']?.selectedTimeframe || 'N/A'}
            </Typography>
            <Typography variant="body2">
              • <strong>Risk per Trade:</strong> {robotConfigs[selectedRobot?.id || '']?.riskPercent || 1}%
            </Typography>
            <Typography variant="body2">
              • <strong>Trading Pairs:</strong> {selectedRobot?.pairs?.join(', ') || 'N/A'}
            </Typography>
          </Box>
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              The robot will open positions when market conditions match its strategy.
              Check the <strong>Open Positions</strong> section above for real-time P/L updates.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTradeDialogOpen(false)} variant="contained">
            Got it!
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
