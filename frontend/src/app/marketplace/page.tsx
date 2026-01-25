'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Chip,
  Stack,
  TextField,
  InputAdornment,
  Tab,
  Tabs,
  Skeleton,
  Rating,
  Avatar,
  Paper,
} from '@mui/material';
import {
  Search,
  Bot,
  Signal,
  FileText,
  Code,
  TrendingUp,
  Star,
  Users,
  ArrowRight,
  Sparkles,
  Shield,
  Zap,
  DollarSign,
  Award,
  Clock,
  Target,
  Crown,
  Rocket,
  Globe,
  ChartBar,
  Wallet,
  LineChart,
} from 'lucide-react';
import Link from 'next/link';

// Animated floating gradient orbs background
const AnimatedBackground = () => (
  <Box
    sx={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
      zIndex: 0,
      pointerEvents: 'none',
    }}
  >
    {/* Gradient Orb 1 - Green (Trading Success) */}
    <Box
      sx={{
        position: 'absolute',
        width: '800px',
        height: '800px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34, 197, 94, 0.25) 0%, transparent 70%)',
        top: '-20%',
        right: '-15%',
        animation: 'float1 20s ease-in-out infinite',
        '@keyframes float1': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '33%': { transform: 'translate(-50px, 50px) scale(1.1)' },
          '66%': { transform: 'translate(30px, -30px) scale(0.95)' },
        },
      }}
    />
    {/* Gradient Orb 2 - Blue (Signals) */}
    <Box
      sx={{
        position: 'absolute',
        width: '700px',
        height: '700px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%)',
        bottom: '10%',
        left: '-10%',
        animation: 'float2 25s ease-in-out infinite',
        '@keyframes float2': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(60px, -40px) scale(1.15)' },
        },
      }}
    />
    {/* Gradient Orb 3 - Purple (API) */}
    <Box
      sx={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.18) 0%, transparent 70%)',
        top: '50%',
        left: '50%',
        animation: 'float3 22s ease-in-out infinite',
        '@keyframes float3': {
          '0%, 100%': { transform: 'translate(-50%, 0) scale(1)' },
          '50%': { transform: 'translate(-50%, 50px) scale(1.1)' },
        },
      }}
    />
    {/* Gradient Orb 4 - Gold (Products) */}
    <Box
      sx={{
        position: 'absolute',
        width: '450px',
        height: '450px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(245, 158, 11, 0.15) 0%, transparent 70%)',
        bottom: '30%',
        right: '5%',
        animation: 'float4 18s ease-in-out infinite',
        '@keyframes float4': {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(-30px, 30px) scale(1.05)' },
        },
      }}
    />
    {/* Floating particles */}
    {[...Array(20)].map((_, i) => (
      <Box
        key={i}
        sx={{
          position: 'absolute',
          width: `${Math.random() * 6 + 2}px`,
          height: `${Math.random() * 6 + 2}px`,
          borderRadius: '50%',
          background: ['#22C55E', '#3B82F6', '#F59E0B', '#8B5CF6'][i % 4],
          opacity: 0.3,
          top: `${Math.random() * 100}%`,
          left: `${Math.random() * 100}%`,
          animation: `sparkle${i % 5} ${3 + Math.random() * 4}s ease-in-out infinite`,
          '@keyframes sparkle0': {
            '0%, 100%': { opacity: 0.2, transform: 'scale(1)' },
            '50%': { opacity: 0.6, transform: 'scale(1.5)' },
          },
          '@keyframes sparkle1': {
            '0%, 100%': { opacity: 0.3, transform: 'translateY(0)' },
            '50%': { opacity: 0.5, transform: 'translateY(-20px)' },
          },
          '@keyframes sparkle2': {
            '0%, 100%': { opacity: 0.2, transform: 'translateX(0)' },
            '50%': { opacity: 0.6, transform: 'translateX(15px)' },
          },
          '@keyframes sparkle3': {
            '0%, 100%': { opacity: 0.3, transform: 'rotate(0deg) scale(1)' },
            '50%': { opacity: 0.5, transform: 'rotate(180deg) scale(1.3)' },
          },
          '@keyframes sparkle4': {
            '0%, 100%': { opacity: 0.2 },
            '50%': { opacity: 0.7 },
          },
        }}
      />
    ))}
  </Box>
);

// Glass Card component
const GlassCard = ({ 
  children, 
  gradient = 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
  borderColor = 'rgba(255,255,255,0.1)',
  hoverBorderColor = 'rgba(34, 197, 94, 0.3)',
  shadowColor = 'rgba(34, 197, 94, 0.1)',
  sx = {},
  ...props 
}: any) => (
  <Box
    sx={{
      background: gradient,
      backdropFilter: 'blur(20px)',
      border: `1px solid ${borderColor}`,
      borderRadius: 3,
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      '&:hover': {
        border: `1px solid ${hoverBorderColor}`,
        transform: 'translateY(-6px)',
        boxShadow: `0 25px 50px ${shadowColor}`,
      },
      ...sx,
    }}
    {...props}
  >
    {children}
  </Box>
);

// Gradient Icon Box
const GradientIconBox = ({ children, gradient, size = 64 }: any) => (
  <Box
    sx={{
      width: size,
      height: size,
      borderRadius: '16px',
      background: gradient,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      transition: 'transform 0.3s ease',
      '&:hover': {
        transform: 'rotate(5deg) scale(1.05)',
      },
    }}
  >
    {children}
  </Box>
);

// Animated Stats Counter
const AnimatedStat = ({ value, label, icon: Icon, color }: any) => (
  <GlassCard
    hoverBorderColor={color}
    shadowColor={`${color}20`}
    sx={{ p: 3, textAlign: 'center' }}
  >
    <Box
      sx={{
        width: 56,
        height: 56,
        borderRadius: '14px',
        background: `linear-gradient(135deg, ${color}30 0%, ${color}10 100%)`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mx: 'auto',
        mb: 2,
      }}
    >
      <Icon size={28} color={color} />
    </Box>
    <Typography
      sx={{
        fontSize: '2.5rem',
        fontWeight: 800,
        background: `linear-gradient(135deg, ${color} 0%, white 100%)`,
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        mb: 0.5,
      }}
    >
      {value}
    </Typography>
    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
      {label}
    </Typography>
  </GlassCard>
);

interface MarketplaceStats {
  total_bots: number | string;
  total_signal_providers: number | string;
  total_products: number | string;
  total_customers: number | string;
  total_volume: number | string;
}

interface FeaturedItem {
  id: number;
  name?: string;
  display_name?: string;
  slug: string;
  thumbnail_url?: string;
  avatar_url?: string;
  price?: number;
  monthly_price?: number;
  rating_average: number;
  total_sales?: number;
  subscriber_count?: number;
  win_rate?: number;
  category?: string;
  product_type?: string;
}

// Why Sell Benefits
const sellerBenefits = [
  {
    icon: DollarSign,
    title: 'Keep 75% Revenue',
    description: 'Industry-leading commission structure. You keep most of your earnings.',
    gradient: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
    color: '#22C55E',
  },
  {
    icon: Globe,
    title: 'Global Reach',
    description: 'Access thousands of traders worldwide. Expand your customer base instantly.',
    gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
    color: '#3B82F6',
  },
  {
    icon: Shield,
    title: 'Secure Payments',
    description: 'Powered by Whop. Reliable, fast payouts to your preferred method.',
    gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
    color: '#F59E0B',
  },
  {
    icon: Rocket,
    title: 'Marketing Support',
    description: 'Get featured on our homepage and benefit from our marketing efforts.',
    gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
    color: '#8B5CF6',
  },
];

export default function MarketplacePage() {
  const [stats, setStats] = useState<MarketplaceStats | null>(null);
  const [featured, setFeatured] = useState<{
    bots: FeaturedItem[];
    signalProviders: FeaturedItem[];
    products: FeaturedItem[];
  }>({ bots: [], signalProviders: [], products: [] });
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchMarketplaceData();
  }, []);

  const fetchMarketplaceData = async () => {
    try {
      const [statsRes, featuredRes] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/stats`),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/featured`),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData.stats);
      }

      if (featuredRes.ok) {
        const featuredData = await featuredRes.json();
        setFeatured(featuredData.featured);
      }
    } catch (error) {
      console.error('Error fetching marketplace data:', error);
    } finally {
      setLoading(false);
    }
  };

  const marketplaceCategories = [
    {
      title: 'Trading Bots',
      description: 'AI-powered automated trading systems for MT4/MT5 platforms',
      icon: Bot,
      href: '/marketplace/bots',
      gradient: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
      color: '#22C55E',
      count: Number(stats?.total_bots) || 9,
      image: 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=400&h=250&fit=crop',
    },
    {
      title: 'Signal Providers',
      description: 'Copy professional traders with verified track records',
      icon: Signal,
      href: '/marketplace/signals',
      gradient: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
      color: '#3B82F6',
      count: Number(stats?.total_signal_providers) || 9,
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=250&fit=crop',
    },
    {
      title: 'Digital Products',
      description: 'Premium e-books, courses, indicators & educational content',
      icon: FileText,
      href: '/marketplace/products',
      gradient: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
      color: '#F59E0B',
      count: Number(stats?.total_products) || 9,
      image: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&h=250&fit=crop',
    },
    {
      title: 'API Access',
      description: 'Build powerful trading apps on our infrastructure',
      icon: Code,
      href: '/marketplace/api',
      gradient: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
      color: '#8B5CF6',
      count: 9,
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop',
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', position: 'relative', overflow: 'hidden' }}>
      <AnimatedBackground />
      
      {/* Hero Section */}
      <Box
        sx={{
          position: 'relative',
          pt: { xs: 10, md: 14 },
          pb: { xs: 8, md: 12 },
          overflow: 'hidden',
        }}
      >
        {/* Hero Background Image Overlay */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'url(https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1920&h=800&fit=crop)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.08,
            zIndex: 0,
          }}
        />
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          {/* Top Navigation Pills */}
          <Stack 
            direction="row" 
            spacing={1} 
            justifyContent="center" 
            sx={{ mb: 4 }}
            flexWrap="wrap"
          >
            <Chip
              label="🔥 New Arrivals"
              sx={{
                bgcolor: 'rgba(239, 68, 68, 0.2)',
                color: '#EF4444',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                fontWeight: 600,
              }}
            />
            <Chip
              label="⭐ Top Rated"
              sx={{
                bgcolor: 'rgba(245, 158, 11, 0.2)',
                color: '#F59E0B',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                fontWeight: 600,
              }}
            />
            <Chip
              label="💰 Best Sellers"
              sx={{
                bgcolor: 'rgba(34, 197, 94, 0.2)',
                color: '#22C55E',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                fontWeight: 600,
              }}
            />
          </Stack>

          {/* Main Hero Content */}
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: '2.5rem', md: '4rem', lg: '4.5rem' },
                fontWeight: 900,
                lineHeight: 1.1,
                mb: 3,
                background: 'linear-gradient(135deg, #FFFFFF 0%, #22C55E 50%, #3B82F6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              The Premier Trading
              <br />
              <Box component="span" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                <Sparkles size={48} color="#F59E0B" style={{ animation: 'pulse 2s infinite' }} />
                Marketplace
                <Sparkles size={48} color="#F59E0B" style={{ animation: 'pulse 2s infinite' }} />
              </Box>
            </Typography>
            
            <Typography
              sx={{
                fontSize: { xs: '1.1rem', md: '1.35rem' },
                color: 'rgba(255,255,255,0.7)',
                maxWidth: 700,
                mx: 'auto',
                mb: 4,
                lineHeight: 1.7,
              }}
            >
              Discover premium trading bots, expert signal providers, educational resources,
              and powerful APIs. Everything you need to succeed in trading, all in one place.
            </Typography>

            {/* Search Bar */}
            <GlassCard
              sx={{
                maxWidth: 650,
                mx: 'auto',
                p: 0.5,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <TextField
                fullWidth
                placeholder="Search bots, signals, products, APIs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={22} color="rgba(255,255,255,0.5)" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    fontSize: '1.1rem',
                    '& fieldset': { border: 'none' },
                  },
                }}
              />
              <Button
                variant="contained"
                sx={{
                  background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                  px: 4,
                  py: 1.5,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                    transform: 'scale(1.02)',
                  },
                }}
              >
                Search
              </Button>
            </GlassCard>
          </Box>

          {/* Animated Stats */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={6} md={3}>
              <AnimatedStat
                value={stats?.total_bots || '25+'}
                label="Trading Bots"
                icon={Bot}
                color="#22C55E"
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <AnimatedStat
                value={stats?.total_signal_providers || '15+'}
                label="Signal Providers"
                icon={Signal}
                color="#3B82F6"
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <AnimatedStat
                value={stats?.total_products || '50+'}
                label="Digital Products"
                icon={FileText}
                color="#F59E0B"
              />
            </Grid>
            <Grid item xs={6} md={3}>
              <AnimatedStat
                value={stats?.total_customers || '2K+'}
                label="Happy Traders"
                icon={Users}
                color="#8B5CF6"
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Browse Categories Section */}
      <Box sx={{ py: { xs: 6, md: 10 }, position: 'relative' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                color: 'white',
                mb: 2,
              }}
            >
              🎯 Browse Categories
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.6)', maxWidth: 500, mx: 'auto' }}>
              Find exactly what you need from our curated collection of trading tools
            </Typography>
          </Box>

          <Grid container spacing={4}>
            {marketplaceCategories.map((category, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <GlassCard
                  component={Link}
                  href={category.href}
                  hoverBorderColor={category.color}
                  shadowColor={`${category.color}30`}
                  sx={{
                    display: 'block',
                    textDecoration: 'none',
                    overflow: 'hidden',
                    height: '100%',
                  }}
                >
                  {/* Category Image */}
                  <Box
                    sx={{
                      height: 160,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <Box
                      component="img"
                      src={category.image}
                      alt={category.title}
                      sx={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.5s ease',
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        background: `linear-gradient(to bottom, transparent 0%, ${category.color}30 100%)`,
                      }}
                    />
                    <Chip
                      label={`${category.count}+ Available`}
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: 12,
                        right: 12,
                        bgcolor: category.color,
                        color: 'white',
                        fontWeight: 700,
                      }}
                    />
                  </Box>
                  
                  <Box sx={{ p: 3 }}>
                    <GradientIconBox
                      gradient={category.gradient}
                      size={56}
                    >
                      <category.icon size={28} />
                    </GradientIconBox>
                    <Typography
                      variant="h6"
                      sx={{
                        color: 'white',
                        fontWeight: 700,
                        mt: 2,
                        mb: 1,
                      }}
                    >
                      {category.title}
                    </Typography>
                    <Typography
                      sx={{
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '0.9rem',
                        lineHeight: 1.6,
                      }}
                    >
                      {category.description}
                    </Typography>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        mt: 2,
                        color: category.color,
                        fontWeight: 600,
                      }}
                    >
                      Explore <ArrowRight size={18} style={{ marginLeft: 8 }} />
                    </Box>
                  </Box>
                </GlassCard>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Featured Trading Bots */}
      {featured.bots.length > 0 && (
        <Box sx={{ py: { xs: 6, md: 8 }, position: 'relative' }}>
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Box>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, mb: 1 }}>
                  🤖 Featured Trading Bots
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  AI-powered bots with verified performance history
                </Typography>
              </Box>
              <Button
                component={Link}
                href="/marketplace/bots"
                endIcon={<ArrowRight size={20} />}
                sx={{
                  background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                  color: 'white',
                  px: 3,
                  fontWeight: 700,
                  '&:hover': { transform: 'scale(1.05)' },
                }}
              >
                View All Bots
              </Button>
            </Box>
            
            <Grid container spacing={3}>
              {featured.bots.map((bot) => (
                <Grid item xs={12} sm={6} md={3} key={bot.id}>
                  <GlassCard
                    component={Link}
                    href={`/marketplace/bots/${bot.slug}`}
                    hoverBorderColor="#22C55E"
                    shadowColor="rgba(34, 197, 94, 0.2)"
                    sx={{ display: 'block', textDecoration: 'none', height: '100%', overflow: 'hidden' }}
                  >
                    <Box
                      sx={{
                        height: 180,
                        bgcolor: 'rgba(34, 197, 94, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {bot.thumbnail_url ? (
                        <Box
                          component="img"
                          src={bot.thumbnail_url}
                          alt={bot.name}
                          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <Bot size={56} color="#22C55E" />
                      )}
                      {bot.category && (
                        <Chip
                          label={bot.category}
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 12,
                            left: 12,
                            bgcolor: '#22C55E',
                            color: 'white',
                            fontWeight: 600,
                          }}
                        />
                      )}
                    </Box>
                    <CardContent>
                      <Typography sx={{ color: 'white', fontWeight: 700, mb: 1 }} noWrap>
                        {bot.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                        <Rating value={bot.rating_average || 0} size="small" readOnly precision={0.5} />
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                          ({bot.total_sales || 0} sales)
                        </Typography>
                      </Box>
                      <Typography
                        sx={{
                          fontSize: '1.5rem',
                          fontWeight: 800,
                          background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}
                      >
                        ${bot.price || 0}
                      </Typography>
                    </CardContent>
                  </GlassCard>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      )}

      {/* Featured Signal Providers */}
      {featured.signalProviders.length > 0 && (
        <Box sx={{ py: { xs: 6, md: 8 }, position: 'relative' }}>
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Box>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, mb: 1 }}>
                  📊 Top Signal Providers
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  Copy trades from professional traders with verified track records
                </Typography>
              </Box>
              <Button
                component={Link}
                href="/marketplace/signals"
                endIcon={<ArrowRight size={20} />}
                sx={{
                  background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                  color: 'white',
                  px: 3,
                  fontWeight: 700,
                  '&:hover': { transform: 'scale(1.05)' },
                }}
              >
                View All Signals
              </Button>
            </Box>
            
            <Grid container spacing={3}>
              {featured.signalProviders.map((provider) => (
                <Grid item xs={12} sm={6} md={3} key={provider.id}>
                  <GlassCard
                    component={Link}
                    href={`/marketplace/signals/${provider.slug}`}
                    hoverBorderColor="#3B82F6"
                    shadowColor="rgba(59, 130, 246, 0.2)"
                    sx={{ display: 'block', textDecoration: 'none', height: '100%' }}
                  >
                    <CardContent sx={{ textAlign: 'center', py: 4 }}>
                      <Avatar
                        src={provider.avatar_url}
                        sx={{
                          width: 90,
                          height: 90,
                          mx: 'auto',
                          mb: 2,
                          border: '3px solid #3B82F6',
                          boxShadow: '0 0 30px rgba(59, 130, 246, 0.3)',
                        }}
                      >
                        {provider.display_name?.charAt(0)}
                      </Avatar>
                      <Typography sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                        {provider.display_name}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mb: 2 }}>
                        <Rating value={provider.rating_average || 0} size="small" readOnly precision={0.5} />
                      </Box>
                      <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 3 }}>
                        <Chip
                          icon={<TrendingUp size={14} />}
                          label={`${provider.win_rate || 0}% Win`}
                          size="small"
                          sx={{ bgcolor: 'rgba(34, 197, 94, 0.2)', color: '#22C55E' }}
                        />
                        <Chip
                          icon={<Users size={14} />}
                          label={`${provider.subscriber_count || 0}`}
                          size="small"
                          sx={{ bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6' }}
                        />
                      </Stack>
                      <Typography
                        sx={{
                          fontSize: '1.25rem',
                          fontWeight: 800,
                          background: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}
                      >
                        ${provider.monthly_price || 0}/mo
                      </Typography>
                    </CardContent>
                  </GlassCard>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      )}

      {/* Featured Digital Products */}
      {featured.products.length > 0 && (
        <Box sx={{ py: { xs: 6, md: 8 }, position: 'relative' }}>
          <Container maxWidth="lg">
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
              <Box>
                <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, mb: 1 }}>
                  📚 Popular Digital Products
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>
                  Premium courses, e-books, indicators, and more
                </Typography>
              </Box>
              <Button
                component={Link}
                href="/marketplace/products"
                endIcon={<ArrowRight size={20} />}
                sx={{
                  background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                  color: 'white',
                  px: 3,
                  fontWeight: 700,
                  '&:hover': { transform: 'scale(1.05)' },
                }}
              >
                View All Products
              </Button>
            </Box>
            
            <Grid container spacing={3}>
              {featured.products.map((product) => (
                <Grid item xs={12} sm={6} md={3} key={product.id}>
                  <GlassCard
                    component={Link}
                    href={`/marketplace/products/${product.slug}`}
                    hoverBorderColor="#F59E0B"
                    shadowColor="rgba(245, 158, 11, 0.2)"
                    sx={{ display: 'block', textDecoration: 'none', height: '100%', overflow: 'hidden' }}
                  >
                    <Box
                      sx={{
                        height: 160,
                        bgcolor: 'rgba(245, 158, 11, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
                      }}
                    >
                      {product.thumbnail_url ? (
                        <Box
                          component="img"
                          src={product.thumbnail_url}
                          alt={product.name}
                          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <FileText size={56} color="#F59E0B" />
                      )}
                      {product.product_type && (
                        <Chip
                          label={product.product_type}
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 12,
                            left: 12,
                            bgcolor: '#F59E0B',
                            color: 'white',
                            fontWeight: 600,
                          }}
                        />
                      )}
                    </Box>
                    <CardContent>
                      <Typography sx={{ color: 'white', fontWeight: 700, mb: 1 }} noWrap>
                        {product.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 2 }}>
                        <Rating value={product.rating_average || 0} size="small" readOnly precision={0.5} />
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                          ({product.total_sales || 0} sales)
                        </Typography>
                      </Box>
                      <Typography
                        sx={{
                          fontSize: '1.5rem',
                          fontWeight: 800,
                          background: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent',
                        }}
                      >
                        ${product.price || 0}
                      </Typography>
                    </CardContent>
                  </GlassCard>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      )}

      {/* ===== BECOME A SELLER SECTION ===== */}
      <Box
        sx={{
          py: { xs: 10, md: 14 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background Image */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url(https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1920&h=800&fit=crop)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: 0.1,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(59, 130, 246, 0.15) 50%, rgba(139, 92, 246, 0.15) 100%)',
          }}
        />
        
        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Chip
                icon={<Crown size={16} />}
                label="SELLER PROGRAM"
                sx={{
                  bgcolor: 'rgba(34, 197, 94, 0.2)',
                  color: '#22C55E',
                  fontWeight: 700,
                  mb: 3,
                  border: '1px solid rgba(34, 197, 94, 0.3)',
                }}
              />
              <Typography
                variant="h2"
                sx={{
                  fontWeight: 900,
                  fontSize: { xs: '2.5rem', md: '3.5rem' },
                  color: 'white',
                  mb: 3,
                  lineHeight: 1.2,
                }}
              >
                Start Earning
                <br />
                <Box
                  component="span"
                  sx={{
                    background: 'linear-gradient(135deg, #22C55E 0%, #3B82F6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  Passive Income
                </Box>
                <br />
                Today
              </Typography>
              <Typography
                sx={{
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '1.2rem',
                  lineHeight: 1.8,
                  mb: 4,
                }}
              >
                Turn your trading expertise into a profitable business. 
                Sell your bots, signals, courses, and more to thousands of traders worldwide.
                Keep <strong style={{ color: '#22C55E' }}>75% of every sale</strong>.
              </Typography>
              
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  component={Link}
                  href="/dashboard/seller"
                  variant="contained"
                  size="large"
                  startIcon={<Rocket size={22} />}
                  sx={{
                    background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                    px: 5,
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    boxShadow: '0 10px 40px rgba(34, 197, 94, 0.3)',
                    '&:hover': {
                      transform: 'translateY(-3px)',
                      boxShadow: '0 15px 50px rgba(34, 197, 94, 0.4)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Become a Seller
                </Button>
                <Button
                  component={Link}
                  href="/affiliate"
                  variant="outlined"
                  size="large"
                  startIcon={<Users size={22} />}
                  sx={{
                    borderColor: '#3B82F6',
                    borderWidth: 2,
                    color: '#3B82F6',
                    px: 5,
                    py: 2,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    '&:hover': {
                      borderColor: '#60A5FA',
                      bgcolor: 'rgba(59, 130, 246, 0.1)',
                      transform: 'translateY(-3px)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Join Affiliate Program
                </Button>
              </Stack>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Grid container spacing={2}>
                {sellerBenefits.map((benefit, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <GlassCard
                      hoverBorderColor={benefit.color}
                      shadowColor={`${benefit.color}20`}
                      sx={{ p: 3, height: '100%' }}
                    >
                      <GradientIconBox
                        gradient={benefit.gradient}
                        size={50}
                      >
                        <benefit.icon size={24} />
                      </GradientIconBox>
                      <Typography
                        sx={{
                          color: 'white',
                          fontWeight: 700,
                          mt: 2,
                          mb: 1,
                        }}
                      >
                        {benefit.title}
                      </Typography>
                      <Typography
                        sx={{
                          color: 'rgba(255,255,255,0.6)',
                          fontSize: '0.9rem',
                          lineHeight: 1.6,
                        }}
                      >
                        {benefit.description}
                      </Typography>
                    </GlassCard>
                  </Grid>
                ))}
              </Grid>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* API Section */}
      <Box sx={{ py: { xs: 8, md: 12 }, position: 'relative' }}>
        <Container maxWidth="lg">
          <GlassCard
            sx={{
              p: { xs: 4, md: 6 },
              background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
            }}
          >
            <Grid container spacing={4} alignItems="center">
              <Grid item xs={12} md={7}>
                <Chip
                  icon={<Code size={16} />}
                  label="DEVELOPER API"
                  sx={{
                    bgcolor: 'rgba(139, 92, 246, 0.2)',
                    color: '#8B5CF6',
                    fontWeight: 700,
                    mb: 2,
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                  }}
                />
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 800,
                    color: 'white',
                    mb: 2,
                  }}
                >
                  Build on Our Infrastructure
                </Typography>
                <Typography
                  sx={{
                    color: 'rgba(255,255,255,0.7)',
                    fontSize: '1.1rem',
                    mb: 3,
                    lineHeight: 1.8,
                  }}
                >
                  Access our powerful trading APIs to build custom applications, 
                  integrate with your existing systems, or create entirely new trading experiences.
                </Typography>
                <Stack direction="row" spacing={3} sx={{ mb: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ color: '#8B5CF6', fontWeight: 800, fontSize: '2rem' }}>
                      99.9%
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                      Uptime SLA
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ color: '#8B5CF6', fontWeight: 800, fontSize: '2rem' }}>
                      &lt;50ms
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                      Avg Response
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography sx={{ color: '#8B5CF6', fontWeight: 800, fontSize: '2rem' }}>
                      100+
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                      Endpoints
                    </Typography>
                  </Box>
                </Stack>
                <Button
                  component={Link}
                  href="/marketplace/api"
                  variant="contained"
                  size="large"
                  endIcon={<ArrowRight size={20} />}
                  sx={{
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                    px: 4,
                    py: 1.5,
                    fontWeight: 700,
                    '&:hover': {
                      transform: 'scale(1.05)',
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  Explore API Plans
                </Button>
              </Grid>
              <Grid item xs={12} md={5}>
                <Box
                  sx={{
                    bgcolor: 'rgba(0,0,0,0.3)',
                    borderRadius: 2,
                    p: 2,
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                  }}
                >
                  <Typography sx={{ color: '#8B5CF6', mb: 1 }}>// Example API Request</Typography>
                  <Typography sx={{ color: '#22C55E' }}>const</Typography>
                  <Typography sx={{ color: 'white' }}>{` response = await fetch(`}</Typography>
                  <Typography sx={{ color: '#F59E0B' }}>{`  'https://api.algoedge.app/v1/signals'`}</Typography>
                  <Typography sx={{ color: 'white' }}>{`, {`}</Typography>
                  <Typography sx={{ color: 'white' }}>{`  headers: {`}</Typography>
                  <Typography sx={{ color: '#F59E0B' }}>{`    'Authorization': 'Bearer YOUR_API_KEY'`}</Typography>
                  <Typography sx={{ color: 'white' }}>{`  }`}</Typography>
                  <Typography sx={{ color: 'white' }}>{`});`}</Typography>
                </Box>
              </Grid>
            </Grid>
          </GlassCard>
        </Container>
      </Box>

      {/* Trust Indicators Footer */}
      <Box
        sx={{
          py: 6,
          borderTop: '1px solid rgba(255,255,255,0.1)',
          position: 'relative',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} justifyContent="center" alignItems="center">
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Shield size={36} color="#22C55E" />
                <Typography sx={{ color: 'white', fontWeight: 700, mt: 1 }}>
                  Secure Payments
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                  Powered by Whop
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Star size={36} color="#F59E0B" />
                <Typography sx={{ color: 'white', fontWeight: 700, mt: 1 }}>
                  Verified Sellers
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                  Quality Assured
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Clock size={36} color="#3B82F6" />
                <Typography sx={{ color: 'white', fontWeight: 700, mt: 1 }}>
                  24/7 Support
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                  Always Available
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Award size={36} color="#8B5CF6" />
                <Typography sx={{ color: 'white', fontWeight: 700, mt: 1 }}>
                  Money Back
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                  30-Day Guarantee
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}
