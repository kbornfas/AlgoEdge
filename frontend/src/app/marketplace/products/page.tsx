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
  Rating,
  Pagination,
  Skeleton,
  CardMedia,
  Tooltip,
} from '@mui/material';
import {
  FileText,
  BookOpen,
  Video,
  Activity,
  ChevronRight,
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

// Demo products data
const demoProducts: Product[] = [
  {
    id: 1,
    name: 'Gold Trading Bible eBook',
    slug: 'gold-trading-bible-ebook',
    short_description: 'Comprehensive guide to trading XAUUSD with institutional strategies and risk management techniques.',
    thumbnail_url: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=400&h=300&fit=crop',
    price: 49,
    compare_at_price: 79,
    product_type: 'ebook',
    category: 'education',
    total_sales: 234,
    rating_average: 4.8,
    rating_count: 67,
    seller_name: 'AlgoEdge Academy'
  },
  {
    id: 2,
    name: 'MT5 Mastery Course',
    slug: 'mt5-mastery-course',
    short_description: 'Complete video course on mastering MetaTrader 5 for professional trading.',
    thumbnail_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop',
    price: 149,
    compare_at_price: 199,
    product_type: 'video_course',
    category: 'education',
    total_sales: 456,
    rating_average: 4.9,
    rating_count: 123,
    seller_name: 'AlgoEdge Academy'
  },
  {
    id: 3,
    name: 'Price Action Secrets eBook',
    slug: 'price-action-secrets-ebook',
    short_description: 'Learn professional price action trading strategies used by institutional traders.',
    thumbnail_url: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=400&h=300&fit=crop',
    price: 39,
    compare_at_price: 59,
    product_type: 'ebook',
    category: 'education',
    total_sales: 312,
    rating_average: 4.7,
    rating_count: 89,
    seller_name: 'AlgoEdge Academy'
  },
  {
    id: 4,
    name: 'Risk Management eBook',
    slug: 'risk-management-ebook',
    short_description: 'Master risk management principles to protect and grow your trading capital.',
    thumbnail_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
    price: 29,
    compare_at_price: 49,
    product_type: 'ebook',
    category: 'education',
    total_sales: 567,
    rating_average: 4.9,
    rating_count: 156,
    seller_name: 'AlgoEdge Academy'
  },
  {
    id: 5,
    name: 'Technical Analysis Mastery eBook',
    slug: 'technical-analysis-mastery-ebook',
    short_description: 'Deep dive into technical analysis with chart patterns, indicators, and trading signals.',
    thumbnail_url: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=400&h=300&fit=crop',
    price: 59,
    compare_at_price: 89,
    product_type: 'ebook',
    category: 'education',
    total_sales: 289,
    rating_average: 4.8,
    rating_count: 78,
    seller_name: 'AlgoEdge Academy'
  },
  {
    id: 6,
    name: 'Prop Firm Challenge Blueprint',
    slug: 'prop-firm-challenge-blueprint',
    short_description: 'Step-by-step guide to passing prop firm challenges and getting funded.',
    thumbnail_url: 'https://images.unsplash.com/photo-1559526324-593bc073d938?w=400&h=300&fit=crop',
    price: 79,
    compare_at_price: 129,
    product_type: 'strategy_guide',
    category: 'education',
    total_sales: 423,
    rating_average: 4.9,
    rating_count: 134,
    seller_name: 'AlgoEdge Academy'
  },
  {
    id: 7,
    name: 'Professional Trading Journal',
    slug: 'professional-trading-journal',
    short_description: 'Digital trading journal template for tracking and analyzing your trades.',
    thumbnail_url: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=400&h=300&fit=crop',
    price: 19,
    compare_at_price: 29,
    product_type: 'template',
    category: 'tools',
    total_sales: 678,
    rating_average: 4.6,
    rating_count: 201,
    seller_name: 'AlgoEdge Academy'
  },
  {
    id: 8,
    name: 'Trading Plan Template Bundle',
    slug: 'trading-plan-template-bundle',
    short_description: 'Complete set of trading plan templates for different trading styles.',
    thumbnail_url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=400&h=300&fit=crop',
    price: 29,
    compare_at_price: 49,
    product_type: 'template',
    category: 'tools',
    total_sales: 345,
    rating_average: 4.7,
    rating_count: 98,
    seller_name: 'AlgoEdge Academy'
  },
  {
    id: 9,
    name: 'Forex Calculator Suite',
    slug: 'forex-calculator-suite',
    short_description: 'Professional Excel-based forex calculators for position sizing, pip value, and risk management.',
    thumbnail_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400&h=300&fit=crop',
    price: 39,
    compare_at_price: 59,
    product_type: 'template',
    category: 'tools',
    total_sales: 234,
    rating_average: 4.8,
    rating_count: 67,
    seller_name: 'AlgoEdge Academy'
  },
  {
    id: 10,
    name: 'Trading Psychology Blueprint',
    slug: 'trading-psychology-blueprint',
    short_description: 'Master your trading mindset with proven psychological frameworks.',
    thumbnail_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
    price: 49,
    compare_at_price: 79,
    product_type: 'ebook',
    category: 'education',
    total_sales: 189,
    rating_average: 4.8,
    rating_count: 54,
    seller_name: 'AlgoEdge Academy'
  },
  {
    id: 11,
    name: 'Complete Forex Trading Course',
    slug: 'complete-forex-trading-course',
    short_description: 'Ultimate comprehensive forex trading course from beginner to professional with 25+ hours of content.',
    thumbnail_url: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=400&h=300&fit=crop',
    price: 299,
    compare_at_price: 499,
    product_type: 'video_course',
    category: 'education',
    total_sales: 1523,
    rating_average: 4.9,
    rating_count: 342,
    seller_name: 'AlgoEdge Academy',
    is_official: true
  },
  {
    id: 12,
    name: 'Smart Money Concepts Course',
    slug: 'smart-money-concepts-course',
    short_description: 'Master institutional trading strategies and learn how smart money moves the markets.',
    thumbnail_url: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=400&h=300&fit=crop',
    price: 199,
    compare_at_price: 299,
    product_type: 'video_course',
    category: 'education',
    total_sales: 892,
    rating_average: 4.8,
    rating_count: 187,
    seller_name: 'AlgoEdge Academy',
    is_official: true
  },
  {
    id: 13,
    name: 'Price Action Bible eBook',
    slug: 'price-action-bible-ebook',
    short_description: '350+ pages with 200+ annotated chart examples covering all price action concepts.',
    thumbnail_url: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=400&h=300&fit=crop',
    price: 39,
    compare_at_price: 49,
    product_type: 'ebook',
    category: 'education',
    total_sales: 1876,
    rating_average: 4.7,
    rating_count: 234,
    seller_name: 'AlgoEdge Academy',
    is_official: true
  },
  {
    id: 14,
    name: 'Ultimate MT5 Indicator Pack',
    slug: 'ultimate-mt5-indicator-pack',
    short_description: '25 premium custom indicators for MetaTrader 5 with full source code and documentation.',
    thumbnail_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop',
    price: 99,
    compare_at_price: 149,
    product_type: 'indicator',
    category: 'tools',
    total_sales: 1234,
    rating_average: 4.8,
    rating_count: 156,
    seller_name: 'AlgoEdge Academy',
    is_official: true
  },
  {
    id: 15,
    name: 'Trading Psychology Masterclass',
    slug: 'trading-psychology-masterclass',
    short_description: 'Master the psychology of successful trading with in-depth video course.',
    thumbnail_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
    price: 104,
    compare_at_price: 149,
    product_type: 'video_course',
    category: 'education',
    total_sales: 645,
    rating_average: 4.9,
    rating_count: 178,
    seller_name: 'AlgoEdge Academy',
    is_official: true
  }
];

export default function ProductsMarketplacePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchProducts();
  }, [page]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        sort: 'popular',
      });

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (data.products && data.products.length > 0) {
          setProducts(data.products);
          setTotalPages(data.pagination?.totalPages || 1);
        } else {
          // Use demo data if no products from API
          setProducts(demoProducts);
          setTotalPages(1);
        }
      } else {
        // Fallback to demo data
        setProducts(demoProducts);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      // Fallback to demo data on error
      setProducts(demoProducts);
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
        {/* Products Grid */}
        <Grid container spacing={3}>
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <Grid item xs={12} sm={6} md={3} key={i}>
                  <Skeleton variant="rounded" height={380} sx={{ bgcolor: 'rgba(255,255,255,0.05)' }} />
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
                        {/* Official Badge */}
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            bgcolor: 'rgba(34, 197, 94, 0.95)',
                            backdropFilter: 'blur(8px)',
                            color: 'white',
                            px: 1,
                            py: 0.5,
                            borderRadius: 2,
                            fontSize: '0.7rem',
                            fontWeight: 700,
                          }}
                        >
                          <CheckCircle2 size={12} />
                          Official
                        </Box>
                        {/* Verified Badge */}
                        <Box
                          sx={{
                            position: 'absolute',
                            top: 8,
                            left: 70,
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
                            ({product.rating_count || 0})
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
                            {product.total_sales || 0} sales
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
              No products available at the moment
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
                    bgcolor: '#F59E0B',
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
