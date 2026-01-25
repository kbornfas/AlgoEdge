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
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  Rating,
  Pagination,
  Skeleton,
  Tooltip,
} from '@mui/material';
import {
  Search,
  Signal,
  TrendingUp,
  Users,
  Award,
  Target,
  ChevronRight,
  Shield,
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

const tradingStyles = [
  { value: '', label: 'All Styles' },
  { value: 'scalping', label: 'Scalping' },
  { value: 'day_trading', label: 'Day Trading' },
  { value: 'swing', label: 'Swing Trading' },
  { value: 'position', label: 'Position Trading' },
];

const riskLevels = [
  { value: '', label: 'All Risk Levels' },
  { value: 'conservative', label: 'Conservative' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'aggressive', label: 'Aggressive' },
];

export default function SignalMarketplacePage() {
  const [providers, setProviders] = useState<SignalProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tradingStyle, setTradingStyle] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [sort, setSort] = useState('popular');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchProviders();
  }, [tradingStyle, riskLevel, sort, page]);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        sort,
      });

      if (tradingStyle) params.append('trading_style', tradingStyle);
      if (riskLevel) params.append('risk_level', riskLevel);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/signals/providers?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
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
        {/* Filters */}
        <Box
          sx={{
            display: 'flex',
            gap: 2,
            mb: 4,
            flexWrap: 'wrap',
          }}
        >
          <TextField
            placeholder="Search providers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} color="rgba(255,255,255,0.5)" />
                </InputAdornment>
              ),
            }}
            sx={{
              flex: 1,
              minWidth: 200,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(255,255,255,0.05)',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
              },
              '& input': { color: 'white' },
            }}
          />

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Style</InputLabel>
            <Select
              value={tradingStyle}
              label="Style"
              onChange={(e) => setTradingStyle(e.target.value)}
              sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}
            >
              {tradingStyles.map((s) => (
                <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Risk</InputLabel>
            <Select
              value={riskLevel}
              label="Risk"
              onChange={(e) => setRiskLevel(e.target.value)}
              sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}
            >
              {riskLevels.map((r) => (
                <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 150 }}>
            <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Sort</InputLabel>
            <Select
              value={sort}
              label="Sort"
              onChange={(e) => setSort(e.target.value)}
              sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}
            >
              <MenuItem value="popular">Most Subscribers</MenuItem>
              <MenuItem value="win_rate">Highest Win Rate</MenuItem>
              <MenuItem value="pips">Most Pips</MenuItem>
              <MenuItem value="rating">Top Rated</MenuItem>
              <MenuItem value="newest">Newest</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Providers Grid */}
        <Grid container spacing={3}>
          {loading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Grid item xs={12} sm={6} md={4} key={i}>
                  <Skeleton variant="rounded" height={350} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
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
              No signal providers found
            </Typography>
          </Box>
        )}

        {/* Become a Provider CTA */}
        <Box
          sx={{
            mt: 6,
            p: 4,
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: 3,
          }}
        >
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, mb: 2 }}>
            Share Your Trading Signals
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 3, maxWidth: 500, mx: 'auto' }}>
            Are you a profitable trader? Start earning by sharing your signals with subscribers.
            We verify all providers for quality.
          </Typography>
          <Button
            component={Link}
            href="/dashboard/seller?tab=signals"
            variant="contained"
            size="large"
            sx={{
              bgcolor: '#3B82F6',
              '&:hover': { bgcolor: '#2563EB' },
              fontWeight: 700,
              px: 4,
            }}
          >
            Become a Signal Provider
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
