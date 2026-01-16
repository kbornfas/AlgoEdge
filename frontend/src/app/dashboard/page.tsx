'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Alert,
  AlertTitle,
  Skeleton,
  CircularProgress,
} from '@mui/material';
import { TrendingUp, TrendingDown, DollarSign, Activity, Users, AlertCircle, Upload, Link as LinkIcon, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface MT5Account {
  id: number;
  accountId: string;
  server: string;
  status: string;
  balance?: number;
  equity?: number;
  profit?: number;
  margin?: number;
  freeMargin?: number;
}

interface Trade {
  id: number;
  symbol: string;
  type: 'BUY' | 'SELL';
  profit: number;
  openTime: string;
  volume: number;
}

interface Robot {
  id: number;
  name: string;
  status: 'running' | 'stopped' | 'paused';
  profit: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [mt5Account, setMt5Account] = useState<MT5Account | null>(null);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [robots, setRobots] = useState<Robot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalTrades, setTotalTrades] = useState(0);
  const [activeRobots, setActiveRobots] = useState(0);

  const fetchAllData = useCallback(async (showRefresh = false) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    if (showRefresh) setRefreshing(true);

    try {
      // Fetch all data in parallel
      const [paymentRes, mt5Res, tradesRes, robotsRes] = await Promise.all([
        fetch('/api/payment-proof/status', {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null),
        fetch('/api/user/mt5-account', {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null),
        fetch('/api/user/trades?limit=5', {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null),
        fetch('/api/user/robots', {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null),
      ]);

      // Process payment status
      if (paymentRes?.ok) {
        const data = await paymentRes.json();
        setPaymentStatus(data);
      }

      // Process MT5 account data
      if (mt5Res?.ok) {
        const data = await mt5Res.json();
        setMt5Account(data.account);
      }

      // Process recent trades
      if (tradesRes?.ok) {
        const data = await tradesRes.json();
        setRecentTrades(data.trades || []);
        setTotalTrades(data.totalCount || data.trades?.length || 0);
        setTotalProfit(data.totalProfit || 0);
      }

      // Process robots
      if (robotsRes?.ok) {
        const data = await robotsRes.json();
        setRobots(data.robots || []);
        setActiveRobots(data.robots?.filter((r: Robot) => r.status === 'running').length || 0);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [router]);

  useEffect(() => {
    fetchAllData();
    
    // Set up auto-refresh every 30 seconds for real-time updates
    const interval = setInterval(() => {
      fetchAllData();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchAllData]);

  const handleRefresh = () => {
    fetchAllData(true);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    return `${diffDays} days ago`;
  };

  const isAccountConnected = mt5Account && mt5Account.status === 'connected';

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
            Welcome to AlgoEdge
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor your automated trading performance
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={refreshing ? <CircularProgress size={16} /> : <RefreshCw size={16} />}
          onClick={handleRefresh}
          disabled={refreshing}
        >
          Refresh
        </Button>
      </Box>

      {/* MT5 Connection Alert */}
      {!loading && !isAccountConnected && (
        <Alert
          severity="warning"
          sx={{ mb: 4 }}
          icon={<LinkIcon size={24} />}
          action={
            <Button
              component={Link}
              href="/dashboard/mt5"
              variant="contained"
              size="small"
              startIcon={<LinkIcon size={16} />}
            >
              Connect Account
            </Button>
          }
        >
          <AlertTitle>MT5 Account Not Connected</AlertTitle>
          <Typography variant="body2">
            Connect your MetaTrader 5 account to see your real balance and enable automated trading with our bots.
          </Typography>
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Balance Card - Only show if MT5 connected */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: 'primary.main',
                    color: 'white',
                    mr: 2,
                  }}
                >
                  <DollarSign size={24} />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Balance
                  </Typography>
                  {loading ? (
                    <Skeleton width={100} height={32} />
                  ) : isAccountConnected ? (
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      ${mt5Account?.balance?.toLocaleString() ?? '0.00'}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Connect MT5
                    </Typography>
                  )}
                </Box>
              </Box>
              {isAccountConnected && mt5Account?.equity && (
                <Typography variant="caption" color="text.secondary">
                  Equity: ${mt5Account.equity.toLocaleString()}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Profit Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: totalProfit >= 0 ? 'success.main' : 'error.main',
                    color: 'white',
                    mr: 2,
                  }}
                >
                  {totalProfit >= 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Profit
                  </Typography>
                  {loading ? (
                    <Skeleton width={100} height={32} />
                  ) : isAccountConnected ? (
                    <>
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 600,
                          color: totalProfit >= 0 ? 'success.main' : 'error.main',
                        }}
                      >
                        {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
                      </Typography>
                    </>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Connect MT5
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Robots Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: 'info.main',
                    color: 'white',
                    mr: 2,
                  }}
                >
                  <Activity size={24} />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Active Robots
                  </Typography>
                  {loading ? (
                    <Skeleton width={50} height={32} />
                  ) : (
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      {activeRobots}
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Total Trades Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: 'secondary.main',
                    color: 'white',
                    mr: 2,
                  }}
                >
                  <Users size={24} />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Trades
                  </Typography>
                  {loading ? (
                    <Skeleton width={50} height={32} />
                  ) : isAccountConnected ? (
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      {totalTrades}
                    </Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Connect MT5
                    </Typography>
                  )}
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3}>
        {/* Trading Robots Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Trading Robots
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Manage your automated trading bots
              </Typography>
              
              {!isAccountConnected ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Connect your MT5 account to activate and use trading robots.
                  </Typography>
                </Alert>
              ) : loading ? (
                <Box>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} height={60} sx={{ mb: 1 }} />
                  ))}
                </Box>
              ) : robots.length > 0 ? (
                <Box sx={{ mb: 2 }}>
                  {robots.slice(0, 3).map((robot) => (
                    <Box key={robot.id} sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2">{robot.name}</Typography>
                        <Chip
                          label={robot.status}
                          size="small"
                          color={robot.status === 'running' ? 'success' : 'default'}
                        />
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={robot.status === 'running' ? 75 : 0}
                        color={robot.status === 'running' ? 'primary' : 'inherit'}
                      />
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  No robots configured yet.
                </Typography>
              )}
              
              <Button
                component={Link}
                href="/dashboard/robots"
                variant="contained"
                fullWidth
                disabled={!isAccountConnected}
              >
                Manage Robots
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Trades Section */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Recent Trades
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Your latest trading activity
              </Typography>
              
              {!isAccountConnected ? (
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    Connect your MT5 account to view your trade history.
                  </Typography>
                </Alert>
              ) : loading ? (
                <Box>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} height={60} sx={{ mb: 1 }} />
                  ))}
                </Box>
              ) : recentTrades.length > 0 ? (
                <Box>
                  {recentTrades.map((trade) => (
                    <Box
                      key={trade.id}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: 2,
                        mb: 1,
                        borderRadius: 2,
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {trade.symbol}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {trade.type} • {trade.volume} lots • {getTimeAgo(trade.openTime)}
                        </Typography>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          color: trade.profit >= 0 ? 'success.main' : 'error.main',
                        }}
                      >
                        {trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  No trades yet. Activate a robot to start trading.
                </Typography>
              )}
              
              <Button
                component={Link}
                href="/dashboard/history"
                variant="outlined"
                fullWidth
                sx={{ mt: 2 }}
                disabled={!isAccountConnected}
              >
                View All Trades
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* External CTAs */}
      <Box sx={{ mt: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Card sx={{ bgcolor: '#25D366', color: 'white' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Need Help?
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Contact us on WhatsApp for support
                </Typography>
                <Button
                  variant="contained"
                  sx={{ bgcolor: 'white', color: '#25D366', '&:hover': { bgcolor: '#f0f0f0' } }}
                  href={process.env.NEXT_PUBLIC_WHATSAPP_URL || 'https://wa.me/'}
                  target="_blank"
                >
                  Chat on WhatsApp
                </Button>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Card sx={{ bgcolor: '#E4405F', color: 'white' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Follow Us
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  Stay updated on Instagram
                </Typography>
                <Button
                  variant="contained"
                  sx={{ bgcolor: 'white', color: '#E4405F', '&:hover': { bgcolor: '#f0f0f0' } }}
                  href={process.env.NEXT_PUBLIC_INSTAGRAM_URL || 'https://instagram.com/'}
                  target="_blank"
                >
                  Follow on Instagram
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
