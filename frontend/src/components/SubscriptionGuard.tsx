'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Box, CircularProgress, Typography, Container, Paper, Button, Alert } from '@mui/material';
import { Lock, ArrowRight } from 'lucide-react';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export default function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('trial');

  useEffect(() => {
    const checkSubscription = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          // No token - redirect to login
          router.push('/auth/login');
          return;
        }

        // Check subscription status
        const response = await fetch('/api/subscription/status', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to check subscription');
        }

        const data = await response.json();
        setSubscriptionStatus(data.status);
        
        // User has access if subscription is active
        const active = data.isActive || data.status === 'active';
        setHasAccess(active);
        
        // If not active, show restricted access page instead of redirecting
        // This way the user sees they need to subscribe
      } catch (error) {
        console.error('Error checking subscription:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkSubscription();
  }, [router, pathname]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress color="primary" />
      </Box>
    );
  }

  // If user doesn't have active subscription, show restricted access banner with pricing redirect
  if (!hasAccess) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        {/* Restricted Access Banner */}
        <Paper
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 1100,
            bgcolor: 'rgba(239, 68, 68, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: 0,
            py: 2,
            px: 3,
          }}
        >
          <Container maxWidth="lg">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 2,
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Lock size={24} color="white" />
                <Box>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                    Trial Version (Restricted Access)
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                    Subscribe to unlock the automated trading bot and all premium features
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                onClick={() => router.push('/auth/pricing')}
                sx={{
                  bgcolor: 'white',
                  color: '#ef4444',
                  fontWeight: 600,
                  px: 3,
                  '&:hover': {
                    bgcolor: 'rgba(255,255,255,0.9)',
                  },
                }}
                endIcon={<ArrowRight size={18} />}
              >
                Upgrade Now
              </Button>
            </Box>
          </Container>
        </Paper>

        {/* Restricted Content Overlay */}
        <Container maxWidth="lg" sx={{ py: 8 }}>
          <Paper
            sx={{
              p: 6,
              textAlign: 'center',
              bgcolor: 'background.paper',
              borderRadius: 3,
              border: '2px solid',
              borderColor: 'error.main',
            }}
          >
            <Lock size={64} color="#ef4444" style={{ marginBottom: 24 }} />
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, color: 'error.main' }}>
              Access Restricted
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}>
              You&apos;re currently on the trial version. To access the automated trading bot, real-time signals, and all premium features, please subscribe to one of our plans.
            </Typography>
            
            <Alert severity="info" sx={{ mb: 4, maxWidth: 500, mx: 'auto', textAlign: 'left' }}>
              <Typography variant="body2">
                <strong>What you&apos;ll get with a subscription:</strong>
              </Typography>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                <li>Fully Automated Trading Bot</li>
                <li>Real-time Trading Signals</li>
                <li>Multi-pair Support (Forex & Crypto)</li>
                <li>Risk Management Tools</li>
                <li>24/7 Automated Trading</li>
              </ul>
            </Alert>

            <Button
              variant="contained"
              size="large"
              onClick={() => router.push('/auth/pricing')}
              sx={{
                bgcolor: '#10b981',
                px: 6,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: '#059669',
                },
              }}
              endIcon={<ArrowRight size={20} />}
            >
              View Pricing Plans
            </Button>

            <Box sx={{ mt: 3 }}>
              <Button
                variant="text"
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('user');
                  router.push('/auth/login');
                }}
                sx={{ color: 'text.secondary' }}
              >
                Sign out and use a different account
              </Button>
            </Box>
          </Paper>
        </Container>
      </Box>
    );
  }

  // User has access - render children
  return <>{children}</>;
}
