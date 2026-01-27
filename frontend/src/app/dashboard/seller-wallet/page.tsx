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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  TrendingUp as EarningsIcon,
  ArrowUpward as WithdrawIcon,
  Schedule as PendingIcon,
  History as HistoryIcon,
  Refresh as RefreshIcon,
  Cancel as CancelIcon,
  CheckCircle as SuccessIcon,
  Phone as PhoneIcon,
  Payments as PaymentsIcon,
  CurrencyBitcoin as CryptoIcon,
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';

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

interface SellerWallet {
  balance: number;
  pending_balance: number;
  total_earned: number;
  total_withdrawn: number;
  is_frozen: boolean;
  frozen_reason?: string;
  pending_withdrawals: number;
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

interface Withdrawal {
  id: number;
  amount: number;
  withdrawal_fee: number;
  net_amount: number;
  payment_method: string;
  payment_details: string;
  status: string;
  created_at: string;
  admin_notes?: string;
}

const getPaymentMethodLabel = (method: string) => {
  switch (method) {
    case 'mpesa': return 'M-Pesa';
    case 'airtel_money': return 'Airtel Money';
    case 'usdt': return 'USDT (TRC20)';
    case 'btc': return 'Bitcoin (BTC)';
    case 'eth': return 'Ethereum (ETH)';
    case 'ltc': return 'Litecoin (LTC)';
    default: return method;
  }
};

// Payment methods configuration
const PAYMENT_METHODS = [
  { id: 'mpesa', label: 'M-Pesa', icon: '/icons/mpesa.svg', color: '#4CAF50' },
  { id: 'airtel_money', label: 'Airtel Money', icon: '/icons/airtel.svg', color: '#FF0000' },
  { id: 'usdt', label: 'USDT (TRC20)', icon: '/icons/usdt.svg', color: '#26A17B' },
  { id: 'btc', label: 'Bitcoin (BTC)', icon: '/icons/btc.svg', color: '#F7931A' },
  { id: 'eth', label: 'Ethereum (ETH)', icon: '/icons/eth.svg', color: '#627EEA' },
  { id: 'ltc', label: 'Litecoin (LTC)', icon: '/icons/ltc.svg', color: '#BFBBBB' },
];

export default function SellerWalletPage() {
  const { token } = useAuth();
  const [wallet, setWallet] = useState<SellerWallet | null>(null);
  const [recentSales, setRecentSales] = useState<Sale[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSeller, setIsSeller] = useState<boolean | null>(null);

  // Withdrawal dialog state
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('mpesa');
  const [withdrawDetails, setWithdrawDetails] = useState<any>({});
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const checkSellerStatus = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${API_URL}/api/profile/status/seller`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setIsSeller(data.is_seller);
        if (!data.is_seller) {
          setLoading(false);
        }
      } else {
        setIsSeller(false);
        setLoading(false);
      }
    } catch (err) {
      console.error('Failed to check seller status:', err);
      setIsSeller(false);
      setLoading(false);
    }
  }, [token, API_URL]);

  const fetchData = useCallback(async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const [walletRes, withdrawRes] = await Promise.all([
        fetch(`${API_URL}/api/wallet/seller/balance`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/wallet/withdrawal/history?wallet_type=seller`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!walletRes.ok) {
        // If API fails, use default wallet data
        setWallet({
          balance: 0,
          pending_balance: 0,
          total_earned: 0,
          total_withdrawn: 0,
          is_frozen: false,
          pending_withdrawals: 0,
        });
        setRecentSales([]);
        setWithdrawals([]);
        return;
      }

      const [walletData, withdrawData] = await Promise.all([
        walletRes.json(),
        withdrawRes.json(),
      ]);

      // Check if API says user is not a seller - show zeros and redirect to become seller
      if (walletData.is_seller === false) {
        setIsSeller(false);
        setWallet({
          balance: 0,
          pending_balance: 0,
          total_earned: 0,
          total_withdrawn: 0,
          is_frozen: false,
          pending_withdrawals: 0,
        });
        setRecentSales([]);
        setWithdrawals([]);
        return;
      }

      // Ensure wallet has all required fields with defaults
      const walletWithDefaults: SellerWallet = {
        balance: walletData.wallet?.balance ?? 0,
        pending_balance: walletData.wallet?.pending_balance ?? 0,
        total_earned: walletData.wallet?.total_earned ?? 0,
        total_withdrawn: walletData.wallet?.total_withdrawn ?? 0,
        is_frozen: walletData.wallet?.is_frozen ?? false,
        frozen_reason: walletData.wallet?.frozen_reason,
        pending_withdrawals: walletData.wallet?.pending_withdrawals ?? 0,
      };

      setWallet(walletWithDefaults);
      setRecentSales(walletData.recent_sales || []);
      setWithdrawals(withdrawData.withdrawals || []);
    } catch (err: any) {
      console.error('Error fetching seller wallet:', err);
      // Set default wallet on error so page still renders
      setWallet({
        balance: 0,
        pending_balance: 0,
        total_earned: 0,
        total_withdrawn: 0,
        is_frozen: false,
        pending_withdrawals: 0,
      });
      setError(err.message || 'Failed to load seller wallet data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [token, API_URL]);

  useEffect(() => {
    checkSellerStatus();
  }, [checkSellerStatus]);

  useEffect(() => {
    if (isSeller) {
      fetchData();
    }
  }, [isSeller, fetchData]);

  const handleSubmitWithdraw = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) < 20) {
      setError('Minimum withdrawal for sellers is $20');
      return;
    }

    if (!withdrawMethod) {
      setError('Please select a withdrawal method');
      return;
    }

    if (withdrawMethod === 'mpesa' && !withdrawDetails.phone_number) {
      setError('Please enter your M-Pesa phone number');
      return;
    }
    if (withdrawMethod === 'airtel_money' && !withdrawDetails.phone_number) {
      setError('Please enter your Airtel Money phone number');
      return;
    }
    if ((withdrawMethod === 'usdt' || withdrawMethod === 'btc') && !withdrawDetails.wallet_address) {
      setError('Please enter your wallet address');
      return;
    }

    const amount = parseFloat(withdrawAmount);
    if (wallet && amount > wallet.balance) {
      setError('Insufficient balance');
      return;
    }

    try {
      setSubmittingWithdraw(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/wallet/withdrawal/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          payment_method: withdrawMethod,
          payment_details: withdrawDetails,
          wallet_type: 'seller',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit withdrawal request');
      }

      setSuccess(`Withdrawal request submitted! Net payout: $${data.withdrawal?.net_amount?.toFixed(2)}. Processing time: 24-48 hours.`);
      setWithdrawDialogOpen(false);
      setWithdrawAmount('');
      setWithdrawDetails({});
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  const handleCancelWithdrawal = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/api/wallet/withdrawal/${id}/cancel`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel withdrawal');
      }

      setSuccess('Withdrawal cancelled and funds returned');
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1.5, sm: 2, md: 3 } }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={{ xs: '250px', sm: '300px', md: '400px' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // Show non-seller message if not a seller
  if (isSeller === false) {
    return (
      <Container maxWidth="md" sx={{ py: { xs: 4, sm: 6, md: 8 }, px: { xs: 1.5, sm: 2, md: 3 } }}>
        <Paper
          sx={{
            p: { xs: 3, sm: 4, md: 6 },
            textAlign: 'center',
            bgcolor: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: { xs: 2, sm: 3, md: 4 },
          }}
        >
          <WalletIcon sx={{ fontSize: { xs: 48, sm: 64, md: 80 }, color: '#8B5CF6', mb: { xs: 2, sm: 3 } }} />
          <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' } }}>
            Seller Wallet
          </Typography>
          <Typography color="text.secondary" sx={{ mb: { xs: 2, sm: 3, md: 4 }, fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } }}>
            You need to be an approved seller to access the seller wallet.
            Start selling on AlgoEdge Marketplace to earn commissions!
          </Typography>
          <Button
            variant="contained"
            href="/dashboard/seller/apply"
            sx={{
              background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
              color: 'white',
              fontWeight: 700,
              px: { xs: 2, sm: 3, md: 4 },
              fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' },
            }}
          >
            Apply to Become a Seller
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1.5, sm: 2, md: 3 } }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={{ xs: 2, sm: 3, md: 4 }} flexWrap="wrap" gap={1}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' } }}>
            Seller Earnings
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } }}>
            View your sales earnings and request withdrawals
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
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: { xs: 2, sm: 3 } }}>
          {success}
        </Alert>
      )}

      {wallet?.is_frozen && (
        <Alert severity="warning" sx={{ mb: { xs: 2, sm: 3 } }}>
          Your seller wallet is frozen. {wallet.frozen_reason || 'Please contact support.'}
        </Alert>
      )}

      {/* Withdraw Button */}
      <Box sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <Button
          variant="contained"
          color="warning"
          size="large"
          startIcon={<WithdrawIcon />}
          onClick={() => setWithdrawDialogOpen(true)}
          disabled={wallet?.is_frozen || (wallet?.balance || 0) < 20}
          sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' } }}
        >
          Withdraw Earnings
        </Button>
      </Box>

      {/* Balance Cards */}
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} mb={{ xs: 2, sm: 3, md: 4 }}>
        <Grid item xs={6} md={3}>
          <Card 
            sx={{ 
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: 'white',
            }}
          >
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Box display="flex" alignItems="center" gap={{ xs: 0.5, sm: 1 }} mb={{ xs: 1, sm: 2 }} flexDirection={{ xs: 'column', sm: 'row' }}>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}><WalletIcon /></Box>
                <Typography variant="subtitle2" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' } }}>Available Balance</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold" sx={{ fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2.5rem' }, textAlign: { xs: 'center', sm: 'left' } }}>
                ${(wallet?.balance ?? 0).toFixed(2)}
              </Typography>
              {wallet && (wallet.pending_withdrawals || 0) > 0 && (
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 1, fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.875rem' }, textAlign: { xs: 'center', sm: 'left' } }}>
                  -${(wallet.pending_withdrawals || 0).toFixed(2)} pending withdrawal
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Box display="flex" alignItems="center" gap={{ xs: 0.5, sm: 1 }} mb={{ xs: 1, sm: 2 }} flexDirection={{ xs: 'column', sm: 'row' }}>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}><PendingIcon color="warning" /></Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' }, textAlign: { xs: 'center', sm: 'left' } }}>
                  Pending Balance
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="warning.main" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2.125rem' }, textAlign: { xs: 'center', sm: 'left' } }}>
                ${(wallet?.pending_balance || 0).toFixed(2)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem', md: '0.75rem' }, display: 'block', textAlign: { xs: 'center', sm: 'left' } }}>
                Held for 7 days
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Box display="flex" alignItems="center" gap={{ xs: 0.5, sm: 1 }} mb={{ xs: 1, sm: 2 }} flexDirection={{ xs: 'column', sm: 'row' }}>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}><EarningsIcon color="success" /></Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' } }}>
                  Total Earned
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="success.main" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2.125rem' }, textAlign: { xs: 'center', sm: 'left' } }}>
                ${(wallet?.total_earned ?? 0).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} md={3}>
          <Card>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Box display="flex" alignItems="center" gap={{ xs: 0.5, sm: 1 }} mb={{ xs: 1, sm: 2 }} flexDirection={{ xs: 'column', sm: 'row' }}>
                <Box sx={{ display: { xs: 'none', sm: 'block' } }}><WithdrawIcon color="primary" /></Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' } }}>
                  Total Withdrawn
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2.125rem' }, textAlign: { xs: 'center', sm: 'left' } }}>
                ${(wallet?.total_withdrawn || 0).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Commission Info */}
      <Alert severity="info" sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>
          <strong>Commission Structure:</strong> Platform takes 20% commission on all sales. 
          You receive 80% of each sale. Withdrawal fee: 3%. Minimum seller withdrawal: $20.
        </Typography>
      </Alert>

      {/* Pending Withdrawals */}
      {withdrawals.filter(w => w.status === 'pending' || w.status === 'processing').length > 0 && (
        <Paper sx={{ p: { xs: 1.5, sm: 2, md: 3 }, mb: { xs: 2, sm: 3, md: 4 } }}>
          <Typography variant="h6" gutterBottom color="warning.main" sx={{ fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' } }}>
            Pending Withdrawals
          </Typography>
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: { xs: 500, sm: 650 } }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' }, whiteSpace: 'nowrap' }}>Date</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' } }}>Amount</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' } }}>Fee</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' } }}>Net</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' } }}>Method</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' } }}>Status</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' } }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {withdrawals
                  .filter(w => w.status === 'pending' || w.status === 'processing')
                  .map((w) => (
                    <TableRow key={w.id}>
                      <TableCell sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' }, whiteSpace: 'nowrap' }}>{formatDate(w.created_at)}</TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' } }}>${parseFloat(String(w.amount)).toFixed(2)}</TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' } }}>${parseFloat(String(w.withdrawal_fee)).toFixed(2)}</TableCell>
                      <TableCell sx={{ color: 'success.main', fontWeight: 'bold', fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' } }}>
                        ${parseFloat(String(w.net_amount)).toFixed(2)}
                      </TableCell>
                      <TableCell sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' } }}>{getPaymentMethodLabel(w.payment_method)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={w.status} 
                          size="small" 
                          color={w.status === 'pending' ? 'warning' : 'info'}
                          sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem', md: '0.75rem' } }}
                        />
                      </TableCell>
                      <TableCell>
                        {w.status === 'pending' && (
                          <Tooltip title="Cancel">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleCancelWithdrawal(w.id)}
                            >
                              <CancelIcon />
                            </IconButton>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Recent Sales */}
      <Paper sx={{ p: { xs: 1.5, sm: 2, md: 3 }, mb: { xs: 2, sm: 3, md: 4 } }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' } }}>
          <EarningsIcon /> Recent Sales
        </Typography>

        {recentSales.length === 0 ? (
          <Box textAlign="center" py={{ xs: 2, sm: 3, md: 4 }}>
            <Typography color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } }}>No sales yet</Typography>
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

      {/* Withdrawal History */}
      <Paper sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' } }}>
          <HistoryIcon /> Withdrawal History
        </Typography>

        {withdrawals.length === 0 ? (
          <Box textAlign="center" py={{ xs: 2, sm: 3, md: 4 }}>
            <Typography color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } }}>No withdrawals yet</Typography>
          </Box>
        ) : (
          <TableContainer sx={{ overflowX: 'auto' }}>
            <Table sx={{ minWidth: { xs: 450, sm: 600 } }} size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' }, whiteSpace: 'nowrap' }}>Date</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' } }}>Amount</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' } }}>Fee</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' } }}>Net</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' } }}>Method</TableCell>
                  <TableCell sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' } }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {withdrawals.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' }, whiteSpace: 'nowrap' }}>{formatDate(w.created_at)}</TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' } }}>${parseFloat(String(w.amount)).toFixed(2)}</TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' } }}>${parseFloat(String(w.withdrawal_fee)).toFixed(2)}</TableCell>
                    <TableCell sx={{ color: 'success.main', fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' } }}>
                      ${parseFloat(String(w.net_amount)).toFixed(2)}
                    </TableCell>
                    <TableCell sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' } }}>{getPaymentMethodLabel(w.payment_method)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={w.status} 
                        size="small" 
                        color={
                          w.status === 'completed' ? 'success' : 
                          w.status === 'rejected' ? 'error' : 
                          w.status === 'pending' ? 'warning' : 'info'
                        }
                        sx={{ fontSize: { xs: '0.55rem', sm: '0.65rem', md: '0.75rem' } }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Withdrawal Dialog */}
      <Dialog 
        open={withdrawDialogOpen} 
        onClose={() => setWithdrawDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { m: { xs: 1, sm: 2 }, maxHeight: { xs: '95vh', sm: '90vh' } } }}
      >
        <DialogTitle sx={{ fontSize: { xs: '1rem', sm: '1.125rem', md: '1.25rem' }, p: { xs: 1.5, sm: 2, md: 3 } }}>
          <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }}>
            <WithdrawIcon />
            Withdraw Seller Earnings
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: { xs: 1.5, sm: 2, md: 3 } }}>
          <Box sx={{ pt: { xs: 1, sm: 2 } }}>
            <Alert severity="info" sx={{ mb: { xs: 2, sm: 3 } }}>
              <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>
                <strong>Withdrawal Fee:</strong> 3%<br />
                <strong>Processing Time:</strong> 24-48 hours<br />
                <strong>Minimum Withdrawal:</strong> $20
              </Typography>
            </Alert>

            <Paper sx={{ p: { xs: 1.5, sm: 2 }, mb: { xs: 2, sm: 3 }, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.main' }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>Available Balance</Typography>
              <Typography variant="h5" fontWeight="bold" color="success.main" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem', md: '1.5rem' } }}>
                ${(wallet?.balance ?? 0).toFixed(2)}
              </Typography>
            </Paper>

            <TextField
              label="Withdrawal Amount (USD)"
              type="number"
              fullWidth
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              inputProps={{ min: 20, max: wallet?.balance || 0, step: 1 }}
              sx={{ mb: { xs: 1.5, sm: 2 } }}
              required
              helperText={`Min: $20 | Max: $${(wallet?.balance ?? 0).toFixed(2)}`}
              size="small"
            />

            <FormControl fullWidth sx={{ mb: { xs: 1.5, sm: 2 } }} size="small">
              <InputLabel>Withdrawal Method</InputLabel>
              <Select
                value={withdrawMethod}
                label="Withdrawal Method"
                onChange={(e) => {
                  setWithdrawMethod(e.target.value);
                  setWithdrawDetails({});
                }}
              >
                <MenuItem value="mpesa">M-Pesa</MenuItem>
                <MenuItem value="airtel_money">Airtel Money</MenuItem>
                <MenuItem value="usdt">USDT (TRC20)</MenuItem>
                <MenuItem value="btc">Bitcoin (BTC)</MenuItem>
              </Select>
            </FormControl>

            {(withdrawMethod === 'mpesa' || withdrawMethod === 'airtel_money') && (
              <TextField
                label={`${getPaymentMethodLabel(withdrawMethod)} Phone Number`}
                fullWidth
                value={withdrawDetails.phone_number || ''}
                onChange={(e) => setWithdrawDetails({ ...withdrawDetails, phone_number: e.target.value })}
                sx={{ mb: { xs: 1.5, sm: 2 } }}
                placeholder="+254..."
                required
                size="small"
              />
            )}

            {withdrawMethod === 'usdt' && (
              <>
                <TextField
                  label="USDT Wallet Address (TRC20)"
                  fullWidth
                  value={withdrawDetails.wallet_address || ''}
                  onChange={(e) => setWithdrawDetails({ ...withdrawDetails, wallet_address: e.target.value })}
                  sx={{ mb: { xs: 1.5, sm: 2 } }}
                  required
                  size="small"
                />
                <Alert severity="warning" sx={{ mb: { xs: 1.5, sm: 2 } }}>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>
                    Make sure your wallet supports USDT on TRC20 network.
                  </Typography>
                </Alert>
              </>
            )}

            {withdrawMethod === 'btc' && (
              <>
                <TextField
                  label="Bitcoin Wallet Address"
                  fullWidth
                  value={withdrawDetails.wallet_address || ''}
                  onChange={(e) => setWithdrawDetails({ ...withdrawDetails, wallet_address: e.target.value })}
                  sx={{ mb: { xs: 1.5, sm: 2 } }}
                  required
                  size="small"
                />
                <Alert severity="warning" sx={{ mb: { xs: 1.5, sm: 2 } }}>
                  <Typography variant="body2" sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' } }}>
                    Make sure you provide a valid Bitcoin address.
                  </Typography>
                </Alert>
              </>
            )}

            {withdrawAmount && parseFloat(withdrawAmount) >= 20 && (
              <Paper sx={{ p: { xs: 1.5, sm: 2 }, bgcolor: 'grey.100' }}>
                <Grid container spacing={{ xs: 1, sm: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' } }}>Withdrawal Amount</Typography>
                    <Typography fontWeight="bold" sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } }}>${parseFloat(withdrawAmount).toFixed(2)}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' } }}>Fee (3%)</Typography>
                    <Typography fontWeight="bold" color="error.main" sx={{ fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } }}>
                      -${(parseFloat(withdrawAmount) * 0.02 + 1).toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' } }}>You will receive:</Typography>
                    <Typography variant="h6" fontWeight="bold" color="success.main" sx={{ fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' } }}>
                      ${Math.max(parseFloat(withdrawAmount) - (parseFloat(withdrawAmount) * 0.02 + 1), 0).toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: { xs: 1.5, sm: 2, md: 3 }, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 0 } }}>
          <Button onClick={() => setWithdrawDialogOpen(false)} disabled={submittingWithdraw} sx={{ width: { xs: '100%', sm: 'auto' }, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="success"
            onClick={handleSubmitWithdraw}
            disabled={
              submittingWithdraw || 
              !withdrawAmount || 
              parseFloat(withdrawAmount) < 20 ||
              parseFloat(withdrawAmount) > (wallet?.balance || 0)
            }
            startIcon={submittingWithdraw ? <CircularProgress size={20} /> : <WithdrawIcon />}
            sx={{ width: { xs: '100%', sm: 'auto' }, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
          >
            {submittingWithdraw ? 'Processing...' : 'Request Withdrawal'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
