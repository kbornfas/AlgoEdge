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

// Default robots with all timeframes - 8 Core Strategies
const getDefaultRobots = (): Robot[] => [
  {
    id: 'ema-pullback',
    name: 'EMA Pullback Pro',
    description: 'High win-rate trend strategy using EMA200/50 with RSI neutral zone pullback entries.',
    strategy: 'EMA 200 Trend + Pullback',
    timeframe: 'H1',
    timeframes: ['M5', 'M15', 'H1', 'H4'],
    pairs: ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'AUDUSD'],
    riskLevel: 'Low',
    winRate: 78.5,
    isActive: true,
  },
  {
    id: 'break-retest',
    name: 'Break & Retest',
    description: 'Institutional-style breakout strategy with confirmed retests and volume analysis.',
    strategy: 'Break and Retest',
    timeframe: 'H1',
    timeframes: ['M5', 'M15', 'H1'],
    pairs: ['EURUSD', 'GBPUSD', 'USDJPY', 'XAUUSD', 'EURJPY', 'GBPJPY'],
    riskLevel: 'Medium',
    winRate: 72.3,
    isActive: true,
  },
  {
    id: 'liquidity-sweep',
    name: 'Liquidity Sweep SMC',
    description: 'Smart Money Concept strategy detecting liquidity sweeps and market structure shifts.',
    strategy: 'Liquidity Sweep + MSS',
    timeframe: 'M15',
    timeframes: ['M5', 'M15'],
    pairs: ['EURUSD', 'GBPUSD', 'XAUUSD', 'USDJPY'],
    riskLevel: 'Medium',
    winRate: 71.8,
    isActive: true,
  },
  {
    id: 'london-breakout',
    name: 'London Session Breakout',
    description: 'Trades Asian range breakouts during the high-volatility London session (08:00-11:00 GMT).',
    strategy: 'London Session Breakout',
    timeframe: 'M15',
    timeframes: ['M5', 'M15', 'M30'],
    pairs: ['EURUSD', 'GBPUSD', 'XAUUSD', 'EURJPY', 'GBPJPY'],
    riskLevel: 'Medium',
    winRate: 69.5,
    isActive: true,
  },
  {
    id: 'order-block',
    name: 'Order Block Trader',
    description: 'Identifies institutional order blocks on H1 zones with M5 precision entries.',
    strategy: 'Order Block',
    timeframe: 'H1',
    timeframes: ['M5', 'M15', 'H1'],
    pairs: ['EURUSD', 'GBPUSD', 'XAUUSD', 'USDJPY', 'AUDUSD'],
    riskLevel: 'Medium',
    winRate: 73.2,
    isActive: true,
  },
  {
    id: 'vwap-reversion',
    name: 'VWAP Mean Reversion',
    description: 'Mean reversion strategy using VWAP deviations with RSI oversold/overbought confirmation.',
    strategy: 'VWAP Mean Reversion',
    timeframe: 'M15',
    timeframes: ['M5', 'M15', 'M30'],
    pairs: ['EURUSD', 'GBPUSD', 'XAUUSD', 'USDJPY'],
    riskLevel: 'Low',
    winRate: 74.6,
    isActive: true,
  },
  {
    id: 'fib-continuation',
    name: 'Fibonacci Continuation',
    description: 'Trend continuation using Fibonacci 50-61.8% retracement levels with rejection candles.',
    strategy: 'Fibonacci Continuation',
    timeframe: 'H1',
    timeframes: ['M15', 'H1', 'H4'],
    pairs: ['EURUSD', 'GBPUSD', 'XAUUSD', 'USDJPY', 'AUDUSD', 'NZDUSD'],
    riskLevel: 'Low',
    winRate: 76.1,
    isActive: true,
  },
  {
    id: 'rsi-divergence',
    name: 'RSI Divergence Reversal',
    description: 'Catches trend reversals using RSI divergence patterns with price confirmation.',
    strategy: 'RSI Divergence',
    timeframe: 'H1',
    timeframes: ['M15', 'H1', 'H4'],
    pairs: ['EURUSD', 'GBPUSD', 'XAUUSD', 'USDJPY', 'AUDUSD'],
    riskLevel: 'Medium',
    winRate: 70.4,
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
  const [accountProfit, setAccountProfit] = useState<number>(0);
  const [runningRobots, setRunningRobots] = useState<Set<string>>(new Set());
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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
    // Sync runningRobots with database state - this is the source of truth
    setRunningRobots(enabledRobotIds);
  }, []);

  // Fetch robots from API - DATABASE IS THE SOURCE OF TRUTH for running state
  const fetchRobots = useCallback(async () => {
    try {
      const response = await fetch('/api/user/robots', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        const robotList = data.robots || [];
        
        // Get enabled robots from database response - THIS IS THE SOURCE OF TRUTH
        const enabledRobotIds = new Set<string>(
          robotList
            .filter((r: any) => r.status === 'running')
            .map((r: any) => r.id)
        );
        
        // Always use default robots for full UI data (timeframes, pairs, winRate, etc)
        // but merge with database status (running/stopped)
        const defaultRobots = getDefaultRobots();
        const mergedRobots = defaultRobots.map(defaultRobot => {
          const apiRobot = robotList.find((r: any) => r.id === defaultRobot.id);
          // CRITICAL: Use database status as the source of truth
          const isRunning = apiRobot?.status === 'running';
          return {
            ...defaultRobot,
            status: isRunning ? 'running' : 'stopped',
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
          // Use account.profit (equity - balance) for live P/L, fallback to calculated
          const liveProfit = posData.account.profit ?? ((posData.account.equity || 0) - (posData.account.balance || 0));
          setAccountProfit(liveProfit);
        }
        
        // Update last updated timestamp
        setLastUpdated(new Date());
        
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
        setLastUpdated(new Date());
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

  // Poll for real-time trade/P&L updates - fast polling for live data
  useEffect(() => {
    let isMounted = true;
    let pollTimeout: NodeJS.Timeout | null = null;
    
    const pollTrades = async () => {
      if (!isMounted) return;
      
      try {
        await fetchTrades();
      } catch (err) {
        console.error('Poll error:', err);
      }
      
      // Schedule next poll - use 2 seconds to reduce load while still being responsive
      if (isMounted) {
        pollTimeout = setTimeout(pollTrades, 2000);
      }
    };
    
    // Start polling immediately
    pollTrades();
    
    return () => {
      isMounted = false;
      if (pollTimeout) clearTimeout(pollTimeout);
    };
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

  // Start a robot - sets isEnabled=true in database
  // The backend trading scheduler will then start executing trades for this robot
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
        // IMMEDIATELY mark robot as running in local state
        setRunningRobots(prev => new Set(prev).add(robot.id));
        setRobotConfigs(prev => ({
          ...prev,
          [robot.id]: {
            ...prev[robot.id],
            isRunning: true,
          },
        }));
        
        // Update robots array to show running status
        setRobots(prev => prev.map(r => 
          r.id === robot.id ? { ...r, status: 'running' } : r
        ));

        // Show success message - trading is handled by backend
        setSuccess(`✅ ${robot.name} is now running! Trading will continue in the background even if you close the browser.`);

        // Refresh trades only (not robots, to prevent state override)
        fetchTrades();
        
        // After 2 seconds, sync with database to confirm state
        setTimeout(() => {
          fetchRobots();
        }, 2000);
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

  // Stop a robot - sets isEnabled=false and closes all open trades for this robot
  const stopRobot = async (robot: Robot) => {
    try {
      setError(null);
      const response = await fetch(`/api/user/robots/${robot.id}/stop`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });

      const data = await response.json();

      if (response.ok) {
        // IMMEDIATELY remove from running robots in local state
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
        
        // Update robots array to show stopped status
        setRobots(prev => prev.map(r => 
          r.id === robot.id ? { ...r, status: 'stopped' } : r
        ));
        
        const tradesClosed = data.tradesClosed || 0;
        if (tradesClosed > 0) {
          setSuccess(`${robot.name} stopped. ${tradesClosed} trade(s) closed.`);
        } else {
          setSuccess(`${robot.name} stopped.`);
        }
        
        // Refresh trades only
        fetchTrades();
        
        // After 2 seconds, sync with database
        setTimeout(() => {
          fetchRobots();
        }, 2000);
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

  // Get unique gradient colors for each robot
  const getRobotGradient = (robotId: string, isRunning: boolean) => {
    const gradients: Record<string, { bg: string; border: string; glow: string }> = {
      'ema-pullback': {
        bg: isRunning 
          ? 'linear-gradient(135deg, #1a5f3c 0%, #0d3320 50%, #0a2818 100%)'
          : 'linear-gradient(135deg, #1a2f38 0%, #0f1a1f 100%)',
        border: isRunning ? '#10b981' : '#2dd4bf',
        glow: '0 0 20px rgba(16, 185, 129, 0.3)',
      },
      'break-retest': {
        bg: isRunning
          ? 'linear-gradient(135deg, #4c1d95 0%, #2e1065 50%, #1e0a43 100%)'
          : 'linear-gradient(135deg, #2d1b4e 0%, #1a0f2e 100%)',
        border: isRunning ? '#a855f7' : '#8b5cf6',
        glow: '0 0 20px rgba(168, 85, 247, 0.3)',
      },
      'liquidity-sweep': {
        bg: isRunning
          ? 'linear-gradient(135deg, #1e3a5f 0%, #0c1929 50%, #06101a 100%)'
          : 'linear-gradient(135deg, #1e3a5f 0%, #0f1d2d 100%)',
        border: isRunning ? '#3b82f6' : '#60a5fa',
        glow: '0 0 20px rgba(59, 130, 246, 0.3)',
      },
      'london-breakout': {
        bg: isRunning
          ? 'linear-gradient(135deg, #7c2d12 0%, #431407 50%, #2a0d04 100%)'
          : 'linear-gradient(135deg, #3d1e12 0%, #1f0f09 100%)',
        border: isRunning ? '#f97316' : '#fb923c',
        glow: '0 0 20px rgba(249, 115, 22, 0.3)',
      },
      'order-block': {
        bg: isRunning
          ? 'linear-gradient(135deg, #be185d 0%, #701a45 50%, #4a112e 100%)'
          : 'linear-gradient(135deg, #4a1942 0%, #2d0f28 100%)',
        border: isRunning ? '#ec4899' : '#f472b6',
        glow: '0 0 20px rgba(236, 72, 153, 0.3)',
      },
      'vwap-reversion': {
        bg: isRunning
          ? 'linear-gradient(135deg, #0e7490 0%, #064e5e 50%, #033540 100%)'
          : 'linear-gradient(135deg, #134e5e 0%, #0a2a33 100%)',
        border: isRunning ? '#06b6d4' : '#22d3ee',
        glow: '0 0 20px rgba(6, 182, 212, 0.3)',
      },
      'fib-continuation': {
        bg: isRunning
          ? 'linear-gradient(135deg, #a16207 0%, #6b4106 50%, #422903 100%)'
          : 'linear-gradient(135deg, #4a3728 0%, #2d1f16 100%)',
        border: isRunning ? '#eab308' : '#facc15',
        glow: '0 0 20px rgba(234, 179, 8, 0.3)',
      },
      'rsi-divergence': {
        bg: isRunning
          ? 'linear-gradient(135deg, #dc2626 0%, #7f1d1d 50%, #4a1111 100%)'
          : 'linear-gradient(135deg, #3d1c1c 0%, #1f0f0f 100%)',
        border: isRunning ? '#ef4444' : '#f87171',
        glow: '0 0 20px rgba(239, 68, 68, 0.3)',
      },
    };
    return gradients[robotId] || gradients['ema-pullback'];
  };

  // Calculate total P/L - use live account profit first, fallback to trade calculation
  const calculatedPL = trades.reduce((sum, trade) => sum + (trade.profit || 0), 0);
  const totalPL = accountProfit !== 0 ? accountProfit : calculatedPL;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4, px: { xs: 1, sm: 2, md: 3 }, overflowX: 'auto' }}>
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
              Stop All
            </Button>
          }
        >
          <strong>{runningRobots.size} robot(s) running</strong>
        </Alert>
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
          const gradient = getRobotGradient(robot.id, isRunning);

          return (
            <Grid item xs={12} md={6} lg={3} key={robot.id}>
              <Card 
                sx={{ 
                  height: '100%',
                  background: gradient.bg,
                  border: '1px solid',
                  borderColor: gradient.border,
                  position: 'relative',
                  overflow: 'visible',
                  boxShadow: isRunning ? gradient.glow : 'none',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: gradient.glow,
                    transform: 'translateY(-4px)',
                    borderColor: gradient.border,
                  },
                }}
              >
                {isRunning && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -10,
                      right: 16,
                      background: `linear-gradient(135deg, ${gradient.border}, ${gradient.border}dd)`,
                      color: 'white',
                      px: 2,
                      py: 0.5,
                      borderRadius: 2,
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      boxShadow: `0 4px 15px ${gradient.border}66`,
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
                    LIVE
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
                        background: `linear-gradient(135deg, ${gradient.border}44, ${gradient.border}22)`,
                        border: `1px solid ${gradient.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mr: 2,
                        color: gradient.border,
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
                      icon={<TrendingUp size={14} />}
                      sx={{
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(16, 185, 129, 0.1))',
                        border: '1px solid rgba(16, 185, 129, 0.5)',
                        color: '#10b981',
                        '& .MuiChip-icon': { color: '#10b981' },
                      }}
                    />
                    <Chip 
                      label={robot.riskLevel || 'Medium'}
                      size="small"
                      sx={{
                        background: `linear-gradient(135deg, ${gradient.border}33, ${gradient.border}11)`,
                        border: `1px solid ${gradient.border}88`,
                        color: gradient.border,
                      }}
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
                        onClick={() => !isRunning && handleTimeframeChange(robot.id, tf)}
                        sx={{ 
                          cursor: isRunning ? 'not-allowed' : 'pointer',
                          fontWeight: config.selectedTimeframe === tf ? 'bold' : 'normal',
                          background: config.selectedTimeframe === tf 
                            ? `linear-gradient(135deg, ${gradient.border}, ${gradient.border}cc)`
                            : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${config.selectedTimeframe === tf ? gradient.border : 'rgba(255,255,255,0.2)'}`,
                          color: config.selectedTimeframe === tf ? 'white' : 'rgba(255,255,255,0.7)',
                          '&:hover': {
                            background: config.selectedTimeframe === tf 
                              ? `linear-gradient(135deg, ${gradient.border}, ${gradient.border}cc)`
                              : 'rgba(255,255,255,0.1)',
                          },
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
                        sx={{ 
                          fontSize: '0.7rem',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid rgba(255,255,255,0.15)',
                          color: 'rgba(255,255,255,0.8)',
                        }}
                      />
                    ))}
                    {(robot.pairs || []).length > 4 && (
                      <Chip 
                        label={`+${robot.pairs.length - 4}`}
                        size="small"
                        sx={{ 
                          fontSize: '0.7rem',
                          background: `${gradient.border}22`,
                          border: `1px solid ${gradient.border}44`,
                          color: gradient.border,
                        }}
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
                    sx={{ 
                      mb: 2,
                      color: gradient.border,
                      '& .MuiSlider-thumb': {
                        background: gradient.border,
                        '&:hover, &.Mui-focusVisible': {
                          boxShadow: `0 0 10px ${gradient.border}`,
                        },
                      },
                      '& .MuiSlider-track': {
                        background: `linear-gradient(90deg, ${gradient.border}, ${gradient.border}cc)`,
                        border: 'none',
                      },
                      '& .MuiSlider-rail': {
                        background: 'rgba(255,255,255,0.15)',
                      },
                      '& .MuiSlider-markLabel': {
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: '0.7rem',
                      },
                    }}
                  />

                  {/* Action Buttons */}
                  <Box display="flex" gap={1}>
                    {isRunning ? (
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => stopRobot(robot)}
                        startIcon={<Square size={16} />}
                        sx={{
                          background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)',
                          border: '1px solid #ef4444',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                            boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
                          },
                        }}
                      >
                        Stop Robot
                      </Button>
                    ) : (
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => startRobot(robot)}
                        disabled={isStarting}
                        startIcon={isStarting ? <CircularProgress size={16} color="inherit" /> : <Play size={16} />}
                        sx={{
                          background: `linear-gradient(135deg, ${gradient.border} 0%, ${gradient.border}cc 100%)`,
                          border: `1px solid ${gradient.border}`,
                          '&:hover': {
                            background: `linear-gradient(135deg, ${gradient.border}ee 0%, ${gradient.border} 100%)`,
                            boxShadow: `0 4px 15px ${gradient.border}66`,
                          },
                          '&:disabled': {
                            background: 'rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.5)',
                          },
                        }}
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
