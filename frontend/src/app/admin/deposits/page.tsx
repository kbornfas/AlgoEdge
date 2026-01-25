'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Tooltip,
  Avatar,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  AccountBalanceWallet as WalletIcon,
  TrendingUp as EarningsIcon,
  MonetizationOn as MoneyIcon,
  Phone as PhoneIcon,
  Payments as PaymentsIcon,
  CurrencyBitcoin as CryptoIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';

interface DepositRequest {
  id: number;
  user_id: number;
  email: string;
  username: string;
  name: string;
  amount: number;
  payment_method: string;
  payment_reference: string;
  payment_proof_url?: string;
  phone_number?: string;
  crypto_address?: string;
  status: string;
  created_at: string;
}

interface EarningSummary {
  today: number;
  this_month: number;
  all_time: number;
  by_type: Array<{ source_type: string; total: number; count: number }>;
}

const getPaymentMethodIcon = (method: string) => {
  switch (method) {
    case 'mpesa':
      return <PhoneIcon fontSize="small" />;
    case 'paypal':
      return <PaymentsIcon fontSize="small" />;
    case 'crypto_usdt':
    case 'crypto_btc':
      return <CryptoIcon fontSize="small" />;
    default:
      return <PaymentsIcon fontSize="small" />;
  }
};

const getPaymentMethodLabel = (method: string) => {
  switch (method) {
    case 'mpesa':
      return 'M-Pesa';
    case 'paypal':
      return 'PayPal';
    case 'crypto_usdt':
      return 'USDT';
    case 'crypto_btc':
      return 'Bitcoin';
    case 'bank_transfer':
      return 'Bank';
    default:
      return method;
  }
};

export default function AdminDepositsPage() {
  const { token } = useAuth();
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [earnings, setEarnings] = useState<EarningSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  // Review dialog state
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedDeposit, setSelectedDeposit] = useState<DepositRequest | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  // Copy state
  const [copied, setCopied] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const fetchData = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const [depositsRes, earningsRes] = await Promise.all([
        fetch(`${API_URL}/api/wallet/admin/deposits/pending`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/wallet/admin/earnings`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!depositsRes.ok) {
        const data = await depositsRes.json();
        throw new Error(data.error || 'Failed to fetch deposits');
      }

      const [depositsData, earningsData] = await Promise.all([
        depositsRes.json(),
        earningsRes.json(),
      ]);

      setDeposits(depositsData.deposits || []);
      if (earningsData.success) {
        setEarnings(earningsData.summary);
      }
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [token, API_URL]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenReview = (deposit: DepositRequest) => {
    setSelectedDeposit(deposit);
    setAdminNotes('');
    setReviewDialogOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedDeposit) return;

    try {
      setProcessing(true);
      setError(null);

      const response = await fetch(
        `${API_URL}/api/wallet/admin/deposits/${selectedDeposit.id}/approve`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ admin_notes: adminNotes }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve deposit');
      }

      setSuccess(`Deposit of $${selectedDeposit.amount} approved!`);
      setReviewDialogOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDeposit) return;

    if (!adminNotes) {
      setError('Please provide a reason for rejection');
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const response = await fetch(
        `${API_URL}/api/wallet/admin/deposits/${selectedDeposit.id}/reject`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ admin_notes: adminNotes }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject deposit');
      }

      setSuccess('Deposit rejected');
      setReviewDialogOpen(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Wallet Management
          </Typography>
          <Typography color="text.secondary">
            Manage user deposits and view platform earnings
          </Typography>
        </Box>
        <IconButton onClick={fetchData} disabled={loading}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Earnings Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <MoneyIcon />
                <Typography variant="subtitle2">Today's Earnings</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                ${earnings?.today.toFixed(2) || '0.00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #1D9BF0 0%, #0A8DDC 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <EarningsIcon />
                <Typography variant="subtitle2">This Month</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                ${earnings?.this_month.toFixed(2) || '0.00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={4}>
          <Card sx={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)', color: 'white' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <WalletIcon />
                <Typography variant="subtitle2">All Time Earnings</Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                ${earnings?.all_time.toFixed(2) || '0.00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab 
            label={
              <Box display="flex" alignItems="center" gap={1}>
                Pending Deposits
                {deposits.length > 0 && (
                  <Chip label={deposits.length} size="small" color="warning" />
                )}
              </Box>
            }
          />
          <Tab label="Earnings Breakdown" />
        </Tabs>
      </Paper>

      {/* Pending Deposits Tab */}
      {activeTab === 0 && (
        <Paper sx={{ p: 3 }}>
          {deposits.length === 0 ? (
            <Box textAlign="center" py={6}>
              <WalletIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
              <Typography color="text.secondary">
                No pending deposit requests
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Reference</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deposits.map((deposit) => (
                    <TableRow key={deposit.id} hover>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar sx={{ width: 32, height: 32 }}>
                            {deposit.email[0].toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {deposit.name || deposit.username || 'User'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {deposit.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="h6" fontWeight="bold" color="success.main">
                          ${deposit.amount.toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          icon={getPaymentMethodIcon(deposit.payment_method)}
                          label={getPaymentMethodLabel(deposit.payment_method)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography
                            variant="body2"
                            fontFamily="monospace"
                            sx={{
                              maxWidth: 150,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {deposit.payment_reference}
                          </Typography>
                          <Tooltip title="Copy">
                            <IconButton
                              size="small"
                              onClick={() => handleCopy(deposit.payment_reference)}
                            >
                              {copied ? <CheckIcon fontSize="small" /> : <CopyIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {format(new Date(deposit.created_at), 'MMM d, HH:mm')}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<ViewIcon />}
                          onClick={() => handleOpenReview(deposit)}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      )}

      {/* Earnings Breakdown Tab */}
      {activeTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Earnings by Source
          </Typography>
          {earnings?.by_type && earnings.by_type.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Source</TableCell>
                    <TableCell align="right">Count</TableCell>
                    <TableCell align="right">Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {earnings.by_type.map((item) => (
                    <TableRow key={item.source_type}>
                      <TableCell>
                        <Chip
                          label={item.source_type.replace(/_/g, ' ').toUpperCase()}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">{item.count}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                        ${parseFloat(String(item.total)).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box textAlign="center" py={4}>
              <Typography color="text.secondary">No earnings recorded yet</Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* Review Dialog */}
      <Dialog
        open={reviewDialogOpen}
        onClose={() => !processing && setReviewDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Review Deposit Request</DialogTitle>
        <DialogContent>
          {selectedDeposit && (
            <Box sx={{ pt: 2 }}>
              {/* User Info */}
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">User</Typography>
                    <Typography fontWeight="medium">
                      {selectedDeposit.name || selectedDeposit.username}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedDeposit.email}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary">Amount</Typography>
                    <Typography variant="h5" fontWeight="bold" color="success.main">
                      ${selectedDeposit.amount.toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Payment Details */}
              <Typography variant="subtitle2" gutterBottom>
                Payment Details
              </Typography>
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'grey.50' }}>
                <Box mb={1}>
                  <Typography variant="caption" color="text.secondary">Method</Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getPaymentMethodIcon(selectedDeposit.payment_method)}
                    <Typography>{getPaymentMethodLabel(selectedDeposit.payment_method)}</Typography>
                  </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box mb={1}>
                  <Typography variant="caption" color="text.secondary">Reference / Transaction ID</Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography fontFamily="monospace" fontWeight="medium">
                      {selectedDeposit.payment_reference}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => handleCopy(selectedDeposit.payment_reference)}
                    >
                      <CopyIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                {selectedDeposit.phone_number && (
                  <Box mt={2}>
                    <Typography variant="caption" color="text.secondary">Phone Number</Typography>
                    <Typography fontFamily="monospace">{selectedDeposit.phone_number}</Typography>
                  </Box>
                )}
              </Paper>

              <Alert severity="info" sx={{ mb: 3 }}>
                Verify this payment using your M-Pesa, PayPal, or crypto wallet before approving.
              </Alert>

              <TextField
                label="Admin Notes (optional for approval, required for rejection)"
                fullWidth
                multiline
                rows={2}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add any notes about this transaction..."
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3, gap: 1 }}>
          <Button onClick={() => setReviewDialogOpen(false)} disabled={processing}>
            Cancel
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={processing ? <CircularProgress size={20} /> : <RejectIcon />}
            onClick={handleReject}
            disabled={processing}
          >
            Reject
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={processing ? <CircularProgress size={20} /> : <ApproveIcon />}
            onClick={handleApprove}
            disabled={processing}
          >
            Approve & Credit Wallet
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
