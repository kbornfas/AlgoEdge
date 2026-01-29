'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Stack,
  Avatar,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  alpha,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Star,
  DollarSign,
  Package,
  BarChart3,
} from 'lucide-react';

interface EarningsData {
  date: string;
  earnings: number;
  sales_count: number;
}

interface ProductPerformance {
  product_name: string;
  product_type: string;
  total_sales: number;
  total_earnings: number;
  avg_rating: number;
}

interface CustomerStats {
  unique_customers: number;
  total_purchases: number;
  avg_order_value: number;
}

interface TopCustomer {
  username: string;
  full_name: string;
  profile_image: string;
  purchase_count: number;
  total_spent: number;
}

interface MonthlyData {
  month: string;
  sales: number;
  revenue: number;
}

interface ReviewBreakdown {
  rating: number;
  count: number;
}

interface AnalyticsData {
  earningsOverTime: EarningsData[];
  productPerformance: ProductPerformance[];
  customerStats: CustomerStats;
  topCustomers: TopCustomer[];
  monthlyComparison: MonthlyData[];
  reviewsBreakdown: ReviewBreakdown[];
  period: number;
}

export default function SellerAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/seller/analytics?period=${period}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!analytics) {
    return (
      <Typography sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', py: 4 }}>
        No analytics data available
      </Typography>
    );
  }

  // Calculate totals
  const totalEarnings = analytics.earningsOverTime.reduce((sum, d) => sum + parseFloat(d.earnings?.toString() || '0'), 0);
  const totalSales = analytics.earningsOverTime.reduce((sum, d) => sum + parseInt(d.sales_count?.toString() || '0'), 0);
  const avgRating = analytics.reviewsBreakdown.length > 0
    ? analytics.reviewsBreakdown.reduce((sum, r) => sum + (r.rating * r.count), 0) / 
      analytics.reviewsBreakdown.reduce((sum, r) => sum + r.count, 0)
    : 0;
  const totalReviews = analytics.reviewsBreakdown.reduce((sum, r) => sum + r.count, 0);

  // Max earnings for chart scaling
  const maxEarnings = Math.max(...analytics.earningsOverTime.map(d => parseFloat(d.earnings?.toString() || '0')), 1);

  return (
    <Card sx={{ 
      bgcolor: 'rgba(0,0,0,0.3)', 
      border: '1px solid rgba(255,255,255,0.1)',
      overflow: 'hidden' 
    }}>
      <CardContent sx={{ p: { xs: 2, md: 3 } }}>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <BarChart3 size={24} color="#8B5CF6" />
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
              Analytics
            </Typography>
          </Stack>
          <ToggleButtonGroup
            value={period}
            exclusive
            onChange={(_, val) => val && setPeriod(val)}
            size="small"
            sx={{
              '& .MuiToggleButton-root': {
                color: 'rgba(255,255,255,0.5)',
                borderColor: 'rgba(255,255,255,0.2)',
                '&.Mui-selected': {
                  bgcolor: 'rgba(139, 92, 246, 0.3)',
                  color: '#8B5CF6',
                },
              },
            }}
          >
            <ToggleButton value="7">7D</ToggleButton>
            <ToggleButton value="30">30D</ToggleButton>
            <ToggleButton value="90">90D</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Summary Stats */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={6} md={3}>
            <Box sx={{ p: 2, bgcolor: 'rgba(139, 92, 246, 0.1)', borderRadius: 2, border: '1px solid rgba(139, 92, 246, 0.2)' }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <DollarSign size={16} color="#8B5CF6" />
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>
                  Earnings ({period}d)
                </Typography>
              </Stack>
              <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.25rem' }}>
                ${totalEarnings.toFixed(2)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ p: 2, bgcolor: 'rgba(34, 197, 94, 0.1)', borderRadius: 2, border: '1px solid rgba(34, 197, 94, 0.2)' }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <Package size={16} color="#22C55E" />
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>
                  Sales ({period}d)
                </Typography>
              </Stack>
              <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.25rem' }}>
                {totalSales}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ p: 2, bgcolor: 'rgba(59, 130, 246, 0.1)', borderRadius: 2, border: '1px solid rgba(59, 130, 246, 0.2)' }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <Users size={16} color="#3B82F6" />
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>
                  Customers
                </Typography>
              </Stack>
              <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.25rem' }}>
                {analytics.customerStats.unique_customers}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={3}>
            <Box sx={{ p: 2, bgcolor: 'rgba(245, 158, 11, 0.1)', borderRadius: 2, border: '1px solid rgba(245, 158, 11, 0.2)' }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                <Star size={16} color="#F59E0B" />
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>
                  Avg Rating
                </Typography>
              </Stack>
              <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.25rem' }}>
                {avgRating.toFixed(1)} ({totalReviews})
              </Typography>
            </Box>
          </Grid>
        </Grid>

        {/* Earnings Chart (Simple bar visualization) */}
        <Box sx={{ mb: 3 }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', mb: 2, fontWeight: 600 }}>
            Earnings Over Time
          </Typography>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'flex-end', 
            gap: 0.5, 
            height: 120, 
            px: 1,
            overflowX: 'auto',
            '&::-webkit-scrollbar': { height: 4 },
            '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.2)', borderRadius: 2 },
          }}>
            {analytics.earningsOverTime.length === 0 ? (
              <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', m: 'auto' }}>
                No earnings data for this period
              </Typography>
            ) : (
              analytics.earningsOverTime.map((d, i) => {
                const height = (parseFloat(d.earnings?.toString() || '0') / maxEarnings) * 100;
                return (
                  <Box
                    key={i}
                    sx={{
                      flex: '1 0 auto',
                      minWidth: 20,
                      maxWidth: 40,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                    }}
                  >
                    <Box
                      sx={{
                        width: '100%',
                        height: `${Math.max(height, 4)}%`,
                        bgcolor: 'rgba(139, 92, 246, 0.6)',
                        borderRadius: '4px 4px 0 0',
                        transition: 'all 0.3s',
                        '&:hover': {
                          bgcolor: '#8B5CF6',
                        },
                      }}
                      title={`$${parseFloat(d.earnings?.toString() || '0').toFixed(2)} - ${new Date(d.date).toLocaleDateString()}`}
                    />
                    <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.6rem', mt: 0.5 }}>
                      {new Date(d.date).getDate()}
                    </Typography>
                  </Box>
                );
              })
            )}
          </Box>
        </Box>

        {/* Product Performance */}
        {analytics.productPerformance.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', mb: 2, fontWeight: 600 }}>
              Product Performance
            </Typography>
            <Stack spacing={1}>
              {analytics.productPerformance.slice(0, 5).map((product, i) => (
                <Box 
                  key={i}
                  sx={{ 
                    p: 1.5, 
                    bgcolor: 'rgba(255,255,255,0.05)', 
                    borderRadius: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0, flex: 1 }}>
                    <Chip
                      label={product.product_type}
                      size="small"
                      sx={{
                        bgcolor: product.product_type === 'Bot' ? 'rgba(139, 92, 246, 0.2)' :
                                 product.product_type === 'Signal' ? 'rgba(59, 130, 246, 0.2)' :
                                 'rgba(245, 158, 11, 0.2)',
                        color: product.product_type === 'Bot' ? '#8B5CF6' :
                               product.product_type === 'Signal' ? '#3B82F6' :
                               '#F59E0B',
                        fontSize: '0.65rem',
                        height: 20,
                      }}
                    />
                    <Typography sx={{ color: 'white', fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {product.product_name}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography sx={{ color: '#22C55E', fontSize: '0.8rem', fontWeight: 700 }}>
                        ${parseFloat(product.total_earnings?.toString() || '0').toFixed(2)}
                      </Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>
                        {product.total_sales} sales
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {/* Top Customers */}
        {analytics.topCustomers.length > 0 && (
          <Box>
            <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', mb: 2, fontWeight: 600 }}>
              Top Customers
            </Typography>
            <Stack spacing={1}>
              {analytics.topCustomers.map((customer, i) => (
                <Box 
                  key={i}
                  sx={{ 
                    p: 1.5, 
                    bgcolor: 'rgba(255,255,255,0.05)', 
                    borderRadius: 1.5,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar
                      src={customer.profile_image}
                      sx={{ width: 32, height: 32, bgcolor: 'rgba(139, 92, 246, 0.3)' }}
                    >
                      {customer.username?.charAt(0) || 'U'}
                    </Avatar>
                    <Box>
                      <Typography sx={{ color: 'white', fontSize: '0.8rem', fontWeight: 600 }}>
                        {customer.full_name || customer.username}
                      </Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>
                        {customer.purchase_count} purchase{customer.purchase_count !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography sx={{ color: '#22C55E', fontSize: '0.85rem', fontWeight: 700 }}>
                    ${parseFloat(customer.total_spent?.toString() || '0').toFixed(2)}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
