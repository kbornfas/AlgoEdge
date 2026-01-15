'use client';

import { Box, Container, Typography, Button, Grid, Card, CardContent, Stack, Fab } from '@mui/material';
import { TrendingUp, Shield, Zap, BarChart3, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import CTACard from '@/components/CTACard';
import { useState, useEffect } from 'react';

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

// Sticky WhatsApp Button Component
const StickyWhatsAppButton = ({ whatsappUrl }: { whatsappUrl: string }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  return (
    <Fab
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Message on WhatsApp"
      sx={{
        position: 'fixed',
        bottom: { xs: 16, md: 24 },
        right: { xs: 16, md: 24 },
        bgcolor: '#25D366',
        color: 'white',
        width: { xs: 56, md: 64 },
        height: { xs: 56, md: 64 },
        zIndex: 1000,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1)' : 'scale(0)',
        transition: 'all 0.3s ease',
        '&:hover': {
          bgcolor: '#1da851',
          transform: 'scale(1.1)',
          boxShadow: '0 8px 24px rgba(37, 211, 102, 0.5)',
        },
        boxShadow: '0 4px 12px rgba(37, 211, 102, 0.4)',
      }}
    >
      <WhatsAppIcon />
    </Fab>
  );
};

export default function Home() {
  const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_URL || 'https://wa.me/';
  const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL || 'https://www.instagram.com/__.kip.chirchir._?igsh=MTc4MWI0MWU3YmNnaQ%3D%3D&utm_source=qr';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', position: 'relative' }}>
      {/* Video Background - Only on Landing Page */}
      <VideoBackground />
      
      {/* Sticky WhatsApp Button */}
      <StickyWhatsAppButton whatsappUrl={whatsappUrl} />
      
      {/* Hero Section - Above the Fold */}
      <Container maxWidth="lg">
        <Box sx={{ py: { xs: 6, md: 10 }, textAlign: 'center' }}>
          {/* Main Headline with Clear Offer */}
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2rem', sm: '2.5rem', md: '3.5rem' },
              fontWeight: 800,
              mb: 2,
              background: 'linear-gradient(135deg, #00ff00 0%, #10b981 50%, #22c55e 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 40px rgba(0, 255, 0, 0.3)',
              lineHeight: 1.2,
            }}
          >
            Early Access to AlgoEdge Automated Trading
          </Typography>
          
          {/* Price Offer */}
          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                fontSize: { xs: '2.5rem', md: '3.5rem' },
                fontWeight: 900,
                color: '#10b981',
                textShadow: '0 4px 20px rgba(16, 185, 129, 0.5)',
                display: 'inline-block',
              }}
            >
              $200 Only
            </Typography>
            <Typography
              component="span"
              sx={{
                fontSize: { xs: '1.2rem', md: '1.5rem' },
                color: 'text.secondary',
                ml: 2,
                textDecoration: 'line-through',
              }}
            >
              Normally $1000
            </Typography>
          </Box>

          {/* 7-Day Money-Back Guarantee Badge */}
          <Box
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1,
              bgcolor: 'rgba(16, 185, 129, 0.2)',
              border: '2px solid #10b981',
              borderRadius: 3,
              px: 3,
              py: 1.5,
              mb: 4,
            }}
          >
            <Shield size={24} color="#10b981" />
            <Typography
              sx={{
                fontSize: { xs: '1rem', md: '1.2rem' },
                fontWeight: 700,
                color: '#10b981',
              }}
            >
              7-Day Money-Back Guarantee
            </Typography>
          </Box>

          {/* Primary WhatsApp CTA */}
          <Button
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="contained"
            size="large"
            sx={{
              minWidth: { xs: '100%', sm: 320 },
              bgcolor: '#25D366',
              color: 'white',
              fontWeight: 700,
              fontSize: { xs: '1rem', md: '1.2rem' },
              py: 2,
              px: 4,
              mb: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              justifyContent: 'center',
              '&:hover': {
                bgcolor: '#1da851',
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 32px rgba(37, 211, 102, 0.5)',
              },
              transition: 'all 0.3s ease',
              textTransform: 'none',
              boxShadow: '0 8px 24px rgba(37, 211, 102, 0.4)',
            }}
          >
            <WhatsAppIcon />
            Message on WhatsApp to Secure Your Spot — Only 20 Available
          </Button>

          {/* 3-Point Proof Snapshot */}
          <Grid container spacing={2} sx={{ mb: 4, maxWidth: '900px', mx: 'auto' }}>
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  bgcolor: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: 2,
                  py: 2,
                  px: 2,
                }}
              >
                <CheckCircle2 size={24} color="#10b981" />
                <Typography
                  sx={{
                    fontSize: { xs: '0.9rem', md: '1rem' },
                    fontWeight: 600,
                    color: 'text.primary',
                  }}
                >
                  Fully Automated MT5 Trading
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  bgcolor: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: 2,
                  py: 2,
                  px: 2,
                }}
              >
                <CheckCircle2 size={24} color="#10b981" />
                <Typography
                  sx={{
                    fontSize: { xs: '0.9rem', md: '1rem' },
                    fontWeight: 600,
                    color: 'text.primary',
                  }}
                >
                  Real Results & Profits
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} md={4}>
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                  bgcolor: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: 2,
                  py: 2,
                  px: 2,
                }}
              >
                <CheckCircle2 size={24} color="#10b981" />
                <Typography
                  sx={{
                    fontSize: { xs: '0.9rem', md: '1rem' },
                    fontWeight: 600,
                    color: 'text.primary',
                  }}
                >
                  Money-Back Guarantee
                </Typography>
              </Box>
            </Grid>
          </Grid>

          {/* Benefit Bullets */}
          <Box sx={{ maxWidth: '700px', mx: 'auto', textAlign: 'left' }}>
            <Typography
              sx={{
                fontSize: { xs: '1.1rem', md: '1.3rem' },
                fontWeight: 600,
                color: 'text.primary',
                mb: 2,
                textAlign: 'center',
              }}
            >
              What You Get:
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <Zap size={20} color="#10b981" style={{ marginTop: 2, flexShrink: 0 }} />
                  <Typography sx={{ color: 'text.primary', fontSize: { xs: '0.95rem', md: '1.05rem' } }}>
                    <strong>Instant Setup</strong> – We install and configure everything for you
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <Zap size={20} color="#10b981" style={{ marginTop: 2, flexShrink: 0 }} />
                  <Typography sx={{ color: 'text.primary', fontSize: { xs: '0.95rem', md: '1.05rem' } }}>
                    <strong>All 7 Strategies</strong> – Trend, scalping, breakout & more
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <Zap size={20} color="#10b981" style={{ marginTop: 2, flexShrink: 0 }} />
                  <Typography sx={{ color: 'text.primary', fontSize: { xs: '0.95rem', md: '1.05rem' } }}>
                    <strong>No Manual Trading</strong> – Algorithm handles everything 24/7
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                  <Zap size={20} color="#10b981" style={{ marginTop: 2, flexShrink: 0 }} />
                  <Typography sx={{ color: 'text.primary', fontSize: { xs: '0.95rem', md: '1.05rem' } }}>
                    <strong>Works with MT5</strong> – Seamless MetaTrader 5 integration
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Telegram Link */}
          <Box sx={{ mt: 4, textAlign: 'center' }}>
            <Link
              href="https://t.me/+newQkIa06W1kNmMx"
              target="_blank"
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <Typography
                sx={{
                  fontSize: '1.1rem',
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
                🎯 Join our Telegram channel for free AI signals 🚀
              </Typography>
            </Link>
          </Box>
        </Box>

        {/* Proof and Trust Section */}
        <Box sx={{ py: 6 }}>
          <Typography
            variant="h3"
            align="center"
            sx={{
              fontWeight: 700,
              mb: 2,
              fontSize: { xs: '2rem', md: '2.5rem' },
              color: '#10b981',
              textShadow: '0 2px 10px rgba(16, 185, 129, 0.3)',
            }}
          >
            See Real Results
          </Typography>
          <Typography
            align="center"
            sx={{
              mb: 4,
              fontSize: { xs: '1rem', md: '1.1rem' },
              color: 'text.secondary',
              maxWidth: '700px',
              mx: 'auto',
            }}
          >
            Watch our platform in action and see actual trading results from AlgoEdge
          </Typography>

          {/* Demo Video */}
          <Box
            sx={{
              maxWidth: '900px',
              mx: 'auto',
              borderRadius: 3,
              overflow: 'hidden',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
              border: '2px solid rgba(16, 185, 129, 0.3)',
              mb: 6,
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

          {/* Trading Results Images */}
          <Grid container spacing={4} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  borderRadius: 3,
                  overflow: 'hidden',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
                  border: '2px solid rgba(16, 185, 129, 0.3)',
                  bgcolor: '#1E293B',
                }}
              >
                <Image
                  src="/images/trading-profits.svg"
                  alt="Recent trading profits with AlgoEdge (MT5)"
                  width={800}
                  height={600}
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                  }}
                />
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography
                    sx={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: '#10b981',
                    }}
                  >
                    Recent Trading Profits with AlgoEdge (MT5)
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Box
                sx={{
                  borderRadius: 3,
                  overflow: 'hidden',
                  boxShadow: '0 10px 40px rgba(0, 0, 0, 0.4)',
                  border: '2px solid rgba(16, 185, 129, 0.3)',
                  bgcolor: '#1E293B',
                }}
              >
                <Image
                  src="/images/algorithm-activity.svg"
                  alt="Live trades and algorithm activity"
                  width={800}
                  height={600}
                  style={{
                    width: '100%',
                    height: 'auto',
                    display: 'block',
                  }}
                />
                <Box sx={{ p: 2, textAlign: 'center' }}>
                  <Typography
                    sx={{
                      fontSize: '1rem',
                      fontWeight: 600,
                      color: '#10b981',
                    }}
                  >
                    Live Trades and Algorithm Activity
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* How It Works Section */}
        <Box sx={{ py: 6 }}>
          <Typography
            variant="h3"
            align="center"
            sx={{
              fontWeight: 700,
              mb: 2,
              fontSize: { xs: '2rem', md: '2.5rem' },
              color: '#10b981',
              textShadow: '0 2px 10px rgba(16, 185, 129, 0.3)',
            }}
          >
            How It Works
          </Typography>
          <Typography
            align="center"
            sx={{
              mb: 5,
              fontSize: { xs: '1rem', md: '1.1rem' },
              color: 'text.secondary',
              maxWidth: '700px',
              mx: 'auto',
            }}
          >
            Get started in 3 simple steps
          </Typography>

          <Grid container spacing={4} sx={{ maxWidth: '1000px', mx: 'auto' }}>
            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  height: '100%',
                  textAlign: 'center',
                  p: 3,
                  bgcolor: 'rgba(30, 41, 59, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 3,
                }}
              >
                <CardContent>
                  <Typography
                    sx={{
                      fontSize: '3rem',
                      fontWeight: 900,
                      color: '#10b981',
                      mb: 2,
                    }}
                  >
                    1
                  </Typography>
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ color: '#10b981', fontWeight: 700, mb: 2 }}
                  >
                    We Install & Set Up
                  </Typography>
                  <Typography variant="body1" color="text.primary">
                    Our team installs the bot and configures all 7 trading strategies on your MT5 account. Zero technical work required from you.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  height: '100%',
                  textAlign: 'center',
                  p: 3,
                  bgcolor: 'rgba(30, 41, 59, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 3,
                }}
              >
                <CardContent>
                  <Typography
                    sx={{
                      fontSize: '3rem',
                      fontWeight: 900,
                      color: '#10b981',
                      mb: 2,
                    }}
                  >
                    2
                  </Typography>
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ color: '#10b981', fontWeight: 700, mb: 2 }}
                  >
                    Algorithm Trades
                  </Typography>
                  <Typography variant="body1" color="text.primary">
                    The AI-powered algorithm analyzes markets 24/7 and executes trades automatically based on proven strategies.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  height: '100%',
                  textAlign: 'center',
                  p: 3,
                  bgcolor: 'rgba(30, 41, 59, 0.8)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 3,
                }}
              >
                <CardContent>
                  <Typography
                    sx={{
                      fontSize: '3rem',
                      fontWeight: 900,
                      color: '#10b981',
                      mb: 2,
                    }}
                  >
                    3
                  </Typography>
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ color: '#10b981', fontWeight: 700, mb: 2 }}
                  >
                    Watch Growth
                  </Typography>
                  <Typography variant="body1" color="text.primary">
                    Monitor your performance through real-time dashboards. Track profits, analyze statistics, and watch your account grow.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Trust and Guarantee Section */}
        <Box sx={{ py: 6 }}>
          <Card
            sx={{
              maxWidth: '800px',
              mx: 'auto',
              p: 4,
              bgcolor: 'rgba(16, 185, 129, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '3px solid #10b981',
              borderRadius: 4,
              textAlign: 'center',
            }}
          >
            <Shield size={64} color="#10b981" style={{ marginBottom: 16 }} />
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                mb: 2,
                color: '#10b981',
                fontSize: { xs: '1.75rem', md: '2.125rem' },
              }}
            >
              100% Risk-Free 7-Day Money-Back Guarantee
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '1rem', md: '1.1rem' },
                color: 'text.primary',
                mb: 3,
                lineHeight: 1.7,
              }}
            >
              Try AlgoEdge completely risk-free. If you're not satisfied with the platform or results within 7 days, we'll refund your money—no questions asked. We're confident in our system and stand behind it 100%.
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '0.95rem', md: '1rem' },
                color: 'text.secondary',
                fontStyle: 'italic',
              }}
            >
              Your success is our priority. We want you to trade with confidence.
            </Typography>
          </Card>
        </Box>

        {/* Final CTA Section */}
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 3,
              color: '#10b981',
              fontSize: { xs: '1.75rem', md: '2.125rem' },
            }}
          >
            Ready to Start Automated Trading?
          </Typography>
          <Typography
            sx={{
              mb: 4,
              fontSize: { xs: '1rem', md: '1.1rem' },
              color: 'text.secondary',
              maxWidth: '600px',
              mx: 'auto',
            }}
          >
            Join the 20 early access spots available. Message us on WhatsApp now to secure your bot and start trading.
          </Typography>
          
          <Button
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            variant="contained"
            size="large"
            sx={{
              minWidth: { xs: '100%', sm: 320 },
              bgcolor: '#25D366',
              color: 'white',
              fontWeight: 700,
              fontSize: { xs: '1rem', md: '1.2rem' },
              py: 2,
              px: 4,
              mb: 3,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 1.5,
              justifyContent: 'center',
              '&:hover': {
                bgcolor: '#1da851',
                transform: 'translateY(-4px)',
                boxShadow: '0 12px 32px rgba(37, 211, 102, 0.5)',
              },
              transition: 'all 0.3s ease',
              textTransform: 'none',
              boxShadow: '0 8px 24px rgba(37, 211, 102, 0.4)',
            }}
          >
            <WhatsAppIcon />
            Message on WhatsApp Now
          </Button>

          {/* Instagram CTA */}
          <Box sx={{ mt: 4 }}>
            <Typography
              sx={{
                mb: 2,
                fontSize: '1rem',
                color: 'text.secondary',
              }}
            >
              Follow us for trading tips and updates
            </Typography>
            <Button
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="outlined"
              sx={{
                borderColor: '#E1306C',
                color: '#E1306C',
                fontWeight: 600,
                '&:hover': {
                  borderColor: '#C13584',
                  bgcolor: 'rgba(225, 48, 108, 0.1)',
                },
              }}
            >
              Follow on Instagram
            </Button>
          </Box>
        </Box>

        {/* Features Section - Moved to Bottom */}
        <Box sx={{ py: 8 }}>
          <Typography
            variant="h4"
            align="center"
            sx={{
              fontWeight: 700,
              mb: 5,
              color: '#10b981',
              fontSize: { xs: '1.75rem', md: '2.125rem' },
            }}
          >
            Platform Features
          </Typography>
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
