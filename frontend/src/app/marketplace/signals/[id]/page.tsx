'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  Avatar,
  Rating,
  Divider,
  Paper,
  Tab,
  Tabs,
  Alert,
  CircularProgress,
  Breadcrumbs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import {
  Signal,
  ArrowLeft,
  Star,
  Users,
  TrendingUp,
  ChevronRight,
  MessageSquare,
  Target,
  Shield,
  Clock,
  BarChart3,
  AlertTriangle,
  Check,
  CheckCircle,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface ProviderDetails {
  id: number;
  user_id: number;
  name: string;
  description: string;
  bio: string;
  avatar_url: string;
  trading_style: string;
  risk_level: string;
  instruments: string[];
  performance_stats: {
    win_rate: number;
    total_pips: number;
    avg_pips_per_trade: number;
    total_signals: number;
    best_month_pips: number;
    worst_month_pips: number;
  };
  pricing: {
    monthly: number;
    quarterly: number;
    yearly: number;
    lifetime: number;
  };
  total_subscribers: number;
  avg_rating: number;
  total_reviews: number;
  is_verified: boolean;
  created_at: string;
}

interface RecentSignal {
  id: number;
  symbol: string;
  signal_type: string;
  entry_price: number;
  stop_loss: number;
  take_profit_1: number;
  status: string;
  pips_result: number;
  created_at: string;
}

interface Review {
  id: number;
  user_name: string;
  rating: number;
  title: string;
  review: string;
  created_at: string;
  avatar?: string;
}

// Profile images for demo reviews
const reviewerImages: Record<number, string> = {
  1: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face',
  2: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&h=60&fit=crop&crop=face',
  3: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=60&h=60&fit=crop&crop=face',
  4: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=60&h=60&fit=crop&crop=face',
  5: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face',
};

// Demo signal provider data
const demoProviders: Record<string, ProviderDetails> = {
  '1': {
    id: 1,
    user_id: 1,
    name: 'GoldMaster Pro',
    description: 'Professional XAUUSD trader with 5+ years experience. Specialized in technical analysis and price action trading. Our signals focus on high-probability setups during London and New York sessions, combining order flow analysis with smart money concepts.',
    bio: 'Professional XAUUSD trader with 5+ years experience.',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    trading_style: 'Day Trading',
    risk_level: 'Moderate',
    instruments: ['XAUUSD', 'XAGUSD'],
    performance_stats: {
      win_rate: 78.5,
      total_pips: 12450,
      avg_pips_per_trade: 45,
      total_signals: 850,
      best_month_pips: 1250,
      worst_month_pips: 180,
    },
    pricing: {
      monthly: 49,
      quarterly: 129,
      yearly: 449,
      lifetime: 999,
    },
    total_subscribers: 234,
    avg_rating: 4.8,
    total_reviews: 89,
    is_verified: true,
    created_at: '2023-01-15',
  },
  '2': {
    id: 2,
    user_id: 2,
    name: 'Forex Elite',
    description: 'Former institutional trader. Focus on major currency pairs with strict risk management. Our team combines technical analysis, fundamental insights, and institutional-grade strategies to deliver high-probability trade setups.',
    bio: 'Former institutional trader with strict risk management.',
    avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&h=150&fit=crop&crop=face',
    trading_style: 'Swing Trading',
    risk_level: 'Conservative',
    instruments: ['EURUSD', 'GBPUSD', 'USDJPY'],
    performance_stats: {
      win_rate: 72.3,
      total_pips: 8920,
      avg_pips_per_trade: 65,
      total_signals: 420,
      best_month_pips: 980,
      worst_month_pips: 120,
    },
    pricing: {
      monthly: 79,
      quarterly: 199,
      yearly: 699,
      lifetime: 1499,
    },
    total_subscribers: 456,
    avg_rating: 4.9,
    total_reviews: 156,
    is_verified: true,
    created_at: '2023-06-20',
  },
  '3': {
    id: 3,
    user_id: 3,
    name: 'Scalp King',
    description: 'High-frequency scalper specializing in volatile market conditions. Our scalping strategies target quick profits with tight stop losses, perfect for traders who prefer active trading during high-volatility sessions.',
    bio: 'High-frequency scalper specializing in volatile markets.',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    trading_style: 'Scalping',
    risk_level: 'Aggressive',
    instruments: ['XAUUSD', 'EURUSD'],
    performance_stats: {
      win_rate: 68.9,
      total_pips: 15670,
      avg_pips_per_trade: 25,
      total_signals: 1200,
      best_month_pips: 1800,
      worst_month_pips: -150,
    },
    pricing: {
      monthly: 39,
      quarterly: 99,
      yearly: 349,
      lifetime: 799,
    },
    total_subscribers: 189,
    avg_rating: 4.6,
    total_reviews: 67,
    is_verified: true,
    created_at: '2023-08-10',
  },
  '4': {
    id: 4,
    user_id: 4,
    name: 'Smart Money Trader',
    description: 'ICT/Smart Money Concepts specialist. Focusing on liquidity sweeps and order blocks. We teach you to trade like institutions by identifying where smart money enters and exits positions.',
    bio: 'ICT/Smart Money Concepts specialist.',
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face',
    trading_style: 'Day Trading',
    risk_level: 'Moderate',
    instruments: ['XAUUSD', 'NAS100', 'US30'],
    performance_stats: {
      win_rate: 75.2,
      total_pips: 9840,
      avg_pips_per_trade: 55,
      total_signals: 560,
      best_month_pips: 1100,
      worst_month_pips: 90,
    },
    pricing: {
      monthly: 59,
      quarterly: 149,
      yearly: 499,
      lifetime: 1199,
    },
    total_subscribers: 312,
    avg_rating: 4.7,
    total_reviews: 98,
    is_verified: true,
    created_at: '2023-04-15',
  },
};

// Demo reviews
const demoReviews: Review[] = [
  {
    id: 1,
    user_name: 'Michael T.',
    rating: 5,
    title: 'Best signals I\'ve used!',
    review: 'Been following for 3 months now and my account has grown 35%. The risk management is excellent and the analysis provided with each signal helps me learn.',
    created_at: '2026-01-20',
    avatar: reviewerImages[1],
  },
  {
    id: 2,
    user_name: 'Sarah K.',
    rating: 5,
    title: 'Highly recommended for beginners',
    review: 'I\'m new to trading and these signals have been perfect for learning. Clear entry/exit points and the Telegram group is very supportive.',
    created_at: '2026-01-18',
    avatar: reviewerImages[2],
  },
  {
    id: 3,
    user_name: 'David R.',
    rating: 4,
    title: 'Solid performance',
    review: 'Good win rate and reasonable risk per trade. Only giving 4 stars because sometimes signals come during off-hours for my timezone.',
    created_at: '2026-01-15',
    avatar: reviewerImages[3],
  },
  {
    id: 4,
    user_name: 'Emma L.',
    rating: 5,
    title: 'Finally, signals that actually work',
    review: 'After trying 3 other signal providers that were scams, I finally found one that delivers. The transparency and track record verification give me confidence.',
    created_at: '2026-01-12',
    avatar: reviewerImages[4],
  },
  {
    id: 5,
    user_name: 'James O.',
    rating: 5,
    title: 'Professional service',
    review: 'The technical analysis shared with each signal is top-notch. I\'ve learned so much about reading charts just from following their setups.',
    created_at: '2026-01-10',
    avatar: reviewerImages[5],
  },
];

// Demo recent signals
const demoSignals: RecentSignal[] = [
  { id: 1, symbol: 'XAUUSD', signal_type: 'BUY', entry_price: 2035.50, stop_loss: 2028.00, take_profit_1: 2050.00, status: 'tp1_hit', pips_result: 145, created_at: '2026-01-24' },
  { id: 2, symbol: 'EURUSD', signal_type: 'SELL', entry_price: 1.0892, stop_loss: 1.0920, take_profit_1: 1.0850, status: 'tp1_hit', pips_result: 42, created_at: '2026-01-24' },
  { id: 3, symbol: 'GBPUSD', signal_type: 'BUY', entry_price: 1.2720, stop_loss: 1.2680, take_profit_1: 1.2780, status: 'active', pips_result: 0, created_at: '2026-01-25' },
  { id: 4, symbol: 'US30', signal_type: 'BUY', entry_price: 38250, stop_loss: 38100, take_profit_1: 38500, status: 'tp2_hit', pips_result: 250, created_at: '2026-01-23' },
  { id: 5, symbol: 'XAUUSD', signal_type: 'SELL', entry_price: 2055.00, stop_loss: 2065.00, take_profit_1: 2040.00, status: 'sl_hit', pips_result: -100, created_at: '2026-01-22' },
];

export default function SignalProviderPage() {
  const params = useParams();
  const router = useRouter();
  const providerId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<ProviderDetails | null>(null);
  const [recentSignals, setRecentSignals] = useState<RecentSignal[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'quarterly' | 'yearly' | 'lifetime'>('monthly');
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (providerId) {
      fetchProviderDetails();
    }
  }, [providerId]);

  const fetchProviderDetails = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/signals/providers/${providerId}`);
      if (res.ok) {
        const data = await res.json();
        setProvider(data.provider);
        setRecentSignals(data.recent_signals || demoSignals);
        setReviews(data.reviews?.length > 0 ? data.reviews : demoReviews);
      } else {
        // Use demo data as fallback
        if (demoProviders[providerId]) {
          setProvider(demoProviders[providerId]);
          setRecentSignals(demoSignals);
          setReviews(demoReviews);
        } else {
          setError('Provider not found');
        }
      }
    } catch (error) {
      console.error('Error fetching provider:', error);
      // Use demo data as fallback on network error
      if (demoProviders[providerId]) {
        setProvider(demoProviders[providerId]);
        setRecentSignals(demoSignals);
        setReviews(demoReviews);
      } else {
        setError('Failed to load provider details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login?redirect=/marketplace/signals/' + providerId);
      return;
    }

    setSubscribing(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/signals/providers/${providerId}/subscribe`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ plan_type: selectedPlan }),
      });
      
      const data = await res.json();
      if (res.ok) {
        if (data.payment_url) {
          window.location.href = data.payment_url;
        } else {
          router.push('/dashboard/signals');
        }
      } else {
        setError(data.error || 'Failed to subscribe');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  const getSelectedPrice = () => {
    if (!provider?.pricing) return 0;
    return provider.pricing[selectedPlan] || 0;
  };

  const getRiskColor = (risk: string) => {
    switch (risk?.toLowerCase()) {
      case 'low': return '#22C55E';
      case 'medium': return '#F59E0B';
      case 'high': return '#EF4444';
      default: return '#8B5CF6';
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#8B5CF6' }} />
      </Box>
    );
  }

  if (error || !provider) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', py: 8 }}>
        <Container maxWidth="md">
          <Alert severity="error" sx={{ mb: 3 }}>{error || 'Provider not found'}</Alert>
          <Button component={Link} href="/marketplace/signals" startIcon={<ArrowLeft size={18} />}>
            Back to Signal Providers
          </Button>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a' }}>
      {/* Breadcrumb */}
      <Box sx={{ bgcolor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.1)', py: 2 }}>
        <Container maxWidth="lg">
          <Breadcrumbs separator={<ChevronRight size={16} color="rgba(255,255,255,0.4)" />}>
            <Link href="/marketplace" style={{ textDecoration: 'none' }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: '#8B5CF6' } }}>
                Marketplace
              </Typography>
            </Link>
            <Link href="/marketplace/signals" style={{ textDecoration: 'none' }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: '#8B5CF6' } }}>
                Signal Providers
              </Typography>
            </Link>
            <Typography sx={{ color: 'white' }}>{provider.name}</Typography>
          </Breadcrumbs>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          {/* Main Content */}
          <Grid item xs={12} md={8}>
            {/* Header */}
            <Box sx={{ display: 'flex', gap: 3, mb: 4 }}>
              <Avatar
                src={provider.avatar_url}
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: 'rgba(34, 197, 94, 0.2)',
                  fontSize: '2.5rem',
                }}
              >
                {provider.name?.charAt(0)}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="h4" sx={{ color: 'white', fontWeight: 800 }}>
                    {provider.name}
                  </Typography>
                  {provider.is_verified && (
                    <Chip
                      icon={<Check size={14} />}
                      label="Verified"
                      size="small"
                      sx={{ bgcolor: 'rgba(34, 197, 94, 0.2)', color: '#22C55E' }}
                    />
                  )}
                </Stack>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                  <Chip label={provider.trading_style} size="small" sx={{ bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6' }} />
                  <Chip
                    label={`${provider.risk_level} Risk`}
                    size="small"
                    sx={{ bgcolor: `${getRiskColor(provider.risk_level)}20`, color: getRiskColor(provider.risk_level) }}
                  />
                </Stack>
                <Stack direction="row" spacing={3} alignItems="center">
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Star size={18} fill="#F59E0B" color="#F59E0B" />
                    <Typography sx={{ color: 'white', fontWeight: 600 }}>
                      {provider.avg_rating?.toFixed(1) || '0.0'}
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      ({provider.total_reviews} reviews)
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Users size={16} color="rgba(255,255,255,0.5)" />
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      {provider.total_subscribers} subscribers
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
            </Box>

            {/* Performance Stats */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
              <Grid item xs={6} sm={4}>
                <Card sx={{ bgcolor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <TrendingUp size={24} color="#22C55E" />
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', mt: 1 }}>
                      Win Rate
                    </Typography>
                    <Typography variant="h5" sx={{ color: '#22C55E', fontWeight: 800 }}>
                      {provider.performance_stats?.win_rate || 0}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Card sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <BarChart3 size={24} color="#3B82F6" />
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', mt: 1 }}>
                      Total Pips
                    </Typography>
                    <Typography variant="h5" sx={{ color: '#3B82F6', fontWeight: 800 }}>
                      +{provider.performance_stats?.total_pips || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={4}>
                <Card sx={{ bgcolor: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                  <CardContent sx={{ textAlign: 'center', py: 2 }}>
                    <Activity size={24} color="#8B5CF6" />
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', mt: 1 }}>
                      Total Signals
                    </Typography>
                    <Typography variant="h5" sx={{ color: '#8B5CF6', fontWeight: 800 }}>
                      {provider.performance_stats?.total_signals || 0}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              sx={{
                mb: 3,
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                '& .MuiTab-root': { color: 'rgba(255,255,255,0.5)' },
                '& .Mui-selected': { color: '#8B5CF6' },
                '& .MuiTabs-indicator': { bgcolor: '#8B5CF6' },
              }}
            >
              <Tab label="About" />
              <Tab label="Recent Signals" />
              <Tab label={`Reviews (${provider.total_reviews})`} />
            </Tabs>

            {/* About Tab */}
            {activeTab === 0 && (
              <Box>
                <Typography sx={{ color: 'rgba(255,255,255,0.9)', mb: 4, lineHeight: 1.8 }}>
                  {provider.description || provider.bio}
                </Typography>

                {/* Instruments */}
                {provider.instruments && provider.instruments.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>
                      Instruments Traded
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {provider.instruments.map((inst, i) => (
                        <Chip
                          key={i}
                          label={inst}
                          sx={{ bgcolor: 'rgba(139, 92, 246, 0.2)', color: '#8B5CF6', mb: 1 }}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}

                {/* Performance Details */}
                <Box>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>
                    Performance Details
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                          Avg Pips/Trade
                        </Typography>
                        <Typography sx={{ color: '#22C55E', fontWeight: 700, fontSize: '1.25rem' }}>
                          +{provider.performance_stats?.avg_pips_per_trade || 0}
                        </Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6}>
                      <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                          Best Month
                        </Typography>
                        <Typography sx={{ color: '#22C55E', fontWeight: 700, fontSize: '1.25rem' }}>
                          +{provider.performance_stats?.best_month_pips || 0} pips
                        </Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            )}

            {/* Recent Signals Tab */}
            {activeTab === 1 && (
              <Box>
                {recentSignals.length > 0 ? (
                  <TableContainer component={Paper} sx={{ bgcolor: 'rgba(255,255,255,0.03)' }}>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ color: 'rgba(255,255,255,0.5)' }}>Symbol</TableCell>
                          <TableCell sx={{ color: 'rgba(255,255,255,0.5)' }}>Type</TableCell>
                          <TableCell sx={{ color: 'rgba(255,255,255,0.5)' }}>Entry</TableCell>
                          <TableCell sx={{ color: 'rgba(255,255,255,0.5)' }}>Status</TableCell>
                          <TableCell sx={{ color: 'rgba(255,255,255,0.5)' }}>Result</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {recentSignals.map((signal) => (
                          <TableRow key={signal.id}>
                            <TableCell sx={{ color: 'white', fontWeight: 600 }}>{signal.symbol}</TableCell>
                            <TableCell>
                              <Chip
                                icon={signal.signal_type === 'BUY' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                label={signal.signal_type}
                                size="small"
                                sx={{
                                  bgcolor: signal.signal_type === 'BUY' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                                  color: signal.signal_type === 'BUY' ? '#22C55E' : '#EF4444',
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ color: 'rgba(255,255,255,0.8)' }}>{signal.entry_price}</TableCell>
                            <TableCell>
                              <Chip
                                label={signal.status}
                                size="small"
                                sx={{
                                  bgcolor: signal.status.includes('tp') ? 'rgba(34, 197, 94, 0.2)' :
                                          signal.status === 'sl_hit' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                                  color: signal.status.includes('tp') ? '#22C55E' :
                                         signal.status === 'sl_hit' ? '#EF4444' : '#F59E0B',
                                  textTransform: 'uppercase',
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              {signal.pips_result !== null && (
                                <Typography sx={{ color: signal.pips_result >= 0 ? '#22C55E' : '#EF4444', fontWeight: 600 }}>
                                  {signal.pips_result >= 0 ? '+' : ''}{signal.pips_result} pips
                                </Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.03)' }}>
                    <Signal size={40} color="rgba(255,255,255,0.3)" style={{ marginBottom: 8 }} />
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>No public signals yet</Typography>
                  </Paper>
                )}
              </Box>
            )}

            {/* Reviews Tab */}
            {activeTab === 2 && (
              <Box>
                {/* Rating Summary */}
                <Paper sx={{ p: 3, mb: 3, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                      <Typography variant="h2" sx={{ color: '#22C55E', fontWeight: 900 }}>
                        {provider.avg_rating?.toFixed(1) || '4.8'}
                      </Typography>
                      <Rating value={provider.avg_rating || 4.8} readOnly precision={0.1} size="large" sx={{ mb: 1 }} />
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        {provider.total_reviews || reviews.length} reviews
                      </Typography>
                    </Grid>
                    <Grid item xs={12} md={8}>
                      {[5, 4, 3, 2, 1].map((stars) => {
                        const count = reviews.filter(r => r.rating === stars).length;
                        const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                        return (
                          <Stack key={stars} direction="row" alignItems="center" spacing={2} sx={{ mb: 0.5 }}>
                            <Typography sx={{ color: 'rgba(255,255,255,0.7)', width: 60, fontSize: '0.875rem' }}>{stars} stars</Typography>
                            <Box sx={{ flex: 1, bgcolor: 'rgba(255,255,255,0.1)', borderRadius: 1, height: 8 }}>
                              <Box sx={{ width: `${percentage}%`, bgcolor: '#FFD700', borderRadius: 1, height: '100%' }} />
                            </Box>
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)', width: 40, fontSize: '0.875rem' }}>{count}</Typography>
                          </Stack>
                        );
                      })}
                    </Grid>
                  </Grid>
                </Paper>

                {reviews.length > 0 ? (
                  reviews.map((review, index) => (
                    <Paper key={review.id} sx={{ 
                      p: 3, 
                      mb: 2, 
                      bgcolor: 'rgba(255,255,255,0.03)', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: 2,
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.05)',
                        borderColor: 'rgba(139, 92, 246, 0.3)',
                      },
                    }}>
                      <Stack direction="row" spacing={2}>
                        <Avatar 
                          src={(review as any).avatar || reviewerImages[(index % 5) + 1]} 
                          sx={{ 
                            width: 56, 
                            height: 56,
                            border: '2px solid #22C55E',
                          }}
                        >
                          {review.user_name?.[0] || 'U'}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="start" sx={{ mb: 1 }}>
                            <Box>
                              <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>
                                {review.user_name}
                              </Typography>
                              <Stack direction="row" alignItems="center" spacing={1}>
                                <Rating value={review.rating} readOnly size="small" />
                                <Chip 
                                  label="Verified Purchase" 
                                  size="small" 
                                  icon={<CheckCircle size={12} />}
                                  sx={{ 
                                    bgcolor: 'rgba(34, 197, 94, 0.1)', 
                                    color: '#22C55E',
                                    fontSize: '0.7rem',
                                    height: 20,
                                    '& .MuiChip-icon': { color: '#22C55E' },
                                  }} 
                                />
                              </Stack>
                            </Box>
                            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                              {new Date(review.created_at).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </Typography>
                          </Stack>
                          {review.title && (
                            <Typography sx={{ color: 'white', fontWeight: 600, mb: 1, fontSize: '1.1rem' }}>
                              "{review.title}"
                            </Typography>
                          )}
                          <Typography sx={{ color: 'rgba(255,255,255,0.8)', lineHeight: 1.6 }}>
                            {review.review}
                          </Typography>
                        </Box>
                      </Stack>
                    </Paper>
                  ))
                ) : (
                  <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.03)' }}>
                    <MessageSquare size={40} color="rgba(255,255,255,0.3)" style={{ marginBottom: 8 }} />
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>No reviews yet</Typography>
                  </Paper>
                )}
              </Box>
            )}
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', position: 'sticky', top: 20 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>
                  Subscribe to Signals
                </Typography>

                {/* Plan Selection */}
                <ToggleButtonGroup
                  value={selectedPlan}
                  exclusive
                  onChange={(_, v) => v && setSelectedPlan(v)}
                  fullWidth
                  sx={{ mb: 3 }}
                >
                  {[
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'quarterly', label: '3 Months' },
                    { value: 'yearly', label: 'Yearly' },
                  ].map((plan) => (
                    <ToggleButton
                      key={plan.value}
                      value={plan.value}
                      disabled={!provider.pricing?.[plan.value as keyof typeof provider.pricing]}
                      sx={{
                        color: 'rgba(255,255,255,0.6)',
                        borderColor: 'rgba(255,255,255,0.2)',
                        '&.Mui-selected': {
                          bgcolor: 'rgba(139, 92, 246, 0.2)',
                          color: '#8B5CF6',
                          borderColor: '#8B5CF6',
                        },
                      }}
                    >
                      {plan.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>

                {/* Price */}
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Typography variant="h3" sx={{ color: '#22C55E', fontWeight: 900 }}>
                    ${getSelectedPrice()}
                    <Typography component="span" sx={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)' }}>
                      /{selectedPlan === 'monthly' ? 'mo' : selectedPlan === 'quarterly' ? '3mo' : 'yr'}
                    </Typography>
                  </Typography>
                  {selectedPlan !== 'monthly' && provider.pricing?.monthly && (
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
                      Save {Math.round(100 - (getSelectedPrice() / (provider.pricing.monthly * (selectedPlan === 'quarterly' ? 3 : 12))) * 100)}%
                    </Typography>
                  )}
                </Box>

                {/* Subscribe Button */}
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleSubscribe}
                  disabled={subscribing || !getSelectedPrice()}
                  startIcon={subscribing ? <CircularProgress size={20} /> : <Signal size={20} />}
                  sx={{
                    bgcolor: '#22C55E',
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    '&:hover': { bgcolor: '#16A34A' },
                    mb: 2,
                  }}
                >
                  {subscribing ? 'Processing...' : 'Subscribe Now'}
                </Button>

                {/* Features */}
                <Stack spacing={1.5}>
                  {[
                    { icon: Signal, text: 'Real-time signal alerts' },
                    { icon: Target, text: 'Entry, SL & TP levels' },
                    { icon: MessageSquare, text: 'Direct provider support' },
                    { icon: Shield, text: 'Cancel anytime' },
                  ].map((item, i) => (
                    <Stack key={i} direction="row" spacing={1} alignItems="center">
                      <item.icon size={16} color="#22C55E" />
                      <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                        {item.text}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
