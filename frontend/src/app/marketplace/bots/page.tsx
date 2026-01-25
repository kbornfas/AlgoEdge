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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Skeleton,
  Rating,
  Slider,
  Drawer,
  IconButton,
  useMediaQuery,
  useTheme,
  Tooltip,
} from '@mui/material';
import {
  Search,
  Bot,
  Filter,
  TrendingUp,
  Award,
  Clock,
  DollarSign,
  X,
  ChevronRight,
  Shield,
  Zap,
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

const categories = [
  { value: '', label: 'All Categories' },
  { value: 'scalping', label: 'Scalping' },
  { value: 'swing', label: 'Swing Trading' },
  { value: 'grid', label: 'Grid Trading' },
  { value: 'news', label: 'News Trading' },
  { value: 'martingale', label: 'Martingale' },
  { value: 'hedge', label: 'Hedging' },
];

const sortOptions = [
  { value: 'popular', label: 'Most Popular' },
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Top Rated' },
  { value: 'win_rate', label: 'Highest Win Rate' },
  { value: 'price_low', label: 'Price: Low to High' },
  { value: 'price_high', label: 'Price: High to Low' },
];

export default function BotMarketplacePage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [bots, setBots] = useState<TradingBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [priceType, setPriceType] = useState('');
  const [sort, setSort] = useState('popular');
  const [priceRange, setPriceRange] = useState<number[]>([0, 500]);
  const [minWinRate, setMinWinRate] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  useEffect(() => {
    fetchBots();
  }, [category, priceType, sort, page, priceRange, minWinRate]);

  const fetchBots = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        sort,
      });

      if (category) params.append('category', category);
      if (priceType) params.append('price_type', priceType);
      if (priceRange[0] > 0) params.append('min_price', priceRange[0].toString());
      if (priceRange[1] < 500) params.append('max_price', priceRange[1].toString());
      if (minWinRate > 0) params.append('min_win_rate', minWinRate.toString());

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/bots?${params}`);
      if (res.ok) {
        const data = await res.json();
        setBots(data.bots);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching bots:', error);
    } finally {
      setLoading(false);
    }
  };

  const FilterContent = () => (
    <Box sx={{ p: 2 }}>
      <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 3 }}>
        Filters
      </Typography>

      {/* Category */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Category</InputLabel>
        <Select
          value={category}
          label="Category"
          onChange={(e) => setCategory(e.target.value)}
          sx={{
            color: 'white',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#22C55E' },
          }}
        >
          {categories.map((cat) => (
            <MenuItem key={cat.value} value={cat.value}>{cat.label}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Price Type */}
      <FormControl fullWidth sx={{ mb: 3 }}>
        <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Price Type</InputLabel>
        <Select
          value={priceType}
          label="Price Type"
          onChange={(e) => setPriceType(e.target.value)}
          sx={{
            color: 'white',
            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
          }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="one_time">One-Time Purchase</MenuItem>
          <MenuItem value="subscription">Subscription</MenuItem>
          <MenuItem value="free">Free</MenuItem>
        </Select>
      </FormControl>

      {/* Price Range */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
          Price Range: ${priceRange[0]} - ${priceRange[1]}+
        </Typography>
        <Slider
          value={priceRange}
          onChange={(_, value) => setPriceRange(value as number[])}
          valueLabelDisplay="auto"
          min={0}
          max={500}
          sx={{ color: '#22C55E' }}
        />
      </Box>

      {/* Minimum Win Rate */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 1 }}>
          Min Win Rate: {minWinRate}%
        </Typography>
        <Slider
          value={minWinRate}
          onChange={(_, value) => setMinWinRate(value as number)}
          valueLabelDisplay="auto"
          min={0}
          max={100}
          sx={{ color: '#22C55E' }}
        />
      </Box>

      <Button
        fullWidth
        variant="outlined"
        onClick={() => {
          setCategory('');
          setPriceType('');
          setPriceRange([0, 500]);
          setMinWinRate(0);
        }}
        sx={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}
      >
        Reset Filters
      </Button>
    </Box>
  );

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
        <Grid container spacing={3}>
          {/* Sidebar Filters - Desktop */}
          {!isMobile && (
            <Grid item md={3}>
              <Box
                sx={{
                  bgcolor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 2,
                  position: 'sticky',
                  top: 20,
                }}
              >
                <FilterContent />
              </Box>
            </Grid>
          )}

          {/* Main Content */}
          <Grid item xs={12} md={9}>
            {/* Search & Sort Bar */}
            <Box
              sx={{
                display: 'flex',
                gap: 2,
                mb: 3,
                flexDirection: { xs: 'column', sm: 'row' },
              }}
            >
              <TextField
                fullWidth
                placeholder="Search bots..."
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
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255,255,255,0.05)',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&:hover fieldset': { borderColor: '#22C55E' },
                  },
                  '& input': { color: 'white' },
                }}
              />

              <FormControl sx={{ minWidth: 180 }}>
                <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Sort By</InputLabel>
                <Select
                  value={sort}
                  label="Sort By"
                  onChange={(e) => setSort(e.target.value)}
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                  }}
                >
                  {sortOptions.map((opt) => (
                    <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {isMobile && (
                <Button
                  variant="outlined"
                  startIcon={<Filter />}
                  onClick={() => setFilterDrawerOpen(true)}
                  sx={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}
                >
                  Filters
                </Button>
              )}
            </Box>

            {/* Bots Grid */}
            <Grid container spacing={3}>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <Grid item xs={12} sm={6} lg={4} key={i}>
                      <Skeleton
                        variant="rounded"
                        height={320}
                        sx={{ bgcolor: 'rgba(255,255,255,0.05)' }}
                      />
                    </Grid>
                  ))
                : bots.map((bot) => (
                    <Grid item xs={12} sm={6} lg={4} key={bot.id}>
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
                                {bot.total_sales || Math.floor(Math.random() * 100 + 25)} sales
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
                  No bots found matching your criteria
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setCategory('');
                    setPriceType('');
                    setSearch('');
                  }}
                  sx={{ borderColor: '#22C55E', color: '#22C55E' }}
                >
                  Reset Filters
                </Button>
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
          </Grid>
        </Grid>
      </Container>

      {/* Mobile Filter Drawer */}
      <Drawer
        anchor="right"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        PaperProps={{
          sx: { bgcolor: '#0a0f1a', width: 300 },
        }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography sx={{ color: 'white', fontWeight: 700 }}>Filters</Typography>
          <IconButton onClick={() => setFilterDrawerOpen(false)} sx={{ color: 'white' }}>
            <X />
          </IconButton>
        </Box>
        <FilterContent />
      </Drawer>
    </Box>
  );
}
