'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Grid,
  Alert,
  Tabs,
  Tab,
  Avatar,
  CircularProgress,
  Divider,
  IconButton,
  Tooltip,
  LinearProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  AccountBalanceWallet as WalletIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  ShoppingCart as ShoppingCartIcon,
  VerifiedUser as VerifiedIcon,
  MoneyOff as WithdrawIcon,
  Subscriptions as SubscriptionIcon,
  Payments as PaymentIcon,
  Person as PersonIcon,
  Receipt as ReceiptIcon,
  ArrowUpward as ArrowUpIcon,
  ArrowDownward as ArrowDownIcon,
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';

interface AdminWallet {
  balance: number;
  total_revenue: number;
  total_marketplace_commission: number;
  total_verification_fees: number;
  total_withdrawal_fees: number;
  total_subscription_revenue: number;
  total_payouts: number;
  total_refunds: number;
}

interface UserBalance {
  user_id: number;
  username: string;
  email: string;
  user_balance: number;
  seller_balance: number;
  seller_pending: number;
  affiliate_balance: number;
  affiliate_pending: number;
  total_balance: number;
  user_created_at: string;
}

interface Transaction {
  id: number;
  type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  reference_type: string;
  reference_id: number;
  username: string;
  email: string;
  created_at: string;
}

export default function AdminFinancePage() {
  const { token } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Admin wallet data
  const [adminWallet, setAdminWallet] = useState<AdminWallet | null>(null);
  const [todayRevenue, setTodayRevenue] = useState(0);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [revenueByType, setRevenueByType] = useState<any[]>([]);

  // User balances data
  const [userBalances, setUserBalances] = useState<UserBalance[]>([]);
  const [userTotals, setUserTotals] = useState<any>({});
  const [userSearch, setUserSearch] = useState('');
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);

  // Transactions data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [txFilter, setTxFilter] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

  useEffect(() => {
    if (tabValue === 0) {
      fetchAdminWallet();
    } else if (tabValue === 1) {
      fetchUserBalances();
    } else if (tabValue === 2) {
      fetchTransactions();
    }
  }, [tabValue, userSearch, userPage, txPage, txFilter]);

  const fetchAdminWallet = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/admin/wallet`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setAdminWallet(data.wallet);
        setTodayRevenue(data.today_revenue || 0);
        setMonthRevenue(data.month_revenue || 0);
        setRevenueByType(data.revenue_by_type || []);
      } else {
        setError(data.error || 'Failed to fetch admin wallet');
      }
    } catch (err) {
      setError('Failed to fetch admin wallet');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBalances = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (userSearch) params.append('search', userSearch);
      params.append('page', String(userPage));
      params.append('limit', '20');
      params.append('sort', 'balance');
      params.append('order', 'desc');

      const res = await fetch(`${API_URL}/api/admin/users/balances?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setUserBalances(data.users);
        setUserTotals(data.totals);
        setUserTotalPages(data.pagination?.pages || 1);
      }
    } catch (err) {
      setError('Failed to fetch user balances');
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', String(txPage));
      params.append('limit', '30');
      if (txFilter) params.append('type', txFilter);

      const res = await fetch(`${API_URL}/api/admin/wallet/transactions?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setTransactions(data.transactions);
        setTxTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      setError('Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString();
  };

  const getTypeColor = (type: string): 'success' | 'error' | 'warning' | 'info' | 'default' => {
    if (type.includes('commission') || type.includes('fee') || type.includes('revenue')) return 'success';
    if (type.includes('payout') || type.includes('refund')) return 'error';
    if (type.includes('adjustment')) return 'warning';
    return 'info';
  };

  const getTypeIcon = (type: string) => {
    if (type === 'marketplace_commission') return <ShoppingCartIcon fontSize="small" />;
    if (type === 'verification_fee') return <VerifiedIcon fontSize="small" />;
    if (type === 'withdrawal_fee') return <WithdrawIcon fontSize="small" />;
    if (type === 'subscription_revenue') return <SubscriptionIcon fontSize="small" />;
    if (type === 'affiliate_payout') return <PaymentIcon fontSize="small" />;
    return <ReceiptIcon fontSize="small" />;
  };

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color,
    subtitle,
  }: { 
    title: string; 
    value: string; 
    icon: React.ReactNode; 
    color: string;
    subtitle?: string;
  }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">{title}</Typography>
            <Typography variant="h5" sx={{ mt: 1, fontWeight: 600 }}>{value}</Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">{subtitle}</Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>{icon}</Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Financial Management</Typography>
        <Button 
          startIcon={<RefreshIcon />} 
          onClick={() => {
            if (tabValue === 0) fetchAdminWallet();
            else if (tabValue === 1) fetchUserBalances();
            else fetchTransactions();
          }}
        >
          Refresh
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 3 }}>
        <Tab label="Platform Revenue" />
        <Tab label="User Balances" />
        <Tab label="Transaction History" />
      </Tabs>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      {/* Tab 0: Platform Revenue */}
      {tabValue === 0 && adminWallet && (
        <Box>
          {/* Main Stats */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Platform Balance"
                value={formatCurrency(adminWallet.balance)}
                icon={<WalletIcon />}
                color="primary.main"
                subtitle="Available funds"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Revenue"
                value={formatCurrency(adminWallet.total_revenue)}
                icon={<TrendingUpIcon />}
                color="success.main"
                subtitle="All time earnings"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Today's Revenue"
                value={formatCurrency(todayRevenue)}
                icon={<ArrowUpIcon />}
                color="info.main"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="This Month"
                value={formatCurrency(monthRevenue)}
                icon={<TrendingUpIcon />}
                color="warning.main"
              />
            </Grid>
          </Grid>

          {/* Revenue Breakdown */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Revenue Breakdown</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <ShoppingCartIcon color="success" />
                      <Typography variant="body2" color="text.secondary">Marketplace Commission</Typography>
                    </Box>
                    <Typography variant="h6">{formatCurrency(adminWallet.total_marketplace_commission)}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <VerifiedIcon color="primary" />
                      <Typography variant="body2" color="text.secondary">Verification Fees</Typography>
                    </Box>
                    <Typography variant="h6">{formatCurrency(adminWallet.total_verification_fees)}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <WithdrawIcon color="warning" />
                      <Typography variant="body2" color="text.secondary">Withdrawal Fees</Typography>
                    </Box>
                    <Typography variant="h6">{formatCurrency(adminWallet.total_withdrawal_fees)}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SubscriptionIcon color="info" />
                      <Typography variant="body2" color="text.secondary">Subscription Revenue</Typography>
                    </Box>
                    <Typography variant="h6">{formatCurrency(adminWallet.total_subscription_revenue)}</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Outgoing */}
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Outgoing Funds</Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, bgcolor: 'error.light', color: 'error.contrastText' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PaymentIcon />
                      <Typography variant="body2">Affiliate Payouts</Typography>
                    </Box>
                    <Typography variant="h6">{formatCurrency(adminWallet.total_payouts)}</Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Paper sx={{ p: 2, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TrendingDownIcon />
                      <Typography variant="body2">Refunds</Typography>
                    </Box>
                    <Typography variant="h6">{formatCurrency(adminWallet.total_refunds)}</Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Tab 1: User Balances */}
      {tabValue === 1 && (
        <Box>
          {/* Totals */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total User Wallets"
                value={formatCurrency(userTotals.total_user_balance || 0)}
                icon={<WalletIcon />}
                color="primary.main"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Seller Wallets"
                value={formatCurrency(userTotals.total_seller_balance || 0)}
                icon={<ShoppingCartIcon />}
                color="success.main"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Total Affiliate Wallets"
                value={formatCurrency(userTotals.total_affiliate_balance || 0)}
                icon={<PersonIcon />}
                color="info.main"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <StatCard
                title="Grand Total (Liabilities)"
                value={formatCurrency(userTotals.grand_total || 0)}
                icon={<TrendingDownIcon />}
                color="error.main"
              />
            </Grid>
          </Grid>

          {/* Search */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <TextField
                fullWidth
                placeholder="Search by email or username..."
                value={userSearch}
                onChange={(e) => { setUserSearch(e.target.value); setUserPage(1); }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </CardContent>
          </Card>

          {/* Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell align="right">User Wallet</TableCell>
                  <TableCell align="right">Seller Wallet</TableCell>
                  <TableCell align="right">Affiliate Wallet</TableCell>
                  <TableCell align="right">Total Balance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {userBalances.map((user) => (
                  <TableRow key={user.user_id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>{user.username}</Typography>
                        <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{formatCurrency(user.user_balance)}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box>
                        <Typography variant="body2">{formatCurrency(user.seller_balance)}</Typography>
                        {user.seller_pending > 0 && (
                          <Typography variant="caption" color="warning.main">
                            +{formatCurrency(user.seller_pending)} pending
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Box>
                        <Typography variant="body2">{formatCurrency(user.affiliate_balance)}</Typography>
                        {user.affiliate_pending > 0 && (
                          <Typography variant="caption" color="warning.main">
                            +{formatCurrency(user.affiliate_pending)} pending
                          </Typography>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600} color="primary">
                        {formatCurrency(user.total_balance)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
                {userBalances.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="text.secondary">No users found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 1 }}>
            <Button 
              disabled={userPage <= 1} 
              onClick={() => setUserPage(p => p - 1)}
            >
              Previous
            </Button>
            <Typography sx={{ alignSelf: 'center' }}>
              Page {userPage} of {userTotalPages}
            </Typography>
            <Button 
              disabled={userPage >= userTotalPages} 
              onClick={() => setUserPage(p => p + 1)}
            >
              Next
            </Button>
          </Box>
        </Box>
      )}

      {/* Tab 2: Transaction History */}
      {tabValue === 2 && (
        <Box>
          {/* Filters */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip 
                  label="All" 
                  onClick={() => setTxFilter('')}
                  color={txFilter === '' ? 'primary' : 'default'}
                />
                <Chip 
                  label="Marketplace Commission" 
                  onClick={() => setTxFilter('marketplace_commission')}
                  color={txFilter === 'marketplace_commission' ? 'primary' : 'default'}
                />
                <Chip 
                  label="Verification Fees" 
                  onClick={() => setTxFilter('verification_fee')}
                  color={txFilter === 'verification_fee' ? 'primary' : 'default'}
                />
                <Chip 
                  label="Withdrawal Fees" 
                  onClick={() => setTxFilter('withdrawal_fee')}
                  color={txFilter === 'withdrawal_fee' ? 'primary' : 'default'}
                />
                <Chip 
                  label="Affiliate Payouts" 
                  onClick={() => setTxFilter('affiliate_payout')}
                  color={txFilter === 'affiliate_payout' ? 'primary' : 'default'}
                />
              </Box>
            </CardContent>
          </Card>

          {/* Table */}
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>User</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Balance After</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id} hover>
                    <TableCell>
                      <Typography variant="caption">{formatDate(tx.created_at)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        icon={getTypeIcon(tx.type)}
                        label={tx.type.replace(/_/g, ' ')}
                        size="small"
                        color={getTypeColor(tx.type)}
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{tx.description}</Typography>
                    </TableCell>
                    <TableCell>
                      {tx.username ? (
                        <Box>
                          <Typography variant="body2">{tx.username}</Typography>
                          <Typography variant="caption" color="text.secondary">{tx.email}</Typography>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">-</Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2" 
                        fontWeight={600}
                        color={tx.amount >= 0 ? 'success.main' : 'error.main'}
                      >
                        {tx.amount >= 0 ? '+' : ''}{formatCurrency(tx.amount)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2">{formatCurrency(tx.balance_after)}</Typography>
                    </TableCell>
                  </TableRow>
                ))}
                {transactions.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary">No transactions found</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, gap: 1 }}>
            <Button 
              disabled={txPage <= 1} 
              onClick={() => setTxPage(p => p - 1)}
            >
              Previous
            </Button>
            <Typography sx={{ alignSelf: 'center' }}>
              Page {txPage} of {txTotalPages}
            </Typography>
            <Button 
              disabled={txPage >= txTotalPages} 
              onClick={() => setTxPage(p => p + 1)}
            >
              Next
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
