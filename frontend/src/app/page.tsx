'use client';

import { Box, Container, Typography, Button, Grid, Card, CardContent, Stack } from '@mui/material';
import { TrendingUp, Shield, Zap, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import CTACard from '@/components/CTACard';

/**
 * Trading Background Video Component
 * 
 * Video Sources (Public Domain):
 * - Pexels: https://www.pexels.com/video/candlestick-chart-on-a-screen-3130284/
 * - Recommended 1080p: https://videos.pexels.com/video-files/3130284/3130284-hd_1920_1080_25fps.mp4
 * - Alternative UHD 2K: https://videos.pexels.com/video-files/3130284/3130284-uhd_2560_1440_25fps.mp4
 * 
 * To replace the video:
 * 1. Download a new trading video from Pexels, Pixabay, or Coverr
 * 2. Save as /public/video/trading-bg.mp4, OR
 * 3. Update the VIDEO_URL constant below with a new public video URL
 * 
 * Performance Note: Use 1080p videos for optimal loading. UHD versions may be too large.
 */
const VIDEO_URL = 'https://videos.pexels.com/video-files/3130284/3130284-hd_1920_1080_25fps.mp4';

const VideoBackground = () => (
  <Box
    sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: -2,
      overflow: 'hidden',
      bgcolor: '#0F172A', // Fallback background color
    }}
  >
    <video
      autoPlay
      loop
      muted
      playsInline
      preload="metadata"
      onError={(e) => {
        // Gracefully handle video loading errors by hiding the video element
        const target = e.target as HTMLVideoElement;
        if (target) {
          target.style.display = 'none';
        }
      }}
      style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        minWidth: '100%',
        minHeight: '100%',
        width: 'auto',
        height: 'auto',
        transform: 'translate(-50%, -50%)',
        objectFit: 'cover',
      }}
    >
      <source src={VIDEO_URL} type="video/mp4" />
      {/* Fallback: If video doesn't load, the dark background color will show */}
      Your browser does not support the video tag. The page will display with a static background.
    </video>
    {/* Dark overlay for text readability */}
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        bgcolor: 'rgba(0, 0, 0, 0.75)',
        zIndex: -1,
      }}
    />
  </Box>
);

// WhatsApp icon component (official logo with white color)
const WhatsAppIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

// Instagram icon component (official logo with white color)
const InstagramIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
    <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z"/>
  </svg>
);

export default function Home() {
  const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_URL || 'https://wa.me/';
  const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL || 'https://www.instagram.com/__.kip.chirchir._?igsh=MTc4MWI0MWU3YmNnaQ%3D%3D&utm_source=qr';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', position: 'relative' }}>
      {/* Video Background - Only on Landing Page */}
      <VideoBackground />
      
      {/* Hero Section */}
      <Container maxWidth="lg">
        <Box sx={{ py: 10, textAlign: 'center' }}>
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.5rem', md: '3.5rem' },
              fontWeight: 700,
              mb: 3,
              background: 'linear-gradient(135deg, #00ff00 0%, #10b981 50%, #22c55e 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 40px rgba(0, 255, 0, 0.3)',
            }}
          >
            AlgoEdge Trading Platform
          </Typography>
          <Typography
            variant="h5"
            color="text.primary"
            sx={{ 
              mb: 5, 
              maxWidth: '800px', 
              mx: 'auto',
              textShadow: '0 2px 10px rgba(0, 0, 0, 0.8)',
              fontWeight: 400,
            }}
          >
            Automated Forex Trading with MetaTrader 5 Integration. Start your journey to algorithmic trading success.
          </Typography>
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Link
              href="https://t.me/+newQkIa06W1kNmMx"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <Typography
                sx={{
                  fontSize: '1.25rem',
                  fontWeight: 600,
                  color: '#10b981',
                  textShadow: '0 2px 8px rgba(16, 185, 129, 0.5)',
                  '&:hover': {
                    color: '#22c55e',
                    textDecoration: 'underline',
                  },
                  cursor: 'pointer',
                }}
              >
                🎯 Join Telegram channel for free AI signals 🚀
              </Typography>
            </Link>
          </Box>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              component={Link}
              href="/auth/register"
              variant="contained"
              size="large"
              sx={{ 
                minWidth: 200,
                bgcolor: '#10b981',
                color: '#000',
                fontWeight: 700,
                fontSize: '1.1rem',
                '&:hover': {
                  bgcolor: '#059669',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Get Started
            </Button>
            <Button
              component={Link}
              href="/auth/login"
              variant="outlined"
              size="large"
              sx={{ 
                minWidth: 200,
                borderColor: '#10b981',
                color: '#10b981',
                fontWeight: 600,
                fontSize: '1.1rem',
                '&:hover': {
                  borderColor: '#059669',
                  bgcolor: 'rgba(16, 185, 129, 0.1)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease',
              }}
            >
              Login
            </Button>
          </Stack>
        </Box>

        {/* Demo Video Section */}
        <Box sx={{ py: 6 }}>
          <Typography
            variant="h4"
            align="center"
            sx={{
              fontWeight: 700,
              mb: 4,
              color: '#10b981',
              textShadow: '0 2px 10px rgba(16, 185, 129, 0.3)',
            }}
          >
            See AlgoEdge in Action
          </Typography>
          <Box
            sx={{
              maxWidth: '900px',
              mx: 'auto',
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              border: '2px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            <video
              controls
              autoPlay
              muted
              loop
              playsInline
              style={{
                width: '100%',
                height: 'auto',
                display: 'block',
              }}
            >
              <source src="/video/demo.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </Box>
          <Typography
            variant="body1"
            align="center"
            sx={{
              mt: 3,
              color: 'text.secondary',
              fontStyle: 'italic',
            }}
          >
            Watch how our AI-powered robots analyze markets and execute trades automatically
          </Typography>
        </Box>

        {/* Connect with Us CTA Section */}
        <Box sx={{ py: 6 }}>
          <Typography
            variant="h4"
            align="center"
            sx={{
              fontWeight: 700,
              mb: 4,
              color: '#10b981',
              textShadow: '0 2px 10px rgba(16, 185, 129, 0.3)',
            }}
          >
            Connect with Us
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <CTACard
                title="Get started now."
                description="Don't wait, start trading smarter today! Let us help you set up your trading bot instantly."
                buttonText="Buy & Start Trading Now"
                buttonIcon={<WhatsAppIcon />}
                buttonHref={whatsappUrl}
                buttonColor="#25D366"
                buttonHoverColor="#1da851"
                iconColor="#25D366"
                ariaLabel="Contact us on WhatsApp to buy and start trading"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <CTACard
                title="Follow Us on Instagram"
                description="Follow us on Instagram for updates, tips, and trading insights"
                buttonText="Follow IG"
                buttonIcon={<InstagramIcon />}
                buttonHref={instagramUrl}
                buttonColor="#E1306C"
                buttonHoverColor="#C13584"
                iconColor="#E1306C"
                ariaLabel="Follow us on Instagram"
              />
            </Grid>
          </Grid>
        </Box>

        {/* Features Section */}
        <Box sx={{ py: 8 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  height: '100%', 
                  textAlign: 'center', 
                  p: 2,
                  bgcolor: 'rgba(30, 41, 59, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    borderColor: '#10b981',
                    boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)',
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ color: '#10b981', mb: 2, display: 'flex', justifyContent: 'center' }}>
                    <TrendingUp size={48} />
                  </Box>
                  <Typography variant="h6" gutterBottom sx={{ color: '#10b981', fontWeight: 700 }}>
                    7 Trading Robots
                  </Typography>
                  <Typography variant="body2" color="text.primary">
                    Pre-built strategies for trend, scalping, breakout, and more
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  height: '100%', 
                  textAlign: 'center', 
                  p: 2,
                  bgcolor: 'rgba(30, 41, 59, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    borderColor: '#10b981',
                    boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)',
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ color: '#10b981', mb: 2, display: 'flex', justifyContent: 'center' }}>
                    <Shield size={48} />
                  </Box>
                  <Typography variant="h6" gutterBottom sx={{ color: '#10b981', fontWeight: 700 }}>
                    Enterprise Security
                  </Typography>
                  <Typography variant="body2" color="text.primary">
                    2FA authentication, encrypted connections, and audit logs
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  height: '100%', 
                  textAlign: 'center', 
                  p: 2,
                  bgcolor: 'rgba(30, 41, 59, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    borderColor: '#10b981',
                    boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)',
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ color: '#10b981', mb: 2, display: 'flex', justifyContent: 'center' }}>
                    <Zap size={48} />
                  </Box>
                  <Typography variant="h6" gutterBottom sx={{ color: '#10b981', fontWeight: 700 }}>
                    Real-Time Trading
                  </Typography>
                  <Typography variant="body2" color="text.primary">
                    Live P&L tracking with WebSocket updates
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Card 
                sx={{ 
                  height: '100%', 
                  textAlign: 'center', 
                  p: 2,
                  bgcolor: 'rgba(30, 41, 59, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    borderColor: '#10b981',
                    boxShadow: '0 8px 32px rgba(16, 185, 129, 0.3)',
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ color: '#10b981', mb: 2, display: 'flex', justifyContent: 'center' }}>
                    <BarChart3 size={48} />
                  </Box>
                  <Typography variant="h6" gutterBottom sx={{ color: '#10b981', fontWeight: 700 }}>
                    Advanced Analytics
                  </Typography>
                  <Typography variant="body2" color="text.primary">
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
