'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
  FormControlLabel,
  Switch,
  List,
  ListItem,
  ListItemText,
  LinearProgress,
} from '@mui/material';
import {
  Bot,
  TrendingUp,
  Play,
  Pause,
  Settings,
  AlertCircle,
  CheckCircle,
  XCircle,
  Activity,
  DollarSign,
} from 'lucide-react';
import Link from 'next/link';

interface Robot {
  id: string;
  name: string;
  description: string;
  strategy?: string;
  timeframe?: string;
  riskLevel?: string;
  winRate?: number;
  status: 'running' | 'stopped' | 'paused';
  profit: number;
  isAssigned: boolean;
}

interface TradingSignal {
  symbol: string;
  type: 'BUY' | 'SELL';
  confidence: number;
  reason: string;
}

export default function RobotsPage() {
  const router = useRouter();
  const [robots, setRobots] = useState<Robot[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mt5Connected, setMt5Connected] = useState(false);
  const [settingsDialog, setSettingsDialog] = useState<Robot | null>(null);
  const [resultDialog, setResultDialog] = useState<{
    robot: Robot;
    signals: TradingSignal[];
    errors: string[];
  } | null>(null);
  const [riskPercent, setRiskPercent] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchData();
  }, [router]);

  const fetchData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    try {
      // Fetch MT5 account status
      const mt5Res = await fetch('/api/user/mt5-account', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (mt5Res.ok) {
        const mt5Data = await mt5Res.json();
        setMt5Connected(mt5Data.account?.status === 'connected');
      }

      // Fetch robots
      const robotsRes = await fetch('/api/user/robots', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (robotsRes.ok) {
        const robotsData = await robotsRes.json();
        setRobots(robotsData.robots || getDefaultRobots());
      } else {
        setRobots(getDefaultRobots());
      }
    } catch (err: any) {
      setError(err.message);
      setRobots(getDefaultRobots());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultRobots = (): Robot[] => [
    {
      id: 'algoedge-pro',
      name: 'AlgoEdge Pro',
      description: 'Multi-timeframe trend following strategy with 75%+ win rate. Trades all major pairs using EMA, RSI, and MACD signals.',
      strategy: 'Trend Following',
      timeframe: 'H1',
      riskLevel: 'Medium',
      winRate: 78,
      status: 'stopped',
      profit: 0,
      isAssigned: false,
    },
    {
      id: 'scalp-master',
      name: 'Scalp Master',
      description: 'High-frequency scalping bot for quick profits. Uses Bollinger Bands and RSI for precise entries.',
      strategy: 'Scalping',
      timeframe: 'M15',
      riskLevel: 'High',
      winRate: 72,
      status: 'stopped',
      profit: 0,
      isAssigned: false,
    },
    {
      id: 'gold-hunter',
      name: 'Gold Hunter',
      description: 'Specialized for XAUUSD trading. Capitalizes on gold volatility with strict risk management.',
      strategy: 'Breakout',
      timeframe: 'H4',
      riskLevel: 'Medium',
      winRate: 76,
      status: 'stopped',
      profit: 0,
      isAssigned: false,
    },
    {
      id: 'swing-trader',
      name: 'Swing Trader',
      description: 'Long-term position trading for major trend captures. Lower frequency, higher profit per trade.',
      strategy: 'Swing Trading',
      timeframe: 'D1',
      riskLevel: 'Low',
      winRate: 82,
      status: 'stopped',
      profit: 0,
      isAssigned: false,
    },
  ];

  const handleStartRobot = async (robot: Robot) => {
    if (!mt5Connected) {
      setError('Please connect your MT5 account first');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    setActionLoading(robot.id);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/user/robots/${robot.id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ riskPercent }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`${robot.name} started successfully!`);
        setRobots((prev) =>
          prev.map((r) =>
            r.id === robot.id ? { ...r, status: 'running' } : r
          )
        );

        // Show trading results
        if (data.tradingResult) {
          setResultDialog({
            robot,
            signals: data.tradingResult.signals || [],
            errors: data.tradingResult.errors || [],
          });
        }
      } else {
        setError(data.error || 'Failed to start robot');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to start robot');
    } finally {
      setActionLoading(null);
    }
  };

  const handleStopRobot = async (robot: Robot) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setActionLoading(robot.id);
    setError('');

    try {
      const response = await fetch(`/api/user/robots/${robot.id}/stop`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(`${robot.name} stopped`);
        setRobots((prev) =>
          prev.map((r) =>
            r.id === robot.id ? { ...r, status: 'stopped' } : r
          )
        );
      } else {
        setError(data.error || 'Failed to stop robot');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const getRiskColor = (riskLevel?: string) => {
    switch (riskLevel?.toLowerCase()) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
        return 'error';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Trading Robots
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Automated trading bots that only enter trades with 75%+ confidence
        </Typography>
      </Box>

      {!mt5Connected && (
        <Alert
          severity="warning"
          sx={{ mb: 3 }}
          action={
            <Button
              component={Link}
              href="/dashboard/mt5"
              variant="contained"
              size="small"
            >
              Connect MT5
            </Button>
          }
        >
          Connect your MT5 account to start using trading robots
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Risk Settings */}
      <Card sx={{ mb: 4, p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Risk Management
        </Typography>
        <Box sx={{ px: 2 }}>
          <Typography gutterBottom>
            Risk per trade: {riskPercent}% of account balance
          </Typography>
          <Slider
            value={riskPercent}
            onChange={(_, value) => setRiskPercent(value as number)}
            min={0.5}
            max={5}
            step={0.5}
            marks={[
              { value: 0.5, label: '0.5%' },
              { value: 1, label: '1%' },
              { value: 2, label: '2%' },
              { value: 5, label: '5%' },
            ]}
            sx={{ maxWidth: 400 }}
          />
          <Typography variant="caption" color="text.secondary">
            Recommended: 1-2% per trade for optimal risk management
          </Typography>
        </Box>
      </Card>

      {/* Robot Cards */}
      <Grid container spacing={3}>
        {robots.map((robot) => (
          <Grid item xs={12} md={6} key={robot.id}>
            <Card
              sx={{
                height: '100%',
                border: robot.status === 'running' ? '2px solid' : '1px solid',
                borderColor: robot.status === 'running' ? 'success.main' : 'divider',
                transition: 'all 0.3s',
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Bot size={32} color={robot.status === 'running' ? '#4caf50' : '#9e9e9e'} />
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {robot.name}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        <Chip
                          label={robot.status}
                          size="small"
                          color={robot.status === 'running' ? 'success' : 'default'}
                        />
                        {robot.riskLevel && (
                          <Chip
                            label={robot.riskLevel}
                            size="small"
                            color={getRiskColor(robot.riskLevel) as any}
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>
                  </Box>
                  {robot.winRate && (
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary">
                        Win Rate
                      </Typography>
                      <Typography variant="h6" color="success.main" sx={{ fontWeight: 600 }}>
                        {robot.winRate}%
                      </Typography>
                    </Box>
                  )}
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {robot.description}
                </Typography>

                {robot.strategy && (
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Typography variant="caption">
                      <strong>Strategy:</strong> {robot.strategy}
                    </Typography>
                    {robot.timeframe && (
                      <Typography variant="caption">
                        <strong>Timeframe:</strong> {robot.timeframe}
                      </Typography>
                    )}
                  </Box>
                )}

                {robot.status === 'running' && (
                  <Box sx={{ mb: 2 }}>
                    <LinearProgress color="success" sx={{ height: 6, borderRadius: 3 }} />
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      Actively scanning for 75%+ confidence trades...
                    </Typography>
                  </Box>
                )}

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  {robot.status === 'running' ? (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={actionLoading === robot.id ? <CircularProgress size={16} /> : <Pause size={16} />}
                      onClick={() => handleStopRobot(robot)}
                      disabled={actionLoading === robot.id || !mt5Connected}
                      fullWidth
                    >
                      Stop Robot
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      color="success"
                      startIcon={actionLoading === robot.id ? <CircularProgress size={16} /> : <Play size={16} />}
                      onClick={() => handleStartRobot(robot)}
                      disabled={actionLoading === robot.id || !mt5Connected}
                      fullWidth
                    >
                      Start Robot
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Trading Pairs Info */}
      <Card sx={{ mt: 4, p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Supported Trading Pairs
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          All robots analyze the following pairs and only execute trades with 75%+ confidence:
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
          {[
            'EURUSD', 'GBPUSD', 'USDJPY', 'USDCHF', 'AUDUSD', 'USDCAD', 'NZDUSD',
            'EURGBP', 'EURJPY', 'GBPJPY', 'AUDJPY', 'EURAUD', 'EURCHF', 'GBPCHF',
            'XAUUSD', 'XAGUSD',
          ].map((pair) => (
            <Chip key={pair} label={pair} size="small" variant="outlined" />
          ))}
        </Box>
      </Card>

      {/* Result Dialog */}
      <Dialog
        open={!!resultDialog}
        onClose={() => setResultDialog(null)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Activity size={24} />
            {resultDialog?.robot.name} - Trading Scan Results
          </Box>
        </DialogTitle>
        <DialogContent>
          {resultDialog && (
            <Box>
              {resultDialog.signals.length > 0 ? (
                <>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Found {resultDialog.signals.length} high-confidence trading signals!
                  </Alert>
                  <List>
                    {resultDialog.signals.map((signal, index) => (
                      <ListItem key={index} divider>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                                {signal.symbol}
                              </Typography>
                              <Chip
                                label={signal.type}
                                size="small"
                                color={signal.type === 'BUY' ? 'success' : 'error'}
                              />
                              <Chip
                                label={`${signal.confidence}% confidence`}
                                size="small"
                                color="primary"
                              />
                            </Box>
                          }
                          secondary={signal.reason}
                        />
                      </ListItem>
                    ))}
                  </List>
                </>
              ) : (
                <Alert severity="info">
                  No trades with 75%+ confidence found at this time. The robot will continue scanning for opportunities.
                </Alert>
              )}

              {resultDialog.errors.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="error">
                    Errors:
                  </Typography>
                  {resultDialog.errors.map((err, i) => (
                    <Typography key={i} variant="body2" color="error">
                      • {err}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResultDialog(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
