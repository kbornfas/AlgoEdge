'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  IconButton,
  Stack,
} from '@mui/material';
import {
  TrendingUp as EarningsIcon,
  ShoppingCart as SalesIcon,
  AccountBalanceWallet as WalletIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

// Helper function to format dates
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

interface SellerStats {
  total_earned: number;
  total_sales: number;
}

interface Sale {
  id: number;
  item_type: string;
  item_name: string;
  price: number;
  platform_commission: number;
  seller_earnings: number;
  created_at: string;
}

export default function SellerStatsPage() {
  const { token, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSeller, setIsSeller] = useState<boolean | null>(null); // null = loading, false = not seller, true = seller
  const [sellerStatus, setSellerStatus] = useState<string>('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  const checkSellerStatus = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch(`${API_URL}/api/seller/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        setIsSeller(false);
        setLoading(false);
        return;
      }
      
      const data = await response.json();
      // Check if they are an approved seller
      if (data.seller?.is_seller === true || data.seller?.status === 'approved') {
        setIsSeller(true);
        setSellerStatus('approved');
      } else if (data.seller?.status === 'pending') {
        setIsSeller(false);
        setSellerStatus('pending');
      } else {
        setIsSeller(false);
        setSellerStatus('not_applied');
      }
    } catch {
      setIsSeller(false);
      setSellerStatus('error');
    }
  }, [token, API_URL]);

  const fetchData = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch seller wallet stats
      const walletResponse = await fetch(`${API_URL}/api/wallet/seller`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const walletData = await walletResponse.json();

      if (!walletResponse.ok) {
        throw new Error(walletData.error || 'Failed to fetch seller stats');
      }

      // Check if API says user is not a seller
      if (walletData.is_seller === false) {
        setIsSeller(false);
        setStats({ total_earned: 0, total_sales: 0 });
        setRecentSales([]);
        return;
      }

      // Extract stats from wallet data
      setStats({
        total_earned: walletData.wallet?.total_earned ?? 0,
        total_sales: walletData.wallet?.total_sales ?? 0,
      });
      setRecentSales(walletData.recent_sales || []);
    } catch (err: any) {
      console.error('Error fetching seller stats:', err);
      setStats({ total_earned: 0, total_sales: 0 });
      setError(err.message || 'Failed to load seller stats. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token, API_URL]);

  useEffect(() => {
    checkSellerStatus();
  }, [checkSellerStatus]);

  useEffect(() => {
    if (isSeller === true) {
      fetchData();
    } else if (isSeller === false) {
      setLoading(false);
    }
  }, [isSeller, fetchData]);

  if (authLoading || isSeller === null) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1.5, sm: 2, md: 3 } }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={{ xs: '250px', sm: '300px', md: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (isSeller === false) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1.5, sm: 2, md: 3 } }}>
        <Paper sx={{ p: { xs: 2, sm: 3, md: 4 }, textAlign: 'center' }}>
          <EarningsIcon sx={{ fontSize: { xs: 40, sm: 48, md: 64 }, color: 'text.secondary', mb: 2 }} />
          {sellerStatus === 'pending' ? (
            <>
              <Typography variant="h5" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' } }}>
                Application Pending
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3, fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' } }}>
                Your seller application is being reviewed. You&apos;ll be notified once it&apos;s approved.
              </Typography>
              <Button
                variant="outlined"
                color="primary"
                size="large"
                component={Link}
                href="/dashboard"
                sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' } }}
              >
                Back to Dashboard
              </Button>
            </>
          ) : (
            <>
              <Typography variant="h5" gutterBottom sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' } }}>
                Become a Seller
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3, fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' } }}>
                Start selling your trading tools, courses, and signals on AlgoEdge marketplace.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                size="large"
                component={Link}
                href="/dashboard/seller/apply"
                sx={{ fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' } }}
              >
                Apply to Become a Seller
              </Button>
            </>
          )}
        </Paper>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1.5, sm: 2, md: 3 } }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={{ xs: '250px', sm: '300px', md: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1.5, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={{ xs: 2, sm: 3, md: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' } }}>
            Seller Earnings Stats
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } }}>
            View your sales earnings and statistics
          </Typography>
        </Box>
        <IconButton onClick={fetchData} disabled={loading} size="small">
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: { xs: 2, sm: 3 } }}>
          {error}
        </Alert>
      )}

      {/* Info Banner - Earnings go to Main Wallet */}
      <Alert 
        severity="info" 
        icon={<InfoIcon />}
        sx={{ mb: { xs: 2, sm: 3, md: 4 } }}
      >
        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.9rem' } }}>
          <strong>Your earnings are automatically added to your main wallet.</strong><br />
          All sales earnings are deposited directly into your <Link href="/dashboard/wallet" style={{ color: '#3B82F6', fontWeight: 600 }}>User Wallet</Link> for easy management and withdrawals.
        </Typography>
      </Alert>

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} mb={{ xs: 2, sm: 3, md: 4 }}>
        <Grid item xs={6}>
          <Card 
            sx={{ 
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: 'white',
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }} mb={{ xs: 1, sm: 2 }} flexDirection={{ xs: 'column', sm: 'row' }}>
                <EarningsIcon sx={{ fontSize: { xs: 24, sm: 32 } }} />
                <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1rem' }, fontWeight: 600 }}>
                  Total Earned
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }, textAlign: { xs: 'center', sm: 'left' } }}>
                ${(stats?.total_earned ?? 0).toFixed(2)}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mt: 1, fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.8rem' }, textAlign: { xs: 'center', sm: 'left' } }}>
                Lifetime earnings (80% of sales)
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6}>
          <Card 
            sx={{ 
              background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
              color: 'white',
            }}
          >
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }} mb={{ xs: 1, sm: 2 }} flexDirection={{ xs: 'column', sm: 'row' }}>
                <SalesIcon sx={{ fontSize: { xs: 24, sm: 32 } }} />
                <Typography variant="subtitle1" sx={{ fontSize: { xs: '0.75rem', sm: '0.9rem', md: '1rem' }, fontWeight: 600 }}>
                  Total Sales
                </Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.5rem' }, textAlign: { xs: 'center', sm: 'left' } }}>
                {stats?.total_sales ?? 0}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.8, mt: 1, fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.8rem' }, textAlign: { xs: 'center', sm: 'left' } }}>
                Total completed sales
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Link to Main Wallet */}
      <Paper sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3, md: 4 }, bgcolor: 'rgba(59, 130, 246, 0.05)', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={2}>
            <WalletIcon sx={{ color: '#3B82F6', fontSize: { xs: 28, sm: 36 } }} />
            <Box>
              <Typography variant="h6" sx={{ fontSize: { xs: '0.95rem', sm: '1.1rem', md: '1.25rem' }, fontWeight: 600 }}>
                Withdraw Your Earnings
              </Typography>
              <Typography color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.9rem' } }}>
                Go to your main wallet to withdraw funds via M-Pesa, USDT, or BTC
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            color="primary"
            component={Link}
            href="/dashboard/wallet"
            startIcon={<WalletIcon />}
            sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem' }, whiteSpace: 'nowrap' }}
          >
            Go to Wallet
          </Button>
        </Stack>
      </Paper>

      {/* Commission Info */}
      <Alert severity="info" sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>
          <strong>Commission Structure:</strong> Platform takes 20% commission on all sales. 
          You receive 80% of each sale directly to your main wallet.
        </Typography>
      </Alert>

      {/* Recent Sales */}
      <Paper sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' } }}>
          <EarningsIcon /> Recent Sales
        </Typography>

        {recentSales.length === 0 ? (
          <Box textAlign="center" py={{ xs: 2, sm: 3, md: 4 }}>
            <Typography color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } }}>
              No sales yet. Start listing your products to make sales!
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              component={Link}
              href="/dashboard/seller"
              sx={{ mt: 2, fontSize: { xs: '0.8rem', sm: '0.85rem' } }}
            >
              Go to Seller Dashboard
            </Button>
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 500, sm: 650 } }} size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' }, whiteSpace: 'nowrap' }}>Date</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' } }}>Item</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' } }}>Type</TableCell>
                  <TableCell align="right" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' } }}>Sale Price</TableCell>
                  <TableCell align="right" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' } }}>Commission</TableCell>
                  <TableCell align="right" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' } }}>Your Earnings</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {recentSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' }, whiteSpace: 'nowrap' }}>{formatDate(sale.created_at)}</TableCell>
                    <TableCell sx={{ fontWeight: 'medium', fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' } }}>{sale.item_name}</TableCell>
                    <TableCell>
                      <Chip label={sale.item_type} size="small" sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem', md: '0.75rem' } }} />
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' } }}>${parseFloat(String(sale.price)).toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ color: 'error.main', fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' } }}>
                      -${parseFloat(String(sale.platform_commission)).toFixed(2)}
                    </TableCell>
                    <TableCell align="right" sx={{ color: 'success.main', fontWeight: 'bold', fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' } }}>
                      +${parseFloat(String(sale.seller_earnings)).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Container>
  );
}
