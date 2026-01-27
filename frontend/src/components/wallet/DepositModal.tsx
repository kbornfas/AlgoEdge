'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Dialog,
  DialogContent,
  IconButton,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  Paper,
  Fade,
  Slide,
  InputAdornment,
} from '@mui/material';
import {
  Close as CloseIcon,
  ContentCopy as CopyIcon,
  Check as CheckIcon,
  CreditCard as CardIcon,
  ArrowBack as BackIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from '@mui/icons-material';
import QRCode from 'qrcode';

// Payment method type definitions
interface BasePaymentMethod {
  id: string;
  name: string;
  icon: string;
  color: string;
  minAmount: number;
  maxAmount: number;
}

interface CryptoPaymentMethod extends BasePaymentMethod {
  fee: number;
}

// Payment method configurations
const MOBILE_MONEY_METHODS: BasePaymentMethod[] = [
  { 
    id: 'mpesa', 
    name: 'M-Pesa', 
    icon: '/icons/mpesa.png',
    color: '#4CAF50',
    minAmount: 5,
    maxAmount: 2000,
  },
  { 
    id: 'airtel_money', 
    name: 'Airtel Money', 
    icon: '/icons/airtel.png',
    color: '#FF0000',
    minAmount: 5,
    maxAmount: 2000,
  },
];

const CRYPTO_METHODS: CryptoPaymentMethod[] = [
  { 
    id: 'btc', 
    name: 'Bitcoin', 
    icon: '/icons/btc.svg',
    color: '#F7931A',
    minAmount: 25,
    maxAmount: 10000,
    fee: 2.00,
  },
  { 
    id: 'eth', 
    name: 'Ethereum', 
    icon: '/icons/eth.svg',
    color: '#627EEA',
    minAmount: 20,
    maxAmount: 10000,
    fee: 1.50,
  },
  { 
    id: 'ltc', 
    name: 'Litecoin', 
    icon: '/icons/ltc.svg',
    color: '#BFBBBB',
    minAmount: 10,
    maxAmount: 10000,
    fee: 0.50,
  },
  { 
    id: 'usdt', 
    name: 'Tether TRC20', 
    icon: '/icons/usdt.svg',
    color: '#26A17B',
    minAmount: 10,
    maxAmount: 10000,
    fee: 1.00,
  },
];

const ALL_PAYMENT_METHODS = [...MOBILE_MONEY_METHODS, ...CRYPTO_METHODS];

const PRESET_AMOUNTS = [25, 50, 100, 250, 500, 1000];

// Platform payment details
const PLATFORM_PAYMENT_DETAILS: Record<string, any> = {
  mpesa: { 
    number: process.env.NEXT_PUBLIC_MPESA_NUMBER || '+254704618663',
    name: process.env.NEXT_PUBLIC_MPESA_NAME || 'AlgoEdge',
  },
  airtel_money: { 
    number: process.env.NEXT_PUBLIC_AIRTEL_NUMBER || '+254750020853',
    name: process.env.NEXT_PUBLIC_AIRTEL_NAME || 'AlgoEdge',
  },
  usdt: { 
    address: process.env.NEXT_PUBLIC_USDT_ADDRESS || 'TFxuKytiDWbgMBYHNhA2J2Wx4MEdnQ3ecJ', 
    network: 'TRC20',
  },
  btc: { 
    address: process.env.NEXT_PUBLIC_BTC_ADDRESS || 'bc1q5fs2vfa0s9zm560ha37hcj3szhrmav3kufxr3s', 
    network: 'Bitcoin',
  },
  eth: { 
    address: process.env.NEXT_PUBLIC_ETH_ADDRESS || '0x1b36710CDF58FA3a1a8Ee83B10dB54d5E8794576', 
    network: 'ERC20',
  },
  ltc: { 
    address: process.env.NEXT_PUBLIC_LTC_ADDRESS || 'ltc1qph9zhf4zmu46cyduxquggyyv2hxtt3k0g5jzre', 
    network: 'Litecoin',
  },
};

// Helper to get payment method icon symbol
const getPaymentIcon = (methodId: string): string => {
  switch (methodId) {
    case 'btc': return '₿';
    case 'eth': return 'Ξ';
    case 'ltc': return 'Ł';
    case 'usdt': return '₮';
    case 'mpesa': return 'M';
    case 'airtel_money': return 'A';
    default: return '$';
  }
};

interface DepositModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  token: string | null;
  apiUrl: string;
}

type Step = 'method' | 'amount' | 'summary';

export default function DepositModal({ open, onClose, onSuccess, token, apiUrl }: DepositModalProps) {
  const [step, setStep] = useState<Step>('method');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [amount, setAmount] = useState(25);
  const [customAmount, setCustomAmount] = useState('25');
  const [paymentReference, setPaymentReference] = useState('');
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(1200); // 20 minutes in seconds

  const selectedMethodConfig = ALL_PAYMENT_METHODS.find(m => m.id === selectedMethod);
  const isCrypto = CRYPTO_METHODS.some(m => m.id === selectedMethod);
  const isMobileMoney = MOBILE_MONEY_METHODS.some(m => m.id === selectedMethod);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      setStep('method');
      setSelectedMethod(null);
      setAmount(25);
      setCustomAmount('25');
      setPaymentReference('');
      setError(null);
      setTimeLeft(1200);
    }
  }, [open]);

  // Generate QR code for crypto payments
  useEffect(() => {
    if (step === 'summary' && isCrypto && selectedMethod) {
      const address = PLATFORM_PAYMENT_DETAILS[selectedMethod]?.address;
      if (address) {
        const qrData = selectedMethod === 'btc' 
          ? `bitcoin:${address}?amount=${(amount / 87108.01).toFixed(8)}` // Example BTC price
          : address;
        QRCode.toDataURL(qrData, { width: 200, margin: 2 })
          .then(url => setQrCodeUrl(url))
          .catch(console.error);
      }
    }
  }, [step, selectedMethod, amount, isCrypto]);

  // Countdown timer for payment
  useEffect(() => {
    if (step === 'summary' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopy = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleMethodSelect = (methodId: string) => {
    setSelectedMethod(methodId);
    const method = ALL_PAYMENT_METHODS.find(m => m.id === methodId);
    if (method) {
      setAmount(method.minAmount);
      setCustomAmount(String(method.minAmount));
    }
    setStep('amount');
  };

  const handleAmountSelect = (preset: number) => {
    setAmount(preset);
    setCustomAmount(String(preset));
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const numValue = parseInt(value) || 0;
    setAmount(numValue);
  };

  const incrementAmount = () => {
    const newAmount = amount + 5;
    if (selectedMethodConfig && newAmount <= selectedMethodConfig.maxAmount) {
      setAmount(newAmount);
      setCustomAmount(String(newAmount));
    }
  };

  const decrementAmount = () => {
    const newAmount = amount - 5;
    if (selectedMethodConfig && newAmount >= selectedMethodConfig.minAmount) {
      setAmount(newAmount);
      setCustomAmount(String(newAmount));
    }
  };

  const handleContinue = () => {
    if (!selectedMethodConfig) return;
    if (amount < selectedMethodConfig.minAmount) {
      setError(`Minimum amount is $${selectedMethodConfig.minAmount}`);
      return;
    }
    if (amount > selectedMethodConfig.maxAmount) {
      setError(`Maximum amount is $${selectedMethodConfig.maxAmount}`);
      return;
    }
    setError(null);
    setStep('summary');
  };

  const handleSubmitDeposit = async () => {
    if (!selectedMethod) return;
    
    if (!paymentReference.trim()) {
      setError('Please enter the transaction reference/confirmation code');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch(`${apiUrl}/api/wallet/deposit/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount,
          payment_method: selectedMethod,
          payment_reference: paymentReference,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit deposit request');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const goBack = () => {
    if (step === 'amount') setStep('method');
    else if (step === 'summary') setStep('amount');
  };

  const getEstimatedFee = (): number => {
    if (isCrypto && selectedMethod) {
      const cryptoMethod = CRYPTO_METHODS.find(m => m.id === selectedMethod);
      if (cryptoMethod) {
        return cryptoMethod.fee;
      }
    }
    return 0;
  };

  const getNetAmount = () => {
    return amount - getEstimatedFee();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: '#0f172a',
          backgroundImage: 'linear-gradient(to bottom, #0f172a, #1e293b)',
          borderRadius: 3,
          overflow: 'hidden',
        },
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 3,
          pb: 2,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {step !== 'method' && (
              <IconButton onClick={goBack} sx={{ color: 'white', mr: 1 }}>
                <BackIcon />
              </IconButton>
            )}
            <Typography variant="h5" fontWeight="bold" color="white">
              {step === 'method' && 'Payment Options'}
              {step === 'amount' && 'Credits Amount'}
              {step === 'summary' && 'Order Summary'}
            </Typography>
          </Box>
          <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Error Alert */}
        {error && (
          <Box sx={{ px: 3 }}>
            <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
              {error}
            </Alert>
          </Box>
        )}

        {/* Step 1: Payment Method Selection */}
        {step === 'method' && (
          <Fade in={step === 'method'}>
            <Box sx={{ p: 3, pt: 1 }}>
              {/* Mobile Money Section */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Divider sx={{ flex: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
                  <Typography variant="body2" sx={{ px: 2, color: 'rgba(255,255,255,0.5)' }}>
                    Mobile Money ($5 - $2,000)
                  </Typography>
                  <Divider sx={{ flex: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
                </Box>
                
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                  {MOBILE_MONEY_METHODS.map((method) => (
                    <Button
                      key={method.id}
                      onClick={() => handleMethodSelect(method.id)}
                      sx={{
                        py: 2,
                        px: 3,
                        bgcolor: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1.5,
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.1)',
                          borderColor: method.color,
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          bgcolor: method.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          color: 'white',
                        }}
                      >
                        {method.id === 'mpesa' ? 'M' : 'A'}
                      </Box>
                      <Typography color="white" fontWeight="medium">
                        {method.name}
                      </Typography>
                    </Button>
                  ))}
                </Box>
              </Box>

              {/* Cryptocurrencies Section */}
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Divider sx={{ flex: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
                  <Typography variant="body2" sx={{ px: 2, color: 'rgba(255,255,255,0.5)' }}>
                    Cryptocurrencies ($10 - $10,000)
                  </Typography>
                  <Divider sx={{ flex: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 2 }}>
                  {CRYPTO_METHODS.map((method) => (
                    <Button
                      key={method.id}
                      onClick={() => handleMethodSelect(method.id)}
                      sx={{
                        py: 2,
                        px: 3,
                        bgcolor: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 1.5,
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: 'rgba(255,255,255,0.1)',
                          borderColor: method.color,
                          transform: 'translateY(-2px)',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          bgcolor: method.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1rem',
                          fontWeight: 'bold',
                          color: 'white',
                        }}
                      >
                        {method.id === 'btc' ? '₿' : '₮'}
                      </Box>
                      <Typography color="white" fontWeight="medium">
                        {method.name}
                      </Typography>
                    </Button>
                  ))}
                </Box>
              </Box>

              {/* Footer */}
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <Button 
                  onClick={onClose}
                  sx={{ 
                    color: 'rgba(255,255,255,0.7)',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' }
                  }}
                >
                  Close
                </Button>
              </Box>
            </Box>
          </Fade>
        )}

        {/* Step 2: Amount Selection */}
        {step === 'amount' && selectedMethodConfig && (
          <Fade in={step === 'amount'}>
            <Box sx={{ p: 3, pt: 1 }}>
              {/* Selected Method Display */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5, 
                mb: 3,
                pb: 2,
                borderBottom: '1px solid rgba(255,255,255,0.1)',
              }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    bgcolor: selectedMethodConfig.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    color: 'white',
                  }}
                >
                  {getPaymentIcon(selectedMethod || '')}
                </Box>
                <Typography color="white" fontWeight="medium">
                  {selectedMethodConfig.name} Payment
                </Typography>
              </Box>

              {/* Preset Amounts */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Divider sx={{ flex: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
                <Typography variant="body2" sx={{ px: 2, color: 'rgba(255,255,255,0.5)' }}>
                  Choose An Amount
                </Typography>
                <Divider sx={{ flex: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5, mb: 3 }}>
                {PRESET_AMOUNTS.filter(a => a >= selectedMethodConfig.minAmount && a <= selectedMethodConfig.maxAmount).map((preset) => (
                  <Button
                    key={preset}
                    onClick={() => handleAmountSelect(preset)}
                    variant={amount === preset ? 'contained' : 'outlined'}
                    sx={{
                      py: 1.5,
                      bgcolor: amount === preset ? '#1D9BF0' : 'transparent',
                      borderColor: amount === preset ? '#1D9BF0' : 'rgba(255,255,255,0.2)',
                      color: 'white',
                      fontWeight: 'bold',
                      fontSize: '1rem',
                      '&:hover': {
                        bgcolor: amount === preset ? '#1a8cd8' : 'rgba(255,255,255,0.05)',
                        borderColor: '#1D9BF0',
                      },
                    }}
                  >
                    ${preset}
                  </Button>
                ))}
              </Box>

              {/* Custom Amount */}
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Divider sx={{ flex: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
                <Typography variant="body2" sx={{ px: 2, color: 'rgba(255,255,255,0.5)' }}>
                  Custom Amount
                </Typography>
                <Divider sx={{ flex: 1, borderColor: 'rgba(255,255,255,0.1)' }} />
              </Box>

              <Typography variant="body2" color="rgba(255,255,255,0.5)" textAlign="center" sx={{ mb: 2 }}>
                Enter a whole number amount from ${selectedMethodConfig.minAmount} to ${selectedMethodConfig.maxAmount.toLocaleString()}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 3 }}>
                <IconButton 
                  onClick={decrementAmount}
                  disabled={amount <= selectedMethodConfig.minAmount}
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.1)', 
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                    '&:disabled': { color: 'rgba(255,255,255,0.3)' },
                  }}
                >
                  <RemoveIcon />
                </IconButton>
                
                <TextField
                  value={customAmount}
                  onChange={(e) => handleCustomAmountChange(e.target.value)}
                  type="number"
                  inputProps={{ 
                    min: selectedMethodConfig.minAmount, 
                    max: selectedMethodConfig.maxAmount,
                    style: { textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold' }
                  }}
                  sx={{
                    width: 120,
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255,255,255,0.1)',
                      borderRadius: 2,
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                      '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                      '&.Mui-focused fieldset': { borderColor: '#1D9BF0' },
                    },
                    '& input': { color: 'white' },
                  }}
                />
                
                <IconButton 
                  onClick={incrementAmount}
                  disabled={amount >= selectedMethodConfig.maxAmount}
                  sx={{ 
                    bgcolor: 'rgba(255,255,255,0.1)', 
                    color: 'white',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                    '&:disabled': { color: 'rgba(255,255,255,0.3)' },
                  }}
                >
                  <AddIcon />
                </IconButton>
              </Box>

              {/* Continue Button */}
              <Button
                fullWidth
                variant="contained"
                onClick={handleContinue}
                sx={{
                  py: 1.5,
                  bgcolor: '#1D9BF0',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  borderRadius: 2,
                  '&:hover': { bgcolor: '#1a8cd8' },
                }}
              >
                Continue
              </Button>

              {/* Footer Buttons */}
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                <Button 
                  onClick={goBack}
                  sx={{ 
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    px: 3,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' }
                  }}
                >
                  Back
                </Button>
                <Button 
                  onClick={onClose}
                  sx={{ 
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    px: 3,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' }
                  }}
                >
                  Close
                </Button>
              </Box>
            </Box>
          </Fade>
        )}

        {/* Step 3: Order Summary */}
        {step === 'summary' && selectedMethodConfig && selectedMethod && (
          <Fade in={step === 'summary'}>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' } }}>
              {/* Left Side - Order Details */}
              <Box sx={{ flex: 1, p: 3, borderRight: { md: '1px solid rgba(255,255,255,0.1)' } }}>
                {/* Method Header */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      bgcolor: selectedMethodConfig.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1rem',
                      fontWeight: 'bold',
                      color: 'white',
                    }}
                  >
                    {getPaymentIcon(selectedMethod || '')}
                  </Box>
                  <Box>
                    <Typography color="white" fontWeight="bold">
                      {selectedMethodConfig.name} Payment
                    </Typography>
                    {isCrypto && (
                      <Typography variant="caption" color="rgba(255,255,255,0.5)">
                        {selectedMethodConfig.name} Network
                      </Typography>
                    )}
                  </Box>
                </Box>

                {/* Order ID */}
                <Typography variant="h6" color="white" fontWeight="bold" sx={{ mb: 3 }}>
                  Order {Date.now().toString().slice(-12)}
                </Typography>

                {/* Amount Breakdown */}
                <Box sx={{ mb: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography color="rgba(255,255,255,0.7)">Description</Typography>
                    <Typography color="rgba(255,255,255,0.7)">Amount</Typography>
                  </Box>
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 2 }} />
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography color="white">Credit Sale Amount *</Typography>
                    <Typography color="white" fontWeight="medium">+ {amount.toFixed(2)}</Typography>
                  </Box>
                  <Typography variant="caption" color="rgba(255,255,255,0.5)" sx={{ display: 'block', mb: 2 }}>
                    * Sending any amount other than what&apos;s shown could result in lost funds, which cannot be recovered.
                  </Typography>

                  {isCrypto && getEstimatedFee() > 0 && (
                    <>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography color="white">Estimated Transaction Fee *</Typography>
                        <Typography color="white" fontWeight="medium">- {getEstimatedFee().toFixed(2)}</Typography>
                      </Box>
                      <Typography variant="caption" color="rgba(255,255,255,0.5)" sx={{ display: 'block', mb: 2 }}>
                        * The transaction fee displayed includes the payment processor fee. This is separate from the network&apos;s sending fee.
                      </Typography>
                    </>
                  )}
                </Box>

                {/* Fee Warning */}
                {isCrypto && (
                  <Paper sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(255, 152, 0, 0.1)', 
                    border: '1px solid rgba(255, 152, 0, 0.3)',
                    borderRadius: 2,
                    mb: 3,
                  }}>
                    <Typography variant="body2" color="#ffb74d">
                      The transaction fee of <strong>${getEstimatedFee().toFixed(2)}</strong> is just an estimate. 
                      The actual fee that will be charged is calculated upon confirmation of your payment by our processor.
                    </Typography>
                  </Paper>
                )}

                {/* Payment Details - Mobile Money */}
                {isMobileMoney && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" color="rgba(255,255,255,0.7)" gutterBottom>
                      Send {selectedMethodConfig.name} to:
                    </Typography>
                    <Paper sx={{ 
                      p: 2, 
                      bgcolor: 'rgba(255,255,255,0.05)', 
                      borderRadius: 2,
                    }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Box>
                          <Typography variant="caption" color="rgba(255,255,255,0.5)">Phone Number</Typography>
                          <Typography color="white" fontWeight="bold" fontSize="1.1rem">
                            {PLATFORM_PAYMENT_DETAILS[selectedMethod]?.number}
                          </Typography>
                        </Box>
                        <IconButton 
                          onClick={() => handleCopy(PLATFORM_PAYMENT_DETAILS[selectedMethod]?.number, 'phone')}
                          size="small"
                          sx={{ color: copied === 'phone' ? '#4CAF50' : 'rgba(255,255,255,0.7)' }}
                        >
                          {copied === 'phone' ? <CheckIcon /> : <CopyIcon />}
                        </IconButton>
                      </Box>
                      <Box>
                        <Typography variant="caption" color="rgba(255,255,255,0.5)">Account Name</Typography>
                        <Typography color="white" fontWeight="medium">
                          {PLATFORM_PAYMENT_DETAILS[selectedMethod]?.name}
                        </Typography>
                      </Box>
                    </Paper>
                  </Box>
                )}

                {/* Transaction Reference Input */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="rgba(255,255,255,0.7)" gutterBottom>
                    Transaction Reference / Confirmation Code *
                  </Typography>
                  <TextField
                    fullWidth
                    value={paymentReference}
                    onChange={(e) => setPaymentReference(e.target.value)}
                    placeholder={
                      selectedMethod === 'mpesa' ? 'e.g., QJK7T8X2YN' :
                      selectedMethod === 'airtel_money' ? 'e.g., AMZ1234567' :
                      'e.g., Transaction Hash'
                    }
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(255,255,255,0.05)',
                        borderRadius: 2,
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                        '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                        '&.Mui-focused fieldset': { borderColor: '#1D9BF0' },
                      },
                      '& input': { color: 'white' },
                      '& input::placeholder': { color: 'rgba(255,255,255,0.4)' },
                    }}
                  />
                  <Typography variant="caption" color="rgba(255,255,255,0.5)" sx={{ mt: 0.5, display: 'block' }}>
                    Enter the confirmation code you received after making the payment
                  </Typography>
                </Box>
              </Box>

              {/* Right Side - QR & Status (for Crypto) */}
              {isCrypto && (
                <Box sx={{ 
                  flex: 1, 
                  p: 3, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                }}>
                  {/* Waiting Status */}
                  <Paper sx={{ 
                    p: 2, 
                    bgcolor: 'rgba(29, 155, 240, 0.1)', 
                    border: '1px solid rgba(29, 155, 240, 0.3)',
                    borderRadius: 2,
                    mb: 3,
                    width: '100%',
                    textAlign: 'center',
                  }}>
                    <Typography color="#1D9BF0">
                      We&apos;re waiting for your payment to be sent and confirmed.
                    </Typography>
                  </Paper>

                  {/* Payment Info */}
                  <Box sx={{ width: '100%', mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography color="rgba(255,255,255,0.7)">Time left to pay</Typography>
                      <Typography color="white" fontWeight="bold">{formatTime(timeLeft)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography color="rgba(255,255,255,0.7)">Selected Cryptocurrency</Typography>
                      <Typography color="white" fontWeight="medium">{selectedMethodConfig.name}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography color="rgba(255,255,255,0.7)">Expected Amount</Typography>
                      <Typography color="white" fontWeight="medium">
                        {selectedMethod === 'btc' 
                          ? (amount / 87108.01).toFixed(6) 
                          : amount.toFixed(2)} {selectedMethod === 'btc' ? 'BTC' : 'USDT'}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Wallet Address */}
                  <Box sx={{ width: '100%', mb: 3 }}>
                    <Typography variant="caption" color="rgba(255,255,255,0.5)" gutterBottom sx={{ display: 'block' }}>
                      {selectedMethodConfig.name} Address ({PLATFORM_PAYMENT_DETAILS[selectedMethod]?.network})
                    </Typography>
                    <Paper sx={{ 
                      p: 1.5, 
                      bgcolor: 'rgba(255,255,255,0.05)', 
                      borderRadius: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}>
                      <Typography 
                        color="white" 
                        fontSize="0.75rem"
                        sx={{ flex: 1, wordBreak: 'break-all' }}
                      >
                        {PLATFORM_PAYMENT_DETAILS[selectedMethod]?.address}
                      </Typography>
                      <IconButton 
                        onClick={() => handleCopy(PLATFORM_PAYMENT_DETAILS[selectedMethod]?.address, 'address')}
                        size="small"
                        sx={{ color: copied === 'address' ? '#4CAF50' : 'rgba(255,255,255,0.7)' }}
                      >
                        {copied === 'address' ? <CheckIcon /> : <CopyIcon />}
                      </IconButton>
                    </Paper>
                  </Box>

                  {/* QR Code */}
                  {qrCodeUrl && (
                    <Paper sx={{ 
                      p: 2, 
                      bgcolor: 'white', 
                      borderRadius: 2,
                      mb: 3,
                    }}>
                      <img src={qrCodeUrl} alt="Payment QR Code" style={{ display: 'block' }} />
                    </Paper>
                  )}
                </Box>
              )}
            </Box>
          </Fade>
        )}

        {/* Submit Button (for Summary step) */}
        {step === 'summary' && (
          <Box sx={{ p: 3, pt: 0 }}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSubmitDeposit}
              disabled={submitting || !paymentReference.trim()}
              sx={{
                py: 1.5,
                bgcolor: '#4CAF50',
                fontSize: '1rem',
                fontWeight: 'bold',
                borderRadius: 2,
                '&:hover': { bgcolor: '#43a047' },
                '&:disabled': { bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              {submitting ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                `Confirm Payment - $${amount.toFixed(2)}`
              )}
            </Button>

            {/* Footer Buttons */}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button 
                onClick={goBack}
                disabled={submitting}
                sx={{ 
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  px: 3,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' }
                }}
              >
                Back
              </Button>
              <Button 
                onClick={onClose}
                disabled={submitting}
                sx={{ 
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                  px: 3,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.15)' }
                }}
              >
                Close
              </Button>
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
