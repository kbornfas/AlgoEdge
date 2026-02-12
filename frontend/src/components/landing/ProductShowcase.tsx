'use client';

import { Box, Typography, Grid, CardContent, Button, Chip, Stack, Avatar, Skeleton } from '@mui/material';
import { Bot, TrendingUp, BookOpen, Code, Star, ArrowRight, Crown, Shield, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

// ============================================================================
// GLASS CARD COMPONENT
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

// Bot thumbnail images by slug
const botImages: Record<string, string> = {
  'gold-scalper-pro': 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=400&h=250&fit=crop',
  'silver-trend-rider': 'https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=400&h=250&fit=crop',
  'multi-metal-portfolio': 'https://images.unsplash.com/photo-1618761714954-0b8cd0026356?w=400&h=250&fit=crop',
  'news-trading-sniper': 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?w=400&h=250&fit=crop',
  'risk-manager-pro': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop',
  'titan-scalper-pro': 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=250&fit=crop',
  'forex-trend-master': 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=400&h=250&fit=crop',
  'gold-hunter-ea': 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=400&h=250&fit=crop',
  'night-owl-ranger': 'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?w=400&h=250&fit=crop',
  'algoedge-starter-bot': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=250&fit=crop',
};

const defaultBotImage = 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=250&fit=crop';

// Product type images
const productImages: Record<string, string> = {
  'course': 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=200&fit=crop',
  'video course': 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=200&fit=crop',
  'video_course': 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=200&fit=crop',
  'ebook': 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=200&fit=crop',
  'indicator': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop',
  'indicators': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop',
  'template': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop',
  'strategy_guide': 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=200&fit=crop',
};

const defaultProductImage = 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&h=200&fit=crop';

const apiTiers = [
  { name: 'Starter', price: 29.99, requests: '1,000/day', features: ['All endpoints', 'WebSocket access', 'Email support', '30-day history'] },
  { name: 'Professional', price: 99.99, requests: '10,000/day', features: ['Priority queue', '5yr history', 'Priority support', 'Custom alerts'] },
  { name: 'Enterprise', price: 499.99, requests: '100,000/day', features: ['Dedicated server', 'Custom SLA', '99.9% uptime', 'Account manager'] },
];

// ============================================================================
// PRODUCT SHOWCASE COMPONENT - Database only, no fake data
// ============================================================================

export default function ProductShowcase() {
  const [bots, setBots] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const fetchData = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/landing`,
          { signal: controller.signal }
        );
        
        if (res?.ok) {
          const data = await res.json();
          setBots(data.bots || []);
          setSignals(data.signals || []);
          setProducts(data.products || []);
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.error('Error fetching marketplace data:', err);
        }
      } finally {
        clearTimeout(timeoutId);
        setLoading(false);
      }
    };

    fetchData();
    return () => { controller.abort(); clearTimeout(timeoutId); };
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

      {/* Trading Bots Section - Only shows if DB has bots */}
      {(loading || bots.length > 0) && (
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
              bots.slice(0, 3).map((bot) => {
                const imageUrl = bot.thumbnail_url || botImages[bot.slug] || defaultBotImage;
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
                          width: '100%',
                          position: 'relative',
                          overflow: 'hidden',
                          bgcolor: 'rgba(34, 197, 94, 0.1)',
                        }}
                      >
                        <Box
                          component="img"
                          src={imageUrl}
                          alt={bot.name}
                          loading="lazy"
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
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
                          {bot.is_featured && (
                            <Chip
                              icon={<Crown size={12} />}
                              label="Featured"
                              size="small"
                              sx={{ 
                                bgcolor: 'rgba(234, 179, 8, 0.9)', 
                                color: '#000', 
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                height: 24,
                              }}
                            />
                          )}
                          {bot.seller_verified && (
                            <Chip
                              icon={<Shield size={12} />}
                              label="Verified Seller"
                              size="small"
                              sx={{ 
                                bgcolor: 'rgba(34, 197, 94, 0.9)', 
                                color: '#000', 
                                fontWeight: 700,
                                fontSize: '0.7rem',
                                height: 24,
                              }}
                            />
                          )}
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
                                {bot.win_rate ? `${Number(bot.win_rate).toFixed(0)}%` : 'N/A'}
                              </Typography>
                              <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>
                                Win Rate
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={6}>
                            <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'rgba(34, 197, 94, 0.1)', borderRadius: 2 }}>
                              <Typography sx={{ color: '#22C55E', fontWeight: 700, fontSize: '1.2rem' }}>
                                {bot.monthly_return ? `${Number(bot.monthly_return).toFixed(0)}%` : 'N/A'}
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
                            <Typography sx={{ color: '#FFFFFF', fontWeight: 600 }}>
                              {bot.rating_average ? Number(bot.rating_average).toFixed(1) : '0.0'}
                            </Typography>
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                              ({bot.total_sales || 0} sales)
                            </Typography>
                          </Stack>
                        </Stack>

                        {/* Price & CTA */}
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Box>
                            {bot.is_free || Number(bot.price) === 0 ? (
                              <Typography sx={{ color: '#22C55E', fontWeight: 700, fontSize: '1.5rem' }}>
                                FREE
                              </Typography>
                            ) : (
                              <Typography sx={{ color: '#22C55E', fontWeight: 700, fontSize: '1.5rem' }}>
                                ${Number(bot.price).toFixed(0)}
                              </Typography>
                            )}
                          </Box>
                          <Button
                            component={Link}
                            href={`/marketplace/bots/${bot.slug || bot.id}`}
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
      )}

      {/* Signal Services Section - Only shows if DB has signals */}
      {(loading || signals.length > 0) && (
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
              signals.slice(0, 4).map((signal) => (
                <Grid item xs={12} md={6} key={signal.id}>
                  <GlassCard
                    component={Link}
                    href={`/marketplace/signals/${signal.id}`}
                    hoverBorderColor="#3B82F6"
                    shadowColor="rgba(59, 130, 246, 0.2)"
                    sx={{ display: 'block', textDecoration: 'none', height: '100%' }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      {/* Header with avatar */}
                      <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 3 }}>
                        <Stack direction="row" alignItems="center" spacing={2}>
                          <Avatar
                            src={signal.avatar_url || signal.provider_avatar}
                            sx={{
                              width: 64,
                              height: 64,
                              background: 'linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)',
                              border: '3px solid #3B82F6',
                              boxShadow: '0 0 30px rgba(59, 130, 246, 0.3)',
                              fontWeight: 700,
                              fontSize: '1.2rem',
                            }}
                          >
                            {(signal.display_name || signal.name || '')
                              .split(' ')
                              .map((w: string) => w[0])
                              .join('')
                              .substring(0, 2)
                              .toUpperCase()}
                          </Avatar>
                          <Box>
                            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ flexWrap: 'nowrap' }}>
                              <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                {signal.display_name || signal.name}
                              </Typography>
                              {(signal.provider_verified || signal.seller_verified) && (
                                <Box 
                                  component="img" 
                                  src="/verified-badge.svg" 
                                  alt="Verified"
                                  sx={{ width: 18, height: 18, flexShrink: 0, ml: 0.5 }}
                                  onError={(e: any) => { e.target.style.display = 'none'; }}
                                />
                              )}
                              <Typography sx={{ color: '#3B82F6', fontWeight: 700, fontSize: '1.1rem', ml: 1 }}>
                                {signal.is_free || Number(signal.monthly_price) === 0 
                                  ? 'FREE' 
                                  : `$${Number(signal.monthly_price).toFixed(2)}/mo`}
                              </Typography>
                            </Stack>
                            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                              {signal.is_featured && (
                                <Chip
                                  icon={<Crown size={12} />}
                                  label="Featured"
                                  size="small"
                                  sx={{ bgcolor: 'rgba(234, 179, 8, 0.2)', color: '#EAB308', fontSize: '0.65rem', height: 22 }}
                                />
                              )}
                              <Chip
                                label={signal.risk_level || 'medium'}
                                size="small"
                                sx={{ 
                                  bgcolor: signal.risk_level === 'low' ? 'rgba(34, 197, 94, 0.2)' : 
                                           signal.risk_level === 'high' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(234, 179, 8, 0.2)', 
                                  color: signal.risk_level === 'low' ? '#22C55E' : 
                                         signal.risk_level === 'high' ? '#EF4444' : '#EAB308', 
                                  fontSize: '0.65rem', 
                                  height: 22 
                                }}
                              />
                            </Stack>
                          </Box>
                        </Stack>
                      </Stack>

                      <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', mb: 3 }}>
                        {signal.description}
                      </Typography>

                      {/* Stats */}
                      <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid item xs={4}>
                          <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'rgba(34, 197, 94, 0.1)', borderRadius: 2 }}>
                            <Typography sx={{ color: '#22C55E', fontWeight: 700, fontSize: '1.1rem' }}>
                              {signal.win_rate ? `${Number(signal.win_rate).toFixed(0)}%` : 'N/A'}
                            </Typography>
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>
                              Win Rate
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={4}>
                          <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'rgba(59, 130, 246, 0.1)', borderRadius: 2 }}>
                            <Typography sx={{ color: '#3B82F6', fontWeight: 700, fontSize: '1.1rem' }}>
                              {Number(signal.average_pips || signal.total_pips || 0).toLocaleString()}+
                            </Typography>
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>
                              Pips/Month
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={4}>
                          <Box sx={{ textAlign: 'center', p: 1.5, bgcolor: 'rgba(139, 92, 246, 0.1)', borderRadius: 2 }}>
                            <Typography sx={{ color: '#8B5CF6', fontWeight: 700, fontSize: '1.1rem' }}>
                              {(signal.subscriber_count || 0).toLocaleString()}
                            </Typography>
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>
                              Subscribers
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>

                      <Button
                        component={Link}
                        href={`/marketplace/signals/${signal.id}`}
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
      )}

      {/* Digital Products Section - Only shows if DB has products */}
      {(loading || products.length > 0) && (
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
              products.slice(0, 3).map((product) => {
                const imageUrl = product.thumbnail_url || productImages[product.type?.toLowerCase()] || defaultProductImage;
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
                          width: '100%',
                          position: 'relative',
                          overflow: 'hidden',
                          bgcolor: 'rgba(245, 158, 11, 0.1)',
                        }}
                      >
                        <Box
                          component="img"
                          src={imageUrl}
                          alt={product.name}
                          loading="lazy"
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
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
                            label={product.type || product.product_type || 'Product'}
                            size="small"
                            sx={{ 
                              bgcolor: 'rgba(245, 158, 11, 0.9)', 
                              color: '#000', 
                              fontWeight: 700,
                              fontSize: '0.7rem',
                            }}
                          />
                          {product.is_featured && (
                            <Chip
                              icon={<Crown size={10} />}
                              label="Featured"
                              size="small"
                              sx={{ 
                                bgcolor: 'rgba(234, 179, 8, 0.9)', 
                                color: '#000', 
                                fontWeight: 700,
                                fontSize: '0.65rem',
                                height: 22,
                              }}
                            />
                          )}
                          {product.seller_verified && (
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
                          )}
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
                            {product.rating_average ? Number(product.rating_average).toFixed(1) : '0.0'}
                          </Typography>
                          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                            ({product.total_sales || 0} sold)
                          </Typography>
                        </Stack>

                        {/* Price & CTA */}
                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                          <Box>
                            {product.discount_price && Number(product.price) !== Number(product.discount_price) && (
                              <Typography sx={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'line-through', fontSize: '0.85rem' }}>
                                ${Number(product.price).toFixed(0)}
                              </Typography>
                            )}
                            <Typography sx={{ color: '#F59E0B', fontWeight: 700, fontSize: '1.25rem' }}>
                              ${Number(product.discount_price || product.price || 0).toFixed(0)}
                            </Typography>
                          </Box>
                          <Button
                            component={Link}
                            href={`/marketplace/products/${product.slug || product.id}`}
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
      )}

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
                  <Stack spacing={0.5} sx={{ mb: 2 }}>
                    {tier.features.map((feature) => (
                      <Stack key={feature} direction="row" spacing={1} alignItems="center" justifyContent="center">
                        <CheckCircle size={12} color="#22C55E" />
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem' }}>
                          {feature}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                  <Button
                    component={Link}
                    href="/marketplace/api"
                    fullWidth
                    variant={index === 1 ? 'contained' : 'outlined'}
                    sx={{
                      ...(index === 1
                        ? {
                            background: 'linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%)',
                            color: 'white',
                            fontWeight: 700,
                            py: 1.2,
                            '&:hover': {
                              background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                            },
                          }
                        : {
                            borderColor: 'rgba(139, 92, 246, 0.4)',
                            color: '#A78BFA',
                            fontWeight: 700,
                            py: 1.2,
                            '&:hover': {
                              borderColor: '#8B5CF6',
                              bgcolor: 'rgba(139, 92, 246, 0.1)',
                            },
                          }),
                    }}
                  >
                    Subscribe Now
                  </Button>
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
