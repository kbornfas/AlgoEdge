'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  useTheme,
  alpha,
  Stack
} from '@mui/material';
import {
  Check as CheckIcon,
  TrendingUp as TrendingUpIcon,
  Speed as SpeedIcon,
  Security as SecurityIcon,
  Star as StarIcon,
  Diamond as DiamondIcon,
  Rocket as RocketIcon,
  EmojiEvents as TrophyIcon
} from '@mui/icons-material';
import { Send as TelegramIcon2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface SignalTier {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  billing_period: string;
  features: string[];
  max_signals_per_day: number | null;
  signal_delay_minutes: number;
  includes_entry: boolean;
  includes_sl_tp: boolean;
  includes_analysis: boolean;
  includes_vip_channel: boolean;
}

interface SignalStats {
  total_signals: number;
  winning_signals: number;
  losing_signals: number;
  total_pips: number;
  avg_pips: number;
  win_rate: string;
}

export default function SignalsPage() {
  const theme = useTheme();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tiers, setTiers] = useState<SignalTier[]>([]);
  const [stats, setStats] = useState<SignalStats | null>(null);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [error, setError] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
    fetchData(!!token);
  }, []);

  const fetchData = async (authenticated: boolean) => {
    try {
      // Fetch tiers
      const tiersRes = await fetch(`${API_URL}/api/signals/tiers`);
      const tiersData = await tiersRes.json();
      setTiers(tiersData.tiers || []);

      // Fetch stats
      const statsRes = await fetch(`${API_URL}/api/signals/stats`);
      const statsData = await statsRes.json();
      setStats(statsData.stats);

      // Fetch user's subscription if logged in
      if (authenticated) {
        const token = localStorage.getItem('token');
        const subRes = await fetch(`${API_URL}/api/signals/subscription`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const subData = await subRes.json();
        setCurrentSubscription(subData.subscription);
      }
    } catch (err) {
      console.error('Error fetching signal data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (tierSlug: string) => {
    if (!isAuthenticated) {
      router.push('/auth/login?redirect=/signals');
      return;
    }

    setSubscribing(tierSlug);
    setError('');

    try {
      // All tiers are now paid - redirect to checkout
      router.push(`/checkout/signals/${tierSlug}`);
    } catch (err: any) {
      setError(err.message || 'Failed to subscribe');
    } finally {
      setSubscribing(null);
    }
  };

  const getTierIcon = (slug: string) => {
    switch (slug) {
      case 'starter': return <TrendingUpIcon />;
      case 'basic': return <StarIcon />;
      case 'premium': return <DiamondIcon />;
      case 'vip': return <TrophyIcon />;
      default: return <TrendingUpIcon />;
    }
  };

  const getTierColor = (slug: string) => {
    switch (slug) {
      case 'starter': return '#64748B';
      case 'basic': return '#3B82F6';
      case 'premium': return '#8B5CF6';
      case 'vip': return '#F59E0B';
      default: return theme.palette.primary.main;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'background.default', minHeight: '100vh', py: 8 }}>
      <Container maxWidth="lg">
        {/* Hero Section */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Chip
            icon={<TelegramIcon2 size={16} />}
            label="Telegram Signal Service"
            sx={{ mb: 2, bgcolor: alpha('#0088cc', 0.1), color: '#0088cc' }}
          />
          <Typography variant="h2" fontWeight={800} gutterBottom>
            Professional Trading Signals
          </Typography>
          <Typography variant="h5" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto', mb: 4 }}>
            Get real-time trading signals delivered directly to your Telegram.
            Join thousands of profitable traders.
          </Typography>

          {/* Stats Bar */}
          {stats && (
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.1)} 100%)`,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                maxWidth: 800,
                mx: 'auto'
              }}
            >
              <Grid container spacing={3}>
                <Grid item xs={6} md={3}>
                  <Typography variant="h4" fontWeight={700} color="primary">
                    {stats.win_rate}%
                  </Typography>
                  <Typography color="text.secondary">Win Rate</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="h4" fontWeight={700} sx={{ color: '#22C55E' }}>
                    +{Number(stats.total_pips).toFixed(0)}
                  </Typography>
                  <Typography color="text.secondary">Total Pips</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="h4" fontWeight={700}>
                    {stats.total_signals}
                  </Typography>
                  <Typography color="text.secondary">Signals (30d)</Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="h4" fontWeight={700} sx={{ color: '#3B82F6' }}>
                    +{Number(stats.avg_pips).toFixed(1)}
                  </Typography>
                  <Typography color="text.secondary">Avg Pips/Trade</Typography>
                </Grid>
              </Grid>
            </Paper>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 4 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Pricing Tiers */}
        <Grid container spacing={3} justifyContent="center">
          {tiers.map((tier) => {
            const isCurrentPlan = currentSubscription?.tier_slug === tier.slug;
            const tierColor = getTierColor(tier.slug);
            const isPopular = tier.slug === 'premium';
            const features = typeof tier.features === 'string' 
              ? JSON.parse(tier.features) 
              : tier.features;

            return (
              <Grid item xs={12} sm={6} md={3} key={tier.id}>
                <Card
                  sx={{
                    height: '100%',
                    position: 'relative',
                    borderRadius: 3,
                    border: isPopular ? `2px solid ${tierColor}` : `1px solid ${alpha(tierColor, 0.3)}`,
                    transition: 'all 0.3s ease',
                    transform: isPopular ? 'scale(1.05)' : 'none',
                    '&:hover': {
                      transform: isPopular ? 'scale(1.08)' : 'scale(1.03)',
                      boxShadow: `0 20px 40px ${alpha(tierColor, 0.2)}`
                    }
                  }}
                >
                  {isPopular && (
                    <Chip
                      label="MOST POPULAR"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: -12,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        bgcolor: tierColor,
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '0.7rem'
                      }}
                    />
                  )}
                  
                  <CardContent sx={{ p: 3 }}>
                    {/* Tier Header */}
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      <Box
                        sx={{
                          width: 60,
                          height: 60,
                          borderRadius: '50%',
                          bgcolor: alpha(tierColor, 0.1),
                          color: tierColor,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mx: 'auto',
                          mb: 2,
                          fontSize: 28
                        }}
                      >
                        {getTierIcon(tier.slug)}
                      </Box>
                      <Typography variant="h5" fontWeight={700}>
                        {tier.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {tier.description}
                      </Typography>
                    </Box>

                    {/* Price */}
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                      <Typography variant="h3" fontWeight={800} sx={{ color: tierColor }}>
                        ${tier.price}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        per {tier.billing_period}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Features */}
                    <List dense sx={{ mb: 2 }}>
                      {features.map((feature: string, idx: number) => (
                        <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                          <ListItemIcon sx={{ minWidth: 32 }}>
                            <CheckIcon sx={{ color: '#22C55E', fontSize: 20 }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={feature}
                            primaryTypographyProps={{
                              variant: 'body2',
                              color: 'text.secondary'
                            }}
                          />
                        </ListItem>
                      ))}
                    </List>

                    {/* Key Benefits */}
                    <Stack spacing={1} sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SpeedIcon sx={{ fontSize: 18, color: tier.signal_delay_minutes === 0 ? '#22C55E' : '#F59E0B' }} />
                        <Typography variant="body2" color="text.secondary">
                          {tier.signal_delay_minutes === 0 ? 'Real-time delivery' : `${tier.signal_delay_minutes} min delay`}
                        </Typography>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <SecurityIcon sx={{ fontSize: 18, color: tier.includes_sl_tp ? '#22C55E' : '#94A3B8' }} />
                        <Typography variant="body2" color="text.secondary">
                          {tier.includes_sl_tp ? 'Full SL/TP levels' : 'Entry price only'}
                        </Typography>
                      </Box>
                    </Stack>

                    {/* CTA Button */}
                    <Button
                      fullWidth
                      variant={isCurrentPlan ? 'outlined' : 'contained'}
                      disabled={isCurrentPlan || subscribing === tier.slug}
                      onClick={() => handleSubscribe(tier.slug)}
                      sx={{
                        py: 1.5,
                        borderRadius: 2,
                        bgcolor: isCurrentPlan ? 'transparent' : tierColor,
                        borderColor: tierColor,
                        color: isCurrentPlan ? tierColor : 'white',
                        fontWeight: 600,
                        '&:hover': {
                          bgcolor: isCurrentPlan ? alpha(tierColor, 0.1) : alpha(tierColor, 0.9)
                        }
                      }}
                    >
                      {subscribing === tier.slug ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : isCurrentPlan ? (
                        'Current Plan'
                      ) : (
                        `Get ${tier.name}`
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* FREE Telegram Community Channel */}
        <Box sx={{ mt: 8 }}>
          <Paper
            elevation={0}
            sx={{
              p: 4,
              borderRadius: 3,
              border: `2px dashed ${alpha('#0088cc', 0.4)}`,
              background: alpha('#0088cc', 0.05),
              textAlign: 'center'
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                bgcolor: alpha('#0088cc', 0.1),
                color: '#0088cc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: 2
              }}
            >
              <TelegramIcon2 size={40} />
            </Box>
            <Chip label="100% FREE" color="success" sx={{ mb: 2 }} />
            <Typography variant="h5" fontWeight={700} gutterBottom>
              Join Our Free Telegram Community
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
              Get trading tips, market updates, and community support absolutely free. 
              No payment required - this is our gift to the trading community!
            </Typography>
            <Button
              variant="contained"
              size="large"
              href={process.env.NEXT_PUBLIC_TELEGRAM_FREE_CHANNEL || "https://t.me/AlgoEdgeSignals"}
              target="_blank"
              startIcon={<TelegramIcon2 size={20} />}
              sx={{
                bgcolor: '#0088cc',
                '&:hover': { bgcolor: '#0077b5' },
                px: 4
              }}
            >
              Join Free Channel
            </Button>
          </Paper>
        </Box>

        {/* How It Works */}
        <Box sx={{ mt: 10 }}>
          <Typography variant="h4" fontWeight={700} textAlign="center" gutterBottom>
            How It Works
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center" sx={{ mb: 6 }}>
            Start receiving professional trading signals in 3 easy steps
          </Typography>

          <Grid container spacing={4}>
            {[
              {
                step: 1,
                title: 'Choose Your Plan',
                description: 'Select a signal tier that fits your trading style and budget.',
                icon: <DiamondIcon sx={{ fontSize: 40 }} />
              },
              {
                step: 2,
                title: 'Connect Telegram',
                description: 'Link your Telegram account to receive instant notifications.',
                icon: <TelegramIcon2 size={40} />
              },
              {
                step: 3,
                title: 'Trade & Profit',
                description: 'Receive signals, execute trades, and grow your account.',
                icon: <RocketIcon sx={{ fontSize: 40 }} />
              }
            ].map((item) => (
              <Grid item xs={12} md={4} key={item.step}>
                <Paper
                  elevation={0}
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    borderRadius: 3,
                    border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                    height: '100%'
                  }}
                >
                  <Box
                    sx={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      bgcolor: alpha(theme.palette.primary.main, 0.1),
                      color: 'primary.main',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 3
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Typography variant="overline" color="primary" fontWeight={600}>
                    Step {item.step}
                  </Typography>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    {item.title}
                  </Typography>
                  <Typography color="text.secondary">
                    {item.description}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* CTA Section */}
        <Box
          sx={{
            mt: 10,
            p: 6,
            borderRadius: 4,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
            textAlign: 'center',
            color: 'white'
          }}
        >
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Ready to Start Trading Smarter?
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, mb: 4 }}>
            Choose a plan that fits your trading style and start receiving professional signals today.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
            <Button
              variant="contained"
              size="large"
              onClick={() => router.push('/auth/register?redirect=/signals')}
              sx={{
                bgcolor: 'white',
                color: theme.palette.primary.main,
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                '&:hover': {
                  bgcolor: alpha('#fff', 0.9)
                }
              }}
            >
              Create Account
            </Button>
            <Button
              variant="outlined"
              size="large"
              href={process.env.NEXT_PUBLIC_TELEGRAM_FREE_CHANNEL || "https://t.me/AlgoEdgeSignals"}
              target="_blank"
              startIcon={<TelegramIcon2 size={20} />}
              sx={{
                borderColor: 'white',
                color: 'white',
                px: 4,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 600,
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: alpha('#fff', 0.1)
                }
              }}
            >
              Try Free Channel First
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
