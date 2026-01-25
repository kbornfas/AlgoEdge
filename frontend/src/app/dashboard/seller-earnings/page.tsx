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
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Seller Earnings
        </Typography>
        <Typography color="text.secondary">
          Track your sales performance and manage your earnings
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Wallet size={32} />
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    ${earnings?.availableBalance.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Available Balance</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <DollarSign size={32} color="#0066FF" />
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    ${earnings?.totalEarnings.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Total Earnings</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TrendingUp size={32} color="#A855F7" />
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    ${earnings?.thisMonthEarnings.toFixed(2) || '0.00'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">This Month</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ShoppingBag size={32} color="#F59E0B" />
                <Box>
                  <Typography variant="h4" fontWeight={700}>
                    {earnings?.totalSales || 0}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">Total Sales</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pending Earnings Alert */}
      {earnings && earnings.pendingEarnings > 0 && (
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography fontWeight={600}>
            You have ${earnings.pendingEarnings.toFixed(2)} in pending earnings
          </Typography>
          <Typography variant="body2">
            These earnings are being processed and will be available soon.
          </Typography>
        </Alert>
      )}

      {/* Recent Sales */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" fontWeight={600} gutterBottom>
          Recent Sales
        </Typography>
        <Divider sx={{ mb: 2 }} />

        {sales.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <ShoppingBag size={48} color="#6B7280" style={{ opacity: 0.5, marginBottom: 16 }} />
            <Typography color="text.secondary">No sales yet</Typography>
            <Typography variant="body2" color="text.secondary">
              Your sales will appear here once you start selling products.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Product</TableCell>
                  <TableCell>Buyer</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Commission</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>{formatDate(sale.created_at)}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography fontWeight={500}>{sale.product_name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {sale.product_type}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{sale.buyer_name}</TableCell>
                    <TableCell align="right">${sale.amount.toFixed(2)}</TableCell>
                    <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>
                      +${sale.commission.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={sale.status}
                        size="small"
                        color={sale.status === 'completed' ? 'success' : 'warning'}
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
