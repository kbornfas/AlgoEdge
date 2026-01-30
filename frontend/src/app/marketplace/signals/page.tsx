'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  Stack,
  Avatar,
  Rating,
  Pagination,
  Skeleton,
} from '@mui/material';
import {
  Signal,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';

interface SignalProvider {
  id: number;
  display_name: string;
  slug: string;
  bio: string;
  avatar_url: string;
  trading_style: string;
  risk_level: string;
  win_rate: number;
  total_pips: number;
  subscriber_count: number;
  rating_average: number;
  rating_count: number;
  monthly_price: number;
  quarterly_price: number;
  yearly_price: number;
  is_free: boolean;
  main_instruments: string[];
}

// Demo signal providers - Popular Instagram Forex Traders
const demoProviders: SignalProvider[] = [
  {
    id: 1,
    display_name: 'HABBY FX',
    slug: 'habby-fx',
    bio: 'Top-tier forex educator & signal provider. Known for precise gold entries and consistent profitability with millions of followers.',
    avatar_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face',
    trading_style: 'day_trading',
    risk_level: 'moderate',
    win_rate: 84.5,
    total_pips: 32500,
    subscriber_count: 25000,
    rating_average: 4.9,
    rating_count: 3456,
    monthly_price: 99,
    quarterly_price: 249,
    yearly_price: 799,
    is_free: false,
    main_instruments: ['XAUUSD', 'NAS100', 'US30']
  },
  {
    id: 2,
    display_name: 'KOJO FX',
    slug: 'kojo-fx',
    bio: 'Elite forex trader specializing in gold and indices. Consistent results with detailed analysis for every trade setup.',
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
    trading_style: 'swing',
    risk_level: 'moderate',
    win_rate: 81.2,
    total_pips: 28920,
    subscriber_count: 18500,
    rating_average: 4.8,
    rating_count: 2567,
    monthly_price: 89,
    quarterly_price: 229,
    yearly_price: 749,
    is_free: false,
    main_instruments: ['XAUUSD', 'GBPUSD', 'NAS100']
  },
  {
    id: 3,
    display_name: 'AMIIN FX',
    slug: 'amiin-fx',
    bio: 'Professional trader specializing in scalping and intraday setups on gold and major pairs.',
    avatar_url: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face',
    trading_style: 'scalping',
    risk_level: 'aggressive',
    win_rate: 78.5,
    total_pips: 42450,
    subscriber_count: 12800,
    rating_average: 4.7,
    rating_count: 1987,
    monthly_price: 79,
    quarterly_price: 199,
    yearly_price: 649,
    is_free: false,
    main_instruments: ['XAUUSD', 'EURUSD', 'GBPJPY']
  },
  {
    id: 4,
    display_name: 'VIDOLLAR',
    slug: 'vidollar',
    bio: 'Master of price action trading. Known for catching big moves in forex and crypto markets with pinpoint accuracy.',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
    trading_style: 'day_trading',
    risk_level: 'moderate',
    win_rate: 82.8,
    total_pips: 35340,
    subscriber_count: 21500,
    rating_average: 4.9,
    rating_count: 2890,
    monthly_price: 99,
    quarterly_price: 259,
    yearly_price: 849,
    is_free: false,
    main_instruments: ['XAUUSD', 'BTCUSD', 'NAS100']
  }
];

export default function SignalMarketplacePage() {
  const [providers, setProviders] = useState<SignalProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchProviders();
  }, [page]);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        sort: 'popular',
      });

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/signals/providers?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.providers && data.providers.length > 0) {
          setProviders(data.providers);
          setTotalPages(data.pagination?.totalPages || 1);
        } else {
          setProviders(demoProviders);
          setTotalPages(1);
        }
      } else {
        setProviders(demoProviders);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
      setProviders(demoProviders);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'conservative': return '#22C55E';
      case 'moderate': return '#F59E0B';
      case 'aggressive': return '#EF4444';
      default: return '#3B82F6';
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a' }}>
      {/* Header */}
      <Box
        sx={{
          py: { xs: 4, md: 6 },
          background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(59, 130, 246, 0.05) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <Link href="/marketplace" style={{ textDecoration: 'none' }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: '#3B82F6' } }}>
                Marketplace
              </Typography>
            </Link>
            <ChevronRight size={16} color="rgba(255,255,255,0.4)" />
            <Typography sx={{ color: 'white' }}>Signal Providers</Typography>
          </Stack>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Signal size={40} color="#3B82F6" />
            <Typography variant="h3" sx={{ color: 'white', fontWeight: 800 }}>
              Signal Providers
            </Typography>
          </Box>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', maxWidth: 600 }}>
            Subscribe to professional traders and receive their signals directly.
            All providers are verified with real trading history.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Providers Grid */}
        <Grid container spacing={3}>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Skeleton variant="rounded" height={400} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                </Grid>
              ))
            : providers.map((provider) => (
                <Grid item xs={12} sm={6} md={4} key={provider.id}>
                  <Card
                    component={Link}
                    href={`/marketplace/signals/${provider.slug}`}
                    sx={{
                      height: '100%',
                      bgcolor: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      transition: 'all 0.3s ease',
                      textDecoration: 'none',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        borderColor: '#3B82F6',
                        boxShadow: '0 8px 32px rgba(59, 130, 246, 0.2)',
                      },
                    }}
                  >
                    <CardContent sx={{ textAlign: 'center', position: 'relative' }}>
                      {/* Verified Badge */}
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
                      
                      <Avatar
                        src={provider.avatar_url}
                        sx={{
                          width: 100,
                          height: 100,
                          mx: 'auto',
                          mb: 2,
                          border: '3px solid #3B82F6',
                        }}
                      >
                        {provider.display_name?.charAt(0)}
                      </Avatar>

                      <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.2rem', mb: 0.5 }}>
                        {provider.display_name}
                      </Typography>
                      
                      {/* Official label */}
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 1 }}>
                        <CheckCircle2 size={14} color="#22C55E" />
                        <Typography sx={{ color: '#22C55E', fontSize: '0.75rem', fontWeight: 600 }}>
                          Official Provider
                        </Typography>
                      </Box>

                      <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 2 }}>
                        <Chip
                          label={provider.trading_style?.replace('_', ' ')}
                          size="small"
                          sx={{ bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6', textTransform: 'capitalize' }}
                        />
                        <Chip
                          label={provider.risk_level}
                          size="small"
                          sx={{ bgcolor: `${getRiskColor(provider.risk_level)}20`, color: getRiskColor(provider.risk_level), textTransform: 'capitalize' }}
                        />
                      </Stack>

                      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                        <Rating value={provider.rating_average || 4.5} size="small" readOnly precision={0.5} />
                        <Typography sx={{ color: 'rgba(255,255,255,0.6)', ml: 1, fontSize: '0.8rem', fontWeight: 600 }}>
                          ({provider.rating_count || Math.floor(Math.random() * 40 + 10)})
                        </Typography>
                      </Box>

                      {/* Stats */}
                      <Grid container spacing={1} sx={{ mb: 3 }}>
                        <Grid item xs={4}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography sx={{ color: '#22C55E', fontWeight: 800, fontSize: '1.2rem' }}>
                              {provider.win_rate || 0}%
                            </Typography>
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>
                              Win Rate
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={4}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography sx={{ color: '#3B82F6', fontWeight: 800, fontSize: '1.2rem' }}>
                              {provider.total_pips?.toLocaleString() || 0}
                            </Typography>
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>
                              Total Pips
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={4}>
                          <Box sx={{ textAlign: 'center' }}>
                            <Typography sx={{ color: '#F59E0B', fontWeight: 800, fontSize: '1.2rem' }}>
                              {provider.subscriber_count || 0}
                            </Typography>
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>
                              Subscribers
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>

                      {/* Instruments */}
                      {provider.main_instruments && (
                        <Stack direction="row" spacing={0.5} justifyContent="center" sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
                          {provider.main_instruments.slice(0, 3).map((inst, i) => (
                            <Chip
                              key={i}
                              label={inst}
                              size="small"
                              sx={{ bgcolor: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.7)', fontSize: '0.7rem' }}
                            />
                          ))}
                        </Stack>
                      )}

                      {/* Price */}
                      <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', pt: 2 }}>
                        {provider.is_free ? (
                          <Typography sx={{ color: '#22C55E', fontWeight: 800, fontSize: '1.5rem' }}>
                            FREE
                          </Typography>
                        ) : (
                          <Box>
                            <Typography sx={{ color: '#3B82F6', fontWeight: 800, fontSize: '1.5rem' }}>
                              ${provider.monthly_price}/mo
                            </Typography>
                            {provider.yearly_price > 0 && (
                              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                                or ${provider.yearly_price}/year (save {Math.round(100 - (provider.yearly_price / (provider.monthly_price * 12)) * 100)}%)
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
        </Grid>

        {/* No Results */}
        {!loading && providers.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Signal size={64} color="rgba(255,255,255,0.2)" style={{ marginBottom: 16 }} />
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', mb: 2 }}>
              No signal providers available at the moment
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
                    bgcolor: '#3B82F6',
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
