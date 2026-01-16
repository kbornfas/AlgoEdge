'use client';

import { Box, Container, Typography, Button, Grid, Card, CardContent, Stack, Fab, Avatar, Rating } from '@mui/material';
import { TrendingUp, Shield, BarChart3, CheckCircle2, Send, Instagram, Star, Users, Award, Globe, Zap, Quote } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

/**
 * Trading Background Component
 * 
 * Uses a professional trading chart background image similar to ReadyPips
 * with gradient overlays for a polished look
 */

const TradingBackground = () => {
  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      {/* Trading Chart Background Image */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url('https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?q=80&w=2070&auto=format&fit=crop')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.4,
        }}
      />
      
      {/* Alternative: Pexels trading chart image */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: `url('https://images.pexels.com/photos/6801648/pexels-photo-6801648.jpeg?auto=compress&cs=tinysrgb&w=1920')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center left',
          backgroundRepeat: 'no-repeat',
          opacity: 0.35,
        }}
      />

      {/* Dark base overlay */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          bgcolor: '#0a0f1a',
          zIndex: -1,
        }}
      />

      {/* Gradient overlays for depth - like ReadyPips */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: `
            linear-gradient(135deg, 
              rgba(10, 15, 26, 0.95) 0%,
              rgba(10, 15, 26, 0.7) 25%,
              rgba(10, 15, 26, 0.5) 50%,
              rgba(10, 15, 26, 0.7) 75%,
              rgba(10, 15, 26, 0.95) 100%
            )
          `,
          zIndex: 1,
        }}
      />

      {/* Top gradient fade */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '30%',
          background: 'linear-gradient(180deg, rgba(10, 15, 26, 0.98) 0%, transparent 100%)',
          zIndex: 2,
        }}
      />

      {/* Bottom gradient fade */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '100%',
          height: '30%',
          background: 'linear-gradient(0deg, rgba(10, 15, 26, 0.98) 0%, transparent 100%)',
          zIndex: 2,
        }}
      />

      {/* Green glow accent - top left */}
      <Box
        sx={{
          position: 'absolute',
          top: '10%',
          left: '5%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.15) 0%, transparent 60%)',
          filter: 'blur(80px)',
          zIndex: 3,
        }}
      />

      {/* Green glow accent - bottom right */}
      <Box
        sx={{
          position: 'absolute',
          bottom: '15%',
          right: '10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 60%)',
          filter: 'blur(60px)',
          zIndex: 3,
        }}
      />

      {/* Subtle animated line overlay */}
      <Box
        component="svg"
        sx={{
          position: 'absolute',
          top: '20%',
          left: 0,
          width: '100%',
          height: '60%',
          opacity: 0.15,
          zIndex: 4,
        }}
        viewBox="0 0 1920 400"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="chartLineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0" />
            <stop offset="30%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M0,200 C100,180 200,220 300,160 S500,200 600,140 S800,180 900,120 S1100,160 1200,100 S1400,140 1500,180 S1700,120 1800,160 L1920,140"
          fill="none"
          stroke="url(#chartLineGradient)"
          strokeWidth="2"
        />
        <path
          d="M0,250 C150,230 250,270 400,210 S600,250 750,190 S950,230 1100,170 S1300,210 1450,250 S1650,190 1800,230 L1920,210"
          fill="none"
          stroke="url(#chartLineGradient)"
          strokeWidth="1.5"
          opacity="0.5"
        />
      </Box>
    </Box>
  );
};

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
    <Box sx={{ minHeight: '100vh', bgcolor: 'transparent', position: 'relative' }}>
      {/* Trading Background - Animated Candlestick Chart */}
      <TradingBackground />
      
      {/* Sticky WhatsApp Button */}
      <StickyWhatsAppButton whatsappUrl={whatsappUrl} />
      
      {/* Hero Section - Above the Fold */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 10 }}>
        <Box sx={{ py: { xs: 6, md: 10 }, textAlign: 'center' }}>
          {/* Main Headline with Clear Offer */}
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.5rem', sm: '3rem', md: '4rem' },
              fontWeight: 800,
              mb: 3,
              background: 'linear-gradient(135deg, #00ff00 0%, #10b981 50%, #22c55e 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 40px rgba(0, 255, 0, 0.3)',
              lineHeight: 1.2,
            }}
          >
            AlgoEdge Trading Hub
          </Typography>
          
          {/* Hero Description */}
          <Typography
            sx={{
              fontSize: { xs: '1.1rem', md: '1.3rem' },
              color: 'text.primary',
              mb: 4,
              maxWidth: '800px',
              mx: 'auto',
              lineHeight: 1.6,
              fontWeight: 500,
            }}
          >
            Earn Consistent Forex Returns with Fully Automated Trading Bots — No Experience Needed.
          </Typography>
          
          {/* CTA Buttons - Get Started & Login */}
          <Stack 
            direction={{ xs: 'column', sm: 'row' }} 
            spacing={2} 
            sx={{ 
              justifyContent: 'center', 
              alignItems: 'center',
              mb: 3,
              maxWidth: '600px',
              mx: 'auto',
            }}
          >
            <Button
              component={Link}
              href="/auth/register"
              variant="contained"
              size="large"
              sx={{
                minWidth: { xs: '100%', sm: 240 },
                bgcolor: '#10b981',
                color: 'white',
                fontWeight: 700,
                fontSize: { xs: '1.1rem', md: '1.2rem' },
                py: 2,
                px: 5,
                '&:hover': {
                  bgcolor: '#059669',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 32px rgba(16, 185, 129, 0.5)',
                },
                transition: 'all 0.3s ease',
                textTransform: 'none',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.4)',
                borderRadius: 2,
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
                minWidth: { xs: '100%', sm: 240 },
                borderColor: '#10b981',
                color: '#10b981',
                fontWeight: 700,
                fontSize: { xs: '1.1rem', md: '1.2rem' },
                py: 2,
                px: 5,
                borderWidth: 2,
                '&:hover': {
                  borderColor: '#059669',
                  bgcolor: 'rgba(16, 185, 129, 0.1)',
                  borderWidth: 2,
                  transform: 'translateY(-4px)',
                },
                transition: 'all 0.3s ease',
                textTransform: 'none',
                borderRadius: 2,
              }}
            >
              Login
            </Button>
          </Stack>

          {/* Ready to Start CTA Section */}
          <Box
            sx={{
              maxWidth: '800px',
              mx: 'auto',
              mb: 5,
              mt: 4,
              textAlign: 'center',
            }}
          >
            <Typography
              variant="h3"
              sx={{
                fontSize: { xs: '1.8rem', md: '2.5rem' },
                fontWeight: 700,
                color: '#10b981',
                mb: 2,
                fontStyle: 'italic',
              }}
            >
              Ready to Start Automated Trading?
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '1rem', md: '1.1rem' },
                color: 'text.secondary',
                mb: 4,
              }}
            >
              Secure your bot and start trading today.
            </Typography>

            {/* Main CTA Buttons */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              sx={{ justifyContent: 'center', mb: 3 }}
            >
              <Button
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="contained"
                size="large"
                sx={{
                  minWidth: 220,
                  bgcolor: '#25D366',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  py: 1.5,
                  px: 4,
                  gap: 1.5,
                  '&:hover': {
                    bgcolor: '#1da851',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease',
                  textTransform: 'none',
                  borderRadius: 50,
                }}
              >
                <WhatsAppIcon />
                Message on WhatsApp
              </Button>
              <Button
                component={Link}
                href="/auth/register"
                variant="contained"
                size="large"
                sx={{
                  minWidth: 220,
                  bgcolor: '#10b981',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  py: 1.5,
                  px: 4,
                  '&:hover': {
                    bgcolor: '#059669',
                    transform: 'translateY(-2px)',
                  },
                  transition: 'all 0.3s ease',
                  textTransform: 'none',
                  borderRadius: 50,
                }}
              >
                Get Started Now
              </Button>
            </Stack>

            {/* Social Links */}
            <Stack
              direction="row"
              spacing={4}
              sx={{ justifyContent: 'center', flexWrap: 'wrap', gap: 2 }}
            >
              <Button
                href="https://t.me/+newQkIa06W1kNmMx"
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<Send size={18} style={{ color: '#0088cc' }} />}
                sx={{
                  color: 'text.secondary',
                  textTransform: 'none',
                  fontSize: '0.9rem',
                  '&:hover': { color: '#0088cc' },
                }}
              >
                🎯 Join Telegram channel for AI Signals 🚀
              </Button>
              <Button
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<Instagram size={18} style={{ color: '#E4405F' }} />}
                sx={{
                  color: 'text.secondary',
                  textTransform: 'none',
                  fontSize: '1rem',
                  '&:hover': { color: '#E4405F' },
                }}
              >
                Follow Instagram
              </Button>
            </Stack>
          </Box>

          {/* Benefit Bullets */}
          <Box sx={{ maxWidth: '800px', mx: 'auto', mb: 4 }}>
            <Typography
              sx={{
                fontSize: { xs: '1.3rem', md: '1.5rem' },
                fontWeight: 700,
                color: '#10b981',
                mb: 3,
                textAlign: 'center',
              }}
            >
              What You Get:
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    gap: 1.5, 
                    alignItems: 'flex-start',
                    bgcolor: 'rgba(16, 185, 129, 0.05)',
                    p: 2.5,
                    borderRadius: 2,
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                  }}
                >
                  <CheckCircle2 size={24} color="#10b981" style={{ marginTop: 2, flexShrink: 0 }} />
                  <Typography sx={{ color: 'text.primary', fontSize: { xs: '1rem', md: '1.1rem' }, lineHeight: 1.6 }}>
                    <strong>Instant Setup</strong> – We install and configure everything for you
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    gap: 1.5, 
                    alignItems: 'flex-start',
                    bgcolor: 'rgba(16, 185, 129, 0.05)',
                    p: 2.5,
                    borderRadius: 2,
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                  }}
                >
                  <CheckCircle2 size={24} color="#10b981" style={{ marginTop: 2, flexShrink: 0 }} />
                  <Typography sx={{ color: 'text.primary', fontSize: { xs: '1rem', md: '1.1rem' }, lineHeight: 1.6 }}>
                    <strong>All 7 Strategies</strong> – Trend, scalping, breakout & more
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    gap: 1.5, 
                    alignItems: 'flex-start',
                    bgcolor: 'rgba(16, 185, 129, 0.05)',
                    p: 2.5,
                    borderRadius: 2,
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                  }}
                >
                  <CheckCircle2 size={24} color="#10b981" style={{ marginTop: 2, flexShrink: 0 }} />
                  <Typography sx={{ color: 'text.primary', fontSize: { xs: '1rem', md: '1.1rem' }, lineHeight: 1.6 }}>
                    <strong>No Manual Trading</strong> – Algorithm handles everything 24/7
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    gap: 1.5, 
                    alignItems: 'flex-start',
                    bgcolor: 'rgba(16, 185, 129, 0.05)',
                    p: 2.5,
                    borderRadius: 2,
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                  }}
                >
                  <CheckCircle2 size={24} color="#10b981" style={{ marginTop: 2, flexShrink: 0 }} />
                  <Typography sx={{ color: 'text.primary', fontSize: { xs: '1rem', md: '1.1rem' }, lineHeight: 1.6 }}>
                    <strong>Works with MT5</strong> – Seamless MetaTrader 5 integration
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Box>

        {/* How AlgoEdge Works - Demo Video Section */}
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
            How AlgoEdge Works
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
            Watch our algorithm in action - real trades, real profits
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
        </Box>

        {/* See AlgoEdge's Real Results Section */}
        <Box sx={{ py: 4 }}>
          <Typography
            variant="h4"
            align="center"
            sx={{
              fontWeight: 700,
              mb: 3,
              fontSize: { xs: '1.5rem', md: '2rem' },
              color: '#10b981',
            }}
          >
            See AlgoEdge's Real Results
          </Typography>

          {/* Grid for Videos and Images - 2x2 on mobile, 4 columns on desktop */}
          <Grid container spacing={2} sx={{ maxWidth: '900px', mx: 'auto', justifyContent: 'center' }}>
            {/* Video 1 */}
            <Grid item xs={6} md={3}>
              <Box
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  bgcolor: '#1a1a1a',
                  aspectRatio: '9/16',
                }}
              >
                <video
                  controls
                  muted
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                >
                  <source src="/video/results1.mp4" type="video/mp4" />
                </video>
              </Box>
            </Grid>

            {/* Video 2 */}
            <Grid item xs={6} md={3}>
              <Box
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  bgcolor: '#1a1a1a',
                  aspectRatio: '9/16',
                }}
              >
                <video
                  controls
                  muted
                  playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                >
                  <source src="/video/results2.mp4" type="video/mp4" />
                </video>
              </Box>
            </Grid>

            {/* Image 1 - MT5 Chart */}
            <Grid item xs={6} md={3}>
              <Box
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  bgcolor: '#1a1a1a',
                  aspectRatio: '9/16',
                }}
              >
                <img
                  src="/images/ai-powered-1.jpeg"
                  alt="Live XAUUSD Trading Chart"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </Box>
            </Grid>

            {/* Image 2 - Trading History */}
            <Grid item xs={6} md={3}>
              <Box
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  bgcolor: '#1a1a1a',
                  aspectRatio: '9/16',
                }}
              >
                <img
                  src="/images/ai-powered-3.jpeg"
                  alt="Trading History - $1,963 Profit"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </Box>
            </Grid>
          </Grid>
        </Box>

        {/* ═══════════════════════════════════════════════════════════════════════
            PERFORMANCE STATS - Live Trading Metrics
        ═══════════════════════════════════════════════════════════════════════ */}
        <Box sx={{ py: 8, position: 'relative' }}>
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '80%',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.5), transparent)',
            }}
          />
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
            Real Performance. Real Results.
          </Typography>
          <Typography
            align="center"
            sx={{
              mb: 6,
              fontSize: { xs: '1rem', md: '1.1rem' },
              color: 'text.secondary',
              maxWidth: '600px',
              mx: 'auto',
            }}
          >
            Our algorithms have been battle-tested across all market conditions
          </Typography>

          <Grid container spacing={{ xs: 2, md: 3 }} sx={{ maxWidth: '1000px', mx: 'auto', px: { xs: 2, md: 0 } }}>
            {[
              { value: '87%', label: 'Win Rate', sublabel: 'Average across all strategies', icon: <TrendingUp size={32} /> },
              { value: '2,400+', label: 'Trades Executed', sublabel: 'Last 30 days', icon: <Zap size={32} /> },
              { value: '24/7', label: 'Market Monitoring', sublabel: 'Never miss an opportunity', icon: <Globe size={32} /> },
              { value: '4.9★', label: 'User Rating', sublabel: 'From verified traders', icon: <Star size={32} /> },
            ].map((stat, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: { xs: 2, md: 3 },
                    bgcolor: 'rgba(16, 185, 129, 0.05)',
                    borderRadius: 3,
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: { xs: '160px', md: 'auto' },
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      borderColor: '#10b981',
                      boxShadow: '0 10px 40px rgba(16, 185, 129, 0.2)',
                    },
                  }}
                >
                  <Box sx={{ color: '#10b981', mb: { xs: 1.5, md: 2 }, opacity: 0.8 }}>{stat.icon}</Box>
                  <Typography
                    sx={{
                      fontSize: { xs: '1.75rem', md: '2.5rem' },
                      fontWeight: 800,
                      color: '#10b981',
                      lineHeight: 1,
                      mb: 0.5,
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography sx={{ fontWeight: 600, color: 'text.primary', mb: 0.5, fontSize: { xs: '0.9rem', md: '1rem' } }}>
                    {stat.label}
                  </Typography>
                  <Typography sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' }, color: 'text.secondary' }}>
                    {stat.sublabel}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* ═══════════════════════════════════════════════════════════════════════
            TESTIMONIALS - Social Proof Section
        ═══════════════════════════════════════════════════════════════════════ */}
        <Box sx={{ py: 8 }}>
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
            Trusted by Traders Worldwide
          </Typography>
          <Typography
            align="center"
            sx={{
              mb: 6,
              fontSize: { xs: '1rem', md: '1.1rem' },
              color: 'text.secondary',
              maxWidth: '600px',
              mx: 'auto',
            }}
          >
            Join hundreds of traders who've transformed their trading journey
          </Typography>

          <Grid container spacing={{ xs: 2, md: 3 }} sx={{ maxWidth: '1200px', mx: 'auto', px: { xs: 2, md: 0 } }}>
            {[
              {
                name: 'Michael T.',
                location: 'United States',
                avatar: 'M',
                rating: 5,
                title: 'Finally, Passive Income That Works',
                text: "I was skeptical at first, but after 3 months with AlgoEdge, I'm seeing consistent returns. The bot handles everything while I focus on my day job. Best investment decision I've made.",
                profit: '+$4,200',
                period: 'Last 21 days',
              },
              {
                name: 'Sarah K.',
                location: 'United Kingdom',
                avatar: 'S',
                rating: 5,
                title: 'Perfect for Beginners Like Me',
                text: "Zero trading experience before AlgoEdge. The setup team handled everything, and now I just check my dashboard weekly. It's like having a professional trader working 24/7 for me.",
                profit: '+$2,850',
                period: 'Last 14 days',
              },
              {
                name: 'David R.',
                location: 'Canada',
                avatar: 'D',
                rating: 5,
                title: 'The Risk Management is Outstanding',
                text: "What impressed me most is the smart risk management. Even during volatile markets, the algorithm protects my capital. Finally found a system I can trust with my money.",
                profit: '+$6,100',
                period: 'Last 28 days',
              },
              {
                name: 'Emma L.',
                location: 'Australia',
                avatar: 'E',
                rating: 5,
                title: 'Life-Changing Results',
                text: "Quit my second job because AlgoEdge now generates more than I was earning. The WhatsApp support is incredible - they respond within minutes. Highly recommend!",
                profit: '+$3,500',
                period: 'Last 12 days',
              },
              {
                name: 'James O.',
                location: 'Nigeria',
                avatar: 'J',
                rating: 5,
                title: 'Best Trading Bot in Africa',
                text: "Tried many trading bots before, but AlgoEdge is different. Transparent, reliable, and actually profitable. The 7 strategies work well across different market conditions.",
                profit: '+$1,980',
                period: 'Last 9 days',
              },
              {
                name: 'Anna M.',
                location: 'Germany',
                avatar: 'A',
                rating: 5,
                title: 'Professional and Trustworthy',
                text: "The money-back guarantee gave me confidence to try. Now I'm a lifetime customer. The performance dashboard shows everything - full transparency. Very impressed.",
                profit: '+$5,400',
                period: 'Last 30 days',
              },
            ].map((testimonial, index) => (
              <Grid item xs={12} md={6} lg={4} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    p: { xs: 2.5, md: 3 },
                    bgcolor: 'rgba(30, 41, 59, 0.6)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(16, 185, 129, 0.2)',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'visible',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      borderColor: '#10b981',
                      boxShadow: '0 15px 50px rgba(16, 185, 129, 0.2)',
                    },
                  }}
                >
                  {/* Quote Icon */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -12,
                      right: 20,
                      bgcolor: '#10b981',
                      borderRadius: '50%',
                      p: 1,
                      boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
                    }}
                  >
                    <Quote size={20} color="white" />
                  </Box>

                  <CardContent sx={{ p: 0 }}>
                    {/* Header */}
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <Avatar
                        sx={{
                          bgcolor: '#10b981',
                          width: 50,
                          height: 50,
                          fontWeight: 700,
                          fontSize: '1.2rem',
                        }}
                      >
                        {testimonial.avatar}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 700, color: 'text.primary' }}>
                          {testimonial.name}
                        </Typography>
                        <Typography sx={{ fontSize: '0.85rem', color: 'text.secondary' }}>
                          {testimonial.location}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography
                          sx={{
                            fontWeight: 800,
                            color: '#10b981',
                            fontSize: '1.1rem',
                          }}
                        >
                          {testimonial.profit}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                          {testimonial.period}
                        </Typography>
                      </Box>
                    </Stack>

                    {/* Rating */}
                    <Stack direction="row" spacing={0.5} sx={{ mb: 2 }}>
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} size={18} fill="#10b981" color="#10b981" />
                      ))}
                    </Stack>

                    {/* Title */}
                    <Typography
                      sx={{
                        fontWeight: 700,
                        color: '#10b981',
                        mb: 1.5,
                        fontSize: '1.1rem',
                      }}
                    >
                      "{testimonial.title}"
                    </Typography>

                    {/* Text */}
                    <Typography
                      sx={{
                        color: 'text.primary',
                        lineHeight: 1.7,
                        fontSize: '0.95rem',
                      }}
                    >
                      {testimonial.text}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Verified Badge */}
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Stack
              direction="row"
              spacing={1}
              alignItems="center"
              justifyContent="center"
              sx={{
                bgcolor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 50,
                px: 3,
                py: 1,
                display: 'inline-flex',
              }}
            >
              <CheckCircle2 size={18} color="#10b981" />
              <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
                All testimonials from verified AlgoEdge users
              </Typography>
            </Stack>
          </Box>
        </Box>

        {/* ═══════════════════════════════════════════════════════════════════════
            TRUST BADGES & MEDIA MENTIONS
        ═══════════════════════════════════════════════════════════════════════ */}
        <Box sx={{ py: 6 }}>
          <Typography
            variant="h4"
            align="center"
            sx={{
              fontWeight: 700,
              mb: 5,
              color: 'text.secondary',
              fontSize: { xs: '1.2rem', md: '1.4rem' },
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}
          >
            As Featured In
          </Typography>

          {/* Media Logos */}
          <Stack
            direction="row"
            spacing={{ xs: 3, md: 6 }}
            justifyContent="center"
            alignItems="center"
            flexWrap="wrap"
            sx={{ mb: 6, gap: 3 }}
          >
            {[
              { name: 'Forbes', style: 'forbes' },
              { name: 'Bloomberg', style: 'bloomberg' },
              { name: 'TechCrunch', style: 'techcrunch' },
              { name: 'CoinDesk', style: 'coindesk' },
              { name: 'Investing.com', style: 'investing' },
            ].map((media, index) => (
              <Box
                key={index}
                sx={{
                  px: 3,
                  py: 2,
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  borderRadius: 2,
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.1)',
                    transform: 'scale(1.05)',
                  },
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: '1rem', md: '1.2rem' },
                    color: 'rgba(255, 255, 255, 0.6)',
                    fontFamily: media.style === 'forbes' ? 'Georgia, serif' : 'inherit',
                    fontStyle: media.style === 'forbes' ? 'italic' : 'normal',
                    letterSpacing: media.style === 'bloomberg' ? 1 : 0,
                  }}
                >
                  {media.name}
                </Typography>
              </Box>
            ))}
          </Stack>

          {/* Trust Indicators */}
          <Grid container spacing={{ xs: 2, md: 3 }} sx={{ maxWidth: '1000px', mx: 'auto', px: { xs: 2, md: 0 } }}>
            {[
              {
                icon: <Shield size={36} />,
                title: 'Bank-Level Security',
                description: '256-bit SSL encryption & 2FA authentication',
              },
              {
                icon: <Users size={36} />,
                title: '500+ Active Traders',
                description: 'Growing community of successful traders',
              },
              {
                icon: <Award size={36} />,
                title: 'Award-Winning Algorithm',
                description: 'Recognized for innovation in automated trading',
              },
              {
                icon: <Globe size={36} />,
                title: 'Global Coverage',
                description: 'Traders from 50+ countries worldwide',
              },
            ].map((badge, index) => (
              <Grid item xs={6} md={3} key={index}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: { xs: 2, md: 3 },
                    borderRadius: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    minHeight: { xs: '140px', md: 'auto' },
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      '& .trust-icon': {
                        transform: 'scale(1.1)',
                        color: '#10b981',
                      },
                    },
                  }}
                >
                  <Box
                    className="trust-icon"
                    sx={{
                      color: 'rgba(16, 185, 129, 0.7)',
                      mb: { xs: 1.5, md: 2 },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {badge.icon}
                  </Box>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      color: 'text.primary',
                      mb: 0.5,
                      fontSize: { xs: '0.85rem', md: '1rem' },
                      lineHeight: 1.3,
                    }}
                  >
                    {badge.title}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: { xs: '0.75rem', md: '0.85rem' },
                      color: 'text.secondary',
                      lineHeight: 1.4,
                    }}
                  >
                    {badge.description}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Compliance Badges */}
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'center',
              alignItems: 'center',
              gap: { xs: 1.5, md: 2 },
              mt: 5,
              px: { xs: 2, md: 0 },
            }}
          >
            {['SSL Secured', 'GDPR Compliant', 'MT5 Certified', 'Anti-Fraud Protected'].map((badge, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  px: { xs: 1.5, md: 2 },
                  py: { xs: 0.75, md: 1 },
                  bgcolor: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: 50,
                  border: '1px solid rgba(16, 185, 129, 0.2)',
                }}
              >
                <CheckCircle2 size={14} color="#10b981" />
                <Typography sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' }, color: 'text.secondary', fontWeight: 500 }}>
                  {badge}
                </Typography>
              </Box>
            ))}
          </Box>
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
              mb: 6,
              fontSize: { xs: '1rem', md: '1.1rem' },
              color: 'text.secondary',
              maxWidth: '700px',
              mx: 'auto',
            }}
          >
            Get started in 3 simple steps
          </Typography>

          <Grid container spacing={{ xs: 2, md: 4 }} sx={{ maxWidth: '1100px', mx: 'auto', px: { xs: 2, md: 0 } }}>
            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  height: '100%',
                  textAlign: 'center',
                  p: { xs: 2, md: 4 },
                  bgcolor: 'rgba(30, 41, 59, 0.6)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    borderColor: '#10b981',
                    boxShadow: '0 12px 40px rgba(16, 185, 129, 0.3)',
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 1, md: 2 } }}>
                  <Box
                    sx={{
                      width: { xs: 60, md: 80 },
                      height: { xs: 60, md: 80 },
                      borderRadius: '50%',
                      bgcolor: 'rgba(16, 185, 129, 0.2)',
                      border: '3px solid #10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: { xs: 2, md: 3 },
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: { xs: '1.8rem', md: '2.5rem' },
                        fontWeight: 900,
                        color: '#10b981',
                      }}
                    >
                      1
                    </Typography>
                  </Box>
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ color: '#10b981', fontWeight: 700, mb: 2, fontSize: { xs: '1.2rem', md: '1.5rem' } }}
                  >
                    We Install & Set Up
                  </Typography>
                  <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.7, fontSize: { xs: '0.9rem', md: '1rem' } }}>
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
                  p: { xs: 2, md: 4 },
                  bgcolor: 'rgba(30, 41, 59, 0.6)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    borderColor: '#10b981',
                    boxShadow: '0 12px 40px rgba(16, 185, 129, 0.3)',
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 1, md: 2 } }}>
                  <Box
                    sx={{
                      width: { xs: 60, md: 80 },
                      height: { xs: 60, md: 80 },
                      borderRadius: '50%',
                      bgcolor: 'rgba(16, 185, 129, 0.2)',
                      border: '3px solid #10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: { xs: 2, md: 3 },
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: { xs: '1.8rem', md: '2.5rem' },
                        fontWeight: 900,
                        color: '#10b981',
                      }}
                    >
                      2
                    </Typography>
                  </Box>
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ color: '#10b981', fontWeight: 700, mb: 2, fontSize: { xs: '1.2rem', md: '1.5rem' } }}
                  >
                    Algorithm Trades
                  </Typography>
                  <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.7, fontSize: { xs: '0.9rem', md: '1rem' } }}>
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
                  p: { xs: 2, md: 4 },
                  bgcolor: 'rgba(30, 41, 59, 0.6)',
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    borderColor: '#10b981',
                    boxShadow: '0 12px 40px rgba(16, 185, 129, 0.3)',
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 1, md: 2 } }}>
                  <Box
                    sx={{
                      width: { xs: 60, md: 80 },
                      height: { xs: 60, md: 80 },
                      borderRadius: '50%',
                      bgcolor: 'rgba(16, 185, 129, 0.2)',
                      border: '3px solid #10b981',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: { xs: 2, md: 3 },
                    }}
                  >
                    <Typography
                      sx={{
                        fontSize: { xs: '1.8rem', md: '2.5rem' },
                        fontWeight: 900,
                        color: '#10b981',
                      }}
                    >
                      3
                    </Typography>
                  </Box>
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ color: '#10b981', fontWeight: 700, mb: 2, fontSize: { xs: '1.2rem', md: '1.5rem' } }}
                  >
                    Watch Growth
                  </Typography>
                  <Typography variant="body1" color="text.primary" sx={{ lineHeight: 1.7, fontSize: { xs: '0.9rem', md: '1rem' } }}>
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
              maxWidth: '900px',
              mx: 'auto',
              p: { xs: 3, md: 5 },
              bgcolor: 'rgba(16, 185, 129, 0.1)',
              backdropFilter: 'blur(10px)',
              border: '3px solid #10b981',
              borderRadius: 4,
              textAlign: 'center',
            }}
          >
            <Shield size={72} color="#10b981" style={{ marginBottom: 24 }} />
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                mb: 3,
                color: '#10b981',
                fontSize: { xs: '1.75rem', md: '2.125rem' },
              }}
            >
              100% Risk-Free 7-Day Money-Back Guarantee
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '1rem', md: '1.2rem' },
                color: 'text.primary',
                mb: 2,
                lineHeight: 1.8,
              }}
            >
              Try AlgoEdge completely risk-free. If you're not satisfied with the platform or results within 7 days, we'll refund your money—no questions asked.
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '1rem', md: '1.1rem' },
                color: 'text.secondary',
                fontStyle: 'italic',
              }}
            >
              We're confident in our system and stand behind it 100%.
            </Typography>
          </Card>
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
                    8 Trading Strategies
                  </Typography>
                  <Typography variant="body2" color="text.primary">
                    EMA Pullback, Break & Retest, SMC, London Breakout, Order Block, VWAP, Fibonacci & RSI Divergence
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
                    MT5 Integration
                  </Typography>
                  <Typography variant="body2" color="text.primary">
                    Direct MetaTrader 5 connection via MetaAPI with real-time sync
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
                    <TrendingUp size={48} />
                  </Box>
                  <Typography variant="h6" gutterBottom sx={{ color: '#10b981', fontWeight: 700 }}>
                    Smart Risk Control
                  </Typography>
                  <Typography variant="body2" color="text.primary">
                    Adjustable risk per trade (1-5%), auto stop-loss, and position sizing
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
                    Live Dashboard
                  </Typography>
                  <Typography variant="body2" color="text.primary">
                    Real-time P&L tracking, trade history, and performance analytics
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      </Container>

      {/* Footer Section */}
      <Box
        component="footer"
        sx={{
          mt: 12,
          borderTop: '1px solid rgba(16, 185, 129, 0.2)',
          bgcolor: 'rgba(10, 15, 26, 0.9)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Container maxWidth="lg">
          {/* Main Footer Content */}
          <Box
            sx={{
              py: 4,
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', md: 'center' },
              gap: 3,
            }}
          >
            {/* Brand Section */}
            <Box sx={{ maxWidth: { xs: '100%', md: '50%' } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                <Box
                  component="img"
                  src="/images/logo.png"
                  alt="AlgoEdge Logo"
                  sx={{ width: 48, height: 48, objectFit: 'contain' }}
                />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 700, 
                    color: 'white',
                    letterSpacing: '0.5px'
                  }}
                >
                  AlgoEdge
                </Typography>
              </Box>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'rgba(255,255,255,0.7)',
                  lineHeight: 1.6
                }}
              >
                Automated precious metals trading with advanced risk management. Trade XAUUSD & XAGUSD 24/7 with institutional-grade strategies and account protection.
              </Typography>
            </Box>

            {/* WhatsApp Contact */}
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 1.5,
                p: 2,
                borderRadius: 2,
                bgcolor: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              <Box
                component="a"
                href="https://wa.me/254704618663"
                target="_blank"
                rel="noopener noreferrer"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  textDecoration: 'none',
                  color: 'white',
                  '&:hover': {
                    '& .whatsapp-icon': {
                      transform: 'scale(1.1)',
                    }
                  }
                }}
              >
                <Box
                  className="whatsapp-icon"
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    bgcolor: '#25D366',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </Box>
                <Box>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', display: 'block' }}>
                    WhatsApp Support
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600, color: 'white' }}>
                    +254 704 618 663
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>

          {/* Copyright Bar */}
          <Box
            sx={{
              py: 3,
              borderTop: '1px solid rgba(255,255,255,0.1)',
              textAlign: 'center',
            }}
          >
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 1 }}>
              © {new Date().getFullYear()} AlgoEdge. All rights reserved.
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#f59e0b',
                fontWeight: 500,
              }}
            >
              Trading involves risk. Past performance is not indicative of future results.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
