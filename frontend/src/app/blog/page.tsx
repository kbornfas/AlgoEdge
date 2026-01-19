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
    image: '/images/gold-trading.jpg',
    category: 'Trading Strategies',
    readTime: '8 min read',
    date: 'January 15, 2026',
    featured: true,
  },
  {
    slug: 'how-to-automate-mt5-trading',
    title: 'How to Automate MT5 Trading: Step-by-Step Guide for 2026',
    excerpt: 'Complete guide to automating your MetaTrader 5 trading. Connect your MT5 account to AI-powered trading bots and start earning passive income.',
    image: '/images/mt5-automation.jpg',
    category: 'MT5 Guides',
    readTime: '10 min read',
    date: 'January 12, 2026',
    featured: true,
  },
  {
    slug: 'best-forex-bots-for-beginners',
    title: 'Best Forex Bots for Beginners 2026: Top 5 Automated Trading Systems',
    excerpt: 'New to forex trading? Discover the best forex trading bots for beginners. Our comprehensive review covers features, costs, and expected returns.',
    image: '/images/forex-bots.jpg',
    category: 'Reviews',
    readTime: '12 min read',
    date: 'January 10, 2026',
    featured: true,
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
              <Card
                sx={{
                  height: '100%',
                  bgcolor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 3,
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    borderColor: 'rgba(0, 200, 83, 0.3)',
                    boxShadow: '0 20px 40px rgba(0, 200, 83, 0.1)',
                  },
                }}
              >
                <CardMedia
                  component="div"
                  sx={{
                    height: 200,
                    background: post.slug.includes('xauusd')
                      ? 'linear-gradient(135deg, #FFD700 0%, #B8860B 100%)'
                      : post.slug.includes('mt5')
                      ? 'linear-gradient(135deg, #2196F3 0%, #1565C0 100%)'
                      : 'linear-gradient(135deg, #00c853 0%, #009624 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Typography variant="h3" sx={{ opacity: 0.3, fontWeight: 800 }}>
                    {post.slug.includes('xauusd') ? '🪙' : post.slug.includes('mt5') ? '📊' : '🤖'}
                  </Typography>
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
                  <Button
                    component={Link}
                    href={`/blog/${post.slug}`}
                    endIcon={<ArrowRight size={16} />}
                    sx={{
                      color: '#00c853',
                      textTransform: 'none',
                      fontWeight: 600,
                      p: 0,
                      '&:hover': {
                        bgcolor: 'transparent',
                        color: '#00e676',
                      },
                    }}
                  >
                    Read Full Article
                  </Button>
                </CardContent>
              </Card>
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
