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
  Grid,
  Chip,
  Stack,
} from '@mui/material';
import { Lock, CheckCircle, CreditCard, Zap, TrendingUp, Award, CheckCircle2, Shield } from 'lucide-react';
import AuthBackground from '@/components/AuthBackground';
import { useRouter } from 'next/navigation';

interface PlanType {
  id: string;
  name: string;
  price: number;
  period: string;
  duration: string;
  features: string[];
  benefits: string[];
  recommended?: boolean;
  checkoutLink: string;
}

// Whop checkout links
const WHOP_CHECKOUT_LINKS = {
  weekly: process.env.NEXT_PUBLIC_WHOP_WEEKLY || 'https://whop.com/checkout/plan_kW4SsqSBxI7SM',
  monthly: process.env.NEXT_PUBLIC_WHOP_MONTHLY || 'https://whop.com/checkout/plan_AqgOxJtvSfSDU',
  quarterly: process.env.NEXT_PUBLIC_WHOP_QUARTERLY || 'https://whop.com/checkout/plan_UhC3CzHFnUvLj',
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
    checkoutLink: WHOP_CHECKOUT_LINKS.weekly,
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
    checkoutLink: WHOP_CHECKOUT_LINKS.monthly,
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
    checkoutLink: WHOP_CHECKOUT_LINKS.quarterly,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const checkUserAndSubscription = async () => {
      // First, sync any pending token from cookies to localStorage (from Google OAuth)
      const pendingTokenCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('pending_token='));
      const pendingUserCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('pending_user='));
      
      if (pendingTokenCookie && pendingUserCookie) {
        try {
          const pendingToken = pendingTokenCookie.split('=')[1];
          const userData = JSON.parse(decodeURIComponent(pendingUserCookie.split('=')[1]));
          
          // Save to localStorage
          localStorage.setItem('token', pendingToken);
          localStorage.setItem('user', JSON.stringify(userData));
          
          // Clear BOTH pending cookies to prevent stale data
          document.cookie = 'pending_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          document.cookie = 'pending_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
          
          setUserEmail(userData.email || '');
          setUserName(userData.firstName || userData.username || '');
          return; // User data synced, stay on pricing
        } catch (e) {
          console.error('Failed to sync pending user data from cookies');
        }
      }
      
      // Always clear stale pending cookies if we have a valid token in localStorage
      // This prevents old Google OAuth data from overriding current user
      const existingToken = localStorage.getItem('token');
      if (existingToken && pendingUserCookie) {
        document.cookie = 'pending_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'pending_user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
      }
      
      // Check for logged-in user first (from localStorage token)
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');
      
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          setUserEmail(user.email || '');
          setUserName(user.firstName || user.username || '');
          
          // Check if user already has an active subscription - redirect to dashboard
          const response = await fetch('/api/subscription/status', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.isActive || data.status === 'active') {
              router.push('/dashboard');
              return;
            }
          }
          return; // User is logged in but no subscription, stay on pricing
        } catch (e) {
          console.error('Failed to parse user data or check subscription');
        }
      }
      
      // Re-check for pending_user cookie (in case it wasn't cleared above)
      // Only use this if we DON'T have a valid token (i.e., user not logged in)
      const currentPendingUserCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('pending_user='));
      
      if (currentPendingUserCookie && !token) {
        try {
          const userData = JSON.parse(decodeURIComponent(currentPendingUserCookie.split('=')[1]));
          setUserEmail(userData.email || '');
          setUserName(userData.firstName || '');
          return; // User data found, don't redirect
        } catch (e) {
          console.error('Failed to parse pending user data');
        }
      }
      
      // Check if user is in localStorage (regular sign-up)
      const pendingUserStr = localStorage.getItem('pendingUser');
      const pendingEmail = localStorage.getItem('pendingEmail');
      
      if (pendingUserStr) {
        try {
          const user = JSON.parse(pendingUserStr);
          if (!user.isVerified) {
            router.push('/auth/verify-otp');
            return;
          }
          setUserEmail(user.email || '');
          setUserName(user.firstName || user.username || '');
          return;
        } catch (e) {
          console.error('Failed to parse pending user data');
        }
      }
      
      if (pendingEmail) {
        setUserEmail(pendingEmail);
        return;
      }
      
      // No user info found - stay on pricing page anyway (don't redirect to register)
      // Users coming from login or directly visiting the page should see pricing
      // They can register/login from here if needed
    };
    
    checkUserAndSubscription();
  }, [router]);

  const handleSelectPlan = (plan: PlanType) => {
    setLoading(true);
    const checkoutUrl = plan.checkoutLink;
    
    // If checkout URL is set, redirect to it with user's email
    if (checkoutUrl && checkoutUrl !== '' && checkoutUrl !== '#') {
      // Build checkout URL with email and redirect parameters
      const separator = checkoutUrl.includes('?') ? '&' : '?';
      const successRedirect = `${window.location.origin}/auth/payment-success`;
      
      let finalUrl = checkoutUrl;
      
      // Add email parameter for Whop to pre-fill and match the user
      if (userEmail) {
        finalUrl += `${separator}email=${encodeURIComponent(userEmail)}`;
      }
      
      // Add redirect URL for after payment completes
      const nextSeparator = finalUrl.includes('?') ? '&' : '?';
      finalUrl += `${nextSeparator}redirect_url=${encodeURIComponent(successRedirect)}`;
      
      window.location.href = finalUrl;
    } else {
      // Checkout links not configured
      alert(`Checkout link for ${plan.name} needs to be configured. Please add your Whop checkout links in the environment variables.`);
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
                  Trial Version (Restricted Access)
                </Typography>
              </Box>
              <Button
                variant="contained"
                size="small"
                sx={{
                  ml: 2,
                  bgcolor: '#0066FF',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: '#0044CC',
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

          {/* Pricing Cards */}
          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <Grid container spacing={{ xs: 1.5, md: 2 }} sx={{ maxWidth: '900px', px: { xs: 1.5, md: 0 }, justifyContent: 'center' }}>
              {/* WEEKLY PLAN */}
              <Grid item xs={12} md={4}>
                <Card
                  sx={{
                    height: '100%',
                    position: 'relative',
                    overflow: 'visible',
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.1) 0%, rgba(30, 41, 59, 0.9) 100%)',
                    border: '2px solid rgba(0, 102, 255, 0.4)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      borderColor: '#0066FF',
                      boxShadow: '0 12px 30px rgba(0, 102, 255, 0.25)',
                    },
                  }}
                >
                  <CardContent sx={{ p: { xs: 2, md: 2.5 }, textAlign: 'center' }}>
                    {/* Plan Icon */}
                    <Box
                      sx={{
                        width: 50,
                        height: 50,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #0066FF 0%, #0044CC 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 1.5,
                        boxShadow: '0 4px 16px rgba(0, 102, 255, 0.4)',
                      }}
                    >
                      <Zap size={24} color="white" />
                    </Box>
                    
                    <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#0066FF', mb: 0.5 }}>
                      Weekly
                    </Typography>
                    
                    <Box sx={{ mb: 1.5 }}>
                      <Typography component="span" sx={{ fontSize: '2.25rem', fontWeight: 800, color: 'white' }}>
                        $19
                      </Typography>
                      <Typography component="span" sx={{ fontSize: '0.9rem', color: 'text.secondary' }}>
                        /week
                      </Typography>
                    </Box>
                    
                    <Typography sx={{ color: 'text.secondary', mb: 2, fontSize: '0.8rem' }}>
                      Perfect for trying out our system
                    </Typography>
                    
                    <Stack spacing={0.75} sx={{ mb: 2.5, textAlign: 'left' }}>
                      {['Full Bot Access', 'All 7 Strategies', 'Real-time Signals', 'Performance Dashboard', 'Email Support', 'Cancel Anytime'].map((feature, i) => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircle2 size={14} color="#0066FF" />
                          <Typography sx={{ color: 'text.primary', fontSize: '0.8rem' }}>{feature}</Typography>
                        </Box>
                      ))}
                    </Stack>
                    
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => handleSelectPlan(plans[0])}
                      disabled={loading}
                      sx={{
                        py: 1,
                        borderColor: '#0066FF',
                        color: '#0066FF',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        borderWidth: 2,
                        borderRadius: 2,
                        '&:hover': {
                          borderColor: '#0066FF',
                          bgcolor: 'rgba(0, 102, 255, 0.1)',
                          borderWidth: 2,
                        },
                      }}
                    >
                      Get Access Now →
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              {/* MONTHLY PLAN - MOST POPULAR */}
              <Grid item xs={12} md={4}>
                <Card
                  sx={{
                    height: '100%',
                    position: 'relative',
                    overflow: 'visible',
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, rgba(0, 255, 0, 0.15) 0%, rgba(30, 41, 59, 0.95) 100%)',
                    border: '2px solid #22C55E',
                    transform: { md: 'scale(1.03)' },
                    transition: 'all 0.3s ease',
                    boxShadow: '0 12px 40px rgba(0, 255, 0, 0.25)',
                    '&:hover': {
                      transform: { xs: 'translateY(-4px)', md: 'scale(1.05)' },
                      boxShadow: '0 16px 50px rgba(0, 255, 0, 0.35)',
                    },
                  }}
                >
                  {/* Most Popular Badge */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                      color: '#000',
                      px: 2,
                      py: 0.5,
                      borderRadius: 50,
                      fontWeight: 700,
                      fontSize: '0.7rem',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      boxShadow: '0 4px 12px rgba(255, 215, 0, 0.4)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    🔥 Most Popular
                  </Box>
                  
                  <CardContent sx={{ p: { xs: 2, md: 2.5 }, textAlign: 'center', pt: { xs: 3, md: 3.5 } }}>
                    {/* Plan Icon */}
                    <Box
                      sx={{
                        width: 56,
                        height: 56,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 1.5,
                        boxShadow: '0 4px 20px rgba(0, 255, 0, 0.4)',
                      }}
                    >
                      <TrendingUp size={28} color="#000000" />
                    </Box>
                    
                    <Typography sx={{ fontSize: '1.2rem', fontWeight: 700, color: '#22C55E', mb: 0.5 }}>
                      Monthly
                    </Typography>
                    
                    <Box sx={{ mb: 0.5 }}>
                      <Typography component="span" sx={{ fontSize: '2.5rem', fontWeight: 800, color: 'white' }}>
                        $49
                      </Typography>
                      <Typography component="span" sx={{ fontSize: '1rem', color: 'text.secondary' }}>
                        /month
                      </Typography>
                    </Box>
                    
                    <Box sx={{ bgcolor: 'rgba(0, 255, 0, 0.2)', borderRadius: 50, px: 1.5, py: 0.25, mb: 2, display: 'inline-block' }}>
                      <Typography sx={{ color: '#22C55E', fontSize: '0.75rem', fontWeight: 600 }}>
                        Save 37% vs Weekly
                      </Typography>
                    </Box>
                    
                    <Stack spacing={0.75} sx={{ mb: 2.5, textAlign: 'left' }}>
                      {['Full Bot Access', 'All 7 Strategies', 'Priority Trade Execution', 'Advanced Analytics', '24/7 Support', 'Dedicated Account Manager'].map((feature, i) => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircle2 size={14} color="#22C55E" />
                          <Typography sx={{ color: 'text.primary', fontSize: '0.8rem', fontWeight: i === 5 ? 600 : 400 }}>{feature}</Typography>
                        </Box>
                      ))}
                    </Stack>
                    
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => handleSelectPlan(plans[1])}
                      disabled={loading}
                      sx={{
                        py: 1.25,
                        bgcolor: '#22C55E',
                        color: '#000000',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        borderRadius: 2,
                        boxShadow: '0 4px 16px rgba(0, 255, 0, 0.4)',
                        '&:hover': {
                          bgcolor: '#16A34A',
                          boxShadow: '0 8px 24px rgba(0, 255, 0, 0.5)',
                        },
                      }}
                    >
                      Get Access Now →
                    </Button>
                  </CardContent>
                </Card>
              </Grid>

              {/* QUARTERLY PLAN */}
              <Grid item xs={12} md={4}>
                <Card
                  sx={{
                    height: '100%',
                    position: 'relative',
                    overflow: 'visible',
                    borderRadius: 3,
                    background: 'linear-gradient(135deg, rgba(160, 0, 255, 0.1) 0%, rgba(30, 41, 59, 0.9) 100%)',
                    border: '2px solid rgba(160, 0, 255, 0.4)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      borderColor: '#A000FF',
                      boxShadow: '0 12px 30px rgba(160, 0, 255, 0.25)',
                    },
                  }}
                >
                  {/* Best Value Badge */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -10,
                      right: 12,
                      background: 'linear-gradient(135deg, #A000FF 0%, #7700CC 100%)',
                      color: 'white',
                      px: 1.5,
                      py: 0.35,
                      borderRadius: 50,
                      fontWeight: 700,
                      fontSize: '0.65rem',
                      textTransform: 'uppercase',
                      boxShadow: '0 4px 10px rgba(160, 0, 255, 0.4)',
                    }}
                  >
                    💎 Best Value
                  </Box>
                  
                  <CardContent sx={{ p: { xs: 2, md: 2.5 }, textAlign: 'center' }}>
                    {/* Plan Icon */}
                    <Box
                      sx={{
                        width: 50,
                        height: 50,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #A000FF 0%, #7700CC 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 1.5,
                        boxShadow: '0 4px 16px rgba(160, 0, 255, 0.4)',
                      }}
                    >
                      <Award size={24} color="white" />
                    </Box>
                    
                    <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#A000FF', mb: 0.5 }}>
                      Quarterly
                    </Typography>
                    
                    <Box sx={{ mb: 0.5 }}>
                      <Typography component="span" sx={{ fontSize: '2.25rem', fontWeight: 800, color: 'white' }}>
                        $149
                      </Typography>
                      <Typography component="span" sx={{ fontSize: '0.9rem', color: 'text.secondary' }}>
                        /3 months
                      </Typography>
                    </Box>
                    
                    <Box sx={{ bgcolor: 'rgba(160, 0, 255, 0.2)', borderRadius: 50, px: 1.5, py: 0.25, mb: 2, display: 'inline-block' }}>
                      <Typography sx={{ color: '#A000FF', fontSize: '0.75rem', fontWeight: 600 }}>
                        Save 49% vs Weekly
                      </Typography>
                    </Box>
                    
                    <Stack spacing={0.75} sx={{ mb: 2.5, textAlign: 'left' }}>
                      {['Full Bot Access', 'VIP Signal Priority', 'Custom Risk Settings', 'Exclusive Strategies', 'Priority 24/7 Support', '1-on-1 Consultation'].map((feature, i) => (
                        <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CheckCircle2 size={14} color="#A000FF" />
                          <Typography sx={{ color: 'text.primary', fontSize: '0.8rem', fontWeight: i >= 4 ? 600 : 400 }}>{feature}</Typography>
                        </Box>
                      ))}
                    </Stack>
                    
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => handleSelectPlan(plans[2])}
                      disabled={loading}
                      sx={{
                        py: 1,
                        borderColor: '#A000FF',
                        color: '#A000FF',
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        borderWidth: 2,
                        borderRadius: 2,
                        '&:hover': {
                          borderColor: '#A000FF',
                          bgcolor: 'rgba(160, 0, 255, 0.1)',
                          borderWidth: 2,
                        },
                      }}
                    >
                      Get Access Now →
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>

          {/* Money-back guarantee note - Colorful & Compact */}
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1.5,
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(0, 255, 0, 0.15) 50%, rgba(0, 102, 255, 0.15) 100%)',
                border: '2px solid transparent',
                borderImage: 'linear-gradient(135deg, #FFD700, #22C55E, #0066FF) 1',
                borderRadius: 3,
                px: 3,
                py: 1.5,
                position: 'relative',
                overflow: 'hidden',
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.05) 0%, rgba(16, 185, 129, 0.08) 50%, rgba(59, 130, 246, 0.05) 100%)',
                  borderRadius: 'inherit',
                  zIndex: 0,
                },
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #fbbf24 0%, #10b981 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <Shield size={18} color="white" />
              </Box>
              <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Typography 
                  sx={{ 
                    fontSize: '0.95rem', 
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #fbbf24 0%, #10b981 50%, #3b82f6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: 0.5,
                  }}
                >
                  🛡️ 7-Day Money-Back Guarantee
                </Typography>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.75rem', fontWeight: 500 }}>
                  No questions asked • 100% Risk-Free
                </Typography>
              </Box>
              <Box
                sx={{
                  ml: 1,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 50,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
                  position: 'relative',
                  zIndex: 1,
                }}
              >
                <Typography sx={{ color: 'white', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                  ✓ Protected
                </Typography>
              </Box>
            </Box>
          </Box>

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
