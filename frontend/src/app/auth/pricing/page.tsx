'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Button,
  Typography,
  Alert,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Grid,
  Chip,
} from '@mui/material';
import { Lock, CheckCircle, CreditCard, Wallet } from 'lucide-react';
import AuthBackground from '@/components/AuthBackground';
import { useRouter } from 'next/navigation';

type PaymentMethod = 'card' | 'crypto';

interface PlanType {
  id: string;
  name: string;
  price: number;
  period: string;
  duration: string;
  features: string[];
  benefits: string[];
  recommended?: boolean;
  checkoutLinks: {
    card: string;
    crypto: string;
  };
}

// Whop checkout links - Replace these with your actual Whop checkout URLs
// The {email} placeholder will be replaced with the user's email for matching
const WHOP_CHECKOUT_LINKS = {
  weekly: {
    card: 'https://whop.com/checkout/plan_kW4SsqSBxI7SM',
    crypto: 'https://whop.com/checkout/plan_kW4SsqSBxI7SM',
  },
  monthly: {
    card: 'https://whop.com/checkout/plan_AqgOxJtvSfSDU',
    crypto: 'https://whop.com/checkout/plan_AqgOxJtvSfSDU',
  },
  quarterly: {
    card: 'https://whop.com/checkout/plan_UhC3CzHFnUvLj',
    crypto: 'https://whop.com/checkout/plan_UhC3CzHFnUvLj',
  },
};

const plans: PlanType[] = [
  {
    id: 'weekly',
    name: 'Weekly',
    price: 19,
    period: '/week',
    duration: '7 days of access',
    features: [
      'Fully Automated Trading Bot',
      'Real-time Trading Signals',
      'Multi-pair Support (Forex & Crypto)',
      'Risk Management Tools',
      'Performance Analytics Dashboard',
      'Cancel at any time',
    ],
    benefits: [
      'Perfect for testing our service',
      'No long-term commitment',
      'Full bot access during trial',
      'Email support available',
    ],
    checkoutLinks: WHOP_CHECKOUT_LINKS.weekly,
  },
  {
    id: 'monthly',
    name: 'Monthly',
    price: 49,
    period: '/month',
    duration: '30 days of access',
    recommended: true,
    features: [
      'Save 37% vs weekly',
      'Fully Automated Trading Bot',
      'Unlimited Trading Signals',
      'Advanced AI-Powered Analysis',
      'Priority Trade Execution',
      '24/7 Automated Trading',
    ],
    benefits: [
      'Most popular choice',
      'Best value for active traders',
      'Priority customer support',
      'All premium features unlocked',
      'Dedicated account manager',
    ],
    checkoutLinks: WHOP_CHECKOUT_LINKS.monthly,
  },
  {
    id: 'quarterly',
    name: 'Quarterly',
    price: 149,
    period: '/quarterly',
    duration: '90 days of access',
    features: [
      'Best Value - Save 49%',
      'Fully Automated Trading Bot',
      'VIP Signal Priority',
      'Custom Risk Settings',
      'Exclusive Strategy Access',
      'Priority 24/7 Support',
    ],
    benefits: [
      'Best value for serious traders',
      'Maximum profit potential',
      'VIP customer support',
      'All premium features included',
      '1-on-1 strategy consultation',
    ],
    checkoutLinks: WHOP_CHECKOUT_LINKS.quarterly,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check for logged-in user first (from localStorage token)
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserEmail(user.email || '');
        setUserName(user.firstName || user.username || '');
        return; // User is logged in, don't redirect
      } catch (e) {
        console.error('Failed to parse user data');
      }
    }
    
    // Check for Google sign-up user first (from cookies)
    const pendingUserCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('pending_user='));
    
    if (pendingUserCookie) {
      try {
        const userData = JSON.parse(decodeURIComponent(pendingUserCookie.split('=')[1]));
        setUserEmail(userData.email || '');
        setUserName(userData.firstName || '');
      } catch (e) {
        console.error('Failed to parse pending user data');
      }
    } else {
      // Check if user is in localStorage (regular sign-up)
      const pendingUserStr = localStorage.getItem('pendingUser');
      const pendingEmail = localStorage.getItem('pendingEmail');
      
      if (!pendingUserStr && !pendingEmail) {
        router.push('/auth/register');
        return;
      }

      if (pendingUserStr) {
        const user = JSON.parse(pendingUserStr);
        if (!user.isVerified) {
          router.push('/auth/verify-otp');
          return;
        }
        setUserEmail(user.email || '');
        setUserName(user.firstName || user.username || '');
      } else if (pendingEmail) {
        setUserEmail(pendingEmail);
      }
    }
  }, [router]);

  const handlePaymentMethodChange = (
    _event: React.MouseEvent<HTMLElement>,
    newMethod: PaymentMethod | null,
  ) => {
    if (newMethod !== null) {
      setPaymentMethod(newMethod);
    }
  };

  const handleSelectPlan = (plan: PlanType) => {
    setLoading(true);
    const baseCheckoutUrl = paymentMethod === 'card' ? plan.checkoutLinks.card : plan.checkoutLinks.crypto;
    
    // If checkout URL is set, redirect to it with user's email
    if (baseCheckoutUrl && baseCheckoutUrl !== '' && baseCheckoutUrl !== '#') {
      // Append email as query parameter for Whop to pre-fill and match the user
      const separator = baseCheckoutUrl.includes('?') ? '&' : '?';
      const checkoutUrl = userEmail 
        ? `${baseCheckoutUrl}${separator}email=${encodeURIComponent(userEmail)}`
        : baseCheckoutUrl;
      
      window.location.href = checkoutUrl;
    } else {
      // Checkout links not configured
      alert(`Checkout link for ${plan.name} (${paymentMethod}) needs to be configured. Please add your Whop checkout links in the environment variables.`);
      setLoading(false);
    }
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
        <Container maxWidth="lg">
          {/* Header Section */}
          <Box sx={{ textAlign: 'center', mb: 2 }}>
            {/* Membership Badge */}
            <Paper
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 2,
                px: 3,
                py: 1.5,
                mb: 4,
                bgcolor: 'rgba(30, 41, 59, 0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 2,
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1,
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Lock size={20} color="#9CA3AF" />
              </Box>
              <Box sx={{ textAlign: 'left' }}>
                <Typography
                  sx={{
                    fontSize: '0.7rem',
                    fontWeight: 600,
                    color: '#10b981',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}
                >
                  Membership
                </Typography>
                <Typography sx={{ fontWeight: 600, color: 'white' }}>
                  Trial Version (Indicator Locked)
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="small"
                sx={{
                  ml: 2,
                  bgcolor: '#3B82F6',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: '#2563EB',
                  },
                }}
              >
                Upgrade Now
              </Button>
            </Paper>
          </Box>

          {/* Main Heading */}
          <Typography
            variant="h3"
            align="center"
            sx={{
              fontWeight: 800,
              mb: 2,
              fontStyle: 'italic',
              color: 'white',
              fontSize: { xs: '1.75rem', md: '2.5rem' },
            }}
          >
            LEVEL UP YOUR TRADES
          </Typography>
          <Typography
            align="center"
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              mb: 4,
              fontSize: { xs: '0.95rem', md: '1.1rem' },
              maxWidth: '600px',
              mx: 'auto',
            }}
          >
            Gain the unfair advantage with institutional-grade signals and private community access.
          </Typography>

          {/* Payment Method Toggle */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 5 }}>
            <ToggleButtonGroup
              value={paymentMethod}
              exclusive
              onChange={handlePaymentMethodChange}
              sx={{
                bgcolor: 'rgba(30, 41, 59, 0.9)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 3,
                p: 0.5,
                '& .MuiToggleButton-root': {
                  border: 'none',
                  borderRadius: 2,
                  px: 4,
                  py: 1.5,
                  textTransform: 'none',
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.7)',
                  '&.Mui-selected': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.15)',
                    },
                  },
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.05)',
                  },
                },
              }}
            >
              <ToggleButton value="card">
                <CreditCard size={18} style={{ marginRight: 8 }} />
                Card / Apple Pay
              </ToggleButton>
              <ToggleButton value="crypto">
                <Wallet size={18} style={{ marginRight: 8 }} />
                Crypto (USDT)
              </ToggleButton>
            </ToggleButtonGroup>
          </Box>

          {/* Pricing Cards */}
          <Grid container spacing={3} justifyContent="center">
            {plans.map((plan) => (
              <Grid item xs={12} sm={6} md={4} key={plan.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    bgcolor: plan.recommended ? 'rgba(16, 40, 30, 0.95)' : 'rgba(20, 25, 35, 0.95)',
                    backdropFilter: 'blur(10px)',
                    border: plan.recommended ? '2px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: 3,
                    position: 'relative',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      borderColor: plan.recommended ? '#10b981' : 'rgba(255, 255, 255, 0.3)',
                      boxShadow: plan.recommended ? '0 12px 40px rgba(16, 185, 129, 0.3)' : '0 12px 40px rgba(0, 0, 0, 0.3)',
                    },
                  }}
                >
                  {/* Recommended Badge */}
                  {plan.recommended && (
                    <Chip
                      label="Most Recommended"
                      sx={{
                        position: 'absolute',
                        top: -14,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        bgcolor: '#10b981',
                        color: 'white',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                      }}
                    />
                  )}

                  <CardContent sx={{ p: 4, flexGrow: 1, display: 'flex', flexDirection: 'column', pt: plan.recommended ? 5 : 4 }}>
                    {/* Plan Name */}
                    <Typography
                      variant="h5"
                      align="center"
                      sx={{ fontWeight: 700, color: 'white', mb: 2 }}
                    >
                      {plan.name}
                    </Typography>

                    {/* Price */}
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      <Typography
                        component="span"
                        sx={{
                          fontSize: { xs: '2rem', md: '2.5rem' },
                          fontWeight: 800,
                          color: '#10b981',
                        }}
                      >
                        USD {plan.price}
                      </Typography>
                      <Typography
                        component="span"
                        sx={{ fontSize: '1rem', color: 'rgba(255, 255, 255, 0.6)' }}
                      >
                        {plan.period}
                      </Typography>
                    </Box>

                    {/* Features */}
                    <Typography sx={{ fontWeight: 600, color: 'white', mb: 2 }}>
                      Features:
                    </Typography>
                    <Box component="ul" sx={{ pl: 0, listStyle: 'none', mb: 3, flexGrow: 1 }}>
                      {plan.features.map((feature, idx) => (
                        <Box
                          component="li"
                          key={idx}
                          sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}
                        >
                          <CheckCircle size={18} color="#10b981" />
                          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                            {feature}
                          </Typography>
                        </Box>
                      ))}
                    </Box>

                    {/* Package Benefits */}
                    <Box
                      sx={{
                        bgcolor: 'rgba(16, 185, 129, 0.1)',
                        borderRadius: 2,
                        p: 2,
                        mb: 3,
                      }}
                    >
                      <Typography sx={{ fontWeight: 600, color: '#10b981', mb: 1.5, fontSize: '0.9rem' }}>
                        Package Benefits:
                      </Typography>
                      {plan.benefits.map((benefit, idx) => (
                        <Typography
                          key={idx}
                          variant="body2"
                          sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 0.5, fontSize: '0.85rem' }}
                        >
                          ✓ {benefit}
                        </Typography>
                      ))}
                    </Box>

                    {/* Access Duration */}
                    <Box
                      sx={{
                        textAlign: 'center',
                        mb: 3,
                        py: 1,
                        px: 2,
                        border: '1px solid rgba(16, 185, 129, 0.5)',
                        borderRadius: 2,
                        display: 'inline-block',
                        mx: 'auto',
                        bgcolor: 'rgba(16, 185, 129, 0.1)',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: '#10b981', fontWeight: 600 }}
                      >
                        {plan.duration}
                      </Typography>
                    </Box>

                    {/* CTA Button */}
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => handleSelectPlan(plan)}
                      disabled={loading}
                      sx={{
                        bgcolor: plan.recommended ? '#10b981' : 'rgba(50, 60, 75, 0.9)',
                        color: 'white',
                        fontWeight: 600,
                        py: 1.5,
                        fontSize: '1rem',
                        borderRadius: 2,
                        textTransform: 'none',
                        border: plan.recommended ? 'none' : '1px solid rgba(255, 255, 255, 0.1)',
                        '&:hover': {
                          bgcolor: plan.recommended ? '#059669' : 'rgba(70, 80, 95, 0.9)',
                          boxShadow: plan.recommended ? '0 4px 12px rgba(16, 185, 129, 0.4)' : '0 4px 12px rgba(0, 0, 0, 0.3)',
                        },
                        '&:disabled': {
                          bgcolor: plan.recommended ? 'rgba(16, 185, 129, 0.5)' : 'rgba(50, 60, 75, 0.5)',
                        },
                      }}
                    >
                      Get Access Now →
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* User Info */}
          {userEmail && (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Purchasing for: <strong style={{ color: 'white' }}>{userEmail}</strong>
              </Typography>
            </Box>
          )}

          {/* Back to Login Link */}
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button
              variant="text"
              onClick={() => router.push('/auth/login')}
              sx={{ color: 'rgba(255, 255, 255, 0.7)', textTransform: 'none' }}
            >
              Already have a subscription? Sign in
            </Button>
          </Box>
        </Container>
      </Box>
    </>
  );
}
