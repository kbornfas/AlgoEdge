'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Box, CircularProgress } from '@mui/material';

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

// Premium pages that require subscription
const PREMIUM_PAGES = [
  '/dashboard/signals',
  '/dashboard/robots',
  '/dashboard/copy-trading',
  '/dashboard/analytics',
  '/dashboard/history',
  '/dashboard/mt5',
  '/dashboard/learning-hub',
  '/dashboard/news',
  '/dashboard/community',
];

/**
 * SubscriptionGuard - Authentication and subscription wrapper for dashboard
 * 
 * - Checks if user is authenticated (has valid token)
 * - Redirects to pricing page if unsubscribed user tries to access premium pages
 */
export default function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  // Wait for client-side mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    
    const checkAuth = async () => {
      // Quick synchronous check for token
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      if (!token) {
        router.push('/auth/login');
        return;
      }
      
      setIsAuthenticated(true);

      // Check if current page is a premium page
      const isPremiumPage = PREMIUM_PAGES.some(page => pathname?.startsWith(page));
      
      if (!isPremiumPage) {
        // Non-premium page - allow access immediately
        setIsChecking(false);
        return;
      }

      // Premium page - need to check subscription
      try {
        const response = await fetch('/api/subscription/status', {
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          const hasSubscription = data.isActive || data.status === 'active';
          setIsSubscribed(hasSubscription);
          
          if (!hasSubscription) {
            // Redirect to pricing page
            router.push('/auth/pricing');
            return;
          }
        } else {
          // Error checking subscription - redirect to pricing
          router.push('/auth/pricing');
          return;
        }
      } catch (error) {
        console.error('Error checking subscription:', error);
        router.push('/auth/pricing');
        return;
      }
      
      setIsChecking(false);
    };

    checkAuth();
  }, [router, pathname, isMounted]);

  // Still checking or not mounted yet
  if (!isMounted || isChecking || isAuthenticated === null) {
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
        <CircularProgress color="primary" size={32} />
      </Box>
    );
  }

  // Not authenticated - will redirect (handled in useEffect)
  if (!isAuthenticated) {
    return null;
  }

  // Authenticated and allowed - render dashboard
  return <>{children}</>;
}
