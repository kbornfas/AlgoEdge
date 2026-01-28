'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Avatar,
  Chip,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  LinearProgress,
  Tooltip,
  Badge,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Bot,
  Signal,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  MoreVertical,
  RefreshCcw,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Activity,
  Globe,
  CreditCard,
  UserPlus,
  Star,
} from 'lucide-react';
import Link from 'next/link';

// Verified Badge Component (Meta/Twitter style blue tick)
export const VerifiedBadge = ({ size = 16, showTooltip = true }: { size?: number; showTooltip?: boolean }) => {
  const badge = (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size + 4,
        height: size + 4,
        borderRadius: '50%',
        bgcolor: '#1D9BF0',
        ml: 0.5,
        flexShrink: 0,
      }}
    >
      <svg
        viewBox="0 0 22 22"
        width={size}
        height={size}
        fill="white"
      >
        <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
      </svg>
    </Box>
  );

  if (showTooltip) {
    return (
      <Tooltip title="Verified" arrow>
        {badge}
      </Tooltip>
    );
  }
  return badge;
};

interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  totalRevenue: number;
  revenueToday: number;
  revenueGrowth: number;
  totalOrders: number;
  ordersToday: number;
  pendingApprovals: number;
  pendingVerifications: number;
  totalBots: number;
  totalProducts: number;
  totalSignalProviders: number;
  activeSubscribers: number;
}

interface RecentActivity {
  id: number;
  type: 'user_signup' | 'purchase' | 'verification' | 'listing' | 'payout';
  title: string;
  description: string;
  amount?: number;
  user?: string;
  created_at: string;
}

interface TopSeller {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  is_verified: boolean;
  total_sales: number;
  total_revenue: number;
  products_count: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [topSellers, setTopSellers] = useState<TopSeller[]>([]);
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      
      // Fetch multiple data sources in parallel
      const [statsRes, usersRes, verificationsRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/marketplace/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/admin/pending-verifications`, {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null),
      ]);

      // Process stats
      let dashboardStats: DashboardStats = {
        totalUsers: 0,
        activeUsers: 0,
        newUsersToday: 0,
        totalRevenue: 0,
        revenueToday: 0,
        revenueGrowth: 12.5,
        totalOrders: 0,
        ordersToday: 0,
        pendingApprovals: 0,
        pendingVerifications: 0,
        totalBots: 0,
        totalProducts: 0,
        totalSignalProviders: 0,
        activeSubscribers: 0,
      };

      if (statsRes?.ok) {
        const statsData = await statsRes.json();
        dashboardStats = {
          ...dashboardStats,
          // Use stats from backend directly
          totalUsers: statsData.total_users || 0,
          activeUsers: statsData.active_users || 0,
          newUsersToday: statsData.new_users_today || 0,
          totalBots: statsData.total_bots || 0,
          totalProducts: statsData.total_products || 0,
          totalSignalProviders: statsData.total_signal_providers || 0,
          pendingApprovals: (statsData.pending_bots || 0) + (statsData.pending_products || 0) + (statsData.pending_signals || 0) + (statsData.pending_seller_applications || 0),
          totalOrders: statsData.total_sales_today || 0,
          revenueToday: statsData.revenue_today || 0,
        };
      }

      if (usersRes?.ok) {
        const usersData = await usersRes.json();
        const users = usersData.users || [];
        
        // Only update if stats endpoint didn't provide these
        if (dashboardStats.totalUsers === 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          dashboardStats.totalUsers = users.length;
          dashboardStats.activeUsers = users.filter((u: any) => !u.is_blocked).length;
          dashboardStats.newUsersToday = users.filter((u: any) => new Date(u.created_at) >= today).length;
        }
        dashboardStats.activeSubscribers = users.filter((u: any) => u.subscription_status === 'active').length;

        // Get top sellers from actual seller data
        const sellerUsers = users.filter((u: any) => u.is_seller);
        const sellers = sellerUsers.slice(0, 5).map((u: any) => ({
          id: u.id,
          name: u.full_name || u.username || 'Unknown',
          email: u.email,
          avatar: u.profile_image,
          is_verified: u.has_blue_badge || false,
          total_sales: 0, // Would need a separate query for actual sales
          total_revenue: 0,
          products_count: 0,
        }));
        setTopSellers(sellers);

        // Recent activity from users (sorted by created_at desc)
        const sortedUsers = [...users].sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        const activity: RecentActivity[] = sortedUsers.slice(0, 8).map((u: any) => ({
          id: u.id,
          type: 'user_signup' as const,
          title: 'New User Signup',
          description: u.full_name || u.username || u.email,
          user: u.email,
          created_at: u.created_at,
        }));
        setRecentActivity(activity);
      }

      if (verificationsRes?.ok) {
        const verificationsData = await verificationsRes.json();
        dashboardStats.pendingVerifications = verificationsData.pendingVerifications?.length || 0;
        setPendingItems(verificationsData.pendingVerifications?.slice(0, 5) || []);
      }

      setStats(dashboardStats);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ 
    icon, 
    label, 
    value, 
    change, 
    changeType = 'positive',
    color,
    bgColor,
  }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
    color: string;
    bgColor: string;
  }) => (
    <Card
      sx={{
        bgcolor: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 3,
        transition: 'all 0.3s ease',
        '&:hover': {
          bgcolor: 'rgba(255,255,255,0.04)',
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        },
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography
              sx={{
                color: 'rgba(255,255,255,0.5)',
                fontSize: '0.8rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                mb: 1,
              }}
            >
              {label}
            </Typography>
            <Typography
              sx={{
                color: 'white',
                fontSize: '2rem',
                fontWeight: 800,
                lineHeight: 1,
                mb: 1,
              }}
            >
              {loading ? <Skeleton width={80} /> : value}
            </Typography>
            {change && (
              <Stack direction="row" alignItems="center" spacing={0.5}>
                {changeType === 'positive' ? (
                  <ArrowUpRight size={14} color="#22C55E" />
                ) : changeType === 'negative' ? (
                  <ArrowDownRight size={14} color="#EF4444" />
                ) : null}
                <Typography
                  sx={{
                    color: changeType === 'positive' ? '#22C55E' : changeType === 'negative' ? '#EF4444' : 'rgba(255,255,255,0.5)',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                  }}
                >
                  {change}
                </Typography>
              </Stack>
            )}
          </Box>
          <Box
            sx={{
              width: 50,
              height: 50,
              borderRadius: 2,
              bgcolor: bgColor,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_signup':
        return <UserPlus size={16} color="#3B82F6" />;
      case 'purchase':
        return <ShoppingCart size={16} color="#22C55E" />;
      case 'verification':
        return (
          <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
            <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="#1D9BF0"/>
          </svg>
        );
      case 'listing':
        return <Package size={16} color="#8B5CF6" />;
      case 'payout':
        return <DollarSign size={16} color="#F59E0B" />;
      default:
        return <Activity size={16} color="#6B7280" />;
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: 4, pl: { xs: 6, md: 0 } }}>
        <Typography
          variant="h4"
          sx={{
            color: 'white',
            fontWeight: 800,
            mb: 0.5,
            fontSize: { xs: '1.5rem', md: '2rem' },
          }}
        >
          Dashboard Overview
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
          Welcome back! Here's what's happening with your platform today.
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Stats Grid */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={<Users size={24} color="#3B82F6" />}
            label="Total Users"
            value={stats?.totalUsers?.toLocaleString() || 0}
            change={`+${stats?.newUsersToday || 0} today`}
            changeType="positive"
            color="#3B82F6"
            bgColor="rgba(59, 130, 246, 0.15)"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={<DollarSign size={24} color="#22C55E" />}
            label="Revenue Today"
            value={`$${(stats?.revenueToday || 0).toLocaleString()}`}
            change={`+${stats?.revenueGrowth || 0}%`}
            changeType="positive"
            color="#22C55E"
            bgColor="rgba(34, 197, 94, 0.15)"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={<ShoppingCart size={24} color="#8B5CF6" />}
            label="Orders Today"
            value={stats?.ordersToday || 0}
            change="Real-time"
            changeType="neutral"
            color="#8B5CF6"
            bgColor="rgba(139, 92, 246, 0.15)"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard
            icon={<CreditCard size={24} color="#F59E0B" />}
            label="Active Subscribers"
            value={stats?.activeSubscribers || 0}
            change="Premium users"
            changeType="neutral"
            color="#F59E0B"
            bgColor="rgba(245, 158, 11, 0.15)"
          />
        </Grid>
      </Grid>

      {/* Action Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Pending Approvals */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              bgcolor: stats?.pendingApprovals ? 'rgba(245, 158, 11, 0.1)' : 'rgba(255,255,255,0.02)',
              border: stats?.pendingApprovals ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(255,255,255,0.06)',
              borderRadius: 3,
              height: '100%',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: 'rgba(245, 158, 11, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Clock size={20} color="#F59E0B" />
                  </Box>
                  <Box>
                    <Typography sx={{ color: 'white', fontWeight: 700 }}>
                      Pending Approvals
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                      Listings awaiting review
                    </Typography>
                  </Box>
                </Box>
                <Badge badgeContent={stats?.pendingApprovals || 0} color="warning">
                  <Box />
                </Badge>
              </Stack>
              <Button
                component={Link}
                href="/admin/marketplace"
                fullWidth
                variant="outlined"
                sx={{
                  borderColor: 'rgba(245, 158, 11, 0.5)',
                  color: '#F59E0B',
                  '&:hover': {
                    borderColor: '#F59E0B',
                    bgcolor: 'rgba(245, 158, 11, 0.1)',
                  },
                }}
              >
                Review Now
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Pending Verifications */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              bgcolor: stats?.pendingVerifications ? 'rgba(29, 155, 240, 0.1)' : 'rgba(255,255,255,0.02)',
              border: stats?.pendingVerifications ? '1px solid rgba(29, 155, 240, 0.3)' : '1px solid rgba(255,255,255,0.06)',
              borderRadius: 3,
              height: '100%',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: 'rgba(29, 155, 240, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
                      <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="#1D9BF0"/>
                    </svg>
                  </Box>
                  <Box>
                    <Typography sx={{ color: 'white', fontWeight: 700 }}>
                      Verifications
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                      Seller badge requests
                    </Typography>
                  </Box>
                </Box>
                <Badge badgeContent={stats?.pendingVerifications || 0} color="info">
                  <Box />
                </Badge>
              </Stack>
              <Button
                component={Link}
                href="/admin/marketplace"
                fullWidth
                variant="outlined"
                sx={{
                  borderColor: 'rgba(29, 155, 240, 0.5)',
                  color: '#1D9BF0',
                  '&:hover': {
                    borderColor: '#1D9BF0',
                    bgcolor: 'rgba(29, 155, 240, 0.1)',
                  },
                }}
              >
                Review Requests
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card
            sx={{
              bgcolor: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 3,
              height: '100%',
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography sx={{ color: 'white', fontWeight: 700, mb: 2 }}>
                Quick Actions
              </Typography>
              <Stack spacing={1.5}>
                <Button
                  component={Link}
                  href="/admin/signals"
                  fullWidth
                  variant="outlined"
                  startIcon={<Signal size={18} />}
                  sx={{
                    borderColor: 'rgba(34, 197, 94, 0.5)',
                    color: '#22C55E',
                    justifyContent: 'flex-start',
                    '&:hover': { borderColor: '#22C55E', bgcolor: 'rgba(34, 197, 94, 0.1)' },
                  }}
                >
                  Send Signal
                </Button>
                <Button
                  component={Link}
                  href="/admin/users"
                  fullWidth
                  variant="outlined"
                  startIcon={<Users size={18} />}
                  sx={{
                    borderColor: 'rgba(139, 92, 246, 0.5)',
                    color: '#8B5CF6',
                    justifyContent: 'flex-start',
                    '&:hover': { borderColor: '#8B5CF6', bgcolor: 'rgba(139, 92, 246, 0.1)' },
                  }}
                >
                  Manage Users
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bottom Section */}
      <Grid container spacing={3}>
        {/* Recent Activity */}
        <Grid item xs={12} lg={7}>
          <Card
            sx={{
              bgcolor: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1.1rem' }}>
                  Recent Activity
                </Typography>
                <IconButton
                  onClick={fetchDashboardData}
                  sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: 'white' } }}
                >
                  <RefreshCcw size={18} />
                </IconButton>
              </Stack>
              <Stack spacing={2}>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} variant="rectangular" height={50} sx={{ borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)' }} />
                  ))
                ) : recentActivity.length === 0 ? (
                  <Typography sx={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', py: 4 }}>
                    No recent activity
                  </Typography>
                ) : (
                  recentActivity.map((activity) => (
                    <Box
                      key={activity.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'rgba(255,255,255,0.02)',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                      }}
                    >
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          bgcolor: 'rgba(255,255,255,0.05)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {getActivityIcon(activity.type)}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>
                          {activity.title}
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                          {activity.description}
                        </Typography>
                      </Box>
                      <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                        {new Date(activity.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  ))
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Top Sellers */}
        <Grid item xs={12} lg={5}>
          <Card
            sx={{
              bgcolor: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1.1rem' }}>
                  Top Sellers
                </Typography>
                <Button
                  component={Link}
                  href="/admin/users"
                  size="small"
                  sx={{ color: '#3B82F6' }}
                >
                  View All
                </Button>
              </Stack>
              <Stack spacing={2}>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} variant="rectangular" height={50} sx={{ borderRadius: 2, bgcolor: 'rgba(255,255,255,0.05)' }} />
                  ))
                ) : topSellers.length === 0 ? (
                  <Typography sx={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', py: 4 }}>
                    No sellers yet
                  </Typography>
                ) : (
                  topSellers.map((seller, index) => (
                    <Box
                      key={seller.id}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        p: 2,
                        borderRadius: 2,
                        bgcolor: 'rgba(255,255,255,0.02)',
                        '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                      }}
                    >
                      <Typography
                        sx={{
                          color: index < 3 ? '#F59E0B' : 'rgba(255,255,255,0.4)',
                          fontWeight: 800,
                          width: 24,
                        }}
                      >
                        #{index + 1}
                      </Typography>
                      <Avatar
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: '#3B82F6',
                          fontSize: '0.9rem',
                        }}
                      >
                        {seller.name?.charAt(0) || '?'}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>
                            {seller.name}
                          </Typography>
                          {seller.is_verified && <VerifiedBadge size={14} />}
                        </Box>
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                          {seller.products_count} listings
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography sx={{ color: '#22C55E', fontWeight: 700, fontSize: '0.9rem' }}>
                          ${seller.total_revenue.toLocaleString()}
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                          {seller.total_sales} sales
                        </Typography>
                      </Box>
                    </Box>
                  ))
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
