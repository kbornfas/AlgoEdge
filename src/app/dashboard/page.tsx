'use client';

import { useEffect, useState } from 'react';
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
} from '@mui/material';
import { TrendingUp, DollarSign, Activity, Users, AlertCircle, Upload } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const router = useRouter();
  const [paymentStatus, setPaymentStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentStatus();
  }, []);

  const fetchPaymentStatus = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    try {
      const response = await fetch('/api/payment-proof/status', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch payment status:', err);
    } finally {
      setLoading(false);
    }
  };

  // Mock data - will be replaced with real API calls
  const stats = {
    balance: 10000,
    profit: 1250.50,
    profitPercentage: 12.5,
    activeRobots: 3,
    totalTrades: 45,
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
        Welcome to AlgoEdge
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Monitor your automated trading performance
      </Typography>

      {/* Payment Status Alert */}
      {!loading && !paymentStatus?.isActivated && (
        <Alert
          severity={paymentStatus?.paymentStatus === 'pending' ? 'info' : 'warning'}
          sx={{ mb: 4 }}
          icon={<AlertCircle size={24} />}
          action={
            paymentStatus?.paymentStatus === 'pending' && (
              <Button
                component={Link}
                href="/payment-proof"
                variant="contained"
                size="small"
                startIcon={<Upload size={16} />}
              >
                Submit Payment
              </Button>
            )
          }
        >
          <AlertTitle>
            {paymentStatus?.paymentStatus === 'submitted'
              ? 'Payment Under Review'
              : paymentStatus?.paymentStatus === 'rejected'
              ? 'Payment Rejected'
              : 'Account Not Activated'}
          </AlertTitle>
          {paymentStatus?.paymentStatus === 'submitted' ? (
            <Typography variant="body2">
              Your payment proof is under admin review. You will be notified once approved. This usually takes 24 hours.
            </Typography>
          ) : paymentStatus?.paymentStatus === 'rejected' ? (
            <Typography variant="body2">
              Your payment proof was rejected. Please submit a valid payment proof to activate your account.
            </Typography>
          ) : (
            <Typography variant="body2">
              Please submit your payment proof to activate your account and access all trading features. Click the button to get started.
            </Typography>
          )}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
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
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    ${stats.balance.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 2,
                    bgcolor: 'success.main',
                    color: 'white',
                    mr: 2,
                  }}
                >
                  <TrendingUp size={24} />
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total Profit
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    ${stats.profit.toFixed(2)}
                  </Typography>
                  <Chip
                    label={`+${stats.profitPercentage}%`}
                    size="small"
                    color="success"
                    sx={{ mt: 0.5 }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

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
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {stats.activeRobots}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

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
                  <Typography variant="h5" sx={{ fontWeight: 600 }}>
                    {stats.totalTrades}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Trading Robots
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Manage your automated trading bots
              </Typography>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">AlgoEdge 1.0</Typography>
                  <Chip label="Running" size="small" color="success" />
                </Box>
                <LinearProgress variant="determinate" value={75} sx={{ mb: 2 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">EA888</Typography>
                  <Chip label="Stopped" size="small" />
                </Box>
                <LinearProgress variant="determinate" value={0} sx={{ mb: 2 }} />

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Scalp Master Pro</Typography>
                  <Chip label="Running" size="small" color="success" />
                </Box>
                <LinearProgress variant="determinate" value={60} />
              </Box>
              <Button
                component={Link}
                href="/dashboard/robots"
                variant="contained"
                fullWidth
                sx={{ mt: 2 }}
              >
                Manage Robots
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Recent Trades
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Your latest trading activity
              </Typography>
              <Box>
                {[
                  { pair: 'EUR/USD', type: 'BUY', profit: 45.30, time: '2 hours ago' },
                  { pair: 'GBP/USD', type: 'SELL', profit: -12.50, time: '5 hours ago' },
                  { pair: 'USD/JPY', type: 'BUY', profit: 28.90, time: '1 day ago' },
                ].map((trade, index) => (
                  <Box
                    key={index}
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
                        {trade.pair}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {trade.type} • {trade.time}
                      </Typography>
                    </Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: trade.profit > 0 ? 'success.main' : 'error.main',
                      }}
                    >
                      {trade.profit > 0 ? '+' : ''}${trade.profit.toFixed(2)}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Button
                component={Link}
                href="/dashboard/history"
                variant="outlined"
                fullWidth
                sx={{ mt: 2 }}
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
