'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface SubscriptionStatus {
  status: 'trial' | 'active' | 'expired' | 'cancelled';
  plan: string | null;
  expiresAt: string | null;
  isActive: boolean;
}

interface SubscriptionContextType {
  subscription: SubscriptionStatus;
  loading: boolean;
  error: string | null;
  refreshSubscription: () => Promise<void>;
  hasAccess: boolean;
}

const defaultSubscription: SubscriptionStatus = {
  status: 'trial',
  plan: null,
  expiresAt: null,
  isActive: false,
};

const SubscriptionContext = createContext<SubscriptionContextType>({
  subscription: defaultSubscription,
  loading: true,
  error: null,
  refreshSubscription: async () => {},
  hasAccess: false,
});

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

interface SubscriptionProviderProps {
  children: ReactNode;
}

export const SubscriptionProvider: React.FC<SubscriptionProviderProps> = ({ children }) => {
  const [subscription, setSubscription] = useState<SubscriptionStatus>(defaultSubscription);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubscriptionStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setSubscription(defaultSubscription);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/subscription/status', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription status');
      }

      const data = await response.json();
      setSubscription(data);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription');
      setSubscription(defaultSubscription);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  // Check if user has full access (active subscription)
  const hasAccess = subscription.isActive || subscription.status === 'active';

  const value: SubscriptionContextType = {
    subscription,
    loading,
    error,
    refreshSubscription: fetchSubscriptionStatus,
    hasAccess,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export default SubscriptionContext;
