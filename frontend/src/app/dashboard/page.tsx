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
  Alert,
  AlertTitle,
  Skeleton,
  CircularProgress,
  Avatar,
  alpha,
  useTheme,
} from '@mui/material';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  Link as LinkIcon, 
  RefreshCw, 
  Play, 
  Square,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Bot,
  Signal,
  ExternalLink,
  Lock,
  Crown,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import SubscriptionCountdown from '@/components/SubscriptionCountdown';

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
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'paused';
  profit: number;
  strategy?: string;
}

// Stat Card Component
const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  trendValue, 
  color = 'primary',
  loading = false,
  onClick,
}: {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: any;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'primary' | 'success' | 'error' | 'warning' | 'info';
  loading?: boolean;
  onClick?: () => void;
}) => {
  const theme = useTheme();
  
  const colorMap = {
    primary: { main: '#0066FF', light: 'rgba(0, 102, 255, 0.1)', gradient: 'linear-gradient(135deg, #0066FF 0%, #00D4FF 100%)' },
    success: { main: '#22C55E', light: 'rgba(34, 197, 94, 0.1)', gradient: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)' },
    error: { main: '#EF4444', light: 'rgba(239, 68, 68, 0.1)', gradient: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)' },
    warning: { main: '#F59E0B', light: 'rgba(245, 158, 11, 0.1)', gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)' },
    info: { main: '#3B82F6', light: 'rgba(59, 130, 246, 0.1)', gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)' },
  };

  const colors = colorMap[color];

  return (
    <Card
      sx={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s ease',
        border: '1px solid',
        borderColor: alpha(theme.palette.divider, 0.1),
        borderRadius: 3,
        overflow: 'hidden',
        position: 'relative',
        '&:hover': onClick ? {
          transform: 'translateY(-4px)',
          boxShadow: `0 20px 40px ${alpha(colors.main, 0.15)}`,
          borderColor: alpha(colors.main, 0.3),
        } : {},
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: colors.gradient,
        },
      }}
      onClick={onClick}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: { xs: 1.5, md: 2 } }}>
          <Box
            sx={{
              width: { xs: 40, md: 48 },
              height: { xs: 40, md: 48 },
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: colors.light,
            }}
          >
            <Icon size={24} color={colors.main} />
          </Box>
          {trend && trendValue && (
            <Chip
              icon={trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              label={trendValue}
              size="small"
              sx={{
                bgcolor: trend === 'up' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                color: trend === 'up' ? '#22C55E' : '#EF4444',
                fontWeight: 600,
                fontSize: '0.75rem',
                '& .MuiChip-icon': {
                  color: 'inherit',
                },
              }}
            />
          )}
        </Box>
        
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5, fontWeight: 500 }}>
          {title}
        </Typography>
        
        {loading ? (
          <Skeleton width={100} height={36} />
        ) : (
          <Typography variant="h4" sx={{ fontWeight: 700, letterSpacing: '-0.5px', mb: 0.5, fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' } }}>
            {value}
          </Typography>
        )}
        
        {subtitle && (
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

// Locked Feature Card Component for Unsubscribed Users
const LockedFeatureCard = ({
  title,
  description,
  icon: Icon,
  features,
}: {
  title: string;
  description: string;
  icon: any;
  features: string[];
}) => {
  const theme = useTheme();
  
  return (
    <Card 
      sx={{ 
        mb: 4, 
        borderRadius: 3, 
        border: '1px solid',
        borderColor: 'rgba(0, 102, 255, 0.2)',
        overflow: 'hidden',
        position: 'relative',
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(30, 41, 59, 0.7) 100%)'
          : 'linear-gradient(135deg, rgba(248, 250, 252, 0.9) 0%, rgba(241, 245, 249, 0.7) 100%)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {/* Lock overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.02)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      
      <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
        <Box sx={{ textAlign: 'center', py: 3 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.1) 0%, rgba(0, 212, 255, 0.05) 100%)',
              border: '2px solid rgba(0, 102, 255, 0.2)',
              mx: 'auto',
              mb: 3,
              position: 'relative',
            }}
          >
            <Icon size={36} color="#0066FF" />
            <Box
              sx={{
                position: 'absolute',
                bottom: -4,
                right: -4,
                width: 28,
                height: 28,
                borderRadius: '50%',
                bgcolor: '#0066FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 102, 255, 0.4)',
              }}
            >
              <Lock size={14} color="white" />
            </Box>
          </Box>
          
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}>
            {description}
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mb: 4 }}>
            {features.map((feature, index) => (
              <Chip
                key={index}
                label={feature}
                size="small"
                sx={{
                  bgcolor: 'rgba(0, 102, 255, 0.1)',
                  color: '#0066FF',
                  fontWeight: 500,
                  border: '1px solid rgba(0, 102, 255, 0.2)',
                }}
              />
            ))}
          </Box>
          
          <Button
            component={Link}
            href="/auth/pricing"
            variant="contained"
            size="large"
            startIcon={<Crown size={18} />}
            sx={{
              px: 4,
              py: 1.5,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #0066FF 0%, #00D4FF 100%)',
              boxShadow: '0 8px 24px rgba(0, 102, 255, 0.4)',
              fontWeight: 700,
              fontSize: '1rem',
              '&:hover': {
                background: 'linear-gradient(135deg, #0052CC 0%, #00B8D9 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 12px 28px rgba(0, 102, 255, 0.5)',
              },
            }}
          >
            Unlock Premium Features
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const theme = useTheme();
  const [mt5Account, setMt5Account] = useState<MT5Account | null>(null);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [robots, setRobots] = useState<Robot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalTrades, setTotalTrades] = useState(0);
  const [activeRobots, setActiveRobots] = useState(0);
  const [user, setUser] = useState<any>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionExpiry, setSubscriptionExpiry] = useState<string | null>(null);
  const [subscriptionPlan, setSubscriptionPlan] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    
    // Check subscription status
    const checkSubscription = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        const response = await fetch('/api/subscription/status', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (response.ok) {
          const data = await response.json();
          setIsSubscribed(data.isActive || data.status === 'active');
          setSubscriptionExpiry(data.expiresAt || null);
          setSubscriptionPlan(data.plan || null);
          setIsExpired(data.isExpired || false);
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
      }
    };
    
    // Fetch wallet balance
    const fetchWalletBalance = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        
        // Use Next.js API proxy route
        const response = await fetch('/api/wallet/balance', {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (response.ok) {
          const data = await response.json();
          setWalletBalance(data.wallet?.balance || 0);
        }
      } catch (error) {
        console.error('Error fetching wallet balance:', error);
      }
    };
    
    checkSubscription();
    fetchWalletBalance();
  }, []);

  const fetchAllData = useCallback(async (showRefresh = false) => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    if (showRefresh) setRefreshing(true);

    try {
      const [mt5Res, tradesRes, robotsRes] = await Promise.all([
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

      if (mt5Res?.ok) {
        const data = await mt5Res.json();
        setMt5Account(data.account);
      }

      if (tradesRes?.ok) {
        const data = await tradesRes.json();
        setRecentTrades(data.trades || []);
        setTotalTrades(data.totalCount || data.trades?.length || 0);
        setTotalProfit(data.totalProfit || 0);
      }

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
    const interval = setInterval(() => fetchAllData(), 30000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  const handleRefresh = () => fetchAllData(true);

  const startRobot = async (robotId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`/api/user/robots/${robotId}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ timeframe: 'H1', riskPercent: 1 }),
      });
      
      if (response.ok) {
        setRobots(prev => prev.map(r => 
          r.id === robotId ? { ...r, status: 'running' as const } : r
        ));
        setActiveRobots(prev => prev + 1);
      }
    } catch (err) {
      console.error('Failed to start robot:', err);
    }
  };

  const stopRobot = async (robotId: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const response = await fetch(`/api/user/robots/${robotId}/stop`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        setRobots(prev => prev.map(r => 
          r.id === robotId ? { ...r, status: 'stopped' as const } : r
        ));
        setActiveRobots(prev => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to stop robot:', err);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  const isAccountConnected = mt5Account && mt5Account.status === 'connected';

  // Robot color schemes
  const robotColors: Record<string, { gradient: string; border: string; glow: string }> = {
    'ema-pullback': { gradient: 'linear-gradient(135deg, #059669 0%, #047857 100%)', border: '#10b981', glow: '0 0 20px rgba(16, 185, 129, 0.3)' },
    'break-retest': { gradient: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)', border: '#a855f7', glow: '0 0 20px rgba(168, 85, 247, 0.3)' },
    'liquidity-sweep': { gradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', border: '#3b82f6', glow: '0 0 20px rgba(59, 130, 246, 0.3)' },
    'london-breakout': { gradient: 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)', border: '#f97316', glow: '0 0 20px rgba(249, 115, 22, 0.3)' },
    'order-block': { gradient: 'linear-gradient(135deg, #db2777 0%, #be185d 100%)', border: '#ec4899', glow: '0 0 20px rgba(236, 72, 153, 0.3)' },
    'vwap-reversion': { gradient: 'linear-gradient(135deg, #0891b2 0%, #0e7490 100%)', border: '#06b6d4', glow: '0 0 20px rgba(6, 182, 212, 0.3)' },
    'fib-continuation': { gradient: 'linear-gradient(135deg, #ca8a04 0%, #a16207 100%)', border: '#eab308', glow: '0 0 20px rgba(234, 179, 8, 0.3)' },
    'rsi-divergence': { gradient: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)', border: '#ef4444', glow: '0 0 20px rgba(239, 68, 68, 0.3)' },
  };

  return (
    <Box>
      {/* Header Section */}
      <Box sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: { xs: 1.5, md: 2 } }}>
          <Box>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 800, 
                letterSpacing: '-0.5px',
                background: 'linear-gradient(135deg, #0066FF 0%, #00D4FF 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 0.5,
                fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' },
              }}
            >
              Welcome back, {user?.username || 'Trader'}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: { xs: '0.875rem', md: '1rem' } }}>
              Monitor your automated trading performance and manage your bots.
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* MT5 Connection Alert */}
      {!loading && !isAccountConnected && (
        <Alert
          severity="warning"
          sx={{ 
            mb: 4,
            borderRadius: 3,
            border: '1px solid',
            borderColor: alpha('#F59E0B', 0.3),
            bgcolor: alpha('#F59E0B', 0.05),
            '& .MuiAlert-icon': {
              color: '#F59E0B',
            },
          }}
          icon={<LinkIcon size={24} />}
          action={
            <Button
              component={Link}
              href="/dashboard/mt5"
              variant="contained"
              size="small"
              startIcon={<LinkIcon size={16} />}
              sx={{
                borderRadius: 2,
                background: 'linear-gradient(135deg, #0066FF 0%, #00D4FF 100%)',
                boxShadow: '0 4px 14px rgba(0, 102, 255, 0.3)',
              }}
            >
              Connect MT5
            </Button>
          }
        >
          <AlertTitle sx={{ fontWeight: 700 }}>MT5 Account Not Connected</AlertTitle>
          <Typography variant="body2">
            Connect your MetaTrader 5 account to enable automated trading and view real-time statistics.
          </Typography>
        </Alert>
      )}

      {/* Stats Grid */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        {/* Subscription Status - Full width on mobile, 1/4 on desktop */}
        <Grid item xs={12} lg={3}>
          <SubscriptionCountdown
            expiresAt={subscriptionExpiry}
            plan={subscriptionPlan}
            isExpired={isExpired}
            isActive={isSubscribed}
          />
        </Grid>
        <Grid item xs={6} sm={6} lg={3}>
          <StatCard
            title="Account Balance"
            value={isAccountConnected ? `$${mt5Account?.balance?.toLocaleString() ?? '0'}` : '--'}
            subtitle={isAccountConnected && mt5Account?.equity ? `Equity: $${mt5Account.equity.toLocaleString()}` : 'Connect MT5 to view'}
            icon={DollarSign}
            color="primary"
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} sm={6} lg={3}>
          <StatCard
            title="Total Profit"
            value={isAccountConnected ? `${totalProfit >= 0 ? '+' : ''}$${totalProfit.toFixed(2)}` : '--'}
            subtitle={isAccountConnected ? 'All time performance' : 'Connect MT5 to view'}
            icon={totalProfit >= 0 ? TrendingUp : TrendingDown}
            trend={isAccountConnected ? (totalProfit >= 0 ? 'up' : 'down') : undefined}
            trendValue={isAccountConnected ? `${totalProfit >= 0 ? '+' : ''}${((totalProfit / (mt5Account?.balance || 1)) * 100).toFixed(1)}%` : undefined}
            color={totalProfit >= 0 ? 'success' : 'error'}
            loading={loading}
          />
        </Grid>
        <Grid item xs={6} sm={6} lg={3}>
          <StatCard
            title="Active Robots"
            value={`${activeRobots}/${robots.length}`}
            subtitle="Trading bots running"
            icon={Bot}
            color="info"
            loading={loading}
            onClick={() => router.push('/dashboard/robots')}
          />
        </Grid>
      </Grid>

      {/* Secondary Stats Row */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <Grid item xs={6} sm={6} lg={3}>
          <StatCard
            title="Total Trades"
            value={isAccountConnected ? totalTrades.toString() : '--'}
            subtitle={isAccountConnected ? 'Executed trades' : 'Connect MT5 to view'}
            icon={Activity}
            color="warning"
            loading={loading}
            onClick={() => router.push('/dashboard/history')}
          />
        </Grid>
      </Grid>

      {/* Trading Robots Section */}
      {!isSubscribed ? (
        <LockedFeatureCard
          title="Trading Robots"
          description="Access our AI-powered trading bots that work 24/7 to maximize your profits with advanced algorithms."
          icon={Bot}
          features={['8 AI Algorithms', 'Auto Trading', '24/7 Operation', 'Risk Management']}
        />
      ) : (
      <Card 
        sx={{ 
          mb: { xs: 2, sm: 3, md: 4 }, 
          borderRadius: 3, 
          border: '1px solid',
          borderColor: alpha(theme.palette.divider, 0.1),
          overflow: 'hidden',
        }}
      >
        <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.1) }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 2 } }}>
              <Box
                sx={{
                  width: { xs: 36, md: 44 },
                  height: { xs: 36, md: 44 },
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.1) 0%, rgba(0, 212, 255, 0.05) 100%)',
                }}
              >
                <Bot size={24} color="#0066FF" />
              </Box>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                  Trading Robots
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                  {activeRobots} of {robots.length} bots active
                </Typography>
              </Box>
            </Box>
            <Button
              component={Link}
              href="/dashboard/robots"
              variant="outlined"
              size="small"
              endIcon={<ExternalLink size={14} />}
              disabled={!isAccountConnected}
              sx={{ borderRadius: 2 }}
            >
              Manage All
            </Button>
          </Box>
        </Box>
        
        <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
          {!isAccountConnected ? (
            <Alert 
              severity="info" 
              sx={{ 
                borderRadius: 2,
                bgcolor: alpha(theme.palette.info.main, 0.05),
                border: '1px solid',
                borderColor: alpha(theme.palette.info.main, 0.2),
              }}
            >
              Connect your MT5 account to activate and manage trading robots.
            </Alert>
          ) : loading ? (
            <Grid container spacing={{ xs: 1.5, sm: 2 }}>
              {[1, 2, 3, 4].map((i) => (
                <Grid item xs={6} sm={6} lg={3} key={i}>
                  <Skeleton variant="rounded" height={110} sx={{ borderRadius: 2 }} />
                </Grid>
              ))}
            </Grid>
          ) : robots.length > 0 ? (
            <Grid container spacing={{ xs: 1.5, sm: 2 }}>
              {robots.slice(0, 8).map((robot) => {
                const isRunning = robot.status === 'running';
                const colors = robotColors[robot.id] || robotColors['ema-pullback'];
                
                return (
                  <Grid item xs={6} sm={6} lg={3} key={robot.id}>
                    <Box
                      sx={{
                        p: { xs: 1.5, sm: 2, md: 2.5 },
                        borderRadius: { xs: 2, md: 3 },
                        border: '1px solid',
                        borderColor: isRunning ? colors.border : alpha(colors.border, 0.3),
                        background: isRunning 
                          ? colors.gradient
                          : theme.palette.mode === 'dark' 
                            ? 'rgba(30, 41, 59, 0.5)'
                            : 'rgba(248, 250, 252, 0.8)',
                        transition: 'all 0.3s ease',
                        boxShadow: isRunning ? colors.glow : 'none',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: colors.glow,
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: { xs: 1, md: 1.5 } }}>
                        <Typography 
                          variant="subtitle2" 
                          sx={{ 
                            fontWeight: 700, 
                            color: isRunning ? 'white' : 'text.primary',
                            lineHeight: 1.2,
                            fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' },
                          }}
                        >
                          {robot.name}
                        </Typography>
                        <Chip
                          label={isRunning ? 'LIVE' : 'OFF'}
                          size="small"
                          sx={{
                            height: { xs: 18, md: 22 },
                            fontSize: { xs: '0.55rem', md: '0.65rem' },
                            fontWeight: 700,
                            bgcolor: isRunning ? 'rgba(255,255,255,0.2)' : alpha(theme.palette.text.secondary, 0.1),
                            color: isRunning ? 'white' : 'text.secondary',
                            border: `1px solid ${isRunning ? 'rgba(255,255,255,0.3)' : alpha(theme.palette.divider, 0.2)}`,
                          }}
                        />
                      </Box>
                      <Typography 
                        variant="caption" 
                        sx={{ 
                          color: isRunning ? 'rgba(255,255,255,0.8)' : 'text.secondary',
                          display: { xs: 'none', sm: 'block' },
                          mb: { xs: 1, md: 2 },
                          minHeight: { xs: 'auto', sm: 32 },
                          lineHeight: 1.4,
                          fontSize: { xs: '0.65rem', md: '0.75rem' },
                        }}
                      >
                        {robot.strategy || 'AI-Powered Strategy'}
                      </Typography>
                      <Button
                        variant="contained"
                        size="small"
                        fullWidth
                        onClick={() => isRunning ? stopRobot(robot.id) : startRobot(robot.id)}
                        startIcon={isRunning ? <Square size={14} /> : <Play size={14} />}
                        sx={{
                          height: { xs: 28, sm: 32, md: 36 },
                          fontSize: { xs: '0.65rem', sm: '0.7rem', md: '0.8rem' },
                          fontWeight: 600,
                          borderRadius: 2,
                          background: isRunning 
                            ? 'rgba(255,255,255,0.15)'
                            : colors.gradient,
                          border: isRunning ? '1px solid rgba(255,255,255,0.3)' : 'none',
                          color: 'white',
                          boxShadow: isRunning ? 'none' : `0 4px 14px ${alpha(colors.border, 0.4)}`,
                          '&:hover': {
                            background: isRunning 
                              ? 'rgba(255,255,255,0.25)'
                              : colors.gradient,
                            boxShadow: `0 6px 20px ${alpha(colors.border, 0.5)}`,
                          },
                        }}
                      >
                        {isRunning ? 'Stop Bot' : 'Start Bot'}
                      </Button>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          ) : (
            <Alert 
              severity="warning"
              sx={{ 
                borderRadius: 2,
                bgcolor: alpha(theme.palette.warning.main, 0.05),
                border: '1px solid',
                borderColor: alpha(theme.palette.warning.main, 0.2),
              }}
            >
              No trading robots available. Please contact support.
            </Alert>
          )}
        </CardContent>
      </Card>
      )}

      {/* Bottom Grid - Recent Trades & Quick Actions */}
      <Grid container spacing={{ xs: 2, md: 3 }}>
        {/* Recent Trades */}
        <Grid item xs={12} lg={7}>
          <Card 
            sx={{ 
              height: '100%',
              borderRadius: 3, 
              border: '1px solid',
              borderColor: alpha(theme.palette.divider, 0.1),
            }}
          >
            <Box sx={{ p: { xs: 2, sm: 2.5, md: 3 }, borderBottom: '1px solid', borderColor: alpha(theme.palette.divider, 0.1) }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 2 } }}>
                <Box
                  sx={{
                    width: { xs: 36, md: 44 },
                    height: { xs: 36, md: 44 },
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)',
                  }}
                >
                  <Activity size={24} color="#22C55E" />
                </Box>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                    Recent Trades
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                    Your latest trading activity
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
              {!isAccountConnected ? (
                <Alert 
                  severity="info"
                  sx={{ 
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.info.main, 0.05),
                    border: '1px solid',
                    borderColor: alpha(theme.palette.info.main, 0.2),
                  }}
                >
                  Connect your MT5 account to view trade history.
                </Alert>
              ) : loading ? (
                <Box>
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} variant="rounded" height={64} sx={{ mb: 1.5, borderRadius: 2 }} />
                  ))}
                </Box>
              ) : recentTrades.length > 0 ? (
                <Box>
                  {recentTrades.map((trade, index) => (
                    <Box
                      key={trade.id}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        p: { xs: 1.5, md: 2 },
                        mb: index < recentTrades.length - 1 ? { xs: 1, md: 1.5 } : 0,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.background.paper, 0.5),
                        border: '1px solid',
                        borderColor: alpha(theme.palette.divider, 0.1),
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: alpha(theme.palette.primary.main, 0.05),
                          borderColor: alpha(theme.palette.primary.main, 0.2),
                        },
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 2 } }}>
                        <Avatar
                          sx={{
                            width: { xs: 32, md: 40 },
                            height: { xs: 32, md: 40 },
                            bgcolor: trade.type === 'BUY' 
                              ? alpha('#22C55E', 0.1)
                              : alpha('#EF4444', 0.1),
                            color: trade.type === 'BUY' ? '#22C55E' : '#EF4444',
                            fontWeight: 700,
                            fontSize: { xs: '0.65rem', md: '0.75rem' },
                          }}
                        >
                          {trade.type}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600, fontSize: { xs: '0.8rem', md: '0.875rem' } }}>
                            {trade.symbol}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}>
                            {trade.volume} lots • {getTimeAgo(trade.openTime)}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                          color: trade.profit >= 0 ? '#22C55E' : '#EF4444',
                          fontSize: { xs: '0.8rem', md: '0.875rem' },
                        }}
                      >
                        {trade.profit >= 0 ? '+' : ''}${trade.profit.toFixed(2)}
                      </Typography>
                    </Box>
                  ))}
                  <Button
                    component={Link}
                    href="/dashboard/history"
                    variant="outlined"
                    fullWidth
                    sx={{ mt: 2, borderRadius: 2 }}
                  >
                    View All Trades
                  </Button>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Activity size={48} color={theme.palette.text.secondary} style={{ opacity: 0.5 }} />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    No trades yet. Start a robot to begin trading.
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} lg={5}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 }, height: '100%' }}>
            {/* WhatsApp Card */}
            <Card
              sx={{
                borderRadius: 3,
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 20px 40px rgba(37, 211, 102, 0.3)',
                },
              }}
              onClick={() => window.open(process.env.NEXT_PUBLIC_WHATSAPP_URL || 'https://wa.me/', '_blank')}
            >
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 2 }, mb: { xs: 1, md: 1.5 } }}>
                  <Box
                    sx={{
                      width: { xs: 36, md: 44 },
                      height: { xs: 36, md: 44 },
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'rgba(255,255,255,0.2)',
                    }}
                  >
                    <Signal size={24} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                      Need Help?
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                      Chat with our support team
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 600,
                    borderRadius: 2,
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.3)',
                    },
                  }}
                >
                  Open WhatsApp
                </Button>
              </CardContent>
            </Card>

            {/* Instagram Card */}
            <Card
              sx={{
                borderRadius: 3,
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #E4405F 0%, #833AB4 50%, #FD1D1D 100%)',
                color: 'white',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 20px 40px rgba(228, 64, 95, 0.3)',
                },
              }}
              onClick={() => window.open(process.env.NEXT_PUBLIC_INSTAGRAM_URL || 'https://instagram.com/', '_blank')}
            >
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 2 }, mb: { xs: 1, md: 1.5 } }}>
                  <Box
                    sx={{
                      width: { xs: 36, md: 44 },
                      height: { xs: 36, md: 44 },
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      bgcolor: 'rgba(255,255,255,0.2)',
                    }}
                  >
                    <Zap size={24} />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                      Follow Us
                    </Typography>
                    <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                      Stay updated with latest news
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: 'white',
                    fontWeight: 600,
                    borderRadius: 2,
                    '&:hover': {
                      bgcolor: 'rgba(255,255,255,0.3)',
                    },
                  }}
                >
                  Follow on Instagram
                </Button>
              </CardContent>
            </Card>

            {/* Wallet Card */}
            <Card
              sx={{
                flex: 1,
                borderRadius: 3,
                border: '1px solid',
                borderColor: alpha(theme.palette.divider, 0.1),
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: `0 20px 40px ${alpha(theme.palette.primary.main, 0.1)}`,
                  borderColor: alpha(theme.palette.primary.main, 0.3),
                },
              }}
              onClick={() => router.push('/dashboard/wallet')}
            >
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, md: 2 }, mb: { xs: 1, md: 1.5 } }}>
                  <Box
                    sx={{
                      width: { xs: 36, md: 44 },
                      height: { xs: 36, md: 44 },
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.1) 0%, rgba(0, 212, 255, 0.05) 100%)',
                    }}
                  >
                    <Wallet size={24} color="#0066FF" />
                  </Box>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                      Your Wallet
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                      Manage deposits & withdrawals
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{
                    borderRadius: 2,
                    borderColor: alpha(theme.palette.primary.main, 0.3),
                    '&:hover': {
                      borderColor: 'primary.main',
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                    },
                  }}
                >
                  Open Wallet
                </Button>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
