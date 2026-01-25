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
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Alert,
  Avatar,
  Tooltip,
  CircularProgress,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Check as ApproveIcon,
  Close as RejectIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  AccountBalanceWallet as WalletIcon,
  Schedule as PendingIcon,
  CheckCircle as CompletedIcon,
  Cancel as RejectedIcon,
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';

interface Withdrawal {
  id: number;
  user_id: number;
  email: string;
  username: string;
  name: string;
  wallet_type: string;
  amount: number;
  withdrawal_fee: number;
  net_amount: number;
  payment_method: string;
  payment_details: string;
  status: string;
  admin_notes: string | null;
  transaction_reference: string | null;
  created_at: string;
  reviewed_at: string | null;
  completed_at: string | null;
}

export default function AdminWithdrawalsPage() {
  const { token } = useAuth();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Dialog states
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [actionType, setActionType] = useState<'complete' | 'reject'>('complete');
  const [transactionRef, setTransactionRef] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchWithdrawals();
  }, [tabValue]);

  const fetchWithdrawals = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/wallet/admin/withdrawals/pending`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setWithdrawals(data.withdrawals);
      }
    } catch (err) {
      setError('Failed to fetch withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async () => {
    if (!selectedWithdrawal) return;

    if (actionType === 'complete' && !transactionRef) {
      setError('Please enter transaction reference');
      return;
    }

    if (actionType === 'reject' && !adminNotes) {
      setError('Please provide a reason for rejection');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const endpoint = actionType === 'complete'
        ? `/api/wallet/admin/withdrawals/${selectedWithdrawal.id}/complete`
        : `/api/wallet/admin/withdrawals/${selectedWithdrawal.id}/reject`;

      const body: any = { admin_notes: adminNotes };
      if (actionType === 'complete') {
        body.transaction_reference = transactionRef;
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
        setTransactionRef('');
        setAdminNotes('');
        fetchWithdrawals();
      } else {
        setError(data.error || 'Action failed');
      }
    } catch (err) {
      setError('Failed to process withdrawal');
    } finally {
      setActionLoading(false);
    }
  };

  const openActionDialog = (withdrawal: Withdrawal, type: 'complete' | 'reject') => {
    setSelectedWithdrawal(withdrawal);
    setActionType(type);
    setTransactionRef('');
    setAdminNotes('');
    setActionDialogOpen(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const parsePaymentDetails = (details: string) => {
    try {
      return JSON.parse(details);
    } catch {
      return { raw: details };
    }
  };

  const formatPaymentDetails = (details: string, method: string) => {
    const parsed = parsePaymentDetails(details);
    
    if (method === 'mpesa') {
      return `M-Pesa: ${parsed.phone_number || parsed.phone || 'N/A'}`;
    } else if (method === 'airtel_money') {
      return `Airtel Money: ${parsed.phone_number || parsed.phone || 'N/A'}`;
    } else if (method === 'usdt') {
      return `USDT (TRC20): ${parsed.wallet_address ? `${parsed.wallet_address.slice(0, 12)}...${parsed.wallet_address.slice(-8)}` : 'N/A'}`;
    } else if (method === 'btc') {
      return `Bitcoin: ${parsed.wallet_address ? `${parsed.wallet_address.slice(0, 12)}...${parsed.wallet_address.slice(-8)}` : 'N/A'}`;
    } else if (method === 'paypal') {
      return `PayPal: ${parsed.email || 'N/A'}`;
    } else if (method === 'bank_transfer') {
      return `Bank: ${parsed.bank_name || 'N/A'} - ${parsed.account_number || 'N/A'}`;
    }
    return JSON.stringify(parsed);
  };

  const getFullPaymentDetails = (details: string, method: string) => {
    const parsed = parsePaymentDetails(details);
    
    if (method === 'mpesa') {
      return { label: 'M-Pesa Phone Number', value: parsed.phone_number || parsed.phone || 'N/A' };
    } else if (method === 'airtel_money') {
      return { label: 'Airtel Money Phone Number', value: parsed.phone_number || parsed.phone || 'N/A' };
    } else if (method === 'usdt') {
      return { label: 'USDT Wallet Address (TRC20)', value: parsed.wallet_address || 'N/A' };
    } else if (method === 'btc') {
      return { label: 'Bitcoin Wallet Address', value: parsed.wallet_address || 'N/A' };
    }
    return { label: 'Payment Details', value: JSON.stringify(parsed) };
  };

  const pendingWithdrawals = withdrawals.filter(w => w.status === 'pending');
  const processingWithdrawals = withdrawals.filter(w => w.status === 'processing');

  // Calculate stats
  const totalPending = pendingWithdrawals.reduce((sum, w) => sum + parseFloat(String(w.amount)), 0);
  const totalProcessing = processingWithdrawals.reduce((sum, w) => sum + parseFloat(String(w.amount)), 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Withdrawal Management</Typography>
        <Button startIcon={<RefreshIcon />} onClick={fetchWithdrawals}>Refresh</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Stats */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Pending Requests</Typography>
                  <Typography variant="h5">{pendingWithdrawals.length}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}><PendingIcon /></Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Pending Amount</Typography>
                  <Typography variant="h5">{formatCurrency(totalPending)}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}><WalletIcon /></Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Processing</Typography>
                  <Typography variant="h5">{processingWithdrawals.length}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}><PendingIcon /></Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" color="text.secondary">Processing Amount</Typography>
                  <Typography variant="h5">{formatCurrency(totalProcessing)}</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.main' }}><WalletIcon /></Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Withdrawals Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>Pending Withdrawals</Typography>
          
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>User</TableCell>
                  <TableCell>Wallet</TableCell>
                  <TableCell>Payment Method</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Fee</TableCell>
                  <TableCell align="right">Net Payout</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Requested</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : withdrawals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center">
                      <Box sx={{ py: 4 }}>
                        <CompletedIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                        <Typography color="text.secondary">No pending withdrawals</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  withdrawals.map((w) => (
                    <TableRow key={w.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {w.name || w.username || 'N/A'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {w.email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={w.wallet_type}
                          size="small"
                          color={w.wallet_type === 'seller' ? 'success' : 'primary'}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                          {w.payment_method?.replace('_', ' ')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatPaymentDetails(w.payment_details, w.payment_method)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold">
                          {formatCurrency(parseFloat(String(w.amount)))}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography color="text.secondary">
                          {formatCurrency(parseFloat(String(w.withdrawal_fee)))}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold" color="success.main">
                          {formatCurrency(parseFloat(String(w.net_amount)))}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={w.status}
                          size="small"
                          color={
                            w.status === 'pending' ? 'warning' :
                            w.status === 'processing' ? 'info' :
                            w.status === 'completed' ? 'success' : 'error'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {new Date(w.created_at).toLocaleDateString()}
                        </Typography>
                        <br />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(w.created_at).toLocaleTimeString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Mark as Completed (Paid)">
                          <IconButton
                            size="small"
                            color="success"
                            onClick={() => openActionDialog(w, 'complete')}
                          >
                            <ApproveIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject (Refund to Wallet)">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => openActionDialog(w, 'reject')}
                          >
                            <RejectIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onClose={() => setActionDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {actionType === 'complete' ? 'Complete Withdrawal' : 'Reject Withdrawal'}
        </DialogTitle>
        <DialogContent>
          {selectedWithdrawal && (
            <Box sx={{ mt: 2 }}>
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">User</Typography>
                    <Typography fontWeight="bold">{selectedWithdrawal.email}</Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Wallet Type</Typography>
                    <Typography fontWeight="bold" sx={{ textTransform: 'capitalize' }}>
                      {selectedWithdrawal.wallet_type}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Gross Amount</Typography>
                    <Typography fontWeight="bold">
                      {formatCurrency(parseFloat(String(selectedWithdrawal.amount)))}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">Net Payout</Typography>
                    <Typography fontWeight="bold" color="success.main">
                      {formatCurrency(parseFloat(String(selectedWithdrawal.net_amount)))}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Payment Details Section - Clear display for admin */}
              <Paper sx={{ p: 2, mb: 3, bgcolor: 'warning.50', border: '2px solid', borderColor: 'warning.main' }}>
                <Typography variant="subtitle2" color="warning.dark" gutterBottom>
                  📤 SEND FUNDS TO:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {getFullPaymentDetails(selectedWithdrawal.payment_details, selectedWithdrawal.payment_method).label}
                </Typography>
                <Typography 
                  variant="h6" 
                  fontWeight="bold" 
                  sx={{ 
                    wordBreak: 'break-all',
                    bgcolor: 'white',
                    p: 1.5,
                    borderRadius: 1,
                    mt: 1,
                    fontFamily: 'monospace',
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  {getFullPaymentDetails(selectedWithdrawal.payment_details, selectedWithdrawal.payment_method).value}
                </Typography>
                <Chip 
                  label={selectedWithdrawal.payment_method?.replace('_', ' ').toUpperCase()} 
                  size="small" 
                  color="warning"
                  sx={{ mt: 1 }}
                />
              </Paper>

              {actionType === 'complete' ? (
                <>
                  <TextField
                    fullWidth
                    label="Transaction Reference / Receipt Number"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g., M-Pesa: ABC123XYZ, PayPal: TXN456..."
                    sx={{ mb: 2 }}
                    required
                  />
                  <TextField
                    fullWidth
                    label="Admin Notes (optional)"
                    multiline
                    rows={2}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Any additional notes..."
                  />
                  <Alert severity="success" sx={{ mt: 2 }}>
                    This will mark the withdrawal as completed. User will be notified.
                  </Alert>
                </>
              ) : (
                <>
                  <TextField
                    fullWidth
                    label="Rejection Reason (required)"
                    multiline
                    rows={3}
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="e.g., Invalid payment details, Suspicious activity..."
                    required
                  />
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <strong>This will:</strong>
                    <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                      <li>Refund the full amount ({formatCurrency(parseFloat(String(selectedWithdrawal.amount)))}) back to user's wallet</li>
                      <li>Cancel the withdrawal fee</li>
                      <li>Notify the user of the rejection</li>
                    </ul>
                  </Alert>
                </>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setActionDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color={actionType === 'complete' ? 'success' : 'error'}
            onClick={handleAction}
            disabled={actionLoading}
          >
            {actionLoading ? <CircularProgress size={24} /> : actionType === 'complete' ? 'Mark as Completed' : 'Reject & Refund'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
