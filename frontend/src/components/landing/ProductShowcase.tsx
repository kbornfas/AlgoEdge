'use client';

import { Box, Container, Typography, Grid, Card, CardContent, Button, Chip, Stack, Avatar, Rating, Skeleton } from '@mui/material';
import { Bot, TrendingUp, BookOpen, Code, Zap, Star, Users, ArrowRight, Crown, Shield, BarChart3, Award, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

// ============================================================================
// GLASS CARD COMPONENT - Same style as Marketplace
// ============================================================================
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

// Bot thumbnail images for display
const botImages: Record<string, string> = {
  'ema-pullback': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=250&fit=crop',
  'break-retest': 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=400&h=250&fit=crop',
  'liquidity-sweep': 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=400&h=250&fit=crop',
  'london-breakout': 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&h=250&fit=crop',
  'order-block': 'https://images.unsplash.com/photo-1535320903710-d993d3d77d29?w=400&h=250&fit=crop',
  'vwap-reversion': 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=400&h=250&fit=crop',
  'fib-continuation': 'https://images.unsplash.com/photo-1559526324-593bc073d938?w=400&h=250&fit=crop',
  'rsi-divergence': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop',
  'default': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=250&fit=crop',
};

// Product type images
const productImages: Record<string, string> = {
  'course': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop',
  'video course': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop',
  'ebook': 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&h=200&fit=crop',
  'indicator': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop',
  'indicators': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop',
  'template': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop',
  'default': 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&h=200&fit=crop',
};

// ============================================================================
// STATIC FALLBACK DATA (if API fails)
// ============================================================================
const fallbackBots = [
  {
    id: 1,
    name: 'EMA Pullback EA',
    slug: 'ema-pullback',
    description: 'Smart trend-following with dynamic support/resistance',
    price: 0,
    is_free: true,
    win_rate: 68,
    monthlyReturn: '8-12%',
    category: 'Trend Following',
    isOfficial: true,
    sales: 2341,
    rating: 4.8,
    isVerified: true,
  },
  {
    id: 2,
    name: 'Break & Retest',
    slug: 'break-retest',
    description: 'Captures breakouts with smart retest confirmation',
    price: 0,
    is_free: true,
    win_rate: 65,
    monthlyReturn: '6-10%',
    category: 'Breakout',
    isOfficial: true,
    sales: 1876,
    rating: 4.7,
    isVerified: true,
  },
  {
    id: 3,
    name: 'Liquidity Sweep Hunter',
    slug: 'liquidity-sweep',
    description: 'Smart money concepts with liquidity zone detection',
    price: 0,
    is_free: true,
    win_rate: 72,
    monthlyReturn: '10-15%',
    category: 'Smart Money',
    isOfficial: true,
    sales: 3124,
    rating: 4.9,
    isVerified: true,
  },
];

const fallbackSignals = [
  {
    id: 1,
    name: 'AlgoEdge Elite Signals',
    description: '5-15 signals daily across major pairs',
    monthlyPrice: 49.99,
    winRate: 71,
    pipsPerMonth: 850,
    subscribers: 2847,
    isOfficial: true,
    isVerified: true,
    avatar: 'AE',
  },
  {
    id: 2,
    name: 'Gold & Indices Pro',
    description: 'XAUUSD, US30, NAS100 specialist signals',
    monthlyPrice: 79.99,
    winRate: 68,
    pipsPerMonth: 620,
    subscribers: 1523,
    isOfficial: true,
    isVerified: true,
    avatar: 'GI',
  },
];

const fallbackProducts = [
  {
    id: 1,
    name: 'Complete Forex Course',
    slug: 'complete-forex-trading-course',
    description: '40+ hours from beginner to advanced',
    price: 299,
    discountPrice: 199,
    type: 'Video Course',
    sales: 2341,
    rating: 4.9,
    isVerified: true,
  },
  {
    id: 2,
    name: 'Price Action Bible',
    slug: 'price-action-bible-ebook',
    description: '350+ pages with 200+ chart examples',
    price: 49,
    discountPrice: 39,
    type: 'eBook',
    sales: 1876,
    rating: 4.7,
    isVerified: true,
  },
  {
    id: 3,
    name: 'MT5 Indicator Pack',
    slug: 'ultimate-mt5-indicator-pack',
    description: '25 premium indicators with source code',
    price: 149,
    discountPrice: 99,
    type: 'Indicators',
    sales: 1234,
    rating: 4.8,
    isVerified: true,
  },
];

const apiTiers = [
  { name: 'Starter', price: 29.99, requests: '1,000/day', features: ['All endpoints', 'WebSocket access', 'Email support', '30-day history'] },
  { name: 'Professional', price: 99.99, requests: '10,000/day', features: ['Priority queue', '5yr history', 'Priority support', 'Custom alerts'] },
  { name: 'Enterprise', price: 499.99, requests: '100,000/day', features: ['Dedicated server', 'Custom SLA', '99.9% uptime', 'Account manager'] },
];

// ============================================================================
// PRODUCT SHOWCASE COMPONENT
// ============================================================================

export default function ProductShowcase() {
  const [bots, setBots] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [botsRes, featuredRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/bots?limit=3`).catch(() => null),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/featured`).catch(() => null),
        ]);

        if (botsRes?.ok) {
          const data = await botsRes.json();
          if (data.bots?.length > 0) {
            setBots(data.bots.slice(0, 3));
          } else {
            setBots(fallbackBots);
          }
        } else {
          setBots(fallbackBots);
        }

        if (featuredRes?.ok) {
          const data = await featuredRes.json();
          if (data.featured?.products?.length > 0) {
            setProducts(data.featured.products.slice(0, 3));
          } else {
            setProducts(fallbackProducts);
          }
          if (data.featured?.signalProviders?.length > 0) {
            setSignals(data.featured.signalProviders.slice(0, 2));
          } else {
            setSignals(fallbackSignals);
          }
        } else {
          setProducts(fallbackProducts);
          setSignals(fallbackSignals);
        }
      } catch (err) {
        console.error('Error fetching marketplace data:', err);
        setBots(fallbackBots);
        setProducts(fallbackProducts);
        setSignals(fallbackSignals);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <Box sx={{ py: 8 }}>
      {/* Section Header */}
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            mb: 2,
            fontSize: { xs: '2rem', md: '2.5rem' },
            color: '#22C55E',
            textShadow: '0 2px 10px rgba(0, 255, 0, 0.3)',
          }}
        >
          Premium Trading Products
        </Typography>
        <Typography
          sx={{
            color: '#FFFFFF',
            fontSize: { xs: '1rem', md: '1.1rem' },
            maxWidth: '700px',
            mx: 'auto',
            fontWeight: 500,
          }}
        >
          Professional-grade tools, bots, and education to accelerate your trading success
        </Typography>
      </Box>

      {/* Trading Bots Section */}
      <Box sx={{ mb: 8 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box sx={{ p: 1.5, bgcolor: 'rgba(34, 197, 94, 0.2)', borderRadius: 2 }}>
              <Bot size={28} color="#22C55E" />
            </Box>
            <Typography variant="h5" sx={{ color: '#FFFFFF', fontWeight: 700 }}>
              Trading Bots
            </Typography>
          </Stack>
          <Button
            component={Link}
            href="/marketplace/bots"
            endIcon={<ArrowRight size={18} />}
            sx={{ color: '#22C55E', fontWeight: 600 }}
          >
            View All
          </Button>
        </Stack>

        <Grid container spacing={3}>
          {loading ? (
            [...Array(3)].map((_, i) => (
              <Grid item xs={12} md={4} key={i}>
                <Skeleton variant="rounded" height={380} sx={{ borderRadius: 3, bgcolor: 'rgba(255,255,255,0.05)' }} />
              </Grid>
            ))
          ) : (
            bots.map((bot) => {
              const imageUrl = botImages[bot.slug] || botImages['default'];
              return (
                <Grid item xs={12} md={4} key={bot.id}>
                  <GlassCard
                    component={Link}
                    href={`/marketplace/bots/${bot.slug}`}
                    hoverBorderColor="#22C55E"
                    shadowColor="rgba(34, 197, 94, 0.2)"
                    sx={{ display: 'block', textDecoration: 'none', height: '100%', overflow: 'hidden' }}
                  >
                    {/* Image Section */}
                    <Box
                      sx={{
                        height: 180,
                        position: 'relative',
                        overflow: 'hidden',
                        bgcolor: 'rgba(34, 197, 94, 0.1)',
                      }}
                    >
                      <Box
                        component="img"
                        src={imageUrl}
                        alt={bot.name}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.5s ease',
                          '&:hover': { transform: 'scale(1.05)' },
                        }}
                      />
                      {/* Gradient overlay */}
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(to bottom, transparent 0%, rgba(10,15,26,0.9) 100%)',
                        }}
                      />
                      {/* Badges */}
                      <Stack direction="row" spacing={1} sx={{ position: 'absolute', top: 12, left: 12 }}>
                        <Chip
                          icon={<Crown size={12} />}
                          label="Official"
                          size="small"
                          sx={{ 
                            bgcolor: 'rgba(234, 179, 8, 0.9)', 
                            color: '#000', 
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            height: 24,
                          }}
                        />
                        <Chip
                          icon={<Shield size={12} />}
                          label="Verified"
                          size="small"
                          sx={{ 
                            bgcolor: 'rgba(34, 197, 94, 0.9)', 
                            color: '#000', 
                            fontWeight: 700,
                            fontSize: '0.7rem',
                            height: 24,
                          }}
                        />
                      </Stack>
                      {/* Category badge */}
                      {bot.category && (
                        <Chip
                          label={bot.category}
                          size="small"
                          sx={{
                            position: 'absolute',
                            bottom: 12,
                            left: 12,
                            bgcolor: 'rgba(139, 92, 246, 0.9)',
                            color: 'white',
                            fontWeight: 600,
                            fontSize: '0.7rem',
                          }}
                        />
                      )}
                    </Box>

                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 700, mb: 1 }}>
                        {bot.name}
                      </Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', mb: 2, minHeight: 40 }}>
                        {bot.description || bot.short_description}
                      </Typography>

                      {/* Stats Grid */}
                      <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'rgba(34, 197, 94, 0.1)', borderRadius: 2 }}>
                            <Typography sx={{ color: '#22C55E', fontWeight: 700, fontSize: '1.2rem' }}>
                              {bot.win_rate || bot.backtest_results?.win_rate || '65'}%
                            </Typography>
                            <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>
                              Win Rate
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'rgba(34, 197, 94, 0.1)', borderRadius: 2 }}>
                            <Typography sx={{ color: '#22C55E', fontWeight: 700, fontSize: '1.2rem' }}>
                              {bot.monthlyReturn || '5-15%'}
                            </Typography>
                            <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>
                              Monthly
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>

                      {/* Rating & Sales */}
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Star size={16} fill="#EAB308" color="#EAB308" />
                          <Typography sx={{ color: '#FFFFFF', fontWeight: 600 }}>{bot.rating || bot.avg_rating || 4.8}</Typography>
                          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                            ({bot.sales || bot.total_purchases || 0} sales)
                          </Typography>
                        </Stack>
                      </Stack>

                      {/* Price & CTA */}
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Box>
                          {bot.is_free ? (
                            <Typography sx={{ color: '#22C55E', fontWeight: 700, fontSize: '1.5rem' }}>
                              FREE
                            </Typography>
                          ) : (
                            <>
                              {bot.discountPrice && (
                                <Typography sx={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'line-through', fontSize: '0.9rem' }}>
                                  ${bot.price}
                                </Typography>
                              )}
                              <Typography sx={{ color: '#22C55E', fontWeight: 700, fontSize: '1.5rem' }}>
                                ${bot.discountPrice || bot.price || 0}
                              </Typography>
                            </>
                          )}
                        </Box>
                        <Button
                          variant="contained"
                          sx={{
                            bgcolor: '#22C55E',
                            color: '#000',
                            fontWeight: 700,
                            px: 3,
                            '&:hover': { bgcolor: '#16A34A' },
                          }}
                        >
                          View Bot
                        </Button>
                      </Stack>
                    </CardContent>
                  </GlassCard>
                </Grid>
              );
            })
          )}
        </Grid>
      </Box>

      {/* Signal Services Section */}
      <Box sx={{ mb: 8 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box sx={{ p: 1.5, bgcolor: 'rgba(59, 130, 246, 0.2)', borderRadius: 2 }}>
              <TrendingUp size={28} color="#3B82F6" />
            </Box>
            <Typography variant="h5" sx={{ color: '#FFFFFF', fontWeight: 700 }}>
              Signal Services
            </Typography>
          </Stack>
          <Button
            component={Link}
            href="/marketplace/signals"
            endIcon={<ArrowRight size={18} />}
            sx={{ color: '#3B82F6', fontWeight: 600 }}
          >
            View All
          </Button>
        </Stack>

        <Grid container spacing={3}>
          {loading ? (
            [...Array(2)].map((_, i) => (
              <Grid item xs={12} md={6} key={i}>
                <Skeleton variant="rounded" height={280} sx={{ borderRadius: 3, bgcolor: 'rgba(255,255,255,0.05)' }} />
              </Grid>
            ))
          ) : (
            signals.map((signal) => (
              <Grid item xs={12} md={6} key={signal.id}>
                <GlassCard
                  component={Link}
                  href={`/marketplace/signals/${signal.id}`}
                  hoverBorderColor="#3B82F6"
                  shadowColor="rgba(59, 130, 246, 0.2)"
                  sx={{ display: 'block', textDecoration: 'none', height: '100%' }}
                >
                  <CardContent sx={{ p: 3 }}>
                    {/* Header with avatar and badges */}
                    <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 3 }}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar
                          sx={{
                            width: 64,
                            height: 64,
                            bgcolor: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                            background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                            border: '3px solid #3B82F6',
                            boxShadow: '0 0 30px rgba(59, 130, 246, 0.3)',
                            fontWeight: 700,
                            fontSize: '1.2rem',
                          }}
                        >
                          {signal.avatar || signal.display_name?.substring(0, 2) || signal.name?.substring(0, 2)}
                        </Avatar>
                        <Box>
                          <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 700 }}>
                            {signal.display_name || signal.name}
                          </Typography>
                          <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                            <Chip
                              icon={<Crown size={12} />}
                              label="Official"
                              size="small"
                              sx={{ bgcolor: 'rgba(234, 179, 8, 0.2)', color: '#EAB308', fontSize: '0.65rem', height: 22 }}
                            />
                            <Chip
                              icon={<Shield size={12} />}
                              label="Verified"
                              size="small"
                              sx={{ bgcolor: 'rgba(34, 197, 94, 0.2)', color: '#22C55E', fontSize: '0.65rem', height: 22 }}
                            />
                          </Stack>
                        </Box>
                      </Stack>
                      <Typography sx={{ color: '#3B82F6', fontWeight: 700, fontSize: '1.3rem' }}>
                        ${signal.monthly_price || signal.monthlyPrice}/mo
                      </Typography>
                    </Stack>

                    <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', mb: 3 }}>
                      {signal.description}
                    </Typography>

                    {/* Stats */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'rgba(34, 197, 94, 0.1)', borderRadius: 2 }}>
                          <Typography sx={{ color: '#22C55E', fontWeight: 700, fontSize: '1.1rem' }}>
                            {signal.win_rate || signal.winRate}%
                          </Typography>
                          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>
                            Win Rate
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'rgba(59, 130, 246, 0.1)', borderRadius: 2 }}>
                          <Typography sx={{ color: '#3B82F6', fontWeight: 700, fontSize: '1.1rem' }}>
                            {signal.pips_per_month || signal.pipsPerMonth || 500}+
                          </Typography>
                          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>
                            Pips/Month
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'rgba(139, 92, 246, 0.1)', borderRadius: 2 }}>
                          <Typography sx={{ color: '#8B5CF6', fontWeight: 700, fontSize: '1.1rem' }}>
                            {(signal.subscriber_count || signal.subscribers || 0).toLocaleString()}
                          </Typography>
                          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>
                            Subscribers
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    <Button
                      fullWidth
                      variant="contained"
                      sx={{
                        background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                        color: 'white',
                        fontWeight: 700,
                        py: 1.2,
                        '&:hover': { 
                          background: 'linear-gradient(135deg, #2563EB 0%, #1D4ED8 100%)',
                        },
                      }}
                    >
                      Subscribe Now
                    </Button>
                  </CardContent>
                </GlassCard>
              </Grid>
            ))
          )}
        </Grid>
      </Box>

      {/* Digital Products Section */}
      <Box sx={{ mb: 8 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box sx={{ p: 1.5, bgcolor: 'rgba(245, 158, 11, 0.2)', borderRadius: 2 }}>
              <BookOpen size={28} color="#F59E0B" />
            </Box>
            <Typography variant="h5" sx={{ color: '#FFFFFF', fontWeight: 700 }}>
              Education & Tools
            </Typography>
          </Stack>
          <Button
            component={Link}
            href="/marketplace/products"
            endIcon={<ArrowRight size={18} />}
            sx={{ color: '#F59E0B', fontWeight: 600 }}
          >
            View All
          </Button>
        </Stack>

        <Grid container spacing={3}>
          {loading ? (
            [...Array(3)].map((_, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton variant="rounded" height={320} sx={{ borderRadius: 3, bgcolor: 'rgba(255,255,255,0.05)' }} />
              </Grid>
            ))
          ) : (
            products.map((product) => {
              const imageUrl = productImages[product.type?.toLowerCase()] || productImages['default'];
              return (
                <Grid item xs={12} sm={6} md={4} key={product.id}>
                  <GlassCard
                    component={Link}
                    href={`/marketplace/products/${product.slug}`}
                    hoverBorderColor="#F59E0B"
                    shadowColor="rgba(245, 158, 11, 0.2)"
                    sx={{ display: 'block', textDecoration: 'none', height: '100%', overflow: 'hidden' }}
                  >
                    {/* Image Section */}
                    <Box
                      sx={{
                        height: 160,
                        position: 'relative',
                        overflow: 'hidden',
                        bgcolor: 'rgba(245, 158, 11, 0.1)',
                      }}
                    >
                      <Box
                        component="img"
                        src={imageUrl}
                        alt={product.name}
                        sx={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.5s ease',
                        }}
                      />
                      {/* Gradient overlay */}
                      <Box
                        sx={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(to bottom, transparent 0%, rgba(10,15,26,0.8) 100%)',
                        }}
                      />
                      {/* Badges */}
                      <Stack direction="row" spacing={1} sx={{ position: 'absolute', top: 12, left: 12 }}>
                        <Chip
                          label={product.type || product.product_type}
                          size="small"
                          sx={{ 
                            bgcolor: 'rgba(245, 158, 11, 0.9)', 
                            color: '#000', 
                            fontWeight: 700,
                            fontSize: '0.7rem',
                          }}
                        />
                        <Chip
                          icon={<Shield size={10} />}
                          label="Verified"
                          size="small"
                          sx={{ 
                            bgcolor: 'rgba(34, 197, 94, 0.9)', 
                            color: '#000', 
                            fontWeight: 700,
                            fontSize: '0.65rem',
                            height: 22,
                          }}
                        />
                      </Stack>
                    </Box>

                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 700, mb: 1 }}>
                        {product.name}
                      </Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', mb: 2, minHeight: 40 }}>
                        {product.description || product.short_description}
                      </Typography>

                      {/* Rating & Sales */}
                      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                        <Star size={14} fill="#EAB308" color="#EAB308" />
                        <Typography sx={{ color: '#FFFFFF', fontSize: '0.85rem', fontWeight: 600 }}>
                          {product.rating || product.rating_average || 4.8}
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                          ({product.sales || product.total_sales || 0} sold)
                        </Typography>
                      </Stack>

                      {/* Price & CTA */}
                      <Stack direction="row" alignItems="center" justifyContent="space-between">
                        <Box>
                          {product.discountPrice && product.price !== product.discountPrice && (
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'line-through', fontSize: '0.85rem' }}>
                              ${product.price}
                            </Typography>
                          )}
                          <Typography sx={{ color: '#F59E0B', fontWeight: 700, fontSize: '1.25rem' }}>
                            ${product.discountPrice || product.price}
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          variant="contained"
                          sx={{
                            bgcolor: '#F59E0B',
                            color: '#000',
                            fontWeight: 600,
                            '&:hover': { bgcolor: '#D97706' },
                          }}
                        >
                          Get Now
                        </Button>
                      </Stack>
                    </CardContent>
                  </GlassCard>
                </Grid>
              );
            })
          )}
        </Grid>
      </Box>

      {/* API Access Section */}
      <Box sx={{ mb: 8 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 4 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box sx={{ p: 1.5, bgcolor: 'rgba(139, 92, 246, 0.2)', borderRadius: 2 }}>
              <Code size={28} color="#8B5CF6" />
            </Box>
            <Typography variant="h5" sx={{ color: '#FFFFFF', fontWeight: 700 }}>
              API Access
            </Typography>
          </Stack>
          <Button
            component={Link}
            href="/marketplace/api"
            endIcon={<ArrowRight size={18} />}
            sx={{ color: '#8B5CF6', fontWeight: 600 }}
          >
            View Docs
          </Button>
        </Stack>

        <Grid container spacing={2}>
          {apiTiers.map((tier, index) => (
            <Grid item xs={12} md={4} key={tier.name}>
              <GlassCard
                hoverBorderColor={index === 1 ? '#8B5CF6' : 'rgba(139, 92, 246, 0.3)'}
                shadowColor="rgba(139, 92, 246, 0.2)"
                sx={{
                  height: '100%',
                  border: index === 1 ? '2px solid #8B5CF6' : undefined,
                  position: 'relative',
                  overflow: 'visible',
                }}
              >
                {index === 1 && (
                  <Chip
                    label="Popular"
                    size="small"
                    sx={{ 
                      position: 'absolute',
                      top: -12,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      bgcolor: '#8B5CF6', 
                      color: '#fff', 
                      fontWeight: 700,
                    }}
                  />
                )}
                <CardContent sx={{ p: 2.5, textAlign: 'center' }}>
                  <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 700 }}>
                    {tier.name}
                  </Typography>
                  <Typography sx={{ 
                    color: '#8B5CF6', 
                    fontWeight: 700, 
                    fontSize: '1.5rem', 
                    my: 1,
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}>
                    {tier.price === 0 ? 'Free' : `$${tier.price}/mo`}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', mb: 2 }}>
                    {tier.requests}
                  </Typography>
                  <Stack spacing={0.5}>
                    {tier.features.map((feature) => (
                      <Stack key={feature} direction="row" spacing={1} alignItems="center" justifyContent="center">
                        <CheckCircle size={12} color="#22C55E" />
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>
                          {feature}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </GlassCard>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* CTA */}
      <GlassCard 
        hoverBorderColor="#22C55E"
        shadowColor="rgba(34, 197, 94, 0.15)"
        sx={{ 
          textAlign: 'center', 
          p: 5,
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)',
        }}
      >
        <Typography variant="h5" sx={{ color: '#FFFFFF', fontWeight: 700, mb: 2 }}>
          Ready to Start Your Trading Journey?
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 3, maxWidth: '500px', mx: 'auto' }}>
          Join thousands of traders using AlgoEdge tools to achieve consistent profits
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
          <Button
            component={Link}
            href="/marketplace"
            variant="contained"
            size="large"
            sx={{
              background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
              color: '#000',
              fontWeight: 700,
              px: 4,
              '&:hover': { 
                background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
                transform: 'scale(1.02)',
              },
            }}
          >
            Browse Marketplace
          </Button>
          <Button
            component={Link}
            href="/auth/register"
            variant="outlined"
            size="large"
            sx={{
              borderColor: '#22C55E',
              color: '#22C55E',
              fontWeight: 700,
              px: 4,
              '&:hover': { bgcolor: 'rgba(34, 197, 94, 0.1)', borderColor: '#22C55E' },
            }}
          >
            Create Free Account
          </Button>
        </Stack>
      </GlassCard>
    </Box>
  );
}
