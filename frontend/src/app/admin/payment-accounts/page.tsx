'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Switch,
  FormControlLabel,
  Alert,
  CircularProgress,
  Chip,
  Card,
  CardContent,
} from '@mui/material';
import {
  Edit as EditIcon,
  Refresh as RefreshIcon,
  Phone as PhoneIcon,
  Payments as PaymentsIcon,
  CurrencyBitcoin as CryptoIcon,
  AccountBalance as BankIcon,
  Check as CheckIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useAuth } from '@/context/AuthContext';

interface PaymentAccount {
  id: number;
  payment_method: string;
  account_name: string;
  account_number?: string;
  crypto_address?: string;
  crypto_network?: string;
  qr_code_url?: string;
  instructions?: string;
  min_amount: number;
  max_amount: number;
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

const getPaymentMethodIcon = (method: string) => {
  switch (method) {
    case 'mpesa':
      return <PhoneIcon />;
    case 'paypal':
      return <PaymentsIcon />;
    case 'crypto_usdt':
    case 'crypto_btc':
      return <CryptoIcon />;
    case 'bank_transfer':
      return <BankIcon />;
    default:
      return <PaymentsIcon />;
  }
};

const getPaymentMethodLabel = (method: string) => {
  switch (method) {
    case 'mpesa':
      return 'M-Pesa';
    case 'paypal':
      return 'PayPal';
    case 'crypto_usdt':
      return 'USDT (TRC20)';
    case 'crypto_btc':
      return 'Bitcoin';
    case 'bank_transfer':
      return 'Bank Transfer';
    default:
      return method;
  }
};

export default function AdminPaymentAccountsPage() {
  const { token } = useAuth();
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<PaymentAccount | null>(null);
  const [editForm, setEditForm] = useState({
    account_name: '',
    account_number: '',
    crypto_address: '',
    crypto_network: '',
    instructions: '',
    is_active: true,
  });
  const [saving, setSaving] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/api/wallet/payment-methods`);
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.payment_methods || []);
      }
    } catch (err: any) {
      console.error('Error fetching accounts:', err);
      setError('Failed to load payment accounts');
    } finally {
      setLoading(false);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const handleOpenEdit = (account: PaymentAccount) => {
    setSelectedAccount(account);
    setEditForm({
      account_name: account.account_name || '',
      account_number: account.account_number || '',
      crypto_address: account.crypto_address || '',
      crypto_network: account.crypto_network || '',
      instructions: account.instructions || '',
      is_active: account.is_active,
    });
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!selectedAccount) return;

    try {
      setSaving(true);
      setError(null);

      const response = await fetch(
        `${API_URL}/api/wallet/admin/payment-accounts/${selectedAccount.id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(editForm),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update account');
      }

      setSuccess('Payment account updated successfully');
      setEditDialogOpen(false);
      fetchAccounts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
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
            Payment Accounts
          </Typography>
          <Typography color="text.secondary">
            Configure payment methods for user deposits
          </Typography>
        </Box>
        <IconButton onClick={fetchAccounts} disabled={loading}>
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

      {/* Info Card */}
      <Card sx={{ mb: 4, bgcolor: 'info.main', color: 'white' }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Important: Update Your Payment Details
          </Typography>
          <Typography variant="body2">
            Replace the placeholder account numbers below with your actual M-Pesa number, 
            PayPal email, and crypto wallet addresses. Users will send deposits to these accounts.
          </Typography>
        </CardContent>
      </Card>

      {/* Payment Accounts Grid */}
      <Grid container spacing={3}>
        {accounts.map((account) => (
          <Grid item xs={12} md={6} key={account.id}>
            <Paper 
              sx={{ 
                p: 3, 
                border: '1px solid',
                borderColor: account.is_active ? 'success.main' : 'grey.300',
                opacity: account.is_active ? 1 : 0.6,
              }}
            >
              <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                <Box display="flex" alignItems="center" gap={2}>
                  {getPaymentMethodIcon(account.payment_method)}
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {getPaymentMethodLabel(account.payment_method)}
                    </Typography>
                    <Chip 
                      label={account.is_active ? 'Active' : 'Disabled'}
                      size="small"
                      color={account.is_active ? 'success' : 'default'}
                      icon={account.is_active ? <CheckIcon /> : <CloseIcon />}
                    />
                  </Box>
                </Box>
                <IconButton onClick={() => handleOpenEdit(account)}>
                  <EditIcon />
                </IconButton>
              </Box>

              <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1, mb: 2 }}>
                {account.account_name && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Account Name:</strong> {account.account_name}
                  </Typography>
                )}
                {account.account_number && (
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    <strong>Account/Phone:</strong> {account.account_number}
                  </Typography>
                )}
                {account.crypto_address && (
                  <Typography 
                    variant="body2" 
                    color="text.secondary" 
                    sx={{ wordBreak: 'break-all' }}
                  >
                    <strong>{account.crypto_network} Address:</strong> {account.crypto_address}
                  </Typography>
                )}
              </Box>

              {account.instructions && (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  "{account.instructions}"
                </Typography>
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => !saving && setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Edit {selectedAccount && getPaymentMethodLabel(selectedAccount.payment_method)}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Account Name"
              fullWidth
              value={editForm.account_name}
              onChange={(e) => setEditForm({ ...editForm, account_name: e.target.value })}
              placeholder="e.g., AlgoEdge Payments"
            />

            {selectedAccount && (selectedAccount.payment_method === 'mpesa' || 
              selectedAccount.payment_method === 'paypal' || 
              selectedAccount.payment_method === 'bank_transfer') && (
              <TextField
                label={selectedAccount.payment_method === 'mpesa' ? 'M-Pesa Phone Number' : 
                       selectedAccount.payment_method === 'paypal' ? 'PayPal Email' : 'Account Number'}
                fullWidth
                value={editForm.account_number}
                onChange={(e) => setEditForm({ ...editForm, account_number: e.target.value })}
                placeholder={selectedAccount.payment_method === 'mpesa' ? '+254...' : 
                            selectedAccount.payment_method === 'paypal' ? 'email@example.com' : 'Account number'}
              />
            )}

            {selectedAccount && (selectedAccount.payment_method === 'crypto_usdt' || 
              selectedAccount.payment_method === 'crypto_btc') && (
              <>
                <TextField
                  label="Crypto Network"
                  fullWidth
                  value={editForm.crypto_network}
                  onChange={(e) => setEditForm({ ...editForm, crypto_network: e.target.value })}
                  placeholder="e.g., TRC20, ERC20, Bitcoin"
                />
                <TextField
                  label="Wallet Address"
                  fullWidth
                  value={editForm.crypto_address}
                  onChange={(e) => setEditForm({ ...editForm, crypto_address: e.target.value })}
                  placeholder="Your crypto wallet address"
                />
              </>
            )}

            <TextField
              label="Instructions for Users"
              fullWidth
              multiline
              rows={3}
              value={editForm.instructions}
              onChange={(e) => setEditForm({ ...editForm, instructions: e.target.value })}
              placeholder="Enter instructions for users making deposits..."
            />

            <FormControlLabel
              control={
                <Switch
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                />
              }
              label="Active (shown to users)"
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setEditDialogOpen(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={20} /> : null}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
