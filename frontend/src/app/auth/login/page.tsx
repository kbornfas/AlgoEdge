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
  Link as MuiLink,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Divider,
  Chip,
} from '@mui/material';
import { 
  Eye, 
  EyeOff, 
  Shield, 
  Lock, 
  Mail,
  ArrowRight,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AuthBackground from '@/components/AuthBackground';
import ThemeToggle from '@/components/ThemeToggle';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    twoFactorCode: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          ...(requires2FA && { twoFactorCode: formData.twoFactorCode }),
        }),
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('Failed to parse login response:', parseError);
        setError('Server returned invalid response. Please try again.');
        return;
      }

      if (!response.ok) {
        if (data.requires2FA) {
          setRequires2FA(true);
          setError('');
        } else if (data.notFound) {
          setError('No account found with this email. Please create an account first.');
        } else if (data.details && Array.isArray(data.details)) {
          const fieldErrors = data.details
            .map((err: { field: string; message: string }) => `${err.field}: ${err.message}`)
            .join(', ');
          setError(fieldErrors || data.error || 'Login failed');
        } else {
          setError(data.error || 'Login failed. Please check your credentials.');
        }
        return;
      }

      // Check for 2FA requirement (status 200 with requires2FA)
      if (data.requires2FA) {
        setRequires2FA(true);
        setError('');
        return;
      }

      // Check for email verification requirement
      if (data.requiresVerification) {
        // Store email for OTP page
        localStorage.setItem('pendingEmail', data.email);
        // Redirect to OTP verification page
        router.push('/auth/verify-otp');
        return;
      }

      // Validate response has required fields
      if (!data.token || !data.user) {
        console.error('Invalid login response - missing token or user:', data);
        setError('Login failed. Please try again.');
        return;
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.removeItem('pendingUser');
      localStorage.removeItem('pendingEmail');
      
      document.cookie = 'pending_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      document.cookie = 'pending_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';

      // Redirect to dashboard - subscription status will be checked there
      router.push('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please try again.');
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
          <Typography variant="body2" color="text.secondary">
            Professional Automated Trading
          </Typography>
        </Box>
        
        {/* Login Card */}
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
          <Box 
            sx={{ 
              display: 'flex', 
              justifyContent: 'center',
              mt: -2,
            }}
          >
            <Chip
              icon={<Shield size={14} />}
              label="256-bit SSL Encrypted"
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
            <Typography 
              variant="h5" 
              align="center" 
              gutterBottom 
              sx={{ fontWeight: 700, mb: 1 }}
            >
              Welcome Back
            </Typography>
            <Typography 
              variant="body2" 
              align="center" 
              color="text.secondary" 
              sx={{ mb: 4 }}
            >
              Sign in to access your trading dashboard
            </Typography>

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

            <Box component="form" onSubmit={handleSubmit} autoComplete="on" name="login">
              {/* Email Field */}
              <TextField
                fullWidth
                label="Email Address"
                name="email"
                id="login-email"
                type="email"
                autoComplete="username email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="you@example.com"
                sx={{ mb: 2.5 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Mail size={20} strokeWidth={1.5} />
                    </InputAdornment>
                  ),
                }}
              />

              {/* Password Field */}
              <TextField
                fullWidth
                label="Password"
                name="password"
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                placeholder="Enter your password"
                sx={{ mb: 1.5 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock size={20} strokeWidth={1.5} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        tabIndex={-1}
                        size="small"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {/* 2FA Field */}
              {requires2FA && (
                <TextField
                  fullWidth
                  label="2FA Verification Code"
                  name="twoFactorCode"
                  id="login-2fa"
                  value={formData.twoFactorCode}
                  onChange={handleChange}
                  required
                  disabled={loading}
                  placeholder="Enter 6-digit code"
                  sx={{ mb: 2 }}
                  inputProps={{ 
                    maxLength: 6, 
                    inputMode: 'numeric', 
                    autoComplete: 'one-time-code',
                    style: { letterSpacing: '0.5em', textAlign: 'center' },
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Shield size={20} strokeWidth={1.5} />
                      </InputAdornment>
                    ),
                  }}
                />
              )}

              {/* Forgot Password Link */}
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
                <MuiLink
                  component={Link}
                  href="/auth/forgot-password"
                  variant="body2"
                  underline="hover"
                  sx={{ 
                    color: 'primary.main',
                    fontWeight: 500,
                    '&:hover': { color: 'primary.dark' },
                  }}
                >
                  Forgot password?
                </MuiLink>
              </Box>

              {/* Submit Button */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ 
                  mb: 3, 
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
                }}
              >
                {loading ? (
                  <CircularProgress size={24} sx={{ color: 'white' }} />
                ) : (
                  <>
                    Sign In Securely
                    <ArrowRight size={20} style={{ marginLeft: 8 }} />
                  </>
                )}
              </Button>

              {/* Divider */}
              <Divider sx={{ mb: 3 }}>
                <Typography variant="caption" color="text.secondary">
                  New to AlgoEdge?
                </Typography>
              </Divider>

              {/* Register Link */}
              <Button
                component={Link}
                href="/auth/register"
                fullWidth
                variant="outlined"
                size="large"
                sx={{ 
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: 600,
                  textTransform: 'none',
                  borderWidth: 2,
                  '&:hover': { borderWidth: 2 },
                }}
              >
                Create Free Account
              </Button>
            </Box>
          </CardContent>

          {/* Security Features Footer */}
          <Box 
            sx={{ 
              px: { xs: 3, sm: 5 }, 
              pb: 3,
              pt: 0,
            }}
          >
            <Box 
              sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                gap: 3,
                flexWrap: 'wrap',
              }}
            >
              {[
                { icon: <CheckCircle2 size={14} />, text: 'Secure Login' },
                { icon: <Shield size={14} />, text: '2FA Protected' },
                { icon: <Lock size={14} />, text: 'Encrypted Data' },
              ].map((item, index) => (
                <Box 
                  key={index}
                  sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5,
                    color: 'text.secondary',
                  }}
                >
                  {item.icon}
                  <Typography variant="caption">{item.text}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Card>

        {/* Trust Indicators */}
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Trusted by 10,000+ traders worldwide
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              icon={<Sparkles size={12} />} 
              label="4.9★ Rating" 
              size="small" 
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
            <Chip 
              label="24/7 Support" 
              size="small" 
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
            <Chip 
              label="Instant Access" 
              size="small" 
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
