'use client';

import { Box, Container, Typography, Button, Grid, Card, CardContent, Stack, Fab } from '@mui/material';
import { TrendingUp, Shield, Zap, BarChart3, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

// Instagram icon component
const InstagramIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

export default function Home() {
  const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_URL || 'https://wa.me/';
  const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL || 'https://instagram.com/';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Floating Action Buttons */}
      <Fab
        color="success"
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 24,
          zIndex: 1000,
          bgcolor: '#25D366',
          '&:hover': { bgcolor: '#1da851' },
        }}
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        <MessageCircle size={24} />
      </Fab>
      
      <Fab
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 24,
          zIndex: 1000,
          bgcolor: '#E1306C',
          color: 'white',
          '&:hover': { bgcolor: '#C13584' },
        }}
        href={instagramUrl}
        target="_blank"
        rel="noopener noreferrer"
      >
        <InstagramIcon />
      </Fab>

      {/* Hero Section */}
      <Container maxWidth="lg">
        <Box sx={{ py: 10, textAlign: 'center' }}>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              fontWeight: 700,
              mb: 3,
              background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            AlgoEdge Trading Platform
          </Typography>
          <Typography
            variant="h5"
            color="text.secondary"
            sx={{ mb: 5, maxWidth: '800px', mx: 'auto' }}
          >
            Automated Forex Trading with MetaTrader 5 Integration. Start your journey to algorithmic trading success.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              component={Link}
              href="/auth/register"
              variant="contained"
              size="large"
              sx={{ minWidth: 200 }}
            >
              Get Started
            </Button>
            <Button
              component={Link}
              href="/auth/login"
              variant="outlined"
              size="large"
              sx={{ minWidth: 200 }}
            >
              Login
            </Button>
          </Stack>
        </Box>

        {/* Features Section */}
        <Box sx={{ py: 8 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                <CardContent>
                  <Box sx={{ color: 'primary.main', mb: 2, display: 'flex', justifyContent: 'center' }}>
                    <TrendingUp size={48} />
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    7 Trading Robots
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pre-built strategies for trend, scalping, breakout, and more
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                <CardContent>
                  <Box sx={{ color: 'primary.main', mb: 2, display: 'flex', justifyContent: 'center' }}>
                    <Shield size={48} />
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    Enterprise Security
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    2FA authentication, encrypted connections, and audit logs
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                <CardContent>
                  <Box sx={{ color: 'primary.main', mb: 2, display: 'flex', justifyContent: 'center' }}>
                    <Zap size={48} />
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    Real-Time Trading
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Live P&L tracking with WebSocket updates
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card sx={{ height: '100%', textAlign: 'center', p: 2 }}>
                <CardContent>
                  <Box sx={{ color: 'primary.main', mb: 2, display: 'flex', justifyContent: 'center' }}>
                    <BarChart3 size={48} />
                  </Box>
                  <Typography variant="h6" gutterBottom>
                    Advanced Analytics
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Win rate, profit factors, and detailed statistics
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>


      </Container>
    </Box>
  );
}
