'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Button,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  alpha,
} from '@mui/material';
import { Mail, CheckCircle, RefreshCw, Shield, ArrowLeft, Sparkles } from 'lucide-react';
import AuthBackground from '@/components/AuthBackground';
import ThemeToggle from '@/components/ThemeToggle';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// OTP Configuration
const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export default function VerifyOTPPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [sendingOTP, setSendingOTP] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [initialLoading, setInitialLoading] = useState(true);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Initialize - OTP was already sent during registration
  useEffect(() => {
    const pendingUserStr = localStorage.getItem('pendingUser');
    const pendingEmail = localStorage.getItem('pendingEmail');
    
    if (pendingUserStr) {
      const user = JSON.parse(pendingUserStr);
      setEmail(user.email || '');
      // OTP was already sent during registration, mark as sent
      setOtpSent(true);
      setResendCooldown(RESEND_COOLDOWN);
    } else if (pendingEmail) {
      setEmail(pendingEmail);
      // OTP was already sent during registration
      setOtpSent(true);
      setResendCooldown(RESEND_COOLDOWN);
    } else {
      router.push('/auth/register');
      return;
    }
    
    setInitialLoading(false);
    // Focus first input after load
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, [router]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  // Auto-submit when OTP is complete
  useEffect(() => {
    const code = otp.join('');
    if (code.length === OTP_LENGTH && !loading && otpSent) {
      handleVerifyOTP();
    }
  }, [otp]);

  const handleSendOTP = async () => {
    if (!email || sendingOTP) return;

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

      setOtpSent(true);
      setResendCooldown(RESEND_COOLDOWN);
      // Focus first input
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSendingOTP(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    // Only allow digits
    const digit = value.replace(/\D/g, '').slice(-1);
    
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (digit && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    const newOtp = [...otp];
    for (let i = 0; i < pastedData.length; i++) {
      newOtp[i] = pastedData[i];
    }
    setOtp(newOtp);
    // Focus the next empty input or last input
    const nextEmptyIndex = newOtp.findIndex(d => !d);
    inputRefs.current[nextEmptyIndex === -1 ? OTP_LENGTH - 1 : nextEmptyIndex]?.focus();
  };

  const handleVerifyOTP = async () => {
    const code = otp.join('');
    if (code.length !== OTP_LENGTH) {
      setError(`Please enter all ${OTP_LENGTH} digits`);
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
        setOtp(Array(OTP_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
        return;
      }

      // Store auth data if returned
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }

      // Clean up pending data
      localStorage.removeItem('pendingUser');
      localStorage.removeItem('pendingEmail');

      setSuccess('Email verified successfully!');
      
      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Mask email for display
  const maskedEmail = email ? email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : '';

  if (initialLoading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        py: 4,
      }}
    >
      <AuthBackground />
      
      {/* Theme Toggle */}
      <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 1000 }}>
        <ThemeToggle />
      </Box>

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Logo & Branding */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            component="img"
            src="/images/logo.png"
            alt="AlgoEdge Logo"
            sx={{ 
              width: 72, 
              height: 72, 
              objectFit: 'contain', 
              mx: 'auto',
              mb: 2,
              filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))',
            }}
          />
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700, 
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0.5,
            }}
          >
            AlgoEdge
          </Typography>
        </Box>

        {/* Verification Card */}
        <Card 
          elevation={0}
          sx={{ 
            borderRadius: 4,
            border: '1px solid',
            borderColor: 'divider',
            backdropFilter: 'blur(20px)',
            background: (theme) => 
              theme.palette.mode === 'dark' 
                ? 'rgba(30, 30, 30, 0.9)' 
                : 'rgba(255, 255, 255, 0.95)',
            overflow: 'visible',
          }}
        >
          {/* Security Badge */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: -2 }}>
            <Chip
              icon={<Shield size={14} />}
              label="Secure Verification"
              size="small"
              sx={{
                bgcolor: 'success.main',
                color: 'white',
                fontWeight: 600,
                fontSize: '0.7rem',
                '& .MuiChip-icon': { color: 'white' },
              }}
            />
          </Box>

          <CardContent sx={{ p: { xs: 3, sm: 5 } }}>
            {/* Icon */}
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: (theme) => alpha(theme.palette.success.main, 0.1),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                <Mail size={40} color="#10B981" />
              </Box>
              
              <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                Verify Your Email
              </Typography>
              
              <Typography variant="body2" color="text.secondary">
                {sendingOTP ? (
                  'Sending verification code...'
                ) : otpSent ? (
                  <>We sent a 6-digit code to <strong>{maskedEmail}</strong></>
                ) : (
                  'Preparing to send verification code...'
                )}
              </Typography>
            </Box>

            {/* Error Alert */}
            {error && (
              <Alert 
                severity="error" 
                sx={{ 
                  mb: 3, 
                  borderRadius: 2,
                  '& .MuiAlert-icon': { alignItems: 'center' },
                }}
              >
                {error}
              </Alert>
            )}

            {/* Success Alert */}
            {success && (
              <Alert 
                severity="success" 
                icon={<CheckCircle size={20} />}
                sx={{ 
                  mb: 3, 
                  borderRadius: 2,
                  '& .MuiAlert-icon': { alignItems: 'center' },
                }}
              >
                {success}
              </Alert>
            )}

            {/* OTP Input */}
            {!success && (
              <>
                {sendingOTP ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={32} color="primary" />
                  </Box>
                ) : (
                  <>
                    <Box 
                      sx={{ 
                        display: 'flex', 
                        justifyContent: 'center', 
                        gap: { xs: 1, sm: 1.5 },
                        mb: 3,
                      }}
                      onPaste={handlePaste}
                    >
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          ref={(el) => { inputRefs.current[index] = el; }}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          disabled={loading || !otpSent}
                          style={{
                            width: '52px',
                            height: '64px',
                            fontSize: '24px',
                            fontWeight: 700,
                            textAlign: 'center',
                            border: '2px solid',
                            borderColor: digit ? '#10B981' : '#E5E7EB',
                            borderRadius: '12px',
                            outline: 'none',
                            transition: 'all 0.2s',
                            background: 'transparent',
                            color: 'inherit',
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#10B981';
                            e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.2)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = digit ? '#10B981' : '#E5E7EB';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                      ))}
                    </Box>

                    {/* Verify Button */}
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      onClick={handleVerifyOTP}
                      disabled={loading || otp.join('').length !== OTP_LENGTH}
                      sx={{ 
                        mb: 2, 
                        py: 1.5,
                        borderRadius: 2,
                        fontWeight: 600,
                        fontSize: '1rem',
                        textTransform: 'none',
                        background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.4)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
                          boxShadow: '0 6px 20px rgba(16, 185, 129, 0.5)',
                        },
                        '&:disabled': {
                          background: 'action.disabledBackground',
                        },
                      }}
                    >
                      {loading ? (
                        <CircularProgress size={24} sx={{ color: 'white' }} />
                      ) : (
                        <>
                          <CheckCircle size={20} style={{ marginRight: 8 }} />
                          Verify Email
                        </>
                      )}
                    </Button>

                    {/* Resend Code */}
                    <Box sx={{ textAlign: 'center' }}>
                      {resendCooldown > 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          Resend code in <strong>{resendCooldown}s</strong>
                        </Typography>
                      ) : (
                        <Button
                          variant="text"
                          size="small"
                          onClick={handleSendOTP}
                          disabled={sendingOTP}
                          startIcon={<RefreshCw size={16} />}
                          sx={{ textTransform: 'none' }}
                        >
                          Didn't receive the code? Resend
                        </Button>
                      )}
                    </Box>
                  </>
                )}
              </>
            )}

            {/* Help Text */}
            <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center' }}>
                Check your spam folder if you don't see the email.
                <br />
                The code expires in 10 minutes.
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Back to Register Link */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button
            component={Link}
            href="/auth/register"
            variant="text"
            startIcon={<ArrowLeft size={16} />}
            sx={{ textTransform: 'none', color: 'text.secondary' }}
          >
            Back to Register
          </Button>
        </Box>

        {/* Trust Badge */}
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Chip 
            icon={<Sparkles size={12} />} 
            label="Your data is encrypted & secure" 
            size="small" 
            variant="outlined"
            sx={{ fontSize: '0.7rem' }}
          />
        </Box>
      </Container>
    </Box>
  );
}
