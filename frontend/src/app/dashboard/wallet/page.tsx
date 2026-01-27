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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  AccountBalanceWallet as WalletIcon,
  Add as AddIcon,
  History as HistoryIcon,
  ShoppingCart as ShoppingCartIcon,
  ArrowDownward as DepositIcon,
  ArrowUpward as WithdrawIcon,
  Phone as PhoneIcon,
  Payments as PaymentsIcon,
  CurrencyBitcoin as CryptoIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';
import DepositModal from '@/components/wallet/DepositModal';

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

interface Wallet {
  balance: number;
  total_deposited: number;
  total_spent: number;
  total_withdrawn: number;
  currency: string;
  is_frozen: boolean;
  frozen_reason?: string;
  pending_deposits: number;
  pending_withdrawals: number;
}

interface Transaction {
  id: number;
  type: string;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  created_at: string;
  reference_type?: string;
  reference_id?: number;
}

interface PaymentMethod {
  id: number;
  payment_method: string;
  account_name: string;
  account_number?: string;
  crypto_address?: string;
  crypto_network?: string;
  qr_code_url?: string;
  instructions?: string;
  min_amount?: number;
  max_amount?: number;
}

interface DepositRequest {
  id: number;
  amount: number;
  payment_method: string;
  status: string;
  created_at: string;
  payment_reference?: string;
}

interface WithdrawalRequest {
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

const getPaymentMethodIcon = (method: string) => {
  const iconStyle = { width: 24, height: 24, borderRadius: '50%' };
  switch (method) {
    case 'mpesa':
      return <img src="/icons/mpesa.svg" alt="M-Pesa" style={iconStyle} />;
    case 'airtel_money':
      return <img src="/icons/airtel.svg" alt="Airtel Money" style={iconStyle} />;
    case 'usdt':
      return <img src="/icons/usdt.svg" alt="USDT" style={iconStyle} />;
    case 'btc':
      return <img src="/icons/btc.svg" alt="Bitcoin" style={iconStyle} />;
    case 'eth':
      return <img src="/icons/eth.svg" alt="Ethereum" style={iconStyle} />;
    case 'ltc':
      return <img src="/icons/ltc.svg" alt="Litecoin" style={iconStyle} />;
    default:
      return <PaymentsIcon />;
  }
};

const getPaymentMethodLabel = (method: string) => {
  switch (method) {
    case 'mpesa':
      return 'M-Pesa';
    case 'airtel_money':
      return 'Airtel Money';
    case 'usdt':
      return 'USDT (TRC20)';
    case 'btc':
      return 'Bitcoin (BTC)';
    case 'eth':
      return 'Ethereum (ETH)';
    case 'ltc':
      return 'Litecoin (LTC)';
    case 'crypto':
      return 'Crypto';
    default:
      return method;
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

// Platform payment details (configured via environment variables)
interface MobilePaymentDetails {
  number: string;
}

interface CryptoPaymentDetails {
  address: string;
  network: string;
}

const PLATFORM_PAYMENT_DETAILS: {
  mpesa: MobilePaymentDetails;
  airtel_money: MobilePaymentDetails;
  usdt: CryptoPaymentDetails;
  btc: CryptoPaymentDetails;
} = {
  mpesa: { 
    number: process.env.NEXT_PUBLIC_MPESA_NUMBER || '+254704618663'
  },
  airtel_money: { 
    number: process.env.NEXT_PUBLIC_AIRTEL_NUMBER || '+254750020853'
  },
  usdt: { 
    address: process.env.NEXT_PUBLIC_USDT_ADDRESS || 'TFxuKytiDWbgMBYHNhA2J2Wx4MEdnQ3ecJ', 
    network: 'TRC20 (Tron Network)' 
  },
  btc: { 
    address: process.env.NEXT_PUBLIC_BTC_ADDRESS || 'bc1q5fs2vfa0s9zm560ha37hcj3szhrmav3kufxr3s', 
    network: 'Bitcoin Network' 
  },
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'warning';
    case 'approved':
    case 'completed':
      return 'success';
    case 'rejected':
      return 'error';
    default:
      return 'default';
  }
};

export default function WalletPage() {
  const { token } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [depositHistory, setDepositHistory] = useState<DepositRequest[]>([]);
  const [withdrawalHistory, setWithdrawalHistory] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // New Deposit Modal state
  const [depositModalOpen, setDepositModalOpen] = useState(false);

  // Action dialog state (for withdraw only now)
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'deposit' | 'withdraw'>('deposit');
  const [selectedMethod, setSelectedMethod] = useState('mpesa');
  const [amount, setAmount] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [userPaymentDetails, setUserPaymentDetails] = useState<any>({});
  const [submitting, setSubmitting] = useState(false);

  // Copy states
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const fetchWalletData = useCallback(async () => {
    if (!token) return;

    try {
      setLoading(true);
      setError(null);

      const [walletRes, methodsRes, historyRes, withdrawRes] = await Promise.all([
        fetch(`${API_URL}/api/wallet/balance`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/wallet/payment-methods`),
        fetch(`${API_URL}/api/wallet/deposit/history`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_URL}/api/wallet/withdrawal/history`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (!walletRes.ok) throw new Error('Failed to fetch wallet');

      const [walletData, methodsData, historyData, withdrawData] = await Promise.all([
        walletRes.json(),
        methodsRes.json(),
        historyRes.json(),
        withdrawRes.json(),
      ]);

      setWallet(walletData.wallet);
      setTransactions(walletData.recent_transactions || []);
      setPaymentMethods(methodsData.payment_methods || []);
      setDepositHistory(historyData.deposits || []);
      setWithdrawalHistory(withdrawData.withdrawals || []);
    } catch (err: any) {
      console.error('Error fetching wallet:', err);
      setError(err.message || 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  }, [token, API_URL]);

  useEffect(() => {
    fetchWalletData();
    // Auto-refresh wallet data every 15 seconds to catch balance updates after admin approval
    const interval = setInterval(fetchWalletData, 15000);
    return () => clearInterval(interval);
  }, [fetchWalletData]);

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const openActionDialog = (type: 'deposit' | 'withdraw') => {
    setActionType(type);
    setSelectedMethod('mpesa');
    setAmount('');
    setPaymentReference('');
    setUserPaymentDetails({});
    setActionDialogOpen(true);
  };

  const handleSubmitDeposit = async () => {
    if (!amount || parseFloat(amount) < 19) {
      setError('Minimum deposit is $19');
      return;
    }
    if (!paymentReference) {
      setError('Please enter the transaction reference/confirmation code');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/wallet/deposit/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          payment_method: selectedMethod,
          payment_reference: paymentReference,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit deposit request');
      }

      setSuccess('Deposit request submitted! Admin will verify and approve your payment within 24 hours.');
      setActionDialogOpen(false);
      fetchWalletData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitWithdraw = async () => {
    if (!amount || parseFloat(amount) < 10) {
      setError('Minimum withdrawal is $10');
      return;
    }

    // Validate payment details
    if ((selectedMethod === 'mpesa' || selectedMethod === 'airtel_money') && !userPaymentDetails.phone_number) {
      setError('Please enter your phone number');
      return;
    }
    if ((selectedMethod === 'usdt' || selectedMethod === 'btc') && !userPaymentDetails.wallet_address) {
      setError('Please enter your wallet address');
      return;
    }

    const withdrawalAmount = parseFloat(amount);
    if (wallet && withdrawalAmount > wallet.balance) {
      setError('Insufficient balance');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`${API_URL}/api/wallet/withdrawal/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: withdrawalAmount,
          payment_method: selectedMethod,
          payment_details: userPaymentDetails,
          wallet_type: 'user',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit withdrawal request');
      }

      setSuccess(`Withdrawal request submitted! Net payout: $${data.withdrawal?.net_amount?.toFixed(2)}. Processing time: 24-48 hours.`);
      setActionDialogOpen(false);
      fetchWalletData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
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

      setSuccess('Withdrawal cancelled and funds returned to your wallet');
      fetchWalletData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Wallet
          </Typography>
          <Typography color="text.secondary">
            Manage your balance, make deposits, and view transactions
          </Typography>
        </Box>
        <Tooltip title="Refresh balance">
          <IconButton 
            onClick={fetchWalletData} 
            disabled={loading}
            sx={{
              animation: loading ? 'spin 1s linear infinite' : 'none',
              '@keyframes spin': {
                '0%': { transform: 'rotate(0deg)' },
                '100%': { transform: 'rotate(360deg)' },
              },
            }}
          >
            <RefreshIcon />
          </IconButton>
        </Tooltip>
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

      {wallet?.is_frozen && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          Your wallet is frozen. {wallet.frozen_reason || 'Please contact support for assistance.'}
        </Alert>
      )}

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
        <Button
          variant="contained"
          color="success"
          startIcon={<DepositIcon />}
          onClick={() => setDepositModalOpen(true)}
          disabled={wallet?.is_frozen}
          size="large"
          sx={{
            py: 1.5,
            px: 4,
            borderRadius: 2,
            fontWeight: 'bold',
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            boxShadow: '0 4px 14px rgba(34, 197, 94, 0.3)',
            '&:hover': {
              background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
              boxShadow: '0 6px 20px rgba(34, 197, 94, 0.4)',
            },
          }}
        >
          Deposit Funds
        </Button>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<WithdrawIcon />}
          onClick={() => openActionDialog('withdraw')}
          disabled={wallet?.is_frozen || (wallet?.balance || 0) < 10}
          size="large"
        >
          Withdraw Funds
        </Button>
      </Box>

      {/* Balance Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={3}>
          <Card 
            sx={{ 
              background: 'linear-gradient(135deg, #1D9BF0 0%, #0A8DDC 100%)',
              color: 'white',
            }}
          >
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <WalletIcon />
                <Typography variant="subtitle2">Available Balance</Typography>
              </Box>
              <Typography variant="h3" fontWeight="bold">
                ${wallet?.balance.toFixed(2) || '0.00'}
              </Typography>
              {wallet && wallet.pending_deposits > 0 && (
                <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                  +${wallet.pending_deposits.toFixed(2)} pending deposit
                </Typography>
              )}
              {wallet && (wallet.pending_withdrawals || 0) > 0 && (
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  -${(wallet.pending_withdrawals || 0).toFixed(2)} pending withdrawal
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <DepositIcon color="success" />
                <Typography variant="subtitle2" color="text.secondary">
                  Total Deposited
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="success.main">
                ${wallet?.total_deposited.toFixed(2) || '0.00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <ShoppingCartIcon color="primary" />
                <Typography variant="subtitle2" color="text.secondary">
                  Total Spent
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold">
                ${wallet?.total_spent.toFixed(2) || '0.00'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={2}>
                <WithdrawIcon color="warning" />
                <Typography variant="subtitle2" color="text.secondary">
                  Total Withdrawn
                </Typography>
              </Box>
              <Typography variant="h4" fontWeight="bold" color="warning.main">
                ${(wallet?.total_withdrawn || 0).toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Payment Methods Info */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AddIcon /> Accepted Payment Methods
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          We accept the following payment methods for deposits and withdrawals
        </Typography>

        <Grid container spacing={2}>
          {PAYMENT_METHODS.map((method) => (
            <Grid item xs={12} sm={4} key={method.id}>
              <Card 
                sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  borderLeft: `4px solid ${method.color}`,
                }}
              >
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ 
                    width: 40, 
                    height: 40, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center' 
                  }}>
                    <img 
                      src={method.icon} 
                      alt={method.label} 
                      style={{ width: 36, height: 36, borderRadius: '50%' }} 
                    />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="medium">
                      {method.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {method.id === 'mpesa' || method.id === 'airtel_money' ? 'Mobile Money' : 'Cryptocurrency'}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* Pending Deposits */}
      {depositHistory.filter(d => d.status === 'pending').length > 0 && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom color="warning.main">
            Pending Deposits
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Reference</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {depositHistory
                  .filter(d => d.status === 'pending')
                  .map((deposit) => (
                    <TableRow key={deposit.id}>
                      <TableCell>
                        {formatDate(deposit.created_at)}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'medium' }}>${deposit.amount.toFixed(2)}</TableCell>
                      <TableCell>{getPaymentMethodLabel(deposit.payment_method)}</TableCell>
                      <TableCell>{deposit.payment_reference || '-'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={deposit.status} 
                          size="small" 
                          color={getStatusColor(deposit.status) as any}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Pending Withdrawals */}
      {withdrawalHistory.filter(w => w.status === 'pending' || w.status === 'processing').length > 0 && (
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" gutterBottom color="warning.main">
            Pending Withdrawals
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Fee</TableCell>
                  <TableCell>Net</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {withdrawalHistory
                  .filter(w => w.status === 'pending' || w.status === 'processing')
                  .map((withdrawal) => (
                    <TableRow key={withdrawal.id}>
                      <TableCell>
                        {formatDate(withdrawal.created_at)}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 'medium' }}>${parseFloat(String(withdrawal.amount)).toFixed(2)}</TableCell>
                      <TableCell sx={{ color: 'text.secondary' }}>${parseFloat(String(withdrawal.withdrawal_fee)).toFixed(2)}</TableCell>
                      <TableCell sx={{ fontWeight: 'medium', color: 'success.main' }}>
                        ${parseFloat(String(withdrawal.net_amount)).toFixed(2)}
                      </TableCell>
                      <TableCell>{getPaymentMethodLabel(withdrawal.payment_method)}</TableCell>
                      <TableCell>
                        <Chip 
                          label={withdrawal.status} 
                          size="small" 
                          color={withdrawal.status === 'pending' ? 'warning' : 'info'}
                        />
                      </TableCell>
                      <TableCell>
                        {withdrawal.status === 'pending' && (
                          <Tooltip title="Cancel Withdrawal">
                            <IconButton 
                              size="small" 
                              color="error"
                              onClick={() => handleCancelWithdrawal(withdrawal.id)}
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

      {/* Recent Transactions */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon /> Recent Transactions
        </Typography>

        {transactions.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography color="text.secondary">No transactions yet</Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell align="right">Balance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell>
                      {formatDate(tx.created_at)}
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={tx.type} 
                        size="small"
                        color={tx.type === 'deposit' ? 'success' : tx.type === 'purchase' ? 'primary' : 'default'}
                      />
                    </TableCell>
                    <TableCell>{tx.description}</TableCell>
                    <TableCell 
                      align="right"
                      sx={{ 
                        fontWeight: 'medium',
                        color: tx.amount >= 0 ? 'success.main' : 'error.main',
                      }}
                    >
                      {tx.amount >= 0 ? '+' : ''}${Math.abs(tx.amount).toFixed(2)}
                    </TableCell>
                    <TableCell align="right">${tx.balance_after.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Unified Deposit/Withdraw Dialog */}
      <Dialog 
        open={actionDialogOpen} 
        onClose={() => setActionDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            {actionType === 'deposit' ? <DepositIcon color="success" /> : <WithdrawIcon color="warning" />}
            <Typography variant="h6">
              {actionType === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds'}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {/* Payment Method Selection */}
            <Typography variant="subtitle2" gutterBottom fontWeight="bold">
              Select Payment Method
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {PAYMENT_METHODS.map((method) => (
                <Grid item xs={4} key={method.id}>
                  <Paper
                    sx={{
                      p: 2,
                      cursor: 'pointer',
                      border: selectedMethod === method.id ? '2px solid' : '1px solid',
                      borderColor: selectedMethod === method.id ? method.color : 'divider',
                      bgcolor: selectedMethod === method.id ? `${method.color}10` : 'background.paper',
                      transition: 'all 0.2s',
                      '&:hover': { borderColor: method.color },
                    }}
                    onClick={() => {
                      setSelectedMethod(method.id);
                      setUserPaymentDetails({});
                    }}
                  >
                    <Box textAlign="center">
                      <Box sx={{ color: method.color, mb: 1 }}>
                        {method.icon === 'phone' ? <PhoneIcon /> : <CryptoIcon />}
                      </Box>
                      <Typography variant="body2" fontWeight={selectedMethod === method.id ? 'bold' : 'normal'}>
                        {method.label}
                      </Typography>
                    </Box>
                  </Paper>
                </Grid>
              ))}
            </Grid>

            <Divider sx={{ my: 2 }} />

            {/* Amount Input */}
            <TextField
              label="Amount (USD)"
              type="number"
              fullWidth
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputProps={{ min: actionType === 'deposit' ? 19 : 10, step: 1 }}
              sx={{ mb: 3 }}
              required
              helperText={
                actionType === 'deposit'
                  ? 'Minimum deposit: $19'
                  : `Minimum: $10 | Available: $${wallet?.balance.toFixed(2) || '0.00'} | Fee: 3%`
              }
            />

            {/* DEPOSIT: Show platform payment details */}
            {actionType === 'deposit' && (
              <>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2" fontWeight="bold">
                    Step 1: Send money to the details below
                  </Typography>
                  <Typography variant="body2">
                    Step 2: Enter the transaction reference/confirmation code
                  </Typography>
                </Alert>

                <Paper sx={{ p: 2, mb: 3, bgcolor: 'rgba(0, 50, 50, 0.8)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                  <Typography variant="subtitle2" color="rgba(255,255,255,0.7)" gutterBottom>
                    Send {getPaymentMethodLabel(selectedMethod)} to:
                  </Typography>
                  
                  {(selectedMethod === 'mpesa' || selectedMethod === 'airtel_money') && (
                    <>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Box>
                          <Typography variant="body2" color="rgba(255,255,255,0.6)">Phone Number</Typography>
                          <Typography variant="h6" fontWeight="bold" sx={{ color: '#fff' }}>
                            {PLATFORM_PAYMENT_DETAILS[selectedMethod as 'mpesa' | 'airtel_money'].number}
                          </Typography>
                        </Box>
                        <IconButton 
                          onClick={() => handleCopy(PLATFORM_PAYMENT_DETAILS[selectedMethod as 'mpesa' | 'airtel_money'].number, 'phone')}
                          size="small"
                        >
                          {copiedField === 'phone' ? <CheckIcon color="success" /> : <CopyIcon />}
                        </IconButton>
                      </Box>
                    </>
                  )}

                  {selectedMethod === 'usdt' && (
                    <>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Box sx={{ maxWidth: '80%' }}>
                          <Typography variant="body2" color="rgba(255,255,255,0.6)">USDT Address (TRC20)</Typography>
                          <Typography variant="body1" fontWeight="bold" sx={{ wordBreak: 'break-all', color: '#fff' }}>
                            {PLATFORM_PAYMENT_DETAILS.usdt.address}
                          </Typography>
                        </Box>
                        <IconButton 
                          onClick={() => handleCopy(PLATFORM_PAYMENT_DETAILS.usdt.address, 'address')}
                          size="small"
                        >
                          {copiedField === 'address' ? <CheckIcon color="success" /> : <CopyIcon />}
                        </IconButton>
                      </Box>
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        <Typography variant="body2">
                          Only send USDT on TRC20 network. Sending other tokens or using wrong network will result in loss of funds.
                        </Typography>
                      </Alert>
                    </>
                  )}

                  {selectedMethod === 'btc' && (
                    <>
                      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                        <Box sx={{ maxWidth: '80%' }}>
                          <Typography variant="body2" color="rgba(255,255,255,0.6)">Bitcoin Address</Typography>
                          <Typography variant="body1" fontWeight="bold" sx={{ wordBreak: 'break-all', color: '#fff' }}>
                            {PLATFORM_PAYMENT_DETAILS.btc.address}
                          </Typography>
                        </Box>
                        <IconButton 
                          onClick={() => handleCopy(PLATFORM_PAYMENT_DETAILS.btc.address, 'address')}
                          size="small"
                        >
                          {copiedField === 'address' ? <CheckIcon color="success" /> : <CopyIcon />}
                        </IconButton>
                      </Box>
                      <Alert severity="warning" sx={{ mt: 1 }}>
                        <Typography variant="body2">
                          Only send Bitcoin (BTC). Sending other tokens will result in loss of funds.
                        </Typography>
                      </Alert>
                    </>
                  )}
                </Paper>

                <TextField
                  label="Transaction Reference / Confirmation Code"
                  fullWidth
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder={
                    selectedMethod === 'mpesa' ? 'e.g., QJK7T8X2YN' :
                    selectedMethod === 'airtel_money' ? 'e.g., AMZ1234567' :
                    'e.g., Transaction Hash'
                  }
                  required
                  helperText="Enter the confirmation code you received after sending the payment"
                />
              </>
            )}

            {/* WITHDRAW: Collect user's payment details */}
            {actionType === 'withdraw' && (
              <>
                <Alert severity="info" sx={{ mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Withdrawal Fee:</strong> 3%<br />
                    <strong>Processing Time:</strong> 24-48 hours
                  </Typography>
                </Alert>

                {(selectedMethod === 'mpesa' || selectedMethod === 'airtel_money') && (
                  <TextField
                    label={`Your ${getPaymentMethodLabel(selectedMethod)} Phone Number`}
                    fullWidth
                    value={userPaymentDetails.phone_number || ''}
                    onChange={(e) => setUserPaymentDetails({ ...userPaymentDetails, phone_number: e.target.value })}
                    placeholder="+254..."
                    sx={{ mb: 2 }}
                    required
                  />
                )}

                {selectedMethod === 'usdt' && (
                  <>
                    <TextField
                      label="Your USDT Wallet Address (TRC20)"
                      fullWidth
                      value={userPaymentDetails.wallet_address || ''}
                      onChange={(e) => setUserPaymentDetails({ ...userPaymentDetails, wallet_address: e.target.value })}
                      sx={{ mb: 2 }}
                      required
                    />
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        Make sure your wallet supports USDT on TRC20 network.
                      </Typography>
                    </Alert>
                  </>
                )}

                {selectedMethod === 'btc' && (
                  <>
                    <TextField
                      label="Your Bitcoin Wallet Address"
                      fullWidth
                      value={userPaymentDetails.wallet_address || ''}
                      onChange={(e) => setUserPaymentDetails({ ...userPaymentDetails, wallet_address: e.target.value })}
                      sx={{ mb: 2 }}
                      required
                    />
                    <Alert severity="warning" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        Make sure you provide a valid Bitcoin address.
                      </Typography>
                    </Alert>
                  </>
                )}

                {amount && parseFloat(amount) >= 10 && (
                  <Paper sx={{ p: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.main' }}>
                    <Typography variant="body2" color="text.secondary">You will receive:</Typography>
                    <Typography variant="h5" fontWeight="bold" color="success.main">
                      ${Math.max(parseFloat(amount) - (parseFloat(amount) * 0.02 + 1), 0).toFixed(2)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      After 3% withdrawal fee
                    </Typography>
                  </Paper>
                )}
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setActionDialogOpen(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color={actionType === 'deposit' ? 'success' : 'warning'}
            onClick={actionType === 'deposit' ? handleSubmitDeposit : handleSubmitWithdraw}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : (actionType === 'deposit' ? <DepositIcon /> : <WithdrawIcon />)}
          >
            {submitting ? 'Processing...' : (actionType === 'deposit' ? 'Submit Deposit Request' : 'Submit Withdrawal Request')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* New Deposit Modal */}
      <DepositModal
        open={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        onSuccess={() => {
          setSuccess('Deposit request submitted! Admin will verify and approve your payment within 24 hours.');
          fetchWalletData();
        }}
        token={token}
        apiUrl={API_URL}
      />
    </Container>
  );
}
