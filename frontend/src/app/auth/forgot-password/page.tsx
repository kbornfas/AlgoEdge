'use client';

import { useState } from 'react';
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
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Mail, ArrowLeft, Eye, EyeOff, Lock, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthBackground from '@/components/AuthBackground';
import ThemeToggle from '@/components/ThemeToggle';

type Step = 'email' | 'verify' | 'new-password' | 'success';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to send reset code');
        return;
      }

      setSuccess('Reset code sent to your email!');
      setStep('verify');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 'verify') {
      if (!code || code.length !== 6) {
        setError('Please enter the 6-digit code');
        return;
      }
      setError('');
      setStep('new-password');
      return;
    }

    // Step: new-password
    if (!newPassword || !confirmPassword) {
      setError('Please fill in both password fields');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.includes('Invalid reset code')) {
          setStep('verify');
        }
        setError(data.error || 'Failed to reset password');
        return;
      }

      setStep('success');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSuccess('New code sent to your email!');
        setCode('');
      }
    } catch (err) {
      setError('Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

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
      
      {/* Theme Toggle - Top Right */}
      <Box sx={{ position: 'fixed', top: 16, right: 16, zIndex: 1000 }}>
        <ThemeToggle />
      </Box>

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            component="img"
            src="/images/logo.png"
            alt="AlgoEdge Logo"
            sx={{ width: 80, height: 80, objectFit: 'contain', mx: 'auto' }}
          />
        </Box>

        <Card>
          <CardContent sx={{ p: 4 }}>
            {step === 'success' ? (
              // Success State
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CheckCircle size={64} color="#10b981" style={{ marginBottom: 16 }} />
                <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                  Password Reset Successful!
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
                  Your password has been changed. You can now log in with your new password.
                </Typography>
                <Button
                  variant="contained"
                  fullWidth
                  onClick={() => router.push('/auth/login')}
                  sx={{
                    bgcolor: '#10b981',
                    '&:hover': { bgcolor: '#059669' },
                    py: 1.5,
                  }}
                >
                  Go to Login
                </Button>
              </Box>
            ) : (
              <>
                {/* Back to Login Link */}
                <Button
                  component={Link}
                  href="/auth/login"
                  startIcon={<ArrowLeft size={18} />}
                  sx={{ mb: 2, color: 'text.secondary' }}
                >
                  Back to Login
                </Button>

                <Typography variant="h4" align="center" gutterBottom sx={{ fontWeight: 600 }}>
                  {step === 'email' && 'Forgot Password'}
                  {step === 'verify' && 'Enter Code'}
                  {step === 'new-password' && 'Create New Password'}
                </Typography>
                
                <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 4 }}>
                  {step === 'email' && 'Enter your email and we\'ll send you a code to reset your password'}
                  {step === 'verify' && `We sent a 6-digit code to ${email}`}
                  {step === 'new-password' && 'Enter your new password below'}
                </Typography>

                {error && (
                  <Alert severity="error" sx={{ mb: 3 }}>
                    {error}
                  </Alert>
                )}

                {success && step !== 'email' && (
                  <Alert severity="success" sx={{ mb: 3 }}>
                    {success}
                  </Alert>
                )}

                <form onSubmit={step === 'email' ? handleSendCode : handleVerifyAndReset}>
                  {step === 'email' && (
                    <TextField
                      fullWidth
                      label="Email Address"
                      type="email"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError('');
                      }}
                      sx={{ mb: 3 }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Mail size={20} />
                          </InputAdornment>
                        ),
                      }}
                    />
                  )}

                  {step === 'verify' && (
                    <>
                      <TextField
                        fullWidth
                        label="Verification Code"
                        value={code}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                          setCode(value);
                          setError('');
                        }}
                        placeholder="Enter 6-digit code"
                        sx={{ mb: 2 }}
                        inputProps={{
                          maxLength: 6,
                          style: { letterSpacing: '0.5em', textAlign: 'center', fontSize: '1.5rem' },
                        }}
                      />
                      <Button
                        variant="text"
                        onClick={handleResendCode}
                        disabled={loading}
                        sx={{ mb: 3, display: 'block', mx: 'auto' }}
                      >
                        Didn&apos;t receive the code? Resend
                      </Button>
                    </>
                  )}

                  {step === 'new-password' && (
                    <>
                      <TextField
                        fullWidth
                        label="New Password"
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setError('');
                        }}
                        sx={{ mb: 3 }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock size={20} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowPassword(!showPassword)}
                                edge="end"
                              >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                        helperText="Minimum 8 characters"
                      />
                      <TextField
                        fullWidth
                        label="Confirm New Password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setError('');
                        }}
                        sx={{ mb: 3 }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock size={20} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                edge="end"
                              >
                                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        }}
                      />
                    </>
                  )}

                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={loading}
                    sx={{
                      bgcolor: '#10b981',
                      '&:hover': { bgcolor: '#059669' },
                      py: 1.5,
                      fontSize: '1rem',
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      <>
                        {step === 'email' && 'Send Reset Code'}
                        {step === 'verify' && 'Verify Code'}
                        {step === 'new-password' && 'Reset Password'}
                      </>
                    )}
                  </Button>
                </form>
              </>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
