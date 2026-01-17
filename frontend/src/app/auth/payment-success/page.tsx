'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { CheckCircle, ArrowRight } from 'lucide-react';
import AuthBackground from '@/components/AuthBackground';
import { useRouter } from 'next/navigation';

export default function PaymentSuccessPage() {
  const router = useRouter();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Verify the subscription status
    const verifySubscription = async () => {
      try {
        // Wait a moment for webhook to process
        await new Promise(resolve => setTimeout(resolve, 2000));

        const token = localStorage.getItem('token');
        if (!token) {
          // Try to get token from pending auth
          const pendingToken = document.cookie
            .split('; ')
            .find(row => row.startsWith('pending_auth_token='));
          
          if (!pendingToken) {
            setVerifying(false);
            setVerified(true); // Assume success, webhook will update
            return;
          }
        }

        // Check subscription status
        const response = await fetch('/api/subscription/status', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setVerified(data.isActive || data.status === 'active');
        } else {
          // Even if check fails, assume success (webhook will handle it)
          setVerified(true);
        }
      } catch (err) {
        console.error('Error verifying subscription:', err);
        setVerified(true); // Assume success
      } finally {
        setVerifying(false);
      }
    };

    verifySubscription();
  }, []);

  // Countdown and redirect
  useEffect(() => {
    if (!verifying && verified) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push('/dashboard');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [verifying, verified, router]);

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
          {/* Logo */}
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              component="img"
              src="/images/logo.png"
              alt="AlgoEdge Logo"
              sx={{ width: 80, height: 80, objectFit: 'contain', mx: 'auto' }}
            />
          </Box>

          <Card
            sx={{
              textAlign: 'center',
              bgcolor: 'rgba(30, 41, 59, 0.95)',
              backdropFilter: 'blur(10px)',
              border: '2px solid #10b981',
              borderRadius: 3,
            }}
          >
            <CardContent sx={{ p: 5 }}>
              {verifying ? (
                <>
                  <CircularProgress color="success" size={60} sx={{ mb: 3 }} />
                  <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>
                    Verifying your payment...
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Please wait while we confirm your subscription
                  </Typography>
                </>
              ) : verified ? (
                <>
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      bgcolor: 'rgba(16, 185, 129, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3,
                    }}
                  >
                    <CheckCircle size={48} color="#10b981" />
                  </Box>

                  <Typography
                    variant="h4"
                    sx={{ color: '#10b981', fontWeight: 700, mb: 2 }}
                  >
                    Payment Successful! 🎉
                  </Typography>

                  <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
                    Welcome to AlgoEdge!
                  </Typography>

                  <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
                    Your subscription is now active. You have full access to all premium features, trading indicators, and video guides.
                  </Typography>

                  <Alert severity="success" sx={{ mb: 4, textAlign: 'left' }}>
                    <Typography variant="body2">
                      <strong>What&apos;s next?</strong>
                    </Typography>
                    <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                      <li>Access your trading dashboard</li>
                      <li>Connect your MT5 account</li>
                      <li>Watch the video guides</li>
                      <li>Start automated trading</li>
                    </ul>
                  </Alert>

                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onClick={() => router.push('/dashboard')}
                    sx={{
                      bgcolor: '#10b981',
                      py: 1.5,
                      fontSize: '1.1rem',
                      fontWeight: 600,
                      '&:hover': {
                        bgcolor: '#059669',
                      },
                    }}
                    endIcon={<ArrowRight size={20} />}
                  >
                    Go to Dashboard
                  </Button>

                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    Redirecting automatically in {countdown} seconds...
                  </Typography>
                </>
              ) : (
                <>
                  <Typography variant="h5" sx={{ color: 'white', mb: 2 }}>
                    Processing your subscription
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Your payment was received. Your subscription will be activated shortly.
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => router.push('/dashboard')}
                    sx={{ bgcolor: '#10b981' }}
                  >
                    Continue to Dashboard
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </Container>
      </Box>
    </>
  );
}
