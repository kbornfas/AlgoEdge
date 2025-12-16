'use client';

import { Box, Container, Typography, Button, Grid, Card, CardContent, Stack } from '@mui/material';
import { TrendingUp, Shield, Zap, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
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

        {/* Pricing Section */}
        <Box sx={{ py: 8, textAlign: 'center' }}>
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 600 }}>
            Choose Your Plan
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 5 }}>
            Start with our free plan or upgrade for more features
          </Typography>
          <Grid container spacing={4} justifyContent="center">
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ p: 3, border: '2px solid transparent' }}>
                <Typography variant="h5" gutterBottom>
                  Free
                </Typography>
                <Typography variant="h3" sx={{ my: 2 }}>
                  $0<Typography component="span" variant="body1">/mo</Typography>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  • 1 MT5 Account<br />
                  • All 7 Trading Robots<br />
                  • Email Alerts<br />
                  • Basic Analytics
                </Typography>
                <Button variant="outlined" fullWidth component={Link} href="/auth/register">
                  Get Started
                </Button>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ p: 3, border: '2px solid', borderColor: 'primary.main' }}>
                <Typography variant="h5" gutterBottom color="primary">
                  Pro
                </Typography>
                <Typography variant="h3" sx={{ my: 2 }}>
                  $49<Typography component="span" variant="body1">/mo</Typography>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  • 3 MT5 Accounts<br />
                  • All Features<br />
                  • Priority Support<br />
                  • Advanced Analytics
                </Typography>
                <Button variant="contained" fullWidth component={Link} href="/auth/register">
                  Start Pro Trial
                </Button>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={4}>
              <Card sx={{ p: 3, border: '2px solid transparent' }}>
                <Typography variant="h5" gutterBottom>
                  Enterprise
                </Typography>
                <Typography variant="h3" sx={{ my: 2 }}>
                  $199<Typography component="span" variant="body1">/mo</Typography>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  • Unlimited Accounts<br />
                  • API Access<br />
                  • Dedicated Support<br />
                  • Custom Features
                </Typography>
                <Button variant="outlined" fullWidth component={Link} href="/auth/register">
                  Contact Sales
                </Button>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}
