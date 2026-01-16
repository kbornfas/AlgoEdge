'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Paper,
} from '@mui/material';
import { Mail, CheckCircle, MessageSquare } from 'lucide-react';
import AuthBackground from '@/components/AuthBackground';
import { useRouter } from 'next/navigation';

// OTP Configuration - matches backend constants
const OTP_LENGTH = 6;

export default function VerifyOTPPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [step, setStep] = useState<'email-confirm' | 'otp-input'>('email-confirm');
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    // Get user info from localStorage
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      setEmail(user.email || '');
    } else {
      // No user found, redirect to register
      router.push('/auth/register');
    }
  }, [router]);

  const handleSendOTP = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setSendingOTP(true);
    setError('');

    try {
      const response = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send verification code');
        return;
      }

      setSuccess('Verification code sent to your email!');
      setOtpSent(true);
      setStep('otp-input');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSendingOTP(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (code.length !== OTP_LENGTH) {
      setError(`Please enter a ${OTP_LENGTH}-digit verification code`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid verification code');
        return;
      }

      // Update user in localStorage
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        user.isVerified = true;
        localStorage.setItem('user', JSON.stringify(user));
      }

      setSuccess('Email verified successfully! Redirecting to payment instructions...');
      
      // Redirect to WhatsApp for payment instructions after 2 seconds
      setTimeout(() => {
        router.push('/auth/payment-instructions');
      }, 2000);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = () => {
    setStep('email-confirm');
    setOtpSent(false);
    setCode('');
    setError('');
    setSuccess('');
  };

  return (
    <>
      <AuthBackground />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'transparent',
          py: 4,
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Container maxWidth="sm">
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Mail size={48} style={{ color: '#10B981', marginBottom: 16 }} />
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
                Verify Your Email
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {step === 'email-confirm' 
                  ? 'We will send a verification code to your email address'
                  : 'Enter the 6-digit code sent to your email'}
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            {success && (
              <Alert severity="success" sx={{ mb: 3 }}>
                {success}
              </Alert>
            )}

            {step === 'email-confirm' ? (
              <Box>
                <Paper sx={{ p: 3, mb: 3, bgcolor: 'action.hover' }}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Email Address:</strong>
                  </Typography>
                  <Typography variant="body1" sx={{ wordBreak: 'break-all' }}>
                    {email}
                  </Typography>
                </Paper>

                <TextField
                  fullWidth
                  label="Change Email (Optional)"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={sendingOTP}
                  sx={{ mb: 3 }}
                  helperText="You can change your email address if needed"
                />

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleSendOTP}
                  disabled={sendingOTP || !email}
                  startIcon={sendingOTP ? <CircularProgress size={20} /> : <Mail />}
                >
                  {sendingOTP ? 'Sending Code...' : 'Send Verification Code'}
                </Button>
              </Box>
            ) : (
              <Box component="form" onSubmit={handleVerifyOTP}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                  Code sent to: <strong>{email}</strong>
                  <br />
                  <Button size="small" onClick={handleChangeEmail}>
                    Change Email
                  </Button>
                </Typography>

                <TextField
                  fullWidth
                  label="Verification Code"
                  value={code}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, OTP_LENGTH);
                    setCode(value);
                    setError('');
                  }}
                  disabled={loading}
                  required
                  inputProps={{ 
                    maxLength: OTP_LENGTH,
                    style: { 
                      fontSize: '24px', 
                      letterSpacing: '8px', 
                      textAlign: 'center',
                      fontWeight: 'bold'
                    }
                  }}
                  sx={{ mb: 2 }}
                  helperText={`Enter the ${OTP_LENGTH}-digit code from your email`}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading || code.length !== OTP_LENGTH}
                  startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
                  sx={{ mb: 2 }}
                >
                  {loading ? 'Verifying...' : 'Verify Email'}
                </Button>

                <Button
                  fullWidth
                  variant="text"
                  size="small"
                  onClick={handleSendOTP}
                  disabled={sendingOTP}
                >
                  {sendingOTP ? 'Sending...' : "Didn't receive the code? Resend"}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
    </>
  );
}
