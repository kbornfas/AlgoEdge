'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export default function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);

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
        
        // User has access if subscription is active
        const active = data.isActive || data.status === 'active';
        setHasAccess(active);
        
        // If not active, redirect to pricing page
        if (!active) {
          router.push('/auth/pricing');
          return;
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        setHasAccess(false);
        router.push('/auth/pricing');
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

  // If user doesn't have active subscription, redirect to pricing (handled above)
  if (!hasAccess) {
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

  // User has access, render children
  return <>{children}</>;
}
