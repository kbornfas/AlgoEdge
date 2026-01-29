'use client';

import { useEffect, useState } from 'react';
import { Box, Typography, LinearProgress, Chip, alpha, Button } from '@mui/material';
import { Clock, Crown, AlertTriangle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

interface SubscriptionCountdownProps {
  expiresAt: string | null;
  plan: string | null;
  isExpired: boolean;
  isActive: boolean;
}

export default function SubscriptionCountdown({ 
  expiresAt, 
  plan, 
  isExpired, 
  isActive 
}: SubscriptionCountdownProps) {
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    if (!expiresAt || isExpired) {
      setDaysRemaining(null);
      return;
    }

    const calculateTimeRemaining = () => {
      const now = new Date();
      const expiry = new Date(expiresAt);
      const diff = expiry.getTime() - now.getTime();
      
      if (diff <= 0) {
        setDaysRemaining(0);
        setTimeRemaining('Expired');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      setDaysRemaining(days);
      
      if (days > 0) {
        setTimeRemaining(`${days}d ${hours}h remaining`);
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m remaining`);
      } else {
        setTimeRemaining(`${minutes}m remaining`);
      }
    };

    calculateTimeRemaining();
    const interval = setInterval(calculateTimeRemaining, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [expiresAt, isExpired]);

  // Not subscribed
  if (!isActive && !isExpired) {
    return (
      <Box
        sx={{
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          borderRadius: 3,
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Crown size={24} style={{ color: '#3B82F6' }} />
          <Box>
            <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
              Unlock Premium Features
            </Typography>
            <Typography variant="caption" sx={{ color: '#94a3b8' }}>
              Subscribe to access all trading tools
            </Typography>
          </Box>
        </Box>
        <Button
          component={Link}
          href="/auth/pricing"
          variant="contained"
          size="small"
          sx={{
            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
            fontWeight: 600,
            textTransform: 'none',
          }}
        >
          Subscribe
        </Button>
      </Box>
    );
  }

  // Expired
  if (isExpired) {
    return (
      <Box
        sx={{
          background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(220, 38, 38, 0.05) 100%)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 3,
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AlertTriangle size={24} style={{ color: '#EF4444' }} />
          <Box>
            <Typography variant="body2" sx={{ color: '#EF4444', fontWeight: 600 }}>
              Subscription Expired
            </Typography>
            <Typography variant="caption" sx={{ color: '#f87171' }}>
              Your {plan} plan has expired
            </Typography>
          </Box>
        </Box>
        <Button
          component={Link}
          href="/auth/pricing"
          variant="contained"
          size="small"
          sx={{
            background: 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
            fontWeight: 600,
            textTransform: 'none',
          }}
        >
          Renew Now
        </Button>
      </Box>
    );
  }

  // Active subscription - show countdown
  const urgencyLevel = daysRemaining !== null 
    ? daysRemaining <= 3 ? 'critical' 
    : daysRemaining <= 7 ? 'warning' 
    : 'normal'
    : 'normal';

  const getColors = () => {
    switch (urgencyLevel) {
      case 'critical':
        return {
          bg: 'rgba(239, 68, 68, 0.1)',
          border: 'rgba(239, 68, 68, 0.3)',
          text: '#EF4444',
          progress: '#EF4444',
          icon: '#EF4444',
        };
      case 'warning':
        return {
          bg: 'rgba(245, 158, 11, 0.1)',
          border: 'rgba(245, 158, 11, 0.3)',
          text: '#F59E0B',
          progress: '#F59E0B',
          icon: '#F59E0B',
        };
      default:
        return {
          bg: 'rgba(16, 185, 129, 0.1)',
          border: 'rgba(16, 185, 129, 0.3)',
          text: '#10B981',
          progress: '#10B981',
          icon: '#10B981',
        };
    }
  };

  const colors = getColors();

  // Calculate progress (assume 30-day month cycle)
  const progressPercent = daysRemaining !== null 
    ? Math.max(0, Math.min(100, (daysRemaining / 30) * 100))
    : 100;

  return (
    <Box
      sx={{
        background: `linear-gradient(135deg, ${colors.bg} 0%, ${alpha(colors.bg, 0.5)} 100%)`,
        border: `1px solid ${colors.border}`,
        borderRadius: 3,
        p: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {urgencyLevel === 'normal' ? (
            <CheckCircle size={20} style={{ color: colors.icon }} />
          ) : (
            <Clock size={20} style={{ color: colors.icon }} />
          )}
          <Typography variant="body2" sx={{ color: 'white', fontWeight: 600 }}>
            {plan?.charAt(0).toUpperCase() + plan?.slice(1)} Plan
          </Typography>
          <Chip
            label={isActive ? 'Active' : 'Inactive'}
            size="small"
            sx={{
              bgcolor: alpha(colors.text, 0.15),
              color: colors.text,
              fontWeight: 600,
              height: 22,
              fontSize: '0.7rem',
            }}
          />
        </Box>
        <Typography variant="caption" sx={{ color: colors.text, fontWeight: 600 }}>
          {timeRemaining}
        </Typography>
      </Box>

      <LinearProgress
        variant="determinate"
        value={progressPercent}
        sx={{
          height: 6,
          borderRadius: 3,
          bgcolor: 'rgba(255,255,255,0.1)',
          '& .MuiLinearProgress-bar': {
            bgcolor: colors.progress,
            borderRadius: 3,
          },
        }}
      />

      {daysRemaining !== null && daysRemaining <= 7 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
          <Button
            component={Link}
            href="/auth/pricing"
            size="small"
            sx={{
              color: colors.text,
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.75rem',
              '&:hover': {
                bgcolor: alpha(colors.text, 0.1),
              },
            }}
          >
            Renew Early →
          </Button>
        </Box>
      )}

      {expiresAt && (
        <Typography variant="caption" sx={{ color: '#64748b', mt: 1, display: 'block' }}>
          Expires: {new Date(expiresAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Typography>
      )}
    </Box>
  );
}
