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
  Tab,
  Tabs,
  CircularProgress,
  Alert,
  Breadcrumbs,
  Paper,
  Divider,
  Dialog,
  DialogContent,
  IconButton,
} from '@mui/material';
import {
  ArrowLeft,
  Star,
  Users,
  Package,
  Bot,
  Signal,
  ChevronRight,
  MapPin,
  Calendar,
  Award,
  ExternalLink,
  Twitter,
  Instagram,
  Image as ImageIcon,
  Play,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface SellerMedia {
  id: number;
  media_type: 'image' | 'video';
  media_url: string;
  thumbnail_url?: string;
  title?: string;
  description?: string;
  is_featured?: boolean;
}

interface SellerReview {
  id: number;
  rating: number;
  comment: string;
  reviewer_username: string;
  reviewer_name: string;
  reviewer_avatar?: string;
  created_at: string;
}

interface SellerProfile {
  id: number;
  display_name: string;
  username: string;
  seller_slug: string;
  seller_bio: string;
  seller_tagline: string;
  profile_image: string;
  avatar: string;
  has_blue_badge: boolean;
  seller_expertise: string[];
  seller_experience_years: number;
  seller_location: string;
  seller_website: string;
  seller_twitter: string;
  seller_instagram: string;
  seller_rating_average: number;
  seller_total_reviews: number;
  total_sales: number;
  created_at: string;
  products: {
    bots: Array<{
      id: number;
      name: string;
      slug: string;
      thumbnail_url: string;
      price: number;
      rating_average: number;
      total_sales: number;
      category: string;
    }>;
    products: Array<{
      id: number;
      name: string;
      slug: string;
      thumbnail_url: string;
      price: number;
      rating_average: number;
      total_sales: number;
      product_type: string;
    }>;
    signals: Array<{
      id: number;
      name: string;
      slug: string;
      monthly_price: number;
      rating_average: number;
      total_subscribers: number;
      avatar_url?: string;
      profile_image?: string;
      is_official?: boolean;
    }>;
  };
  media?: SellerMedia[];
  reviews?: SellerReview[];
}

// Blue badge SVG component
const BlueBadge = ({ size = 20 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
    <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="#1D9BF0"/>
  </svg>
);

export default function SellerProfilePage() {
  const params = useParams();
  const slug = params.slug as string;

  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [mediaLightbox, setMediaLightbox] = useState<SellerMedia | null>(null);

  useEffect(() => {
    if (slug) {
      fetchSellerProfile();
    }
  }, [slug]);

  const fetchSellerProfile = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/seller/${slug}`);
      if (res.ok) {
        const data = await res.json();
        // Map API response to our interface
        setSeller({
          ...data.seller,
          display_name: data.seller.display_name || data.seller.full_name || data.seller.username,
          seller_expertise: data.seller.seller_specialties || [],
          seller_location: data.seller.country,
          seller_total_reviews: data.seller.seller_rating_count || 0,
          total_sales: data.seller.seller_total_sales || 0,
          products: {
            bots: data.bots || [],
            products: data.products || [],
            signals: data.signals || [],
          },
          media: data.media || [],
          reviews: data.reviews || [],
        });
      } else {
        setError('Seller not found');
      }
    } catch (error) {
      console.error('Error fetching seller:', error);
      setError('Failed to load seller profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#8B5CF6' }} />
      </Box>
    );
  }

  if (error || !seller) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', py: 8 }}>
        <Container maxWidth="md">
          <Alert severity="error" sx={{ mb: 3 }}>{error || 'Seller not found'}</Alert>
          <Button component={Link} href="/marketplace" startIcon={<ArrowLeft size={18} />}>
            Back to Marketplace
          </Button>
        </Container>
      </Box>
    );
  }

  const allProducts = [
    ...(seller.products?.bots || []).map(b => ({ ...b, type: 'bot' })),
    ...(seller.products?.products || []).map(p => ({ ...p, type: 'product' })),
  ];

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
            <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>Sellers</Typography>
            <Typography sx={{ color: 'white' }}>{seller.display_name || seller.username}</Typography>
          </Breadcrumbs>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.15) 0%, transparent 100%)',
          py: 6,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Container maxWidth="lg">
          <Grid container spacing={4} alignItems="center">
            <Grid item xs={12} md={8}>
              <Stack direction="row" spacing={3} alignItems="center">
                <Box sx={{ position: 'relative' }}>
                  <Avatar
                    src={seller.avatar || seller.profile_image}
                    sx={{
                      width: 120,
                      height: 120,
                      bgcolor: 'rgba(139, 92, 246, 0.3)',
                      fontSize: '3rem',
                      border: '4px solid rgba(139, 92, 246, 0.5)',
                    }}
                  >
                    {(seller.display_name || seller.username)?.charAt(0)}
                  </Avatar>
                  {seller.has_blue_badge && (
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        bgcolor: '#0a0f1a',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '3px solid #0a0f1a',
                      }}
                    >
                      <BlueBadge size={28} />
                    </Box>
                  )}
                </Box>
                <Box>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <Typography variant="h3" sx={{ color: 'white', fontWeight: 800 }}>
                      {seller.display_name || seller.username}
                    </Typography>
                  </Stack>
                  {seller.seller_tagline && (
                    <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem', mb: 2 }}>
                      {seller.seller_tagline}
                    </Typography>
                  )}
                  <Stack direction="row" spacing={3} flexWrap="wrap">
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Star size={18} fill="#F59E0B" color="#F59E0B" />
                      <Typography sx={{ color: 'white', fontWeight: 600 }}>
                        {Number(seller.seller_rating_average || 0).toFixed(1)}
                      </Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
                        ({seller.seller_total_reviews || 0} reviews)
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Users size={18} color="#22C55E" />
                      <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                        {seller.total_sales || 0} sales
                      </Typography>
                    </Stack>
                    {seller.seller_location && (
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <MapPin size={18} color="#8B5CF6" />
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          {seller.seller_location}
                        </Typography>
                      </Stack>
                    )}
                    {seller.seller_experience_years && (
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Award size={18} color="#F59E0B" />
                        <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                          {seller.seller_experience_years}+ years experience
                        </Typography>
                      </Stack>
                    )}
                  </Stack>
                </Box>
              </Stack>
            </Grid>
            <Grid item xs={12} md={4}>
              <Stack direction="row" spacing={2} justifyContent={{ xs: 'flex-start', md: 'flex-end' }}>
                {seller.seller_website && (
                  <Button
                    variant="outlined"
                    startIcon={<ExternalLink size={18} />}
                    href={seller.seller_website}
                    target="_blank"
                    sx={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}
                  >
                    Website
                  </Button>
                )}
                {seller.seller_twitter && (
                  <Button
                    variant="outlined"
                    href={`https://twitter.com/${seller.seller_twitter}`}
                    target="_blank"
                    sx={{ borderColor: 'rgba(29, 155, 240, 0.5)', color: '#1D9BF0', minWidth: 'auto', px: 2 }}
                  >
                    <Twitter size={18} />
                  </Button>
                )}
                {seller.seller_instagram && (
                  <Button
                    variant="outlined"
                    href={`https://instagram.com/${seller.seller_instagram}`}
                    target="_blank"
                    sx={{ borderColor: 'rgba(225, 48, 108, 0.5)', color: '#E1306C', minWidth: 'auto', px: 2 }}
                  >
                    <Instagram size={18} />
                  </Button>
                )}
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Content */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Grid container spacing={4}>
          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            {/* About Card */}
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>
                  About
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 3, lineHeight: 1.7 }}>
                  {seller.seller_bio || 'This seller has not added a bio yet.'}
                </Typography>

                {seller.seller_expertise && seller.seller_expertise.length > 0 && (
                  <>
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', mb: 1 }}>
                      EXPERTISE
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 3 }}>
                      {seller.seller_expertise.map((skill, i) => (
                        <Chip
                          key={i}
                          label={skill}
                          size="small"
                          sx={{ bgcolor: 'rgba(139, 92, 246, 0.2)', color: '#A78BFA' }}
                        />
                      ))}
                    </Stack>
                  </>
                )}

                <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 2 }} />

                <Stack direction="row" spacing={1} alignItems="center">
                  <Calendar size={16} color="rgba(255,255,255,0.5)" />
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
                    Member since {new Date(seller.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </Typography>
                </Stack>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <CardContent>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>
                  Statistics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, bgcolor: 'rgba(34, 197, 94, 0.1)', textAlign: 'center' }}>
                      <Typography sx={{ color: '#22C55E', fontSize: '1.5rem', fontWeight: 800 }}>
                        {seller.total_sales || 0}
                      </Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                        Total Sales
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, bgcolor: 'rgba(139, 92, 246, 0.1)', textAlign: 'center' }}>
                      <Typography sx={{ color: '#8B5CF6', fontSize: '1.5rem', fontWeight: 800 }}>
                        {allProducts.length}
                      </Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                        Products
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, bgcolor: 'rgba(245, 158, 11, 0.1)', textAlign: 'center' }}>
                      <Typography sx={{ color: '#F59E0B', fontSize: '1.5rem', fontWeight: 800 }}>
                        {Number(seller.seller_rating_average || 0).toFixed(1)}
                      </Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                        Avg Rating
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper sx={{ p: 2, bgcolor: 'rgba(59, 130, 246, 0.1)', textAlign: 'center' }}>
                      <Typography sx={{ color: '#3B82F6', fontSize: '1.5rem', fontWeight: 800 }}>
                        {seller.seller_total_reviews || 0}
                      </Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                        Reviews
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Main Content */}
          <Grid item xs={12} md={8}>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, mb: 3 }}>
              Products by {seller.display_name || seller.username}
            </Typography>

            {allProducts.length === 0 ? (
              <Paper sx={{ p: 4, bgcolor: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
                <Package size={48} color="rgba(255,255,255,0.3)" />
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', mt: 2 }}>
                  This seller hasn't listed any products yet.
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={3}>
                {allProducts.map((product: any) => (
                  <Grid item xs={12} sm={6} key={`${product.type}-${product.id}`}>
                    <Card
                      component={Link}
                      href={`/marketplace/${product.type === 'bot' ? 'bots' : 'products'}/${product.slug}`}
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        textDecoration: 'none',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          borderColor: '#8B5CF6',
                          boxShadow: '0 8px 32px rgba(139, 92, 246, 0.2)',
                        },
                      }}
                    >
                      <Box
                        sx={{
                          height: 120,
                          background: product.thumbnail_url 
                            ? `url(${product.thumbnail_url}) center/cover`
                            : 'linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {!product.thumbnail_url && (
                          product.type === 'bot' ? <Bot size={40} color="white" /> : <Package size={40} color="white" />
                        )}
                      </Box>
                      <CardContent>
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                          <Chip
                            label={product.type === 'bot' ? 'Bot' : product.product_type || 'Product'}
                            size="small"
                            sx={{
                              bgcolor: product.type === 'bot' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                              color: product.type === 'bot' ? '#A78BFA' : '#F59E0B',
                              fontSize: '0.7rem',
                            }}
                          />
                        </Stack>
                        <Typography sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
                          {product.name}
                        </Typography>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Star size={14} fill="#F59E0B" color="#F59E0B" />
                            <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>
                              {Number(product.rating_average || 0).toFixed(1)} • {product.total_sales || 0} sales
                            </Typography>
                          </Stack>
                          <Typography sx={{ color: '#22C55E', fontWeight: 800 }}>
                            ${product.price || 0}
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}

            {/* Signal Providers */}
            {seller.products?.signals && seller.products.signals.length > 0 && (
              <>
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, mb: 3, mt: 4 }}>
                  Signal Services
                </Typography>
                <Grid container spacing={3}>
                  {seller.products.signals.map((signal) => (
                    <Grid item xs={12} sm={6} key={signal.id}>
                      <Card
                        component={Link}
                        href={`/marketplace/signals/${signal.slug}`}
                        sx={{
                          bgcolor: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.1)',
                          textDecoration: 'none',
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            borderColor: '#22C55E',
                          },
                        }}
                      >
                        <CardContent>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Box sx={{ position: 'relative' }}>
                              <Avatar
                                src={signal.avatar_url || signal.profile_image}
                                sx={{
                                  width: 48,
                                  height: 48,
                                  borderRadius: 2,
                                  background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                                }}
                              >
                                <Signal size={24} color="white" />
                              </Avatar>
                              {signal.is_official && (
                                <Box
                                  sx={{
                                    position: 'absolute',
                                    bottom: -4,
                                    right: -4,
                                    width: 20,
                                    height: 20,
                                    borderRadius: '50%',
                                    bgcolor: '#0a0f1a',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                  }}
                                >
                                  <BlueBadge size={16} />
                                </Box>
                              )}
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography sx={{ color: 'white', fontWeight: 700 }}>
                                {signal.name}
                              </Typography>
                              <Stack direction="row" spacing={1} alignItems="center">
                                <Typography sx={{ color: '#22C55E', fontWeight: 700 }}>
                                  ${signal.monthly_price}/mo
                                </Typography>
                                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                                  • {signal.total_subscribers || 0} subscribers
                                </Typography>
                              </Stack>
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}

            {/* Performance Media Gallery */}
            {seller.media && seller.media.length > 0 && (
              <>
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, mb: 3, mt: 4 }}>
                  Performance Gallery
                </Typography>
                <Grid container spacing={2}>
                  {seller.media.map((media) => (
                    <Grid item xs={6} sm={4} md={3} key={media.id}>
                      <Box
                        onClick={() => setMediaLightbox(media)}
                        sx={{
                          position: 'relative',
                          aspectRatio: '1',
                          borderRadius: 2,
                          overflow: 'hidden',
                          cursor: 'pointer',
                          border: media.is_featured ? '2px solid #F59E0B' : '1px solid rgba(255,255,255,0.1)',
                          '&:hover': {
                            '& .media-overlay': {
                              opacity: 1,
                            },
                          },
                        }}
                      >
                        {media.media_type === 'video' ? (
                          <Box
                            sx={{
                              width: '100%',
                              height: '100%',
                              bgcolor: 'rgba(0,0,0,0.8)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundImage: media.thumbnail_url ? `url(${media.thumbnail_url})` : undefined,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                            }}
                          >
                            <Box
                              sx={{
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                bgcolor: 'rgba(255,255,255,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Play size={24} fill="white" color="white" />
                            </Box>
                          </Box>
                        ) : (
                          <Box
                            component="img"
                            src={media.media_url}
                            alt={media.title || 'Performance screenshot'}
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        )}
                        <Box
                          className="media-overlay"
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            bgcolor: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: 0,
                            transition: 'opacity 0.2s',
                          }}
                        >
                          {media.media_type === 'video' ? (
                            <Play size={32} color="white" />
                          ) : (
                            <ImageIcon size={32} color="white" />
                          )}
                        </Box>
                        {media.is_featured && (
                          <Chip
                            label="Featured"
                            size="small"
                            sx={{
                              position: 'absolute',
                              top: 8,
                              left: 8,
                              bgcolor: 'rgba(245, 158, 11, 0.9)',
                              color: 'white',
                              fontSize: '0.65rem',
                            }}
                          />
                        )}
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </>
            )}

            {/* Reviews Section */}
            {seller.reviews && seller.reviews.length > 0 && (
              <>
                <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, mb: 3, mt: 4 }}>
                  Customer Reviews ({seller.reviews.length})
                </Typography>
                <Stack spacing={2}>
                  {seller.reviews.map((review) => (
                    <Card
                      key={review.id}
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      <CardContent>
                        <Stack direction="row" spacing={2} alignItems="flex-start">
                          <Avatar
                            src={review.reviewer_avatar}
                            sx={{ width: 40, height: 40 }}
                          >
                            {(review.reviewer_name || review.reviewer_username)?.charAt(0)}
                          </Avatar>
                          <Box sx={{ flex: 1 }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                              <Typography sx={{ color: 'white', fontWeight: 600 }}>
                                {review.reviewer_name || review.reviewer_username}
                              </Typography>
                              <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                                {new Date(review.created_at).toLocaleDateString()}
                              </Typography>
                            </Stack>
                            <Rating
                              value={review.rating}
                              readOnly
                              size="small"
                              sx={{ mb: 1 }}
                            />
                            <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem' }}>
                              {review.comment}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </>
            )}
          </Grid>
        </Grid>
      </Container>

      {/* Media Lightbox Dialog */}
      <Dialog
        open={!!mediaLightbox}
        onClose={() => setMediaLightbox(null)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: 'rgba(0,0,0,0.95)',
            backgroundImage: 'none',
          },
        }}
      >
        <IconButton
          onClick={() => setMediaLightbox(null)}
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            color: 'white',
            zIndex: 1,
            bgcolor: 'rgba(255,255,255,0.1)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
          }}
        >
          <X size={24} />
        </IconButton>
        <DialogContent sx={{ p: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          {mediaLightbox?.media_type === 'video' ? (
            <video
              controls
              autoPlay
              style={{ maxWidth: '100%', maxHeight: '80vh' }}
              src={mediaLightbox.media_url}
            />
          ) : (
            <Box
              component="img"
              src={mediaLightbox?.media_url}
              alt={mediaLightbox?.title || 'Performance screenshot'}
              sx={{
                maxWidth: '100%',
                maxHeight: '80vh',
                objectFit: 'contain',
              }}
            />
          )}
        </DialogContent>
        {mediaLightbox?.title && (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography sx={{ color: 'white', fontWeight: 600 }}>
              {mediaLightbox.title}
            </Typography>
            {mediaLightbox.description && (
              <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', mt: 0.5 }}>
                {mediaLightbox.description}
              </Typography>
            )}
          </Box>
        )}
      </Dialog>
    </Box>
  );
}
