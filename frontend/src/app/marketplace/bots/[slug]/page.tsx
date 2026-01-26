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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  CircularProgress,
  Breadcrumbs,
} from '@mui/material';
import {
  Bot,
  ArrowLeft,
  Star,
  Users,
  Download,
  ShoppingCart,
  Check,
  Shield,
  Clock,
  TrendingUp,
  DollarSign,
  BarChart3,
  AlertTriangle,
  ChevronRight,
  MessageSquare,
  Play,
  FileText,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface BotDetails {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  seller_id: number;
  seller_name: string;
  seller_avatar: string;
  seller_rating: number;
  seller_total_sales: number;
  seller_verified?: boolean;
  seller_slug?: string;
  category: string;
  platform: string;
  currency_pairs: string;
  timeframe: string;
  minimum_deposit: number;
  price: number;
  is_free: boolean;
  discount_percentage: number;
  backtest_results: {
    win_rate: number;
    profit_factor: number;
    max_drawdown: number;
    total_trades: number;
    period: string;
  };
  features: string[];
  tags: string[];
  screenshots: string[];
  version: string;
  total_purchases: number;
  avg_rating: number;
  total_reviews: number;
  created_at: string;
  updated_at: string;
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
  1: 'https://images.unsplash.com/photo-1599566150163-29194dcabd36?w=60&h=60&fit=crop&crop=face',
  2: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=60&h=60&fit=crop&crop=face',
  3: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=60&h=60&fit=crop&crop=face',
  4: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=60&h=60&fit=crop&crop=face',
  5: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60&h=60&fit=crop&crop=face',
};

// Demo bot data
const demoBots: Record<string, BotDetails> = {
  'gold-scalper-pro': {
    id: 1,
    name: 'Gold Scalper Pro EA',
    slug: 'gold-scalper-pro',
    description: `The Gold Scalper Pro EA is a fully automated Expert Advisor designed specifically for trading XAUUSD (Gold). Using advanced price action algorithms and smart money concepts, this EA identifies high-probability scalping opportunities during the London and New York sessions.

## Key Features

- **Smart Entry System**: Uses institutional order flow patterns to identify precise entry points
- **Dynamic Risk Management**: Automatically adjusts lot sizes based on account equity
- **Multiple TP Levels**: Scales out positions at 3 take-profit levels
- **News Filter**: Built-in high-impact news filter to avoid volatile periods
- **Spread Protection**: Won't open trades when spread exceeds defined threshold

## Requirements

- MetaTrader 5 Platform
- Minimum $500 deposit recommended
- VPS recommended for 24/7 operation
- ECN broker with tight spreads on Gold`,
    short_description: 'Professional XAUUSD scalping EA with advanced risk management',
    seller_id: 1,
    seller_name: 'AlgoEdge Labs',
    seller_avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face',
    seller_rating: 4.9,
    seller_total_sales: 1847,
    category: 'Scalper',
    platform: 'MT5',
    currency_pairs: 'XAUUSD',
    timeframe: 'M5, M15',
    minimum_deposit: 500,
    price: 149,
    is_free: false,
    discount_percentage: 0,
    backtest_results: {
      win_rate: 79.60,
      profit_factor: 2.4,
      max_drawdown: 12,
      total_trades: 2847,
      period: '2020-2025',
    },
    features: [
      'Fully automated trading',
      'Works on XAUUSD (Gold)',
      'Smart money entry system',
      'Built-in news filter',
      'Multiple TP levels',
      'Lifetime updates included',
      '30-day money-back guarantee',
    ],
    tags: ['gold', 'scalper', 'automated', 'xauusd', 'mt5'],
    screenshots: [
      'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=450&fit=crop',
      'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800&h=450&fit=crop',
    ],
    version: '3.2.1',
    total_purchases: 245,
    avg_rating: 4.8,
    total_reviews: 67,
    created_at: '2023-06-15',
    updated_at: '2026-01-20',
  },
  'multi-metal-portfolio': {
    id: 2,
    name: 'Multi-Metal Portfolio EA',
    slug: 'multi-metal-portfolio',
    description: `A diversified precious metals trading strategy for Gold, Silver and Platinum with correlation filter and risk diversification.

## Key Features

- **Multi-Asset Trading**: Trades XAUUSD, XAGUSD, and Platinum simultaneously
- **Correlation Filter**: Avoids overexposure by monitoring correlations
- **Portfolio Balancing**: Automatically rebalances based on market conditions
- **Risk Diversification**: Spreads risk across multiple precious metals

## Requirements

- MetaTrader 5 Platform
- Minimum $1000 deposit recommended
- VPS recommended for 24/7 operation`,
    short_description: 'Diversified precious metals trading strategy',
    seller_id: 1,
    seller_name: 'AlgoEdge Labs',
    seller_avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face',
    seller_rating: 4.9,
    seller_total_sales: 1847,
    category: 'Portfolio',
    platform: 'MT5',
    currency_pairs: 'XAUUSD, XAGUSD, Platinum',
    timeframe: 'H1, H4',
    minimum_deposit: 1000,
    price: 199,
    is_free: false,
    discount_percentage: 0,
    backtest_results: {
      win_rate: 78.90,
      profit_factor: 2.1,
      max_drawdown: 15,
      total_trades: 1856,
      period: '2021-2025',
    },
    features: [
      'Multi-metal diversification',
      'Correlation filter',
      'Portfolio balancing',
      'Risk management',
      'Lifetime updates',
    ],
    tags: ['portfolio', 'metals', 'diversified', 'mt5'],
    screenshots: [],
    version: '2.0.0',
    total_purchases: 156,
    avg_rating: 4.8,
    total_reviews: 42,
    created_at: '2024-01-10',
    updated_at: '2026-01-15',
  },
  'news-trading-sniper': {
    id: 3,
    name: 'News Trading Sniper',
    slug: 'news-trading-sniper',
    description: `Capitalize on high-impact news events with automated spike detection and quick execution.

## Key Features

- **News Calendar Integration**: Automatically detects upcoming high-impact news
- **Spike Detection**: Identifies and trades market spikes
- **Quick Execution**: Optimized for fast order execution
- **Risk Filters**: Built-in protection against extreme volatility

## Requirements

- MetaTrader 5 Platform
- Minimum $500 deposit recommended
- Low latency VPS essential`,
    short_description: 'Capitalize on high-impact news events',
    seller_id: 1,
    seller_name: 'AlgoEdge Labs',
    seller_avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face',
    seller_rating: 4.9,
    seller_total_sales: 1847,
    category: 'News',
    platform: 'MT5',
    currency_pairs: 'Major Pairs',
    timeframe: 'M1, M5',
    minimum_deposit: 500,
    price: 179,
    is_free: false,
    discount_percentage: 0,
    backtest_results: {
      win_rate: 84.90,
      profit_factor: 2.8,
      max_drawdown: 18,
      total_trades: 945,
      period: '2022-2025',
    },
    features: [
      'News calendar integration',
      'Spike detection',
      'Fast execution',
      'Risk filters',
      'Lifetime updates',
    ],
    tags: ['news', 'trading', 'spikes', 'mt5'],
    screenshots: [],
    version: '1.5.0',
    total_purchases: 198,
    avg_rating: 4.8,
    total_reviews: 54,
    created_at: '2024-03-01',
    updated_at: '2026-01-15',
  },
  'risk-manager-pro': {
    id: 4,
    name: 'Risk Manager Pro EA',
    slug: 'risk-manager-pro',
    description: `Advanced risk management tool that protects your account with automatic lot sizing, drawdown limits, and profit targets.

## Key Features

- **Auto Lot Sizing**: Calculates optimal lot size based on risk percentage
- **Drawdown Protection**: Closes all trades when drawdown limit is reached
- **Profit Targets**: Auto-close positions at profit targets
- **Account Protection**: Comprehensive protection against margin calls

## Requirements

- MetaTrader 5 Platform
- Works with any account size`,
    short_description: 'Advanced risk management tool',
    seller_id: 1,
    seller_name: 'AlgoEdge Labs',
    seller_avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face',
    seller_rating: 4.9,
    seller_total_sales: 1847,
    category: 'Utility',
    platform: 'MT5',
    currency_pairs: 'All',
    timeframe: 'All',
    minimum_deposit: 100,
    price: 99,
    is_free: false,
    discount_percentage: 0,
    backtest_results: {
      win_rate: 0,
      profit_factor: 0,
      max_drawdown: 0,
      total_trades: 0,
      period: 'N/A',
    },
    features: [
      'Auto lot sizing',
      'Drawdown protection',
      'Profit targets',
      'Account protection',
      'Works with any EA',
    ],
    tags: ['risk', 'management', 'utility', 'mt5'],
    screenshots: [],
    version: '2.0.0',
    total_purchases: 312,
    avg_rating: 4.9,
    total_reviews: 89,
    created_at: '2024-01-01',
    updated_at: '2026-01-15',
  },
  'silver-trend-rider': {
    id: 5,
    name: 'Silver Trend Rider EA',
    slug: 'silver-trend-rider',
    description: `Trend-following EA optimized for XAGUSD. Captures medium to long-term silver trends with dynamic trailing stops.`,
    short_description: 'Trend-following EA for silver',
    seller_id: 1,
    seller_name: 'AlgoEdge Labs',
    seller_avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face',
    seller_rating: 4.9,
    seller_total_sales: 1847,
    category: 'Trend',
    platform: 'MT5',
    currency_pairs: 'XAGUSD',
    timeframe: 'H1, H4',
    minimum_deposit: 500,
    price: 129,
    is_free: false,
    discount_percentage: 0,
    backtest_results: {
      win_rate: 72.50,
      profit_factor: 1.9,
      max_drawdown: 14,
      total_trades: 1234,
      period: '2021-2025',
    },
    features: [
      'Trend detection',
      'Dynamic trailing stops',
      'Silver optimized',
      'Lifetime updates',
    ],
    tags: ['silver', 'trend', 'mt5'],
    screenshots: [],
    version: '1.3.0',
    total_purchases: 134,
    avg_rating: 4.7,
    total_reviews: 38,
    created_at: '2024-02-01',
    updated_at: '2026-01-15',
  },
  'smart-sr-indicator': {
    id: 6,
    name: 'Smart S/R Indicator',
    slug: 'smart-sr-indicator',
    description: `Automatically identifies and draws high-probability support and resistance zones based on price action.`,
    short_description: 'Auto support/resistance indicator',
    seller_id: 1,
    seller_name: 'AlgoEdge Labs',
    seller_avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face',
    seller_rating: 4.9,
    seller_total_sales: 1847,
    category: 'Indicator',
    platform: 'MT5',
    currency_pairs: 'All',
    timeframe: 'All',
    minimum_deposit: 0,
    price: 49,
    is_free: false,
    discount_percentage: 0,
    backtest_results: {
      win_rate: 0,
      profit_factor: 0,
      max_drawdown: 0,
      total_trades: 0,
      period: 'N/A',
    },
    features: [
      'Auto S/R detection',
      'Multi-timeframe',
      'Clean visuals',
      'Alert system',
    ],
    tags: ['indicator', 'support', 'resistance', 'mt5'],
    screenshots: [],
    version: '1.5.0',
    total_purchases: 428,
    avg_rating: 4.6,
    total_reviews: 112,
    created_at: '2024-01-01',
    updated_at: '2026-01-15',
  },
  'supply-demand-zone-indicator': {
    id: 7,
    name: 'Supply Demand Zone Indicator',
    slug: 'supply-demand-zone-indicator',
    description: `Professional supply and demand zone indicator with multi-timeframe analysis and alert system.`,
    short_description: 'Professional S/D zone indicator',
    seller_id: 1,
    seller_name: 'AlgoEdge Labs',
    seller_avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face',
    seller_rating: 4.9,
    seller_total_sales: 1847,
    category: 'Indicator',
    platform: 'MT5',
    currency_pairs: 'All',
    timeframe: 'All',
    minimum_deposit: 0,
    price: 59,
    is_free: false,
    discount_percentage: 0,
    backtest_results: {
      win_rate: 0,
      profit_factor: 0,
      max_drawdown: 0,
      total_trades: 0,
      period: 'N/A',
    },
    features: [
      'Supply/demand zones',
      'Multi-timeframe',
      'Alert system',
      'Clean visuals',
    ],
    tags: ['indicator', 'supply', 'demand', 'mt5'],
    screenshots: [],
    version: '2.0.0',
    total_purchases: 356,
    avg_rating: 4.7,
    total_reviews: 94,
    created_at: '2024-01-01',
    updated_at: '2026-01-15',
  },
  'trend-strength-dashboard': {
    id: 8,
    name: 'Trend Strength Dashboard',
    slug: 'trend-strength-dashboard',
    description: `Multi-currency trend strength indicator that shows the relative strength of major currencies across timeframes.`,
    short_description: 'Currency strength dashboard',
    seller_id: 1,
    seller_name: 'AlgoEdge Labs',
    seller_avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=60&h=60&fit=crop&crop=face',
    seller_rating: 4.9,
    seller_total_sales: 1847,
    category: 'Indicator',
    platform: 'MT5',
    currency_pairs: 'All',
    timeframe: 'All',
    minimum_deposit: 0,
    price: 69,
    is_free: false,
    discount_percentage: 0,
    backtest_results: {
      win_rate: 0,
      profit_factor: 0,
      max_drawdown: 0,
      total_trades: 0,
      period: 'N/A',
    },
    features: [
      'Multi-currency analysis',
      'Trend strength meter',
      'Multi-timeframe',
      'Clean dashboard',
    ],
    tags: ['indicator', 'trend', 'strength', 'mt5'],
    screenshots: [],
    version: '1.8.0',
    total_purchases: 267,
    avg_rating: 4.8,
    total_reviews: 71,
    created_at: '2024-01-01',
    updated_at: '2026-01-15',
  },
};

// Demo reviews for bots
const demoBotReviews: Review[] = [
  {
    id: 1,
    user_name: 'Marcus R.',
    rating: 5,
    title: 'Consistent profits for 6 months!',
    review: 'This EA has been running on my VPS for 6 months now and the results are incredible. The risk management is solid and I\'ve seen consistent 8-12% monthly returns.',
    created_at: '2026-01-22',
    avatar: reviewerImages[1],
  },
  {
    id: 2,
    user_name: 'Elena S.',
    rating: 5,
    title: 'Best gold trading bot I\'ve tried',
    review: 'After testing many EAs, this one actually delivers. The news filter saves you from nasty drawdowns during high-impact events. Highly recommend!',
    created_at: '2026-01-20',
    avatar: reviewerImages[2],
  },
  {
    id: 3,
    user_name: 'Chris T.',
    rating: 4,
    title: 'Good EA, needs proper setup',
    review: 'The EA works well once you get the settings right. Support helped me optimize for my broker. Only 4 stars because the default settings could be better.',
    created_at: '2026-01-18',
    avatar: reviewerImages[3],
  },
  {
    id: 4,
    user_name: 'Amanda K.',
    rating: 5,
    title: 'Support is amazing',
    review: 'Had some issues setting up on my VPS and the support team helped me within hours. The EA itself is profitable and the updates keep improving it.',
    created_at: '2026-01-15',
    avatar: reviewerImages[4],
  },
  {
    id: 5,
    user_name: 'Daniel M.',
    rating: 5,
    title: 'Worth every penny',
    review: 'Already made back my investment in the first month. The backtest results actually match live performance which is rare for EAs. Very impressed.',
    created_at: '2026-01-12',
    avatar: reviewerImages[5],
  },
];

export default function BotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [bot, setBot] = useState<BotDetails | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState('');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [insufficientFunds, setInsufficientFunds] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchBotDetails();
      fetchWalletBalance();
    }
  }, [slug]);

  const fetchWalletBalance = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wallet/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setWalletBalance(data.wallet?.balance || 0);
      }
    } catch (error) {
      console.error('Error fetching wallet:', error);
    }
  };

  const fetchBotDetails = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/bots/${slug}`);
      if (res.ok) {
        const data = await res.json();
        // Ensure numeric fields are properly typed
        const botData = {
          ...data.bot,
          price: parseFloat(data.bot.price) || 0,
          discount_percentage: parseFloat(data.bot.discount_percentage) || 0,
          avg_rating: parseFloat(data.bot.avg_rating) || 0,
          seller_rating: parseFloat(data.bot.seller_rating) || 0,
          total_purchases: parseInt(data.bot.total_purchases) || 0,
          total_reviews: parseInt(data.bot.total_reviews) || 0,
          seller_total_sales: parseInt(data.bot.seller_total_sales) || 0,
        };
        setBot(botData);
        setReviews(data.reviews?.length > 0 ? data.reviews : demoBotReviews);
      } else {
        // Use demo data as fallback
        if (demoBots[slug]) {
          setBot(demoBots[slug]);
          setReviews(demoBotReviews);
        } else {
          setError('Bot not found');
        }
      }
    } catch (error) {
      console.error('Error fetching bot:', error);
      // Use demo data as fallback on network error
      if (demoBots[slug]) {
        setBot(demoBots[slug]);
        setReviews(demoBotReviews);
      } else {
        setError('Failed to load bot details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login?redirect=/marketplace/bots/' + slug);
      return;
    }

    // Check if user has enough balance
    if (walletBalance !== null && bot && !bot.is_free && walletBalance < (discountedPrice || bot.price)) {
      setInsufficientFunds(true);
      return;
    }

    setPurchasing(true);
    setError('');
    try {
      // Use internal wallet for purchase
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wallet/purchase/bot/${bot?.id}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await res.json();
      if (res.ok) {
        // Success - redirect to purchases page
        router.push('/dashboard/purchases?success=true');
      } else {
        if (data.error === 'Insufficient balance') {
          setInsufficientFunds(true);
        } else {
          setError(data.error || 'Failed to purchase');
        }
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const discountedPrice = bot?.discount_percentage && bot?.price
    ? Number(bot.price) * (1 - Number(bot.discount_percentage) / 100)
    : Number(bot?.price) || 0;

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#8B5CF6' }} />
      </Box>
    );
  }

  if (error || !bot) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', py: 8 }}>
        <Container maxWidth="md">
          <Alert severity="error" sx={{ mb: 3 }}>{error || 'Bot not found'}</Alert>
          <Button component={Link} href="/marketplace/bots" startIcon={<ArrowLeft size={18} />}>
            Back to Bots
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
            <Link href="/marketplace/bots" style={{ textDecoration: 'none' }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: '#8B5CF6' } }}>
                Trading Bots
              </Typography>
            </Link>
            <Typography sx={{ color: 'white' }}>{bot.name}</Typography>
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
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: 'rgba(139, 92, 246, 0.2)',
                  fontSize: '2rem',
                }}
              >
                <Bot size={50} color="#8B5CF6" />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  {bot.category && <Chip label={bot.category} size="small" sx={{ bgcolor: 'rgba(139, 92, 246, 0.2)', color: '#8B5CF6' }} />}
                  {bot.platform && <Chip label={bot.platform.toUpperCase()} size="small" sx={{ bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6' }} />}
                  {bot.is_free && (
                    <Chip label="FREE" size="small" sx={{ bgcolor: 'rgba(34, 197, 94, 0.2)', color: '#22C55E' }} />
                  )}
                </Stack>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, mb: 1 }}>
                  {bot.name}
                </Typography>
                <Stack direction="row" spacing={3} alignItems="center">
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Star size={18} fill="#F59E0B" color="#F59E0B" />
                    <Typography sx={{ color: 'white', fontWeight: 600 }}>
                      {Number(bot.avg_rating || 0).toFixed(1)}
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      ({bot.total_reviews || 0} reviews)
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Download size={16} color="rgba(255,255,255,0.5)" />
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      {bot.total_purchases} purchases
                    </Typography>
                  </Stack>
                </Stack>
              </Box>
            </Box>

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
              <Tab label="Overview" />
              <Tab label="Performance" />
              <Tab label={`Reviews (${bot.total_reviews})`} />
            </Tabs>

            {/* Overview Tab */}
            {activeTab === 0 && (
              <Box>
                <Typography sx={{ color: 'rgba(255,255,255,0.9)', mb: 4, lineHeight: 1.8 }}>
                  {bot.description}
                </Typography>

                {/* Features */}
                {bot.features && bot.features.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>
                      Features
                    </Typography>
                    <Grid container spacing={2}>
                      {bot.features.map((feature, i) => (
                        <Grid item xs={12} sm={6} key={i}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Check size={18} color="#22C55E" />
                            <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>{feature}</Typography>
                          </Stack>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}

                {/* Requirements */}
                <Box sx={{ mb: 4 }}>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>
                    Requirements
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Platform</Typography>
                        <Typography sx={{ color: 'white', fontWeight: 600 }}>{bot.platform?.toUpperCase() || 'MT5'}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Min Deposit</Typography>
                        <Typography sx={{ color: 'white', fontWeight: 600 }}>${bot.minimum_deposit}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Pairs</Typography>
                        <Typography sx={{ color: 'white', fontWeight: 600 }}>{bot.currency_pairs}</Typography>
                      </Paper>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>Timeframe</Typography>
                        <Typography sx={{ color: 'white', fontWeight: 600 }}>{bot.timeframe}</Typography>
                      </Paper>
                    </Grid>
                  </Grid>
                </Box>
              </Box>
            )}

            {/* Performance Tab */}
            {activeTab === 1 && (
              <Box>
                <Alert severity="info" sx={{ mb: 3, bgcolor: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                  <strong>Backtest Results</strong> - Past performance does not guarantee future results
                </Alert>

                <Grid container spacing={3}>
                  <Grid item xs={6} sm={3}>
                    <Card sx={{ bgcolor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <TrendingUp size={24} color="#22C55E" />
                        <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', mt: 1 }}>
                          Win Rate
                        </Typography>
                        <Typography variant="h4" sx={{ color: '#22C55E', fontWeight: 800 }}>
                          {bot.backtest_results?.win_rate || 0}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <BarChart3 size={24} color="#3B82F6" />
                        <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', mt: 1 }}>
                          Profit Factor
                        </Typography>
                        <Typography variant="h4" sx={{ color: '#3B82F6', fontWeight: 800 }}>
                          {bot.backtest_results?.profit_factor || 0}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <AlertTriangle size={24} color="#EF4444" />
                        <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', mt: 1 }}>
                          Max Drawdown
                        </Typography>
                        <Typography variant="h4" sx={{ color: '#EF4444', fontWeight: 800 }}>
                          {bot.backtest_results?.max_drawdown || 0}%
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={6} sm={3}>
                    <Card sx={{ bgcolor: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
                      <CardContent sx={{ textAlign: 'center' }}>
                        <Zap size={24} color="#8B5CF6" />
                        <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', mt: 1 }}>
                          Total Trades
                        </Typography>
                        <Typography variant="h4" sx={{ color: '#8B5CF6', fontWeight: 800 }}>
                          {bot.backtest_results?.total_trades || 0}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
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
                        {Number(bot.avg_rating || 4.7).toFixed(1)}
                      </Typography>
                      <Rating value={Number(bot.avg_rating) || 4.7} readOnly precision={0.1} size="large" sx={{ mb: 1 }} />
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        {bot.total_reviews || reviews.length} reviews
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
                            border: '2px solid #8B5CF6',
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
                                  icon={<Check size={12} />}
                                  sx={{ 
                                    bgcolor: 'rgba(139, 92, 246, 0.1)', 
                                    color: '#8B5CF6',
                                    fontSize: '0.7rem',
                                    height: 20,
                                    '& .MuiChip-icon': { color: '#8B5CF6' },
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
                {/* Price */}
                <Box sx={{ mb: 3 }}>
                  {bot.is_free ? (
                    <Typography variant="h3" sx={{ color: '#22C55E', fontWeight: 900 }}>
                      FREE
                    </Typography>
                  ) : (
                    <>
                      {bot.discount_percentage > 0 && (
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <Typography sx={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'line-through' }}>
                            ${bot.price}
                          </Typography>
                          <Chip
                            label={`-${bot.discount_percentage}%`}
                            size="small"
                            sx={{ bgcolor: 'rgba(239, 68, 68, 0.2)', color: '#EF4444' }}
                          />
                        </Stack>
                      )}
                      <Typography variant="h3" sx={{ color: '#22C55E', fontWeight: 900 }}>
                        ${Number(discountedPrice || 0).toFixed(2)}
                      </Typography>
                    </>
                  )}
                </Box>

                {/* Buy Button */}
                {insufficientFunds && (
                  <Alert 
                    severity="warning" 
                    sx={{ mb: 2, bgcolor: 'rgba(234, 179, 8, 0.1)' }}
                    action={
                      <Button 
                        color="inherit" 
                        size="small" 
                        component={Link}
                        href="/dashboard/wallet"
                      >
                        Add Funds
                      </Button>
                    }
                  >
                    Insufficient wallet balance. You need ${Number(discountedPrice || bot.price || 0).toFixed(2)} but have ${Number(walletBalance || 0).toFixed(2)}.
                  </Alert>
                )}

                {walletBalance !== null && (
                  <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(29, 155, 240, 0.1)', border: '1px solid rgba(29, 155, 240, 0.3)' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                        Your Wallet Balance
                      </Typography>
                      <Typography sx={{ color: '#1D9BF0', fontWeight: 700 }}>
                        ${Number(walletBalance || 0).toFixed(2)}
                      </Typography>
                    </Stack>
                  </Paper>
                )}

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handlePurchase}
                  disabled={purchasing}
                  startIcon={purchasing ? <CircularProgress size={20} /> : <ShoppingCart size={20} />}
                  sx={{
                    bgcolor: '#8B5CF6',
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    '&:hover': { bgcolor: '#7C3AED' },
                    mb: 2,
                  }}
                >
                  {purchasing ? 'Processing...' : bot.is_free ? 'Get for Free' : 'Buy with Wallet'}
                </Button>

                {/* Trust Badges */}
                <Stack spacing={1.5} sx={{ mb: 3 }}>
                  {[
                    { icon: Shield, text: 'Secure Wallet Payment' },
                    { icon: Download, text: 'Instant Download' },
                    { icon: Clock, text: 'Lifetime Access' },
                    { icon: MessageSquare, text: 'Seller Support Included' },
                  ].map((item, i) => (
                    <Stack key={i} direction="row" spacing={1} alignItems="center">
                      <item.icon size={16} color="#22C55E" />
                      <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                        {item.text}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 2 }} />

                {/* Seller Info */}
                <Box>
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', mb: 1 }}>
                    Sold by
                  </Typography>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ position: 'relative' }}>
                      <Avatar sx={{ bgcolor: 'rgba(139, 92, 246, 0.2)', width: 48, height: 48 }}>
                        {bot.seller_name?.charAt(0)}
                      </Avatar>
                      {bot.seller_verified && (
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: -2,
                            right: -2,
                            width: 20,
                            height: 20,
                            borderRadius: '50%',
                            bgcolor: '#0a0f1a',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 22 22" fill="none">
                            <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="#1D9BF0"/>
                          </svg>
                        </Box>
                      )}
                    </Box>
                    <Box>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography sx={{ color: 'white', fontWeight: 600 }}>{bot.seller_name}</Typography>
                        {bot.seller_verified && (
                          <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center' }}>
                            <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
                              <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="#1D9BF0"/>
                            </svg>
                          </Box>
                        )}
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Star size={14} fill="#F59E0B" color="#F59E0B" />
                        <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>
                          {Number(bot.seller_rating || 0).toFixed(1)} • {bot.seller_total_sales || 0} sales
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>
                  {bot.seller_slug && (
                    <Button
                      component={Link}
                      href={`/sellers/${bot.seller_slug}`}
                      size="small"
                      sx={{ 
                        mt: 1.5, 
                        color: '#8B5CF6', 
                        fontSize: '0.75rem',
                        '&:hover': { bgcolor: 'rgba(139, 92, 246, 0.1)' }
                      }}
                    >
                      View Seller Profile →
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
