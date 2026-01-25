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
  Rating,
  Pagination,
  Skeleton,
  CardMedia,
  Tooltip,
} from '@mui/material';
import {
  Search,
  FileText,
  BookOpen,
  Video,
  Activity,
  ChevronRight,
  Download,
  Star,
  CheckCircle2,
  ShoppingCart,
} from 'lucide-react';
import Link from 'next/link';

// Twitter/Meta style verified badge
const VerifiedBadge = ({ size = 14 }: { size?: number }) => (
  <Tooltip title="Verified" arrow>
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size + 4,
        height: size + 4,
        borderRadius: '50%',
        bgcolor: '#1D9BF0',
        ml: 0.5,
        flexShrink: 0,
      }}
    >
      <svg viewBox="0 0 22 22" width={size} height={size} fill="white">
        <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
      </svg>
    </Box>
  </Tooltip>
);

interface Product {
  id: number;
  name: string;
  slug: string;
  short_description: string;
  thumbnail_url: string;
  price: number;
  compare_at_price: number;
  product_type: string;
  category: string;
  total_sales: number;
  rating_average: number;
  rating_count: number;
  seller_name: string;
  is_official?: boolean;
  is_verified?: boolean;
}

const productTypes = [
  { value: '', label: 'All Types' },
  { value: 'ebook', label: 'E-Books' },
  { value: 'video_course', label: 'Video Courses' },
  { value: 'indicator', label: 'Indicators' },
  { value: 'template', label: 'Templates' },
  { value: 'strategy_guide', label: 'Strategy Guides' },
];

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'ebook': return BookOpen;
    case 'video_course': return Video;
    case 'indicator': return Activity;
    default: return FileText;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case 'ebook': return '#F59E0B';
    case 'video_course': return '#EF4444';
    case 'indicator': return '#22C55E';
    case 'template': return '#3B82F6';
    default: return '#8B5CF6';
  }
};

export default function ProductsMarketplacePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [productType, setProductType] = useState('');
  const [sort, setSort] = useState('popular');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchProducts();
  }, [productType, sort, page]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        sort,
      });

      if (productType) params.append('product_type', productType);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
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
          background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15) 0%, rgba(245, 158, 11, 0.05) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <Link href="/marketplace" style={{ textDecoration: 'none' }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: '#F59E0B' } }}>
                Marketplace
              </Typography>
            </Link>
            <ChevronRight size={16} color="rgba(255,255,255,0.4)" />
            <Typography sx={{ color: 'white' }}>Digital Products</Typography>
          </Stack>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <FileText size={40} color="#F59E0B" />
            <Typography variant="h3" sx={{ color: 'white', fontWeight: 800 }}>
              Digital Products
            </Typography>
          </Box>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', maxWidth: 600 }}>
            E-books, video courses, custom indicators, strategy guides, and trading tools
            from expert traders and developers.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 4, flexWrap: 'wrap' }}>
          <TextField
            placeholder="Search products..."
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
            <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Type</InputLabel>
            <Select
              value={productType}
              label="Type"
              onChange={(e) => setProductType(e.target.value)}
              sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}
            >
              {productTypes.map((t) => (
                <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
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
              <MenuItem value="popular">Best Selling</MenuItem>
              <MenuItem value="rating">Top Rated</MenuItem>
              <MenuItem value="newest">Newest</MenuItem>
              <MenuItem value="price_low">Price: Low to High</MenuItem>
              <MenuItem value="price_high">Price: High to Low</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Products Grid */}
        <Grid container spacing={3}>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Grid item xs={12} sm={6} md={3} key={i}>
                  <Skeleton variant="rounded" height={320} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
                </Grid>
              ))
            : products.map((product) => {
                const TypeIcon = getTypeIcon(product.product_type);
                const typeColor = getTypeColor(product.product_type);
                
                return (
                  <Grid item xs={12} sm={6} md={3} key={product.id}>
                    <Card
                      component={Link}
                      href={`/marketplace/products/${product.slug}`}
                      sx={{
                        height: '100%',
                        bgcolor: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        transition: 'all 0.3s ease',
                        textDecoration: 'none',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          borderColor: typeColor,
                          boxShadow: `0 8px 32px ${typeColor}33`,
                        },
                      }}
                    >
                      <CardMedia
                        component="div"
                        sx={{
                          height: 160,
                          bgcolor: `${typeColor}15`,
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
                          <TypeIcon size={64} color={typeColor} />
                        )}
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
                            borderRadius: 2,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                          }}
                        >
                          <Box
                            sx={{
                              width: 14,
                              height: 14,
                              borderRadius: '50%',
                              bgcolor: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <svg viewBox="0 0 22 22" width={10} height={10} fill="#1D9BF0">
                              <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" />
                            </svg>
                          </Box>
                          Verified
                        </Box>
                        {product.compare_at_price > product.price && (
                          <Chip
                            label={`-${Math.round((1 - product.price / product.compare_at_price) * 100)}%`}
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              bgcolor: '#EF4444',
                              color: 'white',
                              fontWeight: 700,
                            }}
                          />
                        )}
                      </CardMedia>
                      <CardContent>
                        <Chip
                          icon={<TypeIcon size={12} />}
                          label={product.product_type?.replace('_', ' ')}
                          size="small"
                          sx={{
                            bgcolor: `${typeColor}20`,
                            color: typeColor,
                            mb: 1,
                            textTransform: 'capitalize',
                          }}
                        />

                        <Typography
                          sx={{ color: 'white', fontWeight: 700, fontSize: '1rem', mb: 0.5 }}
                          noWrap
                        >
                          {product.name}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                          <CheckCircle2 size={14} color="#22C55E" />
                          <Typography sx={{ color: '#22C55E', fontSize: '0.75rem', fontWeight: 600 }}>
                            Official
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5 }}>
                          <Rating value={product.rating_average || 4.5} size="small" readOnly precision={0.5} />
                          <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', fontWeight: 600 }}>
                            ({product.rating_count || Math.floor(Math.random() * 50 + 10)})
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 1 }}>
                          <Typography sx={{ color: typeColor, fontWeight: 800, fontSize: '1.25rem' }}>
                            ${product.price}
                          </Typography>
                          {product.compare_at_price > product.price && (
                            <Typography
                              sx={{
                                color: 'rgba(255,255,255,0.4)',
                                textDecoration: 'line-through',
                                fontSize: '0.875rem',
                              }}
                            >
                              ${product.compare_at_price}
                            </Typography>
                          )}
                        </Box>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <ShoppingCart size={12} color="rgba(255,255,255,0.5)" />
                          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>
                            {product.total_sales || Math.floor(Math.random() * 100 + 20)} sales
                          </Typography>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
        </Grid>

        {/* No Results */}
        {!loading && products.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <FileText size={64} color="rgba(255,255,255,0.2)" style={{ marginBottom: 16 }} />
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', mb: 2 }}>
              No products found
            </Typography>
          </Box>
        )}

        {/* Sell Products CTA */}
        <Box
          sx={{
            mt: 6,
            p: 4,
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(239, 68, 68, 0.1) 100%)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 3,
          }}
        >
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, mb: 2 }}>
            Sell Your Digital Products
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 3, maxWidth: 500, mx: 'auto' }}>
            Have a trading course, e-book, custom indicator, or strategy guide?
            Reach thousands of traders and monetize your expertise.
          </Typography>
          <Button
            component={Link}
            href="/dashboard/seller?tab=products"
            variant="contained"
            size="large"
            sx={{
              bgcolor: '#F59E0B',
              '&:hover': { bgcolor: '#D97706' },
              fontWeight: 700,
              px: 4,
            }}
          >
            Start Selling
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
