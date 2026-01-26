'use client';

import { useState, useEffect, useMemo } from 'react';
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
  Grid,
  Chip,
  LinearProgress,
  Divider,
} from '@mui/material';
import { 
  Eye, 
  EyeOff, 
  Gift, 
  Shield, 
  Lock, 
  Mail, 
  User,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import AuthBackground from '@/components/AuthBackground';
import ThemeToggle from '@/components/ThemeToggle';

// Password strength checker
interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  requirements: {
    length: boolean;
    uppercase: boolean;
    lowercase: boolean;
    number: boolean;
    special: boolean;
  };
}

const checkPasswordStrength = (password: string): PasswordStrength => {
  const requirements = {
    length: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password),
  };

  const score = Object.values(requirements).filter(Boolean).length;

  let label = 'Very Weak';
  let color = '#EF4444';

  if (score === 5) {
    label = 'Very Strong';
    color = '#10B981';
  } else if (score === 4) {
    label = 'Strong';
    color = '#22C55E';
  } else if (score === 3) {
    label = 'Medium';
    color = '#F59E0B';
  } else if (score === 2) {
    label = 'Weak';
    color = '#F97316';
  }

  return { score, label, color, requirements };
};

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [referralCode, setReferralCode] = useState('');
  const [referrerName, setReferrerName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Password strength
  const passwordStrength = useMemo(() => 
    checkPasswordStrength(formData.password), 
    [formData.password]
  );

  // Capture referral code from URL on mount
  useEffect(() => {
    const refCode = searchParams.get('ref');
    if (refCode) {
      setReferralCode(refCode.toUpperCase());
      validateReferralCode(refCode);
    }
  }, [searchParams]);

  const validateReferralCode = async (code: string) => {
    try {
      const response = await fetch('/api/affiliate/validate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await response.json();
      if (data.valid) {
        setReferrerName(data.referrer);
      }
    } catch (err) {
      console.error('Failed to validate referral code:', err);
    }
  };

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

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password strength (must meet at least 4 requirements)
    if (passwordStrength.score < 4) {
      setError('Password is too weak. Please use a stronger password with uppercase, lowercase, numbers, and special characters.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          referralCode: referralCode || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.details && Array.isArray(data.details)) {
          const fieldErrors = data.details
            .map((err: { field: string; message: string }) => `${err.field}: ${err.message}`)
            .join(', ');
          setError(fieldErrors || data.error || 'Registration failed');
        } else {
          setError(data.error || 'Registration failed');
        }
        return;
      }

      localStorage.setItem('pendingEmail', data.user.email);
      localStorage.setItem('pendingUser', JSON.stringify(data.user));

      // Silently redirect to OTP verification
      router.push('/auth/verify-otp');
    } catch (err) {
      console.error('Registration error:', err);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {met ? (
        <CheckCircle2 size={14} color="#10B981" />
      ) : (
        <XCircle size={14} color="#9CA3AF" />
      )}
      <Typography 
        variant="caption" 
        sx={{ 
          color: met ? 'success.main' : 'text.secondary',
          textDecoration: met ? 'none' : 'none',
        }}
      >
        {text}
      </Typography>
    </Box>
  );

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
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            component="img"
            src="/images/logo.png"
            alt="AlgoEdge Logo"
            sx={{ 
              width: 64, 
              height: 64, 
              objectFit: 'contain', 
              mx: 'auto',
              mb: 1.5,
              filter: 'drop-shadow(0 4px 12px rgba(0, 0, 0, 0.15))',
            }}
          />
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 700, 
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            AlgoEdge
          </Typography>
        </Box>
        
        {/* Register Card */}
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
              label="Bank-Grade Security"
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

          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 700, mb: 0.5 }}>
              Create Your Account
            </Typography>
            <Typography variant="body2" align="center" color="text.secondary" sx={{ mb: 3 }}>
              Start your automated trading journey today
            </Typography>

            {/* Referral Code Banner */}
            {referralCode && (
              <Alert 
                icon={<Gift size={20} />}
                severity="success" 
                sx={{ 
                  mb: 3, 
                  bgcolor: 'rgba(16, 185, 129, 0.1)', 
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 2,
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    🎉 Referral Code Applied: {referralCode}
                  </Typography>
                  {referrerName && (
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      Referred by: {referrerName}
                    </Typography>
                  )}
                </Box>
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} autoComplete="on" name="register">
              <Grid container spacing={2}>
                {/* Name Fields */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="First Name"
                    name="firstName"
                    id="register-firstName"
                    autoComplete="given-name"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <User size={18} strokeWidth={1.5} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Name"
                    name="lastName"
                    id="register-lastName"
                    autoComplete="family-name"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <User size={18} strokeWidth={1.5} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Email */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    name="email"
                    id="register-email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    placeholder="you@example.com"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Mail size={18} strokeWidth={1.5} />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Password */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Create Password"
                    name="password"
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    placeholder="Create a strong password"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock size={18} strokeWidth={1.5} />
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
                  
                  {/* Password Strength Indicator */}
                  {formData.password && (
                    <Box sx={{ mt: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">
                          Password Strength
                        </Typography>
                        <Typography 
                          variant="caption" 
                          sx={{ fontWeight: 600, color: passwordStrength.color }}
                        >
                          {passwordStrength.label}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={(passwordStrength.score / 5) * 100}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          bgcolor: 'action.hover',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: passwordStrength.color,
                            borderRadius: 3,
                          },
                        }}
                      />
                      
                      {/* Password Requirements */}
                      <Box sx={{ mt: 1.5, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}>
                        <RequirementItem met={passwordStrength.requirements.length} text="12+ characters" />
                        <RequirementItem met={passwordStrength.requirements.uppercase} text="Uppercase (A-Z)" />
                        <RequirementItem met={passwordStrength.requirements.lowercase} text="Lowercase (a-z)" />
                        <RequirementItem met={passwordStrength.requirements.number} text="Number (0-9)" />
                        <RequirementItem met={passwordStrength.requirements.special} text="Special (!@#$%)" />
                      </Box>
                    </Box>
                  )}
                </Grid>

                {/* Confirm Password */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Confirm Password"
                    name="confirmPassword"
                    id="register-confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    placeholder="Confirm your password"
                    error={formData.confirmPassword !== '' && formData.password !== formData.confirmPassword}
                    helperText={
                      formData.confirmPassword !== '' && formData.password !== formData.confirmPassword
                        ? 'Passwords do not match'
                        : ''
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Lock size={18} strokeWidth={1.5} />
                        </InputAdornment>
                      ),
                      endAdornment: (
                        <InputAdornment position="end">
                          {formData.confirmPassword && formData.password === formData.confirmPassword ? (
                            <CheckCircle2 size={18} color="#10B981" />
                          ) : (
                            <IconButton
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              edge="end"
                              tabIndex={-1}
                              size="small"
                            >
                              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </IconButton>
                          )}
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                {/* Referral Code Input */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Referral Code (Optional)"
                    name="referralCode"
                    id="register-referralCode"
                    value={referralCode}
                    onChange={(e) => {
                      const code = e.target.value.toUpperCase();
                      setReferralCode(code);
                      if (code.length >= 4) {
                        validateReferralCode(code);
                      } else {
                        setReferrerName('');
                      }
                    }}
                    disabled={loading}
                    placeholder="Enter referral code"
                    helperText={referrerName ? `✓ Referred by: ${referrerName}` : ''}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Gift size={18} color={referralCode ? '#22C55E' : undefined} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiFormHelperText-root': {
                        color: referrerName ? 'success.main' : undefined,
                        fontWeight: referrerName ? 600 : undefined,
                      },
                    }}
                  />
                </Grid>
              </Grid>

              {/* Security Notice */}
              <Alert 
                severity="info" 
                icon={<AlertCircle size={18} />}
                sx={{ 
                  mt: 3, 
                  mb: 2, 
                  borderRadius: 2,
                  bgcolor: 'action.hover',
                  border: 'none',
                }}
              >
                <Typography variant="caption">
                  Your password is encrypted with AES-256 and never stored in plain text. 
                  We recommend using a password manager.
                </Typography>
              </Alert>

              {/* Submit Button */}
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading || passwordStrength.score < 4}
                sx={{ 
                  mt: 1,
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
                    Create Secure Account
                    <ArrowRight size={20} style={{ marginLeft: 8 }} />
                  </>
                )}
              </Button>

              {/* Divider */}
              <Divider sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Already have an account?
                </Typography>
              </Divider>

              {/* Login Link */}
              <Button
                component={Link}
                href="/auth/login"
                fullWidth
                variant="outlined"
                size="large"
                sx={{ 
                  py: 1.2,
                  borderRadius: 2,
                  fontWeight: 600,
                  textTransform: 'none',
                  borderWidth: 2,
                  '&:hover': { borderWidth: 2 },
                }}
              >
                Sign In Instead
              </Button>
            </Box>
          </CardContent>

          {/* Security Features Footer */}
          <Box sx={{ px: { xs: 3, sm: 4 }, pb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
              {[
                { icon: <Shield size={14} />, text: 'SSL Encrypted' },
                { icon: <Lock size={14} />, text: 'GDPR Compliant' },
                { icon: <CheckCircle2 size={14} />, text: 'Secure Storage' },
              ].map((item, index) => (
                <Box 
                  key={index}
                  sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}
                >
                  {item.icon}
                  <Typography variant="caption">{item.text}</Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </Card>

        {/* Trust Indicators */}
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              icon={<Sparkles size={12} />} 
              label="Free to Join" 
              size="small" 
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
            <Chip 
              label="No Credit Card Required" 
              size="small" 
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
            <Chip 
              label="Cancel Anytime" 
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
