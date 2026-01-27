'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Paper,
  Divider,
  Alert,
} from '@mui/material';
import {
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Download,
  Calendar,
  Wallet,
} from 'lucide-react';

interface EarningsSummary {
  totalEarnings: number;
  pendingEarnings: number;
  availableBalance: number;
  thisMonthEarnings: number;
  totalSales: number;
  productsSold: number;
}

interface Sale {
  id: number;
  product_name: string;
  product_type: string;
  amount: number;
  commission: number;
  buyer_name: string;
  created_at: string;
  status: string;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export default function SellerEarningsPage() {
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const [earningsRes, salesRes] = await Promise.all([
        fetch(`${apiUrl}/api/seller/earnings`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${apiUrl}/api/seller/sales`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (earningsRes.ok) {
        const data = await earningsRes.json();
        setEarnings(data);
      } else {
        // Default empty state
        setEarnings({
          totalEarnings: 0,
          pendingEarnings: 0,
          availableBalance: 0,
          thisMonthEarnings: 0,
          totalSales: 0,
          productsSold: 0,
        });
      }

      if (salesRes.ok) {
        const data = await salesRes.json();
        setSales(data.sales || []);
      }
    } catch (err) {
      console.error('Error fetching earnings:', err);
      setError('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1.5, sm: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: { xs: 4, sm: 6, md: 8 } }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1.5, sm: 2, md: 3 } }}>
      <Box sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <Typography variant="h4" fontWeight={700} gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' } }}>
          Seller Earnings
        </Typography>
        <Typography color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } }}>
          Track your sales performance and manage your earnings
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: { xs: 2, sm: 3 } }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)', color: 'white' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}><Wallet size={32} /></Box>
                <Box sx={{ display: { xs: 'block', sm: 'none' } }}><Wallet size={24} /></Box>
                <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                  <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2.125rem' } }}>
                    ${earnings?.availableBalance.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9, fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>Available Balance</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}><DollarSign size={32} color="#0066FF" /></Box>
                <Box sx={{ display: { xs: 'block', sm: 'none' } }}><DollarSign size={24} color="#0066FF" /></Box>
                <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                  <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2.125rem' } }}>
                    ${earnings?.totalEarnings.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>Total Earnings</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}><TrendingUp size={32} color="#A855F7" /></Box>
                <Box sx={{ display: { xs: 'block', sm: 'none' } }}><TrendingUp size={24} color="#A855F7" /></Box>
                <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                  <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2.125rem' } }}>
                    ${earnings?.thisMonthEarnings.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>This Month</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}><ShoppingBag size={32} color="#F59E0B" /></Box>
                <Box sx={{ display: { xs: 'block', sm: 'none' } }}><ShoppingBag size={24} color="#F59E0B" /></Box>
                <Box sx={{ textAlign: { xs: 'center', sm: 'left' } }}>
                  <Typography variant="h4" fontWeight={700} sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2.125rem' } }}>
                    {earnings?.totalSales || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>Total Sales</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pending Earnings Alert */}
      {earnings && earnings.pendingEarnings > 0 && (
        <Alert severity="info" sx={{ mb: { xs: 2, sm: 3 } }}>
          <Typography fontWeight={600} sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } }}>
            You have ${earnings.pendingEarnings.toFixed(2)} in pending earnings
          </Typography>
          <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.8rem', md: '0.875rem' } }}>
            These earnings are being processed and will be available soon.
          </Typography>
        </Alert>
      )}

      {/* Recent Sales */}
      <Paper sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
        <Typography variant="h6" fontWeight={600} gutterBottom sx={{ fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' } }}>
          Recent Sales
        </Typography>
        <Divider sx={{ mb: { xs: 1.5, sm: 2 } }} />

        {sales.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: { xs: 3, sm: 4, md: 6 } }}>
            <ShoppingBag size={48} color="#6B7280" style={{ opacity: 0.5, marginBottom: 16 }} />
            <Typography color="text.secondary" sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}>No sales yet</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
              Your sales will appear here once you start selling products.
            </Typography>
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 500, sm: 650 } }} size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' }, whiteSpace: 'nowrap' }}>Date</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>Product</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>Buyer</TableCell>
                  <TableCell align="right" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>Amount</TableCell>
                  <TableCell align="right" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>Commission</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' }, whiteSpace: 'nowrap' }}>{formatDate(sale.created_at)}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography fontWeight={500} sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>{sale.product_name}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.75rem' } }}>
                          {sale.product_type}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>{sale.buyer_name}</TableCell>
                    <TableCell align="right" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>${sale.amount.toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600, fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>
                      +${sale.commission.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={sale.status}
                        size="small"
                        color={sale.status === 'completed' ? 'success' : 'warning'}
                        sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.75rem' } }}
                      />
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
