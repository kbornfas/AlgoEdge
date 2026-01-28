'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Chip,
  Card,
  CardContent,
  IconButton,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  Phone as PhoneIcon,
  CurrencyBitcoin as CryptoIcon,
  Check as CheckIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

interface PaymentAccount {
  id: number;
  payment_method: string;
  account_name: string;
  account_number?: string;
  crypto_address?: string;
  crypto_network?: string;
  instructions?: string;
  min_amount: number;
  max_amount: number;
}

const getPaymentMethodIcon = (method: string) => {
  const iconStyle = { width: 28, height: 28, borderRadius: '50%' };
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
      return <PhoneIcon />;
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
    default:
      return method;
  }
};

export default function AdminPaymentAccountsPage() {
  const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const fetchAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/wallet/payment-methods`);
      if (res.ok) {
        const data = await res.json();
        setAccounts(data.payment_methods || []);
      } else {
        throw new Error('Failed to fetch payment accounts');
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} sx={{ pl: { xs: 6, md: 0 } }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Payment Accounts
          </Typography>
          <Typography color="text.secondary">
            Payment methods configured for user deposits
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

      {/* Info Card */}
      <Card sx={{ mb: 4, bgcolor: 'info.main', color: 'white' }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={1}>
            <InfoIcon />
            <Typography variant="h6">
              Environment Variables Configuration
            </Typography>
          </Box>
          <Typography variant="body2">
            Payment accounts are configured via environment variables on your hosting platform (Vercel/Railway). 
            To update payment details, modify the following variables in your dashboard:
          </Typography>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1, fontFamily: 'monospace', fontSize: '0.85rem' }}>
            <Typography component="div" sx={{ fontFamily: 'inherit' }}>MPESA_NUMBER, MPESA_NAME</Typography>
            <Typography component="div" sx={{ fontFamily: 'inherit' }}>AIRTEL_NUMBER, AIRTEL_NAME</Typography>
            <Typography component="div" sx={{ fontFamily: 'inherit' }}>USDT_ADDRESS</Typography>
            <Typography component="div" sx={{ fontFamily: 'inherit' }}>BTC_ADDRESS</Typography>
          </Box>
        </CardContent>
      </Card>

      {/* No accounts warning */}
      {accounts.length === 0 && !loading && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          No payment accounts configured. Please add the required environment variables on your hosting platform.
        </Alert>
      )}

      {/* Payment Accounts Grid */}
      <Grid container spacing={3}>
        {accounts.map((account) => (
          <Grid item xs={12} md={6} key={account.id}>
            <Paper 
              sx={{ 
                p: 3, 
                border: '1px solid',
                borderColor: 'success.main',
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
                      label="Active"
                      size="small"
                      color="success"
                      icon={<CheckIcon />}
                    />
                  </Box>
                </Box>
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

              <Box sx={{ mt: 2, display: 'flex', gap: 1 }}>
                <Chip 
                  label={`Min: $${account.min_amount}`} 
                  size="small" 
                  variant="outlined" 
                />
                <Chip 
                  label={`Max: $${account.max_amount}`} 
                  size="small" 
                  variant="outlined" 
                />
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
