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
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  Tabs,
  Tab,
  Avatar,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as ViewIcon,
  AccountBalanceWallet as WalletIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Lock as FreezeIcon,
  LockOpen as UnfreezeIcon,
  Refresh as RefreshIcon,
  TrendingUp as EarningsIcon,
  People as UsersIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';

interface Wallet {
  user_id: number;
  email: string;
  username: string;
  name: string;
  balance: number;
  total_deposited: number;
  total_spent: number;
  total_withdrawn: number;
  is_frozen: boolean;
  frozen_reason: string | null;
  seller_balance: number;
  seller_total_earned: number;
  seller_frozen: boolean;
}

interface WalletDetails {
  user: any;
  user_wallet: any;
  seller_wallet: any;
  transactions: any[];
  deposits: any[];
  withdrawals: any[];
}

interface PlatformWallet {
  id: number;
  wallet_type: string;
  balance: number;
  total_received: number;
  total_withdrawn: number;
}

export default function AdminWalletsPage() {
  const { token } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [platformWallets, setPlatformWallets] = useState<PlatformWallet[]>([]);
  const [totals, setTotals] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [frozenOnly, setFrozenOnly] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialogs
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [walletDetails, setWalletDetails] = useState<WalletDetails | null>(null);
  const [actionType, setActionType] = useState<'credit' | 'debit' | 'freeze' | 'unfreeze'>('credit');
  const [actionWalletType, setActionWalletType] = useState<'user' | 'seller'>('user');
  const [actionAmount, setActionAmount] = useState('');
  const [actionReason, setActionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchWallets();
  }, [search, frozenOnly]);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (frozenOnly) params.append('frozen_only', 'true');

      const res = await fetch(`${API_URL}/api/wallet/admin/wallets?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setWallets(data.wallets);
        setPlatformWallets(data.platform_wallets || []);
        setTotals(data.totals || {});
      }
    } catch (err) {
      setError('Failed to fetch wallets');
    } finally {
      setLoading(false);
    }
  };

  const fetchWalletDetails = async (userId: number) => {
    try {
      const res = await fetch(`${API_URL}/api/wallet/admin/wallets/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setWalletDetails(data);
        setViewDialogOpen(true);
      }
    } catch (err) {
      setError('Failed to fetch wallet details');
    }
  };

  const handleAction = async () => {
    if (!selectedWallet) return;

    if ((actionType === 'credit' || actionType === 'debit') && (!actionAmount || parseFloat(actionAmount) <= 0)) {
      setError('Please enter a valid amount');
      return;
    }

    if (!actionReason) {
      setError('Please provide a reason');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      let endpoint = '';
      let body: any = { wallet_type: actionWalletType, reason: actionReason };

      switch (actionType) {
        case 'credit':
          endpoint = `/api/wallet/admin/wallets/${selectedWallet.user_id}/deposit`;
          body.amount = parseFloat(actionAmount);
          break;
        case 'debit':
          endpoint = `/api/wallet/admin/wallets/${selectedWallet.user_id}/deduct`;
          body.amount = parseFloat(actionAmount);
          break;
        case 'freeze':
          endpoint = `/api/wallet/admin/wallets/${selectedWallet.user_id}/freeze`;
          break;
        case 'unfreeze':
          endpoint = `/api/wallet/admin/wallets/${selectedWallet.user_id}/unfreeze`;
          break;
      }

      const res = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(data.message);
        setActionDialogOpen(false);
        setActionAmount('');
        setActionReason('');
        fetchWallets();
      } else {
        setError(data.error || 'Action failed');
      }
    } catch (err) {
      setError('Failed to perform action');
    } finally {
      setActionLoading(false);
    }
  };

  const openActionDialog = (wallet: Wallet, type: 'credit' | 'debit' | 'freeze' | 'unfreeze', walletType: 'user' | 'seller') => {
    setSelectedWallet(wallet);
    setActionType(type);
    setActionWalletType(walletType);
    setActionAmount('');
    setActionReason('');
    setActionDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const StatCard = ({ title, value, icon, color }: { title: string; value: string; icon: React.ReactNode; color: string }) => (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">{title}</Typography>
            <Typography variant="h5" sx={{ mt: 1 }}>{value}</Typography>
          </Box>
          <Avatar sx={{ bgcolor: color, width: 48, height: 48 }}>{icon}</Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, py: 2, maxWidth: '100%', overflowX: 'hidden' }}>
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.5rem', md: '2rem' } }}>Wallet Management</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Manage user deposits and view platform earnings</Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={fetchWallets}
          disabled={loading}
          sx={{ minWidth: { xs: '100%', sm: 'auto' } }}
        >
          Refresh
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total User Balances"
            value={formatCurrency(parseFloat(totals.total_user_balance) || 0)}
            icon={<WalletIcon />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Seller Balances"
            value={formatCurrency(parseFloat(totals.total_seller_balance) || 0)}
            icon={<EarningsIcon />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Wallets"
            value={String(parseInt(totals.total_user_wallets) || 0)}
            icon={<UsersIcon />}
            color="info.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Frozen Wallets"
            value={String((parseInt(totals.frozen_user_count) || 0) + (parseInt(totals.frozen_seller_count) || 0))}
            icon={<WarningIcon />}
            color="error.main"
          />
        </Grid>
      </Grid>

      {/* Platform Wallets */}
      {platformWallets.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>Platform Wallets</Typography>
            <Grid container spacing={2}>
              {platformWallets.map((pw) => (
                <Grid item xs={12} sm={6} md={3} key={pw.id}>
                  <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                      {pw.wallet_type.replace('_', ' ')} Wallet
                    </Typography>
                    <Typography variant="h6">{formatCurrency(parseFloat(String(pw.balance)))}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Total Received: {formatCurrency(parseFloat(String(pw.total_received || 0)))}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                placeholder="Search by email, username, or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <Button
                variant={frozenOnly ? 'contained' : 'outlined'}
                color={frozenOnly ? 'error' : 'inherit'}
                onClick={() => setFrozenOnly(!frozenOnly)}
                startIcon={<FreezeIcon />}
                fullWidth
              >
                {frozenOnly ? 'Showing Frozen Only' : 'Show Frozen Only'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Wallets Table */}
      <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
        <Table sx={{ minWidth: { xs: '100%', md: 650 } }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>User</TableCell>
              <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>User Balance</TableCell>
              <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' }, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>Seller Balance</TableCell>
              <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' }, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>Total Deposited</TableCell>
              <TableCell align="right" sx={{ display: { xs: 'none', lg: 'table-cell' }, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>Total Spent</TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' }, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>Status</TableCell>
              <TableCell align="center" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : wallets.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No wallets found
                </TableCell>
              </TableRow>
            ) : (
              wallets.map((wallet) => (
                <TableRow key={wallet.user_id}>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight="bold" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                        {wallet.name || wallet.username || 'N/A'}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }}>
                        {wallet.email}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Typography fontWeight="bold" color={wallet.is_frozen ? 'error' : 'inherit'} sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                      {formatCurrency(parseFloat(String(wallet.balance)))}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Typography color={wallet.seller_frozen ? 'error' : 'inherit'} sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                      {formatCurrency(parseFloat(String(wallet.seller_balance)))}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' }, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                    {formatCurrency(parseFloat(String(wallet.total_deposited)))}
                  </TableCell>
                  <TableCell align="right" sx={{ display: { xs: 'none', lg: 'table-cell' }, fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                    {formatCurrency(parseFloat(String(wallet.total_spent)))}
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    {wallet.is_frozen && (
                      <Chip label="User Frozen" color="error" size="small" sx={{ mr: 0.5, fontSize: { xs: '0.65rem', md: '0.75rem' } }} />
                    )}
                    {wallet.seller_frozen && (
                      <Chip label="Seller Frozen" color="error" size="small" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }} />
                    )}
                    {!wallet.is_frozen && !wallet.seller_frozen && (
                      <Chip label="Active" color="success" size="small" sx={{ fontSize: { xs: '0.65rem', md: '0.75rem' } }} />
                    )}
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.5 }}>
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => fetchWalletDetails(wallet.user_id)}>
                          <ViewIcon sx={{ fontSize: { xs: 16, md: 20 } }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Credit User Wallet">
                        <IconButton size="small" color="success" onClick={() => openActionDialog(wallet, 'credit', 'user')}>
                          <AddIcon sx={{ fontSize: { xs: 16, md: 20 } }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Debit User Wallet">
                        <IconButton size="small" color="error" onClick={() => openActionDialog(wallet, 'debit', 'user')}>
                          <RemoveIcon sx={{ fontSize: { xs: 16, md: 20 } }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={wallet.is_frozen ? 'Unfreeze User Wallet' : 'Freeze User Wallet'}>
                        <IconButton
                          size="small"
                          color={wallet.is_frozen ? 'success' : 'warning'}
                          onClick={() => openActionDialog(wallet, wallet.is_frozen ? 'unfreeze' : 'freeze', 'user')}
                        >
                          {wallet.is_frozen ? <UnfreezeIcon sx={{ fontSize: { xs: 16, md: 20 } }} /> : <FreezeIcon sx={{ fontSize: { xs: 16, md: 20 } }} />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* View Details Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Wallet Details - {walletDetails?.user?.email}
        </DialogTitle>
        <DialogContent>
          {walletDetails && (
            <Box>
              <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2 }}>
                <Tab label="Overview" />
                <Tab label="Transactions" />
                <Tab label="Deposits" />
                <Tab label="Withdrawals" />
              </Tabs>

              {tabValue === 0 && (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" sx={{ mb: 2 }}>User Wallet</Typography>
                      {walletDetails.user_wallet ? (
                        <>
                          <Typography>Balance: {formatCurrency(parseFloat(walletDetails.user_wallet.balance))}</Typography>
                          <Typography>Total Deposited: {formatCurrency(parseFloat(walletDetails.user_wallet.total_deposited))}</Typography>
                          <Typography>Total Spent: {formatCurrency(parseFloat(walletDetails.user_wallet.total_spent))}</Typography>
                          <Typography>Total Withdrawn: {formatCurrency(parseFloat(walletDetails.user_wallet.total_withdrawn || 0))}</Typography>
                          <Typography color={walletDetails.user_wallet.is_frozen ? 'error' : 'success'}>
                            Status: {walletDetails.user_wallet.is_frozen ? 'Frozen' : 'Active'}
                          </Typography>
                          {walletDetails.user_wallet.frozen_reason && (
                            <Typography color="error">Reason: {walletDetails.user_wallet.frozen_reason}</Typography>
                          )}
                        </>
                      ) : (
                        <Typography color="text.secondary">No user wallet</Typography>
                      )}
                    </Paper>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" sx={{ mb: 2 }}>Seller Wallet</Typography>
                      {walletDetails.seller_wallet ? (
                        <>
                          <Typography>Balance: {formatCurrency(parseFloat(walletDetails.seller_wallet.balance))}</Typography>
                          <Typography>Pending: {formatCurrency(parseFloat(walletDetails.seller_wallet.pending_balance || 0))}</Typography>
                          <Typography>Total Earned: {formatCurrency(parseFloat(walletDetails.seller_wallet.total_earned))}</Typography>
                          <Typography>Total Withdrawn: {formatCurrency(parseFloat(walletDetails.seller_wallet.total_withdrawn || 0))}</Typography>
                          <Typography color={walletDetails.seller_wallet.is_frozen ? 'error' : 'success'}>
                            Status: {walletDetails.seller_wallet.is_frozen ? 'Frozen' : 'Active'}
                          </Typography>
                        </>
                      ) : (
                        <Typography color="text.secondary">No seller wallet</Typography>
                      )}
                    </Paper>
                  </Grid>
                </Grid>
              )}

              {tabValue === 1 && (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Wallet</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Description</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {walletDetails.transactions.map((tx) => (
                        <TableRow key={tx.id}>
                          <TableCell>{new Date(tx.created_at).toLocaleString()}</TableCell>
                          <TableCell>
                            <Chip label={tx.type} size="small" />
                          </TableCell>
                          <TableCell>{tx.wallet_type || 'user'}</TableCell>
                          <TableCell align="right" sx={{ color: tx.amount >= 0 ? 'success.main' : 'error.main' }}>
                            {tx.amount >= 0 ? '+' : ''}{formatCurrency(parseFloat(tx.amount))}
                          </TableCell>
                          <TableCell>{tx.description}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {tabValue === 2 && (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Method</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Reference</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {walletDetails.deposits.map((d) => (
                        <TableRow key={d.id}>
                          <TableCell>{new Date(d.created_at).toLocaleString()}</TableCell>
                          <TableCell>{d.payment_method}</TableCell>
                          <TableCell align="right">{formatCurrency(parseFloat(d.amount))}</TableCell>
                          <TableCell>
                            <Chip
                              label={d.status}
                              color={d.status === 'approved' ? 'success' : d.status === 'rejected' ? 'error' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>{d.payment_reference}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {tabValue === 3 && (
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Wallet</TableCell>
                        <TableCell>Method</TableCell>
                        <TableCell align="right">Amount</TableCell>
                        <TableCell align="right">Fee</TableCell>
                        <TableCell align="right">Net</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {walletDetails.withdrawals.map((w) => (
                        <TableRow key={w.id}>
                          <TableCell>{new Date(w.created_at).toLocaleString()}</TableCell>
                          <TableCell>{w.wallet_type}</TableCell>
                          <TableCell>{w.payment_method}</TableCell>
                          <TableCell align="right">{formatCurrency(parseFloat(w.amount))}</TableCell>
                          <TableCell align="right">{formatCurrency(parseFloat(w.withdrawal_fee || 0))}</TableCell>
                          <TableCell align="right">{formatCurrency(parseFloat(w.net_amount || 0))}</TableCell>
                          <TableCell>
                            <Chip
                              label={w.status}
                              color={w.status === 'completed' ? 'success' : w.status === 'rejected' ? 'error' : 'warning'}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'credit' && 'Credit Wallet'}
          {actionType === 'debit' && 'Debit Wallet'}
          {actionType === 'freeze' && 'Freeze Wallet'}
          {actionType === 'unfreeze' && 'Unfreeze Wallet'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {actionWalletType === 'user' ? 'User' : 'Seller'} Wallet for: {selectedWallet?.email}
            </Typography>

            {(actionType === 'credit' || actionType === 'debit') && (
              <TextField
                fullWidth
                label="Amount (USD)"
                type="number"
                value={actionAmount}
                onChange={(e) => setActionAmount(e.target.value)}
                sx={{ mb: 2 }}
                InputProps={{
                  startAdornment: <InputAdornment position="start">$</InputAdornment>,
                }}
              />
            )}

            <TextField
              fullWidth
              label="Reason (required for audit)"
              multiline
              rows={3}
              value={actionReason}
              onChange={(e) => setActionReason(e.target.value)}
              placeholder={
                actionType === 'credit' ? 'e.g., Promotional credit, Refund, Manual adjustment...' :
                actionType === 'debit' ? 'e.g., Chargeback, Fraud correction, Fee adjustment...' :
                actionType === 'freeze' ? 'e.g., Suspicious activity, Pending investigation...' :
                'e.g., Investigation complete, Issue resolved...'
              }
            />

            <Alert severity="info" sx={{ mt: 2 }}>
              This action will be logged in the admin audit trail.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color={actionType === 'debit' || actionType === 'freeze' ? 'error' : 'primary'}
            onClick={handleAction}
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
