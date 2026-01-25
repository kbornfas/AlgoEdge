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
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  Package,
  ArrowLeft,
  Star,
  Download,
  ShoppingCart,
  Check,
  Shield,
  Clock,
  ChevronRight,
  MessageSquare,
  FileText,
  Video,
  BookOpen,
  BarChart,
  Layout,
  File,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

interface ProductDetails {
  id: number;
  name: string;
  slug: string;
  description: string;
  short_description: string;
  seller_id: number;
  seller_name: string;
  seller_rating: number;
  seller_total_sales: number;
  product_type: string;
  category: string;
  price: number;
  discount_percentage: number;
  file_size_bytes: number;
  preview_content: string[];
  features: string[];
  tags: string[];
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
  1: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=60&h=60&fit=crop&crop=face',
  2: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=60&h=60&fit=crop&crop=face',
  3: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=60&h=60&fit=crop&crop=face',
  4: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=60&h=60&fit=crop&crop=face',
  5: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&h=60&fit=crop&crop=face',
};

// Demo product data
const demoProducts: Record<string, ProductDetails> = {
  'gold-trading-bible-ebook': {
    id: 1,
    name: 'Gold Trading Bible eBook',
    slug: 'gold-trading-bible-ebook',
    description: `Comprehensive guide to trading XAUUSD with institutional strategies and risk management techniques.

## What You'll Learn

- Gold market fundamentals and drivers
- Technical analysis specifically for gold
- Institutional trading strategies
- Risk management for volatile markets
- Trade setups with real examples`,
    short_description: 'Comprehensive guide to trading XAUUSD',
    seller_id: 1,
    seller_name: 'AlgoEdge Academy',
    seller_rating: 4.9,
    seller_total_sales: 2847,
    product_type: 'ebook',
    category: 'Education',
    price: 49,
    discount_percentage: 38,
    file_size_bytes: 52428800,
    preview_content: ['Table of contents', 'Chapter 1 preview'],
    features: [
      '200+ pages of content',
      'Annotated chart examples',
      'PDF format for all devices',
      'Free updates for life',
    ],
    tags: ['gold', 'trading', 'ebook', 'education'],
    total_purchases: 234,
    avg_rating: 4.8,
    total_reviews: 67,
    created_at: '2024-06-15',
    updated_at: '2026-01-20',
  },
  'mt5-mastery-course': {
    id: 2,
    name: 'MT5 Mastery Course',
    slug: 'mt5-mastery-course',
    description: `Complete video course on mastering MetaTrader 5 for professional trading.

## Course Contents

1. MT5 Platform Overview
2. Chart Analysis Tools
3. Order Types & Execution
4. Custom Indicators
5. Expert Advisors
6. Optimization & Backtesting`,
    short_description: 'Master MetaTrader 5 platform',
    seller_id: 1,
    seller_name: 'AlgoEdge Academy',
    seller_rating: 4.9,
    seller_total_sales: 2847,
    product_type: 'video_course',
    category: 'Education',
    price: 149,
    discount_percentage: 25,
    file_size_bytes: 5120000000,
    preview_content: ['Introduction video', 'Course outline'],
    features: [
      '12+ hours of HD video',
      'Lifetime access',
      'Certificate of completion',
      'Practice exercises',
    ],
    tags: ['mt5', 'metatrader', 'video course', 'education'],
    total_purchases: 456,
    avg_rating: 4.9,
    total_reviews: 123,
    created_at: '2024-06-15',
    updated_at: '2026-01-20',
  },
  'price-action-secrets-ebook': {
    id: 3,
    name: 'Price Action Secrets eBook',
    slug: 'price-action-secrets-ebook',
    description: `Learn professional price action trading strategies used by institutional traders.`,
    short_description: 'Professional price action strategies',
    seller_id: 1,
    seller_name: 'AlgoEdge Academy',
    seller_rating: 4.9,
    seller_total_sales: 2847,
    product_type: 'ebook',
    category: 'Education',
    price: 39,
    discount_percentage: 34,
    file_size_bytes: 45000000,
    preview_content: ['Table of contents'],
    features: [
      '180+ pages',
      'Chart examples',
      'PDF format',
      'Free updates',
    ],
    tags: ['price action', 'ebook', 'education'],
    total_purchases: 312,
    avg_rating: 4.7,
    total_reviews: 89,
    created_at: '2024-06-15',
    updated_at: '2026-01-20',
  },
  'risk-management-ebook': {
    id: 4,
    name: 'Risk Management eBook',
    slug: 'risk-management-ebook',
    description: `Master risk management principles to protect and grow your trading capital.`,
    short_description: 'Protect your trading capital',
    seller_id: 1,
    seller_name: 'AlgoEdge Academy',
    seller_rating: 4.9,
    seller_total_sales: 2847,
    product_type: 'ebook',
    category: 'Education',
    price: 29,
    discount_percentage: 41,
    file_size_bytes: 35000000,
    preview_content: ['Table of contents'],
    features: [
      '150+ pages',
      'Calculators included',
      'PDF format',
      'Free updates',
    ],
    tags: ['risk', 'management', 'ebook', 'education'],
    total_purchases: 567,
    avg_rating: 4.9,
    total_reviews: 156,
    created_at: '2024-06-15',
    updated_at: '2026-01-20',
  },
  'technical-analysis-mastery-ebook': {
    id: 5,
    name: 'Technical Analysis Mastery eBook',
    slug: 'technical-analysis-mastery-ebook',
    description: `Deep dive into technical analysis with chart patterns, indicators, and trading signals.`,
    short_description: 'Master technical analysis',
    seller_id: 1,
    seller_name: 'AlgoEdge Academy',
    seller_rating: 4.9,
    seller_total_sales: 2847,
    product_type: 'ebook',
    category: 'Education',
    price: 59,
    discount_percentage: 34,
    file_size_bytes: 60000000,
    preview_content: ['Table of contents'],
    features: [
      '250+ pages',
      'Chart patterns',
      'Indicator setups',
      'Free updates',
    ],
    tags: ['technical analysis', 'ebook', 'education'],
    total_purchases: 289,
    avg_rating: 4.8,
    total_reviews: 78,
    created_at: '2024-06-15',
    updated_at: '2026-01-20',
  },
  'prop-firm-challenge-blueprint': {
    id: 6,
    name: 'Prop Firm Challenge Blueprint',
    slug: 'prop-firm-challenge-blueprint',
    description: `Step-by-step guide to passing prop firm challenges and getting funded.`,
    short_description: 'Pass prop firm challenges',
    seller_id: 1,
    seller_name: 'AlgoEdge Academy',
    seller_rating: 4.9,
    seller_total_sales: 2847,
    product_type: 'strategy_guide',
    category: 'Education',
    price: 79,
    discount_percentage: 39,
    file_size_bytes: 55000000,
    preview_content: ['Table of contents'],
    features: [
      'Complete strategy guide',
      'Risk management rules',
      'Trade examples',
      'Free updates',
    ],
    tags: ['prop firm', 'challenge', 'funded', 'education'],
    total_purchases: 423,
    avg_rating: 4.9,
    total_reviews: 134,
    created_at: '2024-06-15',
    updated_at: '2026-01-20',
  },
  'professional-trading-journal': {
    id: 7,
    name: 'Professional Trading Journal',
    slug: 'professional-trading-journal',
    description: `Digital trading journal template for tracking and analyzing your trades.`,
    short_description: 'Track and analyze your trades',
    seller_id: 1,
    seller_name: 'AlgoEdge Academy',
    seller_rating: 4.9,
    seller_total_sales: 2847,
    product_type: 'template',
    category: 'Tools',
    price: 19,
    discount_percentage: 34,
    file_size_bytes: 5000000,
    preview_content: ['Preview screenshots'],
    features: [
      'Excel/Google Sheets',
      'Trade tracking',
      'Performance analytics',
      'Free updates',
    ],
    tags: ['journal', 'tracking', 'template', 'tools'],
    total_purchases: 678,
    avg_rating: 4.6,
    total_reviews: 201,
    created_at: '2024-06-15',
    updated_at: '2026-01-20',
  },
  'trading-plan-template-bundle': {
    id: 8,
    name: 'Trading Plan Template Bundle',
    slug: 'trading-plan-template-bundle',
    description: `Complete set of trading plan templates for different trading styles.`,
    short_description: 'Complete trading plan templates',
    seller_id: 1,
    seller_name: 'AlgoEdge Academy',
    seller_rating: 4.9,
    seller_total_sales: 2847,
    product_type: 'template',
    category: 'Tools',
    price: 29,
    discount_percentage: 41,
    file_size_bytes: 8000000,
    preview_content: ['Preview screenshots'],
    features: [
      'Multiple templates',
      'Customizable',
      'PDF & Word formats',
      'Free updates',
    ],
    tags: ['trading plan', 'template', 'tools'],
    total_purchases: 345,
    avg_rating: 4.7,
    total_reviews: 98,
    created_at: '2024-06-15',
    updated_at: '2026-01-20',
  },
  'forex-calculator-suite': {
    id: 9,
    name: 'Forex Calculator Suite',
    slug: 'forex-calculator-suite',
    description: `Professional Excel-based forex calculators for position sizing, pip value, and risk management.`,
    short_description: 'Professional forex calculators',
    seller_id: 1,
    seller_name: 'AlgoEdge Academy',
    seller_rating: 4.9,
    seller_total_sales: 2847,
    product_type: 'template',
    category: 'Tools',
    price: 39,
    discount_percentage: 34,
    file_size_bytes: 3000000,
    preview_content: ['Preview screenshots'],
    features: [
      'Position size calculator',
      'Pip value calculator',
      'Risk calculator',
      'Free updates',
    ],
    tags: ['calculator', 'forex', 'tools'],
    total_purchases: 234,
    avg_rating: 4.8,
    total_reviews: 67,
    created_at: '2024-06-15',
    updated_at: '2026-01-20',
  },
  'trading-psychology-blueprint': {
    id: 10,
    name: 'Trading Psychology Blueprint',
    slug: 'trading-psychology-blueprint',
    description: `Master your trading mindset with proven psychological frameworks.`,
    short_description: 'Master your trading mindset',
    seller_id: 1,
    seller_name: 'AlgoEdge Academy',
    seller_rating: 4.9,
    seller_total_sales: 2847,
    product_type: 'ebook',
    category: 'Education',
    price: 49,
    discount_percentage: 38,
    file_size_bytes: 40000000,
    preview_content: ['Table of contents'],
    features: [
      '160+ pages',
      'Exercises included',
      'PDF format',
      'Free updates',
    ],
    tags: ['psychology', 'mindset', 'ebook', 'education'],
    total_purchases: 189,
    avg_rating: 4.8,
    total_reviews: 54,
    created_at: '2024-06-15',
    updated_at: '2026-01-20',
  },
  'complete-forex-trading-course': {
    id: 11,
    name: 'Complete Forex Trading Course',
    slug: 'complete-forex-trading-course',
    description: `The ultimate comprehensive forex trading course covering everything from basics to advanced strategies.

## Course Modules

1. **Forex Fundamentals** - Currency pairs, pips, lots, and market structure
2. **Technical Analysis** - Chart patterns, candlesticks, and price action
3. **Fundamental Analysis** - Economic indicators and news trading
4. **Risk Management** - Position sizing and capital protection
5. **Trading Psychology** - Emotional control and discipline
6. **Live Trading Sessions** - Real-time market analysis and execution

## What's Included

- 25+ hours of HD video content
- Downloadable resources and templates
- Private Discord community access
- Monthly live Q&A sessions
- Lifetime updates`,
    short_description: 'Ultimate comprehensive forex trading course from beginner to professional',
    seller_id: 1,
    seller_name: 'AlgoEdge Academy',
    seller_rating: 4.9,
    seller_total_sales: 2847,
    product_type: 'video_course',
    category: 'Education',
    price: 299,
    discount_percentage: 40,
    file_size_bytes: 15000000000,
    preview_content: ['Course introduction video', 'Full course outline PDF', 'Sample lesson'],
    features: [
      '25+ hours of HD video',
      'Comprehensive curriculum',
      'Private Discord community',
      'Monthly live Q&A sessions',
      'Downloadable resources',
      'Certificate of completion',
      'Lifetime access & updates',
      '30-day money-back guarantee',
    ],
    tags: ['forex', 'trading course', 'education', 'comprehensive'],
    total_purchases: 1523,
    avg_rating: 4.9,
    total_reviews: 342,
    created_at: '2024-01-15',
    updated_at: '2026-01-20',
  },
  'smart-money-concepts-course': {
    id: 12,
    name: 'Smart Money Concepts Course',
    slug: 'smart-money-concepts-course',
    description: `Master institutional trading strategies with our comprehensive Smart Money Concepts course.

## What You'll Learn

- Order blocks and breaker blocks
- Fair value gaps and liquidity voids
- Market structure and character changes
- Institutional order flow analysis
- Entry models and trade management`,
    short_description: 'Learn how institutional traders move the markets',
    seller_id: 1,
    seller_name: 'AlgoEdge Academy',
    seller_rating: 4.9,
    seller_total_sales: 2847,
    product_type: 'video_course',
    category: 'Education',
    price: 199,
    discount_percentage: 35,
    file_size_bytes: 8000000000,
    preview_content: ['Introduction video', 'Course outline'],
    features: [
      '18+ hours of HD video',
      'Real chart examples',
      'Entry model templates',
      'Discord community access',
      'Lifetime updates',
    ],
    tags: ['smart money', 'institutional', 'ICT', 'video course'],
    total_purchases: 892,
    avg_rating: 4.8,
    total_reviews: 187,
    created_at: '2024-03-20',
    updated_at: '2026-01-20',
  },
  'price-action-bible-ebook': {
    id: 13,
    name: 'Price Action Bible eBook',
    slug: 'price-action-bible-ebook',
    description: `The complete encyclopedia of price action trading with 350+ pages and over 200 annotated chart examples.

## What's Covered

- Candlestick patterns and formations
- Support and resistance trading
- Trend analysis and structure
- Multi-timeframe analysis
- Trade entries and exits
- Real-world examples from all markets`,
    short_description: '350+ pages with 200+ chart examples',
    seller_id: 1,
    seller_name: 'AlgoEdge Academy',
    seller_rating: 4.9,
    seller_total_sales: 2847,
    product_type: 'ebook',
    category: 'Education',
    price: 49,
    discount_percentage: 20,
    file_size_bytes: 85000000,
    preview_content: ['Table of contents', 'Sample chapter'],
    features: [
      '350+ pages of content',
      '200+ annotated chart examples',
      'PDF format for all devices',
      'Bookmark-ready chapters',
      'Free lifetime updates',
      'Print-friendly version included',
    ],
    tags: ['price action', 'ebook', 'education', 'charts'],
    total_purchases: 1876,
    avg_rating: 4.7,
    total_reviews: 234,
    created_at: '2024-02-10',
    updated_at: '2026-01-15',
  },
  'ultimate-mt5-indicator-pack': {
    id: 14,
    name: 'Ultimate MT5 Indicator Pack',
    slug: 'ultimate-mt5-indicator-pack',
    description: `A collection of 25 premium custom indicators for MetaTrader 5, complete with source code and documentation.

## Included Indicators

- Supply/Demand Zones Auto-Drawer
- Smart Money Order Blocks
- Fair Value Gap Detector
- Liquidity Sweep Alert
- Session High/Low Markers
- Multi-Timeframe Dashboard
- And 19 more professional indicators!

## Features

- Full source code (.mq5 files)
- Detailed documentation
- Video installation guide
- Lifetime updates`,
    short_description: '25 premium indicators with source code',
    seller_id: 1,
    seller_name: 'AlgoEdge Academy',
    seller_rating: 4.9,
    seller_total_sales: 2847,
    product_type: 'indicator',
    category: 'Tools',
    price: 149,
    discount_percentage: 33,
    file_size_bytes: 25000000,
    preview_content: ['Indicator screenshots', 'Feature overview video'],
    features: [
      '25 premium indicators',
      'Full source code included',
      'Detailed documentation',
      'Video installation guide',
      'Works on all timeframes',
      'Free lifetime updates',
      'Discord support community',
    ],
    tags: ['mt5', 'indicators', 'tools', 'metatrader'],
    total_purchases: 1234,
    avg_rating: 4.8,
    total_reviews: 156,
    created_at: '2024-04-05',
    updated_at: '2026-01-18',
  },
  'trading-psychology-masterclass': {
    id: 15,
    name: 'Trading Psychology Masterclass',
    slug: 'trading-psychology-masterclass',
    description: `Transform your trading mindset with this in-depth psychology course designed specifically for traders.

## Course Contents

1. Understanding the Trading Mind
2. Fear and Greed Management
3. Building Trading Discipline
4. Handling Losing Streaks
5. Peak Performance Strategies
6. Creating Your Mental Edge`,
    short_description: 'Master the psychology of successful trading',
    seller_id: 1,
    seller_name: 'AlgoEdge Academy',
    seller_rating: 4.9,
    seller_total_sales: 2847,
    product_type: 'video_course',
    category: 'Education',
    price: 149,
    discount_percentage: 30,
    file_size_bytes: 6000000000,
    preview_content: ['Introduction video', 'Course outline'],
    features: [
      '10+ hours of video content',
      'Practical exercises',
      'Journaling templates',
      'Meditation guides for traders',
      'Private community access',
      'Lifetime updates',
    ],
    tags: ['psychology', 'mindset', 'video course', 'education'],
    total_purchases: 645,
    avg_rating: 4.9,
    total_reviews: 178,
    created_at: '2024-05-12',
    updated_at: '2026-01-20',
  },
};

// Demo reviews
const demoReviews: Review[] = [
  {
    id: 1,
    user_name: 'Robert M.',
    rating: 5,
    title: 'Life-changing content!',
    review: 'This course completely transformed my trading. The price action concepts are explained so clearly that even complex patterns became easy to identify. Worth every penny.',
    created_at: '2026-01-22',
    avatar: reviewerImages[1],
  },
  {
    id: 2,
    user_name: 'Jennifer L.',
    rating: 5,
    title: 'Best trading education I\'ve purchased',
    review: 'Coming from indicator-based trading, this course opened my eyes to how markets really work. The live examples are incredibly valuable.',
    created_at: '2026-01-20',
    avatar: reviewerImages[2],
  },
  {
    id: 3,
    user_name: 'Anthony K.',
    rating: 4,
    title: 'Great content, few minor issues',
    review: 'The content quality is excellent. Only giving 4 stars because some videos could use better audio. Content-wise, it\'s a solid 5.',
    created_at: '2026-01-18',
    avatar: reviewerImages[3],
  },
  {
    id: 4,
    user_name: 'Lisa P.',
    rating: 5,
    title: 'Finally understand the markets',
    review: 'After years of struggling with indicators, this course helped me see what was always right in front of me - price. Highly recommend for anyone serious about trading.',
    created_at: '2026-01-15',
    avatar: reviewerImages[4],
  },
  {
    id: 5,
    user_name: 'William T.',
    rating: 5,
    title: 'Exceptional value',
    review: 'The amount of content and quality of teaching is unmatched. The Discord community alone is worth the price of the course.',
    created_at: '2026-01-12',
    avatar: reviewerImages[5],
  },
];

const productTypeIcons: Record<string, any> = {
  ebook: BookOpen,
  video_course: Video,
  indicator: BarChart,
  template: Layout,
  strategy_guide: FileText,
  other: File,
};

const productTypeLabels: Record<string, string> = {
  ebook: 'E-Book',
  video_course: 'Video Course',
  indicator: 'Indicator',
  template: 'Template',
  strategy_guide: 'Strategy Guide',
  other: 'Digital Product',
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<ProductDetails | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState('');
  const [walletBalance, setWalletBalance] = useState<number | null>(null);
  const [insufficientFunds, setInsufficientFunds] = useState(false);

  useEffect(() => {
    if (slug) {
      fetchProductDetails();
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

  const fetchProductDetails = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/products/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setProduct(data.product);
        setReviews(data.reviews?.length > 0 ? data.reviews : demoReviews);
      } else {
        // Use demo data as fallback
        if (demoProducts[slug]) {
          setProduct(demoProducts[slug]);
          setReviews(demoReviews);
        } else {
          setError('Product not found');
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      // Use demo data as fallback on network error
      if (demoProducts[slug]) {
        setProduct(demoProducts[slug]);
        setReviews(demoReviews);
      } else {
        setError('Failed to load product details');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login?redirect=/marketplace/products/' + slug);
      return;
    }

    // Check if user has enough balance
    if (walletBalance !== null && product && walletBalance < (discountedPrice || product.price)) {
      setInsufficientFunds(true);
      return;
    }

    setPurchasing(true);
    setError('');
    try {
      // Use internal wallet for purchase
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/wallet/purchase/product/${product?.id}`, {
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

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'N/A';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const discountedPrice = product?.discount_percentage 
    ? product.price * (1 - product.discount_percentage / 100)
    : product?.price;

  const TypeIcon = product?.product_type ? productTypeIcons[product.product_type] || File : File;

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#8B5CF6' }} />
      </Box>
    );
  }

  if (error || !product) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', py: 8 }}>
        <Container maxWidth="md">
          <Alert severity="error" sx={{ mb: 3 }}>{error || 'Product not found'}</Alert>
          <Button component={Link} href="/marketplace/products" startIcon={<ArrowLeft size={18} />}>
            Back to Products
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
            <Link href="/marketplace/products" style={{ textDecoration: 'none' }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: '#8B5CF6' } }}>
                Digital Products
              </Typography>
            </Link>
            <Typography sx={{ color: 'white' }}>{product.name}</Typography>
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
                  bgcolor: 'rgba(59, 130, 246, 0.2)',
                  fontSize: '2rem',
                }}
              >
                <TypeIcon size={50} color="#3B82F6" />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Chip
                    label={productTypeLabels[product.product_type] || product.product_type}
                    size="small"
                    sx={{ bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6' }}
                  />
                  {product.category && (
                    <Chip label={product.category} size="small" sx={{ bgcolor: 'rgba(139, 92, 246, 0.2)', color: '#8B5CF6' }} />
                  )}
                  {product.discount_percentage > 0 && (
                    <Chip
                      label={`${product.discount_percentage}% OFF`}
                      size="small"
                      sx={{ bgcolor: 'rgba(239, 68, 68, 0.2)', color: '#EF4444' }}
                    />
                  )}
                </Stack>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, mb: 1 }}>
                  {product.name}
                </Typography>
                <Stack direction="row" spacing={3} alignItems="center">
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Star size={18} fill="#F59E0B" color="#F59E0B" />
                    <Typography sx={{ color: 'white', fontWeight: 600 }}>
                      {product.avg_rating?.toFixed(1) || '0.0'}
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      ({product.total_reviews} reviews)
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Download size={16} color="rgba(255,255,255,0.5)" />
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      {product.total_purchases} purchases
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
              <Tab label="Description" />
              <Tab label="What's Included" />
              <Tab label={`Reviews (${product.total_reviews})`} />
            </Tabs>

            {/* Description Tab */}
            {activeTab === 0 && (
              <Box>
                <Typography sx={{ color: 'rgba(255,255,255,0.9)', mb: 4, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                  {product.description}
                </Typography>

                {/* Tags */}
                {product.tags && product.tags.length > 0 && (
                  <Box sx={{ mb: 4 }}>
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', mb: 1 }}>
                      Tags
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                      {product.tags.map((tag, i) => (
                        <Chip
                          key={i}
                          label={tag}
                          size="small"
                          sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', mb: 1 }}
                        />
                      ))}
                    </Stack>
                  </Box>
                )}
              </Box>
            )}

            {/* What's Included Tab */}
            {activeTab === 1 && (
              <Box>
                {product.features && product.features.length > 0 ? (
                  <List>
                    {product.features.map((feature, i) => (
                      <ListItem key={i} sx={{ px: 0 }}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <Check size={20} color="#22C55E" />
                        </ListItemIcon>
                        <ListItemText
                          primary={feature}
                          sx={{ '& .MuiTypography-root': { color: 'rgba(255,255,255,0.9)' } }}
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'rgba(255,255,255,0.03)' }}>
                    <Package size={40} color="rgba(255,255,255,0.3)" style={{ marginBottom: 8 }} />
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      No detailed contents listed
                    </Typography>
                  </Paper>
                )}

                {/* Product Info */}
                <Grid container spacing={2} sx={{ mt: 3 }}>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                        File Size
                      </Typography>
                      <Typography sx={{ color: 'white', fontWeight: 600 }}>
                        {formatFileSize(product.file_size_bytes)}
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                        Format
                      </Typography>
                      <Typography sx={{ color: 'white', fontWeight: 600 }}>
                        {productTypeLabels[product.product_type] || 'Digital'}
                      </Typography>
                    </Paper>
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
                        {product.avg_rating?.toFixed(1) || '4.8'}
                      </Typography>
                      <Rating value={product.avg_rating || 4.8} readOnly precision={0.1} size="large" sx={{ mb: 1 }} />
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        {product.total_reviews || reviews.length} reviews
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
                                  icon={<Check size={12} />}
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
                {/* Price */}
                <Box sx={{ mb: 3 }}>
                  {product.discount_percentage > 0 && (
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'line-through' }}>
                        ${product.price}
                      </Typography>
                      <Chip
                        label={`-${product.discount_percentage}%`}
                        size="small"
                        sx={{ bgcolor: 'rgba(239, 68, 68, 0.2)', color: '#EF4444' }}
                      />
                    </Stack>
                  )}
                  <Typography variant="h3" sx={{ color: '#22C55E', fontWeight: 900 }}>
                    ${discountedPrice?.toFixed(2)}
                  </Typography>
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
                    Insufficient wallet balance. You need ${(discountedPrice || product.price).toFixed(2)} but have ${walletBalance?.toFixed(2) || '0.00'}.
                  </Alert>
                )}

                {walletBalance !== null && (
                  <Paper sx={{ p: 2, mb: 2, bgcolor: 'rgba(29, 155, 240, 0.1)', border: '1px solid rgba(29, 155, 240, 0.3)' }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                        Your Wallet Balance
                      </Typography>
                      <Typography sx={{ color: '#1D9BF0', fontWeight: 700 }}>
                        ${walletBalance.toFixed(2)}
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
                  {purchasing ? 'Processing...' : 'Buy with Wallet'}
                </Button>

                {/* Trust Badges */}
                <Stack spacing={1.5} sx={{ mb: 3 }}>
                  {[
                    { icon: Shield, text: 'Secure Wallet Payment' },
                    { icon: Download, text: 'Instant Download' },
                    { icon: Clock, text: 'Lifetime Access' },
                    { icon: MessageSquare, text: 'Seller Support' },
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
                    <Avatar sx={{ bgcolor: 'rgba(59, 130, 246, 0.2)' }}>
                      {product.seller_name?.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography sx={{ color: 'white', fontWeight: 600 }}>{product.seller_name}</Typography>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Star size={14} fill="#F59E0B" color="#F59E0B" />
                        <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>
                          {product.seller_rating?.toFixed(1)} • {product.seller_total_sales} sales
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
