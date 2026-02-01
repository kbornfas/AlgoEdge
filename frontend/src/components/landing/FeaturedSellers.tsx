'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Avatar,
  Stack,
  Chip,
  Button,
  Skeleton,
  Rating,
} from '@mui/material';
import { Store, Star, Package, Bot, ArrowRight, MapPin, Shield, Signal } from 'lucide-react';
import Link from 'next/link';

// Twitter-style verified badge
const VerifiedBadge = ({ size = 18 }: { size?: number }) => (
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
);

interface Seller {
  id: number;
  username: string;
  full_name: string;
  profile_image: string;
  has_blue_badge: boolean;
  seller_slug: string;
  seller_tagline: string;
  seller_experience_years: number;
  seller_total_sales: number;
  seller_rating_average: number;
  seller_rating_count: number;
  seller_featured: boolean;
  country: string;
  bots_count: number;
  products_count: number;
  signals_count: number;
}

export default function FeaturedSellers() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedSellers();
  }, []);

  const fetchFeaturedSellers = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/sellers?featured=true&limit=6`);
      if (res.ok) {
        const data = await res.json();
        setSellers(data.sellers || []);
      }
    } catch (error) {
      console.error('Error fetching featured sellers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Don't render section if no featured sellers
  if (!loading && sellers.length === 0) {
    return null;
  }

  return (
    <Box sx={{ py: { xs: 6, md: 10 } }}>
      <Container maxWidth="lg">
        {/* Section Header */}
        <Box sx={{ textAlign: 'center', mb: { xs: 4, md: 6 } }}>
          <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ mb: 2 }}>
            <Store size={28} color="#8B5CF6" />
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                fontSize: { xs: '1.75rem', md: '2.5rem' },
                background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Featured Sellers
            </Typography>
          </Stack>
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.7)',
              fontSize: { xs: '1rem', md: '1.1rem' },
              maxWidth: '600px',
              mx: 'auto',
            }}
          >
            Discover top-rated sellers offering premium trading tools, EAs, and educational resources
          </Typography>
        </Box>

        {/* Sellers Grid */}
        <Grid container spacing={3}>
          {loading ? (
            // Loading skeletons
            [...Array(3)].map((_, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Card sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 3 }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <Skeleton variant="circular" width={64} height={64} sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                      <Box sx={{ flex: 1 }}>
                        <Skeleton variant="text" width="70%" sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                        <Skeleton variant="text" width="50%" sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                      </Box>
                    </Stack>
                    <Skeleton variant="text" width="100%" sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                    <Skeleton variant="text" width="80%" sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />
                  </CardContent>
                </Card>
              </Grid>
            ))
          ) : (
            sellers.map((seller) => (
              <Grid item xs={12} sm={6} md={4} key={seller.id}>
                <Card
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      bgcolor: 'rgba(255,255,255,0.05)',
                      borderColor: 'rgba(139, 92, 246, 0.3)',
                      boxShadow: '0 12px 40px rgba(139, 92, 246, 0.15)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    {/* Seller Header */}
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <Avatar
                        src={seller.profile_image}
                        sx={{
                          width: 64,
                          height: 64,
                          bgcolor: '#8B5CF6',
                          fontSize: '1.5rem',
                          fontWeight: 700,
                          border: seller.has_blue_badge ? '3px solid #1D9BF0' : '2px solid rgba(255,255,255,0.2)',
                        }}
                      >
                        {seller.full_name?.charAt(0) || seller.username?.charAt(0) || 'S'}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" alignItems="center" spacing={0.5}>
                          <Typography
                            sx={{
                              color: 'white',
                              fontWeight: 700,
                              fontSize: '1.1rem',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {seller.full_name || seller.username}
                          </Typography>
                          {seller.has_blue_badge && <VerifiedBadge size={16} />}
                        </Stack>
                        {seller.country && (
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <MapPin size={12} color="rgba(255,255,255,0.5)" />
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                              {seller.country}
                            </Typography>
                          </Stack>
                        )}
                        {seller.seller_rating_count > 0 && (
                          <Stack direction="row" alignItems="center" spacing={0.5}>
                            <Rating
                              value={seller.seller_rating_average || 0}
                              readOnly
                              size="small"
                              precision={0.5}
                              sx={{ '& .MuiRating-icon': { color: '#F59E0B' } }}
                            />
                            <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem' }}>
                              ({seller.seller_rating_count})
                            </Typography>
                          </Stack>
                        )}
                      </Box>
                    </Stack>

                    {/* Tagline */}
                    {seller.seller_tagline && (
                      <Typography
                        sx={{
                          color: 'rgba(255,255,255,0.7)',
                          fontSize: '0.9rem',
                          mb: 2,
                          fontStyle: 'italic',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        "{seller.seller_tagline}"
                      </Typography>
                    )}

                    {/* Stats */}
                    <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
                      {seller.bots_count > 0 && (
                        <Chip
                          icon={<Bot size={14} />}
                          label={`${seller.bots_count} EAs`}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(139, 92, 246, 0.15)',
                            color: '#A78BFA',
                            '& .MuiChip-icon': { color: '#A78BFA' },
                          }}
                        />
                      )}
                      {seller.signals_count > 0 && (
                        <Chip
                          icon={<Signal size={14} />}
                          label={`${seller.signals_count} Signals`}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(34, 197, 94, 0.15)',
                            color: '#86EFAC',
                            '& .MuiChip-icon': { color: '#86EFAC' },
                          }}
                        />
                      )}
                      {seller.products_count > 0 && (
                        <Chip
                          icon={<Package size={14} />}
                          label={`${seller.products_count} Products`}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(59, 130, 246, 0.15)',
                            color: '#93C5FD',
                            '& .MuiChip-icon': { color: '#93C5FD' },
                          }}
                        />
                      )}
                      {seller.seller_experience_years > 0 && (
                        <Chip
                          icon={<Shield size={14} />}
                          label={`${seller.seller_experience_years}+ yrs`}
                          size="small"
                          sx={{
                            bgcolor: 'rgba(245, 158, 11, 0.15)',
                            color: '#FCD34D',
                            '& .MuiChip-icon': { color: '#FCD34D' },
                          }}
                        />
                      )}
                    </Stack>

                    {/* View Profile Button */}
                    <Button
                      component={Link}
                      href={`/sellers/${seller.seller_slug}`}
                      fullWidth
                      variant="outlined"
                      endIcon={<ArrowRight size={16} />}
                      sx={{
                        borderColor: 'rgba(139, 92, 246, 0.5)',
                        color: '#A78BFA',
                        '&:hover': {
                          borderColor: '#8B5CF6',
                          bgcolor: 'rgba(139, 92, 246, 0.1)',
                        },
                      }}
                    >
                      View Profile
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))
          )}
        </Grid>

        {/* View All Sellers Button */}
        {sellers.length > 0 && (
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button
              component={Link}
              href="/marketplace"
              variant="contained"
              endIcon={<ArrowRight size={18} />}
              sx={{
                px: 4,
                py: 1.5,
                background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
                fontWeight: 700,
                '&:hover': {
                  background: 'linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)',
                },
              }}
            >
              Explore All Sellers
            </Button>
          </Box>
        )}
      </Container>
    </Box>
  );
}
