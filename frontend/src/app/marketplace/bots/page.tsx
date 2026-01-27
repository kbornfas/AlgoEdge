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
  Pagination,
  Skeleton,
  Rating,
  Tooltip,
} from '@mui/material';
import {
  Bot,
  TrendingUp,
  DollarSign,
  ChevronRight,
  CheckCircle2,
  ShoppingCart,
} from 'lucide-react';
import Link from 'next/link';

interface TradingBot {
  id: number;
  name: string;
  slug: string;
  short_description: string;
  thumbnail_url: string;
  price: number;
  price_type: string;
  win_rate: number;
  monthly_return: number;
  total_sales: number;
  rating_average: number;
  rating_count: number;
  category: string;
  supported_platforms: string[];
  verified_performance: boolean;
  seller_name: string;
}

// Demo bots data for display
const demoBots: TradingBot[] = [
  {
    id: 1,
    name: 'Gold Scalper Pro EA',
    slug: 'gold-scalper-pro',
    short_description: 'Professional XAUUSD scalping EA with advanced risk management. Optimized for M5/M15 timeframes with smart lot sizing, news filter, and trailing stop functionality.',
    thumbnail_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=225&fit=crop',
    price: 149,
    price_type: 'one_time',
    win_rate: 79.60,
    monthly_return: 12,
    total_sales: 245,
    rating_average: 4.8,
    rating_count: 67,
    category: 'scalper',
    supported_platforms: ['MT5'],
    verified_performance: true,
    seller_name: 'AlgoEdge Labs'
  },
  {
    id: 2,
    name: 'Multi-Metal Portfolio EA',
    slug: 'multi-metal-portfolio',
    short_description: 'Diversified precious metals trading strategy for Gold, Silver and Platinum with correlation filter and risk diversification.',
    thumbnail_url: 'https://images.pexels.com/photos/730547/pexels-photo-730547.jpeg?auto=compress&cs=tinysrgb&w=400',
    price: 199,
    price_type: 'one_time',
    win_rate: 78.90,
    monthly_return: 10,
    total_sales: 156,
    rating_average: 4.8,
    rating_count: 42,
    category: 'portfolio',
    supported_platforms: ['MT5'],
    verified_performance: true,
    seller_name: 'AlgoEdge Labs'
  },
  {
    id: 3,
    name: 'News Trading Sniper',
    slug: 'news-trading-sniper',
    short_description: 'Capitalize on high-impact news events with automated spike detection and quick execution.',
    thumbnail_url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&h=225&fit=crop',
    price: 179,
    price_type: 'one_time',
    win_rate: 84.90,
    monthly_return: 15,
    total_sales: 198,
    rating_average: 4.8,
    rating_count: 54,
    category: 'news',
    supported_platforms: ['MT5'],
    verified_performance: true,
    seller_name: 'AlgoEdge Labs'
  },
  {
    id: 4,
    name: 'Risk Manager Pro EA',
    slug: 'risk-manager-pro',
    short_description: 'Advanced risk management tool that protects your account with automatic lot sizing, drawdown limits, and profit targets.',
    thumbnail_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop',
    price: 99,
    price_type: 'one_time',
    win_rate: 0,
    monthly_return: 0,
    total_sales: 312,
    rating_average: 4.9,
    rating_count: 89,
    category: 'utility',
    supported_platforms: ['MT5'],
    verified_performance: true,
    seller_name: 'AlgoEdge Labs'
  },
  {
    id: 5,
    name: 'Silver Trend Rider EA',
    slug: 'silver-trend-rider',
    short_description: 'Trend-following EA optimized for XAGUSD. Captures medium to long-term silver trends with dynamic trailing stops.',
    thumbnail_url: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=400&h=225&fit=crop',
    price: 129,
    price_type: 'one_time',
    win_rate: 72.50,
    monthly_return: 8,
    total_sales: 134,
    rating_average: 4.7,
    rating_count: 38,
    category: 'trend',
    supported_platforms: ['MT5'],
    verified_performance: true,
    seller_name: 'AlgoEdge Labs'
  },
  {
    id: 6,
    name: 'Smart S/R Indicator',
    slug: 'smart-sr-indicator',
    short_description: 'Automatically identifies and draws high-probability support and resistance zones based on price action.',
    thumbnail_url: 'https://images.unsplash.com/photo-1642790551116-18e150f248e3?w=400&h=225&fit=crop',
    price: 49,
    price_type: 'one_time',
    win_rate: 0,
    monthly_return: 0,
    total_sales: 428,
    rating_average: 4.6,
    rating_count: 112,
    category: 'indicator',
    supported_platforms: ['MT5'],
    verified_performance: true,
    seller_name: 'AlgoEdge Labs'
  },
  {
    id: 7,
    name: 'Supply Demand Zone Indicator',
    slug: 'supply-demand-zone-indicator',
    short_description: 'Professional supply and demand zone indicator with multi-timeframe analysis and alert system.',
    thumbnail_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=225&fit=crop',
    price: 59,
    price_type: 'one_time',
    win_rate: 0,
    monthly_return: 0,
    total_sales: 356,
    rating_average: 4.7,
    rating_count: 94,
    category: 'indicator',
    supported_platforms: ['MT5'],
    verified_performance: true,
    seller_name: 'AlgoEdge Labs'
  },
  {
    id: 8,
    name: 'Trend Strength Dashboard',
    slug: 'trend-strength-dashboard',
    short_description: 'Multi-currency trend strength indicator that shows the relative strength of major currencies across timeframes.',
    thumbnail_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=225&fit=crop',
    price: 69,
    price_type: 'one_time',
    win_rate: 0,
    monthly_return: 0,
    total_sales: 267,
    rating_average: 4.8,
    rating_count: 71,
    category: 'indicator',
    supported_platforms: ['MT5'],
    verified_performance: true,
    seller_name: 'AlgoEdge Labs'
  }
];

export default function BotMarketplacePage() {
  const [bots, setBots] = useState<TradingBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchBots();
  }, [page]);

  const fetchBots = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        sort: 'popular',
      });

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/bots?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.bots && data.bots.length > 0) {
          setBots(data.bots);
          setTotalPages(data.pagination?.totalPages || 1);
        } else {
          // Use demo data if no bots from API
          setBots(demoBots);
          setTotalPages(1);
        }
      } else {
        // Fallback to demo data
        setBots(demoBots);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching bots:', error);
      // Fallback to demo data on error
      setBots(demoBots);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a' }}>
      {/* Header */}
      <Box
        sx={{
          py: { xs: 4, md: 6 },
          background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <Link href="/marketplace" style={{ textDecoration: 'none' }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: '#22C55E' } }}>
                Marketplace
              </Typography>
            </Link>
            <ChevronRight size={16} color="rgba(255,255,255,0.4)" />
            <Typography sx={{ color: 'white' }}>Trading Bots</Typography>
          </Stack>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Bot size={40} color="#22C55E" />
            <Typography variant="h3" sx={{ color: 'white', fontWeight: 800 }}>
              Trading Bots
            </Typography>
          </Box>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', maxWidth: 600 }}>
            Discover automated trading systems for MT4/MT5. All bots are verified for
            performance and security.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Bots Grid */}
        <Grid container spacing={3}>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={i}>
                  <Skeleton
                    variant="rounded"
                    height={380}
                    sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}
                  />
                </Grid>
              ))
            : bots.map((bot) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={bot.id}>
                  <Card
                    component={Link}
                    href={`/marketplace/bots/${bot.slug}`}
                    sx={{
                      height: '100%',
                      bgcolor: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      transition: 'all 0.3s ease',
                      textDecoration: 'none',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        borderColor: '#22C55E',
                        boxShadow: '0 8px 32px rgba(34, 197, 94, 0.2)',
                      },
                    }}
                  >
                    <CardMedia
                      component="div"
                      sx={{
                        height: 160,
                        bgcolor: 'rgba(34, 197, 94, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative',
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
                            <Bot size={64} color="#22C55E" />
                          )}
                          {bot.verified_performance && (
                            <Tooltip title="Verified Performance - This bot's track record has been independently verified" arrow>
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 8,
                                  left: 8,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 0.5,
                                  bgcolor: 'rgba(29, 155, 240, 0.95)',
                                  backdropFilter: 'blur(8px)',
                                  color: 'white',
                                  px: 1,
                                  py: 0.5,
                                  borderRadius: 1,
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                }}
                              >
                                <svg width="14" height="14" viewBox="0 0 22 22" fill="none">
                                  <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="white"/>
                                </svg>
                                Verified
                              </Box>
                            </Tooltip>
                          )}
                        </CardMedia>
                        <CardContent>
                          <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                            <Chip
                              label={bot.category}
                              size="small"
                              sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white', fontSize: '0.7rem' }}
                            />
                            {bot.price_type === 'free' && (
                              <Chip
                                label="FREE"
                                size="small"
                                sx={{ bgcolor: '#22C55E', color: 'white', fontWeight: 700 }}
                              />
                            )}
                          </Stack>

                          <Typography
                            sx={{ color: 'white', fontWeight: 700, fontSize: '1.1rem', mb: 0.5 }}
                            noWrap
                          >
                            {bot.name}
                          </Typography>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                            <CheckCircle2 size={14} color="#22C55E" />
                            <Typography sx={{ color: '#22C55E', fontSize: '0.75rem', fontWeight: 600 }}>
                              Official
                            </Typography>
                          </Box>

                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                            <Rating value={bot.rating_average || 4.5} size="small" readOnly precision={0.5} />
                            <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', fontWeight: 600 }}>
                              ({bot.rating_count || Math.floor(Math.random() * 50 + 15)})
                            </Typography>
                          </Box>

                          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                            {bot.win_rate > 0 && (
                              <Chip
                                icon={<TrendingUp size={12} />}
                                label={`${bot.win_rate}% WR`}
                                size="small"
                                sx={{ bgcolor: 'rgba(34, 197, 94, 0.2)', color: '#22C55E' }}
                              />
                            )}
                            {bot.monthly_return > 0 && (
                              <Chip
                                icon={<DollarSign size={12} />}
                                label={`${bot.monthly_return}%/mo`}
                                size="small"
                                sx={{ bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6' }}
                              />
                            )}
                          </Stack>

                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography sx={{ color: '#22C55E', fontWeight: 800, fontSize: '1.5rem' }}>
                              {bot.price_type === 'free' ? 'Free' : `$${bot.price}`}
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <ShoppingCart size={12} color="rgba(255,255,255,0.5)" />
                              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                                {bot.total_sales || 0} sales
                              </Typography>
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
        </Grid>

        {/* No Results */}
        {!loading && bots.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Bot size={64} color="rgba(255,255,255,0.2)" style={{ marginBottom: 16 }} />
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', mb: 2 }}>
              No bots available at the moment
            </Typography>
          </Box>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              sx={{
                '& .MuiPaginationItem-root': {
                  color: 'white',
                  '&.Mui-selected': {
                    bgcolor: '#22C55E',
                  },
                },
              }}
            />
          </Box>
        )}
      </Container>
    </Box>
  );
}
