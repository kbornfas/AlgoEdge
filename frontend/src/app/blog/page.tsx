'use client';

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Grid,
  Chip,
  Button,
  Stack,
} from '@mui/material';
import { Calendar, Clock, ArrowRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';

const blogPosts = [
  {
    slug: 'best-xauusd-strategy-2026',
    title: 'Best XAUUSD Strategy 2026: Complete Gold Trading Guide',
    excerpt: 'Discover the most profitable XAUUSD (Gold) trading strategies for 2026. Learn how AI-powered bots are revolutionizing gold trading with 94%+ win rates.',
    image: 'https://images.unsplash.com/photo-1610375461246-83df859d849d?w=800&q=80',
    category: 'Trading Strategies',
    readTime: '8 min read',
    date: 'January 15, 2026',
    featured: true,
    color: '#FFD700',
    gradient: 'linear-gradient(135deg, rgba(255,215,0,0.9) 0%, rgba(218,165,32,0.95) 100%)',
  },
  {
    slug: 'best-trading-api-2026',
    title: 'Best Trading APIs for Algorithmic Trading in 2026: Complete Developer Guide',
    excerpt: 'Compare the top trading APIs for building automated trading systems. Real-time market data, historical prices, WebSocket streaming, and everything developers need.',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80',
    category: 'Trading APIs',
    readTime: '12 min read',
    date: 'January 25, 2026',
    featured: true,
    color: '#8B5CF6',
    gradient: 'linear-gradient(135deg, rgba(139,92,246,0.85) 0%, rgba(109,40,217,0.9) 100%)',
  },
  {
    slug: 'best-forex-signals-2026',
    title: 'Best Forex Signal Services 2026: Complete Guide to Copy Trading Success',
    excerpt: 'Discover the top-rated forex signal providers with proven track records. Learn how to choose reliable signals and maximize profits from professional trading alerts.',
    image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80',
    category: 'Trading Signals',
    readTime: '15 min read',
    date: 'January 25, 2026',
    featured: true,
    color: '#3B82F6',
    gradient: 'linear-gradient(135deg, rgba(59,130,246,0.85) 0%, rgba(37,99,235,0.9) 100%)',
  },
  {
    slug: 'forex-trading-courses-2026',
    title: 'Best Forex Trading Courses & Education in 2026: Complete Learning Guide',
    excerpt: 'Master forex trading with the best courses, ebooks, and educational resources. Compare top-rated programs and start your journey to profitable trading.',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80',
    category: 'Forex Education',
    readTime: '14 min read',
    date: 'January 25, 2026',
    featured: true,
    color: '#F59E0B',
    gradient: 'linear-gradient(135deg, rgba(245,158,11,0.85) 0%, rgba(217,119,6,0.9) 100%)',
  },
  {
    slug: 'how-to-automate-mt5-trading',
    title: 'How to Automate MT5 Trading: Step-by-Step Guide for 2026',
    excerpt: 'Complete guide to automating your MetaTrader 5 trading. Connect your MT5 account to AI-powered trading bots and start earning passive income.',
    image: 'https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=800&q=80',
    category: 'MT5 Guides',
    readTime: '10 min read',
    date: 'January 12, 2026',
    featured: true,
    color: '#2196F3',
    gradient: 'linear-gradient(135deg, rgba(33,150,243,0.85) 0%, rgba(25,118,210,0.9) 100%)',
  },
  {
    slug: 'best-forex-bots-for-beginners',
    title: 'Best Forex Bots for Beginners 2026: Top 5 Automated Trading Systems',
    excerpt: 'New to forex trading? Discover the best forex trading bots for beginners. Our comprehensive review covers features, costs, and expected returns.',
    image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&q=80',
    category: 'Reviews',
    readTime: '12 min read',
    date: 'January 10, 2026',
    featured: true,
    color: '#00c853',
    gradient: 'linear-gradient(135deg, rgba(0,200,83,0.85) 0%, rgba(0,150,36,0.9) 100%)',
  },
  {
    slug: 'trading-psychology-overcoming-fear-greed',
    title: 'Trading Psychology: Overcoming Fear and Greed in Forex',
    excerpt: 'Master your trading mindset. Learn proven techniques to control emotions, stay disciplined, and make rational trading decisions under pressure.',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80',
    category: 'Psychology',
    readTime: '9 min read',
    date: 'January 20, 2026',
    featured: true,
    color: '#EC4899',
    gradient: 'linear-gradient(135deg, rgba(236,72,153,0.85) 0%, rgba(219,39,119,0.9) 100%)',
  },
  {
    slug: 'risk-management-rules-every-trader',
    title: '5 Risk Management Rules Every Forex Trader Must Follow',
    excerpt: 'Protect your capital with these essential risk management strategies. Learn position sizing, stop losses, and the 2% rule for long-term trading success.',
    image: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=800&q=80',
    category: 'Risk Management',
    readTime: '7 min read',
    date: 'January 18, 2026',
    featured: true,
    color: '#EF4444',
    gradient: 'linear-gradient(135deg, rgba(239,68,68,0.85) 0%, rgba(220,38,38,0.9) 100%)',
  },
];

export default function BlogPage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #111111 100%)',
        py: 8,
      }}
    >
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Chip
            icon={<TrendingUp size={16} />}
            label="AlgoEdge Blog"
            sx={{
              mb: 2,
              bgcolor: 'rgba(0, 200, 83, 0.1)',
              color: '#00c853',
              border: '1px solid rgba(0, 200, 83, 0.3)',
            }}
          />
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              mb: 2,
              background: 'linear-gradient(135deg, #fff 0%, #00c853 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Trading Insights & Guides
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{ maxWidth: 600, mx: 'auto' }}
          >
            Learn proven trading strategies, MT5 automation tips, and how to maximize 
            profits with AI-powered forex bots.
          </Typography>
        </Box>

        {/* Blog Grid */}
        <Grid container spacing={4}>
          {blogPosts.map((post) => (
            <Grid item xs={12} md={4} key={post.slug}>
              <Link href={`/blog/${post.slug}`} style={{ textDecoration: 'none' }}>
              <Card
                sx={{
                  height: '100%',
                  bgcolor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 3,
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    borderColor: 'rgba(0, 200, 83, 0.3)',
                    boxShadow: '0 20px 40px rgba(0, 200, 83, 0.15)',
                    '& img': {
                      transform: 'scale(1.1)',
                    },
                  },
                }}
              >
              <CardMedia
                  component="div"
                  sx={{
                    height: 220,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: post.gradient,
                      zIndex: 1,
                      opacity: 0.6,
                      transition: 'opacity 0.3s ease',
                    },
                    '&:hover::before': {
                      opacity: 0.4,
                    },
                  }}
                >
                  <Box
                    component="img"
                    src={post.image}
                    alt={post.title}
                    sx={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.5s ease',
                    }}
                  />
                  <Box
                    sx={{
                      position: 'absolute',
                      bottom: 16,
                      left: 16,
                      zIndex: 2,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(10px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(255,255,255,0.3)',
                      }}
                    >
                      <TrendingUp size={20} color="white" />
                    </Box>
                  </Box>
                </CardMedia>
                <CardContent sx={{ p: 3 }}>
                  <Chip
                    label={post.category}
                    size="small"
                    sx={{
                      mb: 2,
                      bgcolor: 'rgba(0, 200, 83, 0.1)',
                      color: '#00c853',
                      fontSize: '0.75rem',
                    }}
                  />
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      mb: 1.5,
                      color: 'white',
                      lineHeight: 1.3,
                    }}
                  >
                    {post.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2, lineHeight: 1.6 }}
                  >
                    {post.excerpt}
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={2}
                    sx={{ mb: 2, color: 'text.secondary' }}
                  >
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Calendar size={14} />
                      <Typography variant="caption">{post.date}</Typography>
                    </Stack>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Clock size={14} />
                      <Typography variant="caption">{post.readTime}</Typography>
                    </Stack>
                  </Stack>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      color: '#00c853',
                      fontWeight: 600,
                      fontSize: '0.875rem',
                      '&:hover': {
                        color: '#00e676',
                      },
                    }}
                  >
                    Read Full Article
                    <ArrowRight size={16} />
                  </Box>
                </CardContent>
              </Card>
              </Link>
            </Grid>
          ))}
        </Grid>

        {/* CTA Section */}
        <Box
          sx={{
            mt: 8,
            p: 6,
            borderRadius: 4,
            background: 'linear-gradient(135deg, rgba(0, 200, 83, 0.1) 0%, rgba(0, 150, 36, 0.1) 100%)',
            border: '1px solid rgba(0, 200, 83, 0.2)',
            textAlign: 'center',
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: 'white' }}>
            Ready to Start Automated Trading?
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
            Join 10,000+ traders using AlgoEdge AI-powered bots. Get started with 
            a 94%+ win rate trading system today.
          </Typography>
          <Button
            component={Link}
            href="/auth/register"
            variant="contained"
            size="large"
            sx={{
              bgcolor: '#00c853',
              color: 'black',
              fontWeight: 700,
              px: 4,
              py: 1.5,
              borderRadius: 50,
              '&:hover': {
                bgcolor: '#00e676',
              },
            }}
          >
            Start Trading Now →
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
