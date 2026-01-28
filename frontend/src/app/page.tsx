'use client';

import { Box, Container, Typography, Button, Grid, Card, CardContent, Stack, Fab, Avatar, Rating, Menu, MenuItem, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { TrendingUp, Shield, BarChart3, CheckCircle2, Send, Instagram, Star, Users, Award, Globe, Zap, Quote, ChevronDown, Headphones, HelpCircle, MessageSquare, FileText, Lock, X, Store } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProductShowcase from '@/components/landing/ProductShowcase';
import FeaturedSellers from '@/components/landing/FeaturedSellers';

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
            <stop offset="0%" stopColor="#22C55E" stopOpacity="0" />
            <stop offset="30%" stopColor="#22C55E" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#22C55E" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#22C55E" stopOpacity="0" />
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

// Live Stats Component - Simulated real-time stats for social proof
const LiveStatsBar = () => {
  const [stats, setStats] = useState({
    signalsToday: 47,
    usersOnline: 234,
    tradesExecuted: 1892,
    totalProfit: 127450,
    winRate: 78.5,
  });

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        signalsToday: prev.signalsToday + (Math.random() > 0.7 ? 1 : 0),
        usersOnline: Math.max(180, Math.min(350, prev.usersOnline + Math.floor(Math.random() * 7) - 3)),
        tradesExecuted: prev.tradesExecuted + (Math.random() > 0.5 ? Math.floor(Math.random() * 3) + 1 : 0),
        totalProfit: prev.totalProfit + (Math.random() > 0.6 ? Math.floor(Math.random() * 150) + 50 : 0),
        winRate: Math.max(75, Math.min(82, prev.winRate + (Math.random() - 0.5) * 0.3)),
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const statItems = [
    { 
      label: 'Signals Today', 
      value: stats.signalsToday.toString(), 
      icon: '📊',
      color: '#22C55E',
      bgColor: 'rgba(0, 255, 0, 0.15)',
      borderColor: 'rgba(0, 255, 0, 0.4)',
      pulse: true,
    },
    { 
      label: 'Users Online', 
      value: stats.usersOnline.toString(), 
      icon: '🟢',
      color: '#22C55E',
      bgColor: 'rgba(0, 255, 0, 0.15)',
      borderColor: 'rgba(0, 255, 0, 0.4)',
      pulse: true,
    },
    { 
      label: 'Trades Today', 
      value: stats.tradesExecuted.toLocaleString(), 
      icon: '📈',
      color: '#0066FF',
      bgColor: 'rgba(0, 102, 255, 0.15)',
      borderColor: 'rgba(0, 102, 255, 0.4)',
    },
    { 
      label: 'Total Profit', 
      value: `$${stats.totalProfit.toLocaleString()}`, 
      icon: '💰',
      color: '#FFD700',
      bgColor: 'rgba(255, 215, 0, 0.15)',
      borderColor: 'rgba(255, 215, 0, 0.4)',
    },
    { 
      label: 'Win Rate', 
      value: `${stats.winRate.toFixed(1)}%`, 
      icon: '🎯',
      color: '#FF00AA',
      bgColor: 'rgba(255, 0, 170, 0.15)',
      borderColor: 'rgba(255, 0, 170, 0.4)',
    },
  ];

  return (
    <Box
      sx={{
        width: '100%',
        py: { xs: 2, md: 3 },
        px: { xs: 1, md: 0 },
        position: 'relative',
        overflowX: { xs: 'auto', md: 'visible' },
        WebkitOverflowScrolling: 'touch',
        '&::-webkit-scrollbar': { display: 'none' },
        msOverflowStyle: 'none',
        scrollbarWidth: 'none',
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 0, md: 3 } }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { 
              xs: 'repeat(2, 1fr)', 
              sm: 'repeat(3, 1fr)', 
              md: 'repeat(5, 1fr)' 
            },
            gap: { xs: 1, sm: 1.5, md: 2 },
            justifyItems: 'center',
          }}
        >
          {statItems.map((stat, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 0.75, md: 1.5 },
                px: { xs: 1.5, sm: 2, md: 2.5 },
                py: { xs: 1, sm: 1.25, md: 1.5 },
                borderRadius: { xs: 3, md: 50 },
                bgcolor: stat.bgColor,
                border: `1px solid ${stat.borderColor}`,
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                cursor: 'default',
                width: '100%',
                maxWidth: { xs: '100%', md: 'auto' },
                minWidth: { xs: 'auto', md: 140 },
                justifyContent: { xs: 'center', md: 'flex-start' },
                // Hide last item on very small screens for even grid
                '&:nth-of-type(5)': {
                  gridColumn: { xs: '1 / -1', sm: 'auto' },
                  maxWidth: { xs: '50%', sm: '100%' },
                  mx: { xs: 'auto', sm: 0 },
                },
                '@media (hover: hover)': {
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: `0 8px 24px ${stat.bgColor}`,
                    borderColor: stat.color,
                  },
                },
              }}
            >
              {/* Pulse animation for live indicators */}
              {stat.pulse && (
                <Box
                  sx={{
                    width: { xs: 6, md: 8 },
                    height: { xs: 6, md: 8 },
                    borderRadius: '50%',
                    bgcolor: stat.color,
                    boxShadow: `0 0 8px ${stat.color}`,
                    flexShrink: 0,
                    animation: 'pulse 2s ease-in-out infinite',
                    '@keyframes pulse': {
                      '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                      '50%': { opacity: 0.5, transform: 'scale(1.3)' },
                    },
                  }}
                />
              )}
              <Typography sx={{ fontSize: { xs: '1rem', md: '1.3rem' }, flexShrink: 0 }}>
                {stat.icon}
              </Typography>
              <Box sx={{ textAlign: 'left', minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1.1rem' },
                    fontWeight: 700,
                    color: stat.color,
                    lineHeight: 1,
                    fontFamily: 'monospace',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {stat.value}
                </Typography>
                <Typography
                  sx={{
                    fontSize: { xs: '0.55rem', sm: '0.6rem', md: '0.7rem' },
                    color: '#888888',
                    textTransform: 'uppercase',
                    letterSpacing: '0.3px',
                    whiteSpace: 'nowrap',
                    fontWeight: 700,
                  }}
                >
                  {stat.label}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
};

// Recent Activity Popup - Shows simulated recent purchases/sign-ups
const RecentActivityPopup = () => {
  const [visible, setVisible] = useState(false);
  const [currentActivity, setCurrentActivity] = useState(0);

  const activities = [
    { name: 'John D.', location: 'New York, USA', action: 'just subscribed', plan: 'Monthly', time: '2 mins ago', flag: '🇺🇸' },
    { name: 'Ahmed K.', location: 'Dubai, UAE', action: 'just started trading', plan: '', time: '5 mins ago', flag: '🇦🇪' },
    { name: 'Sarah M.', location: 'London, UK', action: 'earned +$847', plan: 'today', time: '8 mins ago', flag: '🇬🇧' },
    { name: 'Pierre L.', location: 'Paris, France', action: 'just subscribed', plan: 'Quarterly', time: '12 mins ago', flag: '🇫🇷' },
    { name: 'Michael R.', location: 'Sydney, AUS', action: 'just signed up', plan: '', time: '15 mins ago', flag: '🇦🇺' },
    { name: 'Chen W.', location: 'Singapore', action: 'earned +$1,234', plan: 'this week', time: '18 mins ago', flag: '🇸🇬' },
    { name: 'David O.', location: 'Lagos, Nigeria', action: 'just subscribed', plan: 'Weekly', time: '23 mins ago', flag: '🇳🇬' },
    { name: 'Maria S.', location: 'Toronto, CAN', action: 'just started trading', plan: '', time: '27 mins ago', flag: '🇨🇦' },
    { name: 'James T.', location: 'Nairobi, Kenya', action: 'earned +$456', plan: 'today', time: '32 mins ago', flag: '🇰🇪' },
    { name: 'Anna P.', location: 'Berlin, GER', action: 'just subscribed', plan: 'Monthly', time: '38 mins ago', flag: '🇩🇪' },
  ];

  useEffect(() => {
    // Show popup every 8-15 seconds
    const showPopup = () => {
      setVisible(true);
      
      // Hide after 5 seconds
      setTimeout(() => {
        setVisible(false);
        // Move to next activity
        setCurrentActivity(prev => (prev + 1) % activities.length);
      }, 5000);
    };

    // Initial delay before first popup (3 seconds)
    const initialTimeout = setTimeout(showPopup, 3000);

    // Then show every 8-15 seconds
    const interval = setInterval(showPopup, 8000 + Math.random() * 7000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [activities.length]);

  const activity = activities[currentActivity];

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: { xs: 70, sm: 80, md: 100 },
        left: { xs: 8, sm: 16, md: 24 },
        right: { xs: 8, sm: 'auto' },
        zIndex: 999,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0) translateY(0)' : 'translateX(0) translateY(120%)',
        transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
        maxWidth: { xs: 'calc(100% - 16px)', sm: 300, md: 320 },
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 1, sm: 1.5 },
          bgcolor: 'rgba(30, 41, 59, 0.98)',
          backdropFilter: 'blur(10px)',
          borderRadius: 2,
          p: { xs: 1.25, sm: 1.5 },
          border: '1px solid rgba(0, 255, 0, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Avatar/Flag */}
        <Box
          sx={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            bgcolor: 'rgba(0, 255, 0, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
            flexShrink: 0,
          }}
        >
          {activity.flag}
        </Box>
        
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#FFFFFF',
              lineHeight: 1.3,
            }}
          >
            {activity.name} from {activity.location}
          </Typography>
          <Typography
            sx={{
              fontSize: '0.8rem',
              color: activity.action.includes('earned') ? '#22C55E' : '#888888',
              fontWeight: activity.action.includes('earned') ? 700 : 500,
            }}
          >
            {activity.action} {activity.plan && <span style={{ color: '#22C55E' }}>{activity.plan}</span>}
          </Typography>
          <Typography
            sx={{
              fontSize: '0.7rem',
              color: '#666666',
            }}
          >
            {activity.time}
          </Typography>
        </Box>

        {/* Verified badge */}
        <Box
          sx={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            bgcolor: '#22C55E',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <CheckCircle2 size={14} color="black" />
        </Box>
      </Box>
    </Box>
  );
};

// Top Navigation Bar Component - Similar to ReadyPips
const TopNavBar = () => {
  const [resourcesAnchor, setResourcesAnchor] = useState<null | HTMLElement>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleResourcesOpen = (event: React.MouseEvent<HTMLElement>) => {
    setResourcesAnchor(event.currentTarget);
  };

  const handleResourcesClose = () => {
    setResourcesAnchor(null);
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        bgcolor: '#000000',
        borderBottom: '1px solid #222222',
        transition: 'all 0.3s ease',
      }}
    >
      <Container maxWidth="lg">
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: 1.5,
            gap: 2,
          }}
        >
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Box
              component="img"
              src="/images/logo.png"
              alt="AlgoEdge"
              sx={{ width: 36, height: 36, objectFit: 'contain' }}
            />
            <Typography
              sx={{
                fontWeight: 900,
                fontSize: '1.4rem',
                color: '#FFFFFF',
                display: { xs: 'none', sm: 'block' },
                letterSpacing: '-0.01em',
              }}
            >
              <Box component="span" sx={{ color: '#FF0000' }}>Algo</Box><Box component="span" sx={{ color: '#22C55E' }}>Edge</Box>
            </Typography>
          </Link>

          {/* Navigation Links - Desktop */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 0.5,
            }}
          >
            <Button
              component={Link}
              href="/dashboard/signals"
              startIcon={<TrendingUp size={18} />}
              sx={{
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '0.95rem',
                textTransform: 'none',
                px: 2,
                '&:hover': {
                  color: '#22C55E',
                  bgcolor: 'transparent',
                },
              }}
            >
              Indicator
            </Button>

            <Button
              component={Link}
              href="/dashboard/robots"
              startIcon={<Zap size={18} />}
              sx={{
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '0.95rem',
                textTransform: 'none',
                px: 2,
                '&:hover': {
                  color: '#22C55E',
                  bgcolor: 'transparent',
                },
              }}
            >
              Copy Trading
            </Button>

            <Button
              component={Link}
              href="/marketplace"
              startIcon={<Store size={18} />}
              sx={{
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '0.95rem',
                textTransform: 'none',
                px: 2,
                '&:hover': {
                  color: '#22C55E',
                  bgcolor: 'transparent',
                },
              }}
            >
              Marketplace
            </Button>

            <Button
              component={Link}
              href="/affiliate"
              startIcon={<BarChart3 size={18} />}
              sx={{
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '0.95rem',
                textTransform: 'none',
                px: 2,
                '&:hover': {
                  color: '#22C55E',
                  bgcolor: 'transparent',
                },
              }}
            >
              Affiliate Program
            </Button>

            <Button
              onClick={handleResourcesOpen}
              endIcon={<ChevronDown size={16} />}
              sx={{
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '0.95rem',
                textTransform: 'none',
                px: 2,
                '&:hover': {
                  color: '#22C55E',
                  bgcolor: 'transparent',
                },
              }}
            >
              More
            </Button>

            <Menu
              anchorEl={resourcesAnchor}
              open={Boolean(resourcesAnchor)}
              onClose={handleResourcesClose}
              PaperProps={{
                sx: {
                  bgcolor: '#111111',
                  border: '1px solid #333333',
                  borderRadius: 2,
                  mt: 1,
                  minWidth: 200,
                },
              }}
            >
              <MenuItem
                component={Link}
                href="/support"
                onClick={handleResourcesClose}
                sx={{
                  py: 1.5,
                  px: 2.5,
                  gap: 1.5,
                  '&:hover': { bgcolor: '#222222' },
                }}
              >
                <Headphones size={18} color="#22C55E" />
                <Typography sx={{ color: '#FFFFFF', fontSize: '0.95rem', fontWeight: 500 }}>Support</Typography>
              </MenuItem>
              <MenuItem
                component={Link}
                href="/faq"
                onClick={handleResourcesClose}
                sx={{
                  py: 1.5,
                  px: 2.5,
                  gap: 1.5,
                  '&:hover': { bgcolor: '#222222' },
                }}
              >
                <HelpCircle size={18} color="#22C55E" />
                <Typography sx={{ color: '#FFFFFF', fontSize: '0.95rem', fontWeight: 500 }}>FAQs</Typography>
              </MenuItem>
              <MenuItem
                component={Link}
                href="/testimonials"
                onClick={handleResourcesClose}
                sx={{
                  py: 1.5,
                  px: 2.5,
                  gap: 1.5,
                  '&:hover': { bgcolor: '#222222' },
                }}
              >
                <MessageSquare size={18} color="#22C55E" />
                <Typography sx={{ color: '#FFFFFF', fontSize: '0.95rem', fontWeight: 500 }}>Testimonials</Typography>
              </MenuItem>
              <MenuItem
                component={Link}
                href="/privacy"
                onClick={handleResourcesClose}
                sx={{
                  py: 1.5,
                  px: 2.5,
                  gap: 1.5,
                  '&:hover': { bgcolor: '#222222' },
                }}
              >
                <Lock size={18} color="#22C55E" />
                <Typography sx={{ color: '#FFFFFF', fontSize: '0.95rem', fontWeight: 500 }}>Privacy Policy</Typography>
              </MenuItem>
              <MenuItem
                component={Link}
                href="/terms"
                onClick={handleResourcesClose}
                sx={{
                  py: 1.5,
                  px: 2.5,
                  gap: 1.5,
                  '&:hover': { bgcolor: '#222222' },
                }}
              >
                <FileText size={18} color="#22C55E" />
                <Typography sx={{ color: '#FFFFFF', fontSize: '0.95rem', fontWeight: 500 }}>Terms & Conditions</Typography>
              </MenuItem>
            </Menu>
          </Box>

          {/* Auth Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              component={Link}
              href="/auth/login"
              sx={{
                color: '#FFFFFF',
                fontWeight: 600,
                fontSize: '0.95rem',
                textTransform: 'none',
                px: 2,
                display: { xs: 'none', sm: 'flex' },
                '&:hover': {
                  color: '#22C55E',
                  bgcolor: 'transparent',
                },
              }}
            >
              Login
            </Button>
            <Button
              component={Link}
              href="/auth/register"
              variant="contained"
              sx={{
                bgcolor: '#22C55E',
                color: '#000000',
                fontWeight: 700,
                fontSize: '0.95rem',
                textTransform: 'none',
                px: 3,
                py: 1,
                borderRadius: 2,
                '&:hover': {
                  bgcolor: '#16A34A',
                },
              }}
            >
              Sign Up
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

// Affiliate Login Dialog Component
const AffiliateLoginDialog = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const router = useRouter();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          bgcolor: '#111111',
          border: '1px solid #333333',
          borderRadius: 3,
          maxWidth: 400,
          width: '100%',
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 1,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: '#22C55E',
            }}
          >
            <Users size={24} color="#000000" />
          </Box>
          <Typography variant="h6" fontWeight={800} color="#FFFFFF">
            Affiliate Program
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small" sx={{ color: '#888888' }}>
          <X size={20} />
        </IconButton>
      </DialogTitle>
      
      <DialogContent sx={{ pt: 2 }}>
        <Typography sx={{ mb: 3, color: '#FFFFFF' }}>
          Join our affiliate program and earn <strong style={{ color: '#22C55E' }}>10% commission</strong> on every referral subscription!
        </Typography>
        
        <Box
          sx={{
            p: 2.5,
            borderRadius: 2,
            bgcolor: '#001a00',
            border: '1px solid #22C55E',
            mb: 2,
          }}
        >
          <Typography fontWeight={800} sx={{ mb: 1, color: '#22C55E' }}>
            Commission Rates:
          </Typography>
          <Stack spacing={0.5}>
            <Typography sx={{ color: '#FFFFFF', fontSize: '0.95rem' }}>
              • Weekly Plan ($19): <strong style={{ color: '#22C55E' }}>$1.90</strong> per referral
            </Typography>
            <Typography sx={{ color: '#FFFFFF', fontSize: '0.95rem' }}>
              • Monthly Plan ($49): <strong style={{ color: '#22C55E' }}>$4.90</strong> per referral
            </Typography>
            <Typography sx={{ color: '#FFFFFF', fontSize: '0.95rem' }}>
              • Quarterly Plan ($149): <strong style={{ color: '#22C55E' }}>$14.90</strong> per referral
            </Typography>
          </Stack>
        </Box>
        
        <Typography sx={{ textAlign: 'center', color: '#888888' }}>
          Please login or create an account to access your affiliate dashboard.
        </Typography>
      </DialogContent>
      
      <DialogActions sx={{ p: 3, pt: 2, gap: 1 }}>
        <Button
          fullWidth
          variant="outlined"
          onClick={() => {
            onClose();
            router.push('/auth/login?redirect=/dashboard/affiliate');
          }}
          sx={{
            borderColor: '#FFFFFF',
            borderWidth: 2,
            color: '#FFFFFF',
            fontWeight: 700,
            py: 1.25,
            '&:hover': {
              borderColor: '#22C55E',
              borderWidth: 2,
              bgcolor: 'transparent',
            },
          }}
        >
          Login
        </Button>
        <Button
          fullWidth
          variant="contained"
          onClick={() => {
            onClose();
            router.push('/auth/register?redirect=/dashboard/affiliate');
          }}
          sx={{
            bgcolor: '#22C55E',
            color: '#000000',
            fontWeight: 700,
            py: 1.25,
            '&:hover': {
              bgcolor: '#16A34A',
            },
          }}
        >
          Create Account
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default function Home() {
  const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_URL || 'https://wa.me/';
  const instagramUrl = process.env.NEXT_PUBLIC_INSTAGRAM_URL || 'https://www.instagram.com/__.kip.chirchir._?igsh=MTc4MWI0MWU3YmNnaQ%3D%3D&utm_source=qr';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'transparent', position: 'relative' }}>
      {/* Top Navigation Bar */}
      <TopNavBar />
      
      {/* Trading Background - Animated Candlestick Chart */}
      <TradingBackground />
      
      {/* Sticky WhatsApp Button */}
      <StickyWhatsAppButton whatsappUrl={whatsappUrl} />
      
      {/* Recent Activity Popup - Social Proof */}
      <RecentActivityPopup />
      
      {/* Hero Section - Above the Fold */}
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 10, pt: 8 }}>
        <Box sx={{ py: { xs: 6, md: 10 }, textAlign: 'center' }}>
          {/* Main Headline with Clear Offer */}
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.5rem', sm: '3rem', md: '4rem' },
              fontWeight: 900,
              mb: 3,
              background: 'linear-gradient(135deg, #22C55E 0%, #22C55E 50%, #22C55E 100%)',
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
              color: '#FFFFFF',
              mb: 4,
              maxWidth: '800px',
              mx: 'auto',
              lineHeight: 1.6,
              fontWeight: 600,
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
                bgcolor: '#22C55E',
                color: '#000000',
                fontWeight: 800,
                fontSize: { xs: '1.1rem', md: '1.2rem' },
                py: 2,
                px: 5,
                '&:hover': {
                  bgcolor: '#16A34A',
                  transform: 'translateY(-4px)',
                  boxShadow: '0 12px 32px rgba(0, 255, 0, 0.5)',
                },
                transition: 'all 0.3s ease',
                textTransform: 'none',
                boxShadow: '0 8px 24px rgba(0, 255, 0, 0.4)',
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
                borderColor: '#22C55E',
                color: '#22C55E',
                fontWeight: 800,
                fontSize: { xs: '1.1rem', md: '1.2rem' },
                py: 2,
                px: 5,
                borderWidth: 2,
                '&:hover': {
                  borderColor: '#22C55E',
                  bgcolor: 'rgba(0, 255, 0, 0.1)',
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
        </Box>
      </Container>

      {/* Live Stats Bar - Social Proof */}
      <LiveStatsBar />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 10 }}>
        <Box sx={{ py: { xs: 4, md: 6 }, textAlign: 'center' }}>
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
                fontWeight: 800,
                color: '#22C55E',
                mb: 2,
                fontStyle: 'italic',
              }}
            >
              Ready to Start Automated Trading?
            </Typography>
            <Typography
              sx={{
                fontSize: { xs: '1rem', md: '1.1rem' },
                color: '#FFFFFF',
                mb: 4,
                fontWeight: 600,
              }}
            >
              Secure your bot and start trading today.
            </Typography>

            {/* Social Links - CTA Style */}
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ xs: 1.5, sm: 2 }}
              sx={{ 
                justifyContent: 'center', 
                alignItems: 'center',
                width: '100%',
                flexWrap: 'wrap',
                gap: { xs: 1.5, sm: 2 },
              }}
            >
              <Button
                href="https://t.me/+newQkIa06W1kNmMx"
                target="_blank"
                rel="noopener noreferrer"
                variant="contained"
                size="large"
                startIcon={<Send size={20} />}
                sx={{
                  minWidth: { xs: '100%', sm: 340 },
                  maxWidth: { xs: '100%', sm: 380 },
                  bgcolor: '#0088cc',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  py: { xs: 1.5, sm: 1.75 },
                  px: 3,
                  whiteSpace: 'nowrap',
                  '@media (hover: hover)': {
                    '&:hover': {
                      bgcolor: '#006699',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(0, 136, 204, 0.4)',
                    },
                  },
                  '&:active': {
                    transform: 'scale(0.98)',
                  },
                  transition: 'all 0.2s ease',
                  textTransform: 'none',
                  borderRadius: 50,
                  boxShadow: '0 4px 12px rgba(0, 136, 204, 0.3)',
                }}
              >
                🎯 Join Telegram for AI Signals 🚀
              </Button>
              <Button
                href={instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="contained"
                size="large"
                startIcon={<Instagram size={20} />}
                sx={{
                  minWidth: { xs: '100%', sm: 220 },
                  maxWidth: { xs: '100%', sm: 260 },
                  background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: { xs: '0.9rem', sm: '1rem' },
                  py: { xs: 1.5, sm: 1.75 },
                  px: 3,
                  '@media (hover: hover)': {
                    '&:hover': {
                      background: 'linear-gradient(45deg, #e6683c 0%, #dc2743 25%, #cc2366 50%, #bc1888 75%, #a01472 100%)',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(225, 48, 108, 0.4)',
                    },
                  },
                  '&:active': {
                    transform: 'scale(0.98)',
                  },
                  transition: 'all 0.2s ease',
                  textTransform: 'none',
                  borderRadius: 50,
                  boxShadow: '0 4px 12px rgba(225, 48, 108, 0.3)',
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
                fontWeight: 800,
                color: '#22C55E',
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
                    bgcolor: 'rgba(0, 255, 0, 0.05)',
                    p: 2.5,
                    borderRadius: 2,
                    border: '1px solid rgba(0, 255, 0, 0.2)',
                  }}
                >
                  <CheckCircle2 size={24} color="#22C55E" style={{ marginTop: 2, flexShrink: 0 }} />
                  <Typography sx={{ color: '#FFFFFF', fontSize: { xs: '1rem', md: '1.1rem' }, lineHeight: 1.6, fontWeight: 600 }}>
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
                    bgcolor: 'rgba(0, 255, 0, 0.05)',
                    p: 2.5,
                    borderRadius: 2,
                    border: '1px solid rgba(0, 255, 0, 0.2)',
                  }}
                >
                  <CheckCircle2 size={24} color="#22C55E" style={{ marginTop: 2, flexShrink: 0 }} />
                  <Typography sx={{ color: '#FFFFFF', fontSize: { xs: '1rem', md: '1.1rem' }, lineHeight: 1.6, fontWeight: 600 }}>
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
                    bgcolor: 'rgba(0, 255, 0, 0.05)',
                    p: 2.5,
                    borderRadius: 2,
                    border: '1px solid rgba(0, 255, 0, 0.2)',
                  }}
                >
                  <CheckCircle2 size={24} color="#22C55E" style={{ marginTop: 2, flexShrink: 0 }} />
                  <Typography sx={{ color: '#FFFFFF', fontSize: { xs: '1rem', md: '1.1rem' }, lineHeight: 1.6, fontWeight: 600 }}>
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
                    bgcolor: 'rgba(0, 255, 0, 0.05)',
                    p: 2.5,
                    borderRadius: 2,
                    border: '1px solid rgba(0, 255, 0, 0.2)',
                  }}
                >
                  <CheckCircle2 size={24} color="#22C55E" style={{ marginTop: 2, flexShrink: 0 }} />
                  <Typography sx={{ color: '#FFFFFF', fontSize: { xs: '1rem', md: '1.1rem' }, lineHeight: 1.6, fontWeight: 600 }}>
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
              fontWeight: 800,
              mb: 2,
              fontSize: { xs: '2rem', md: '2.5rem' },
              color: '#22C55E',
              textShadow: '0 2px 10px rgba(0, 255, 0, 0.3)',
            }}
          >
            How AlgoEdge Works
          </Typography>
          <Typography
            align="center"
            sx={{
              mb: 5,
              fontSize: { xs: '1rem', md: '1.1rem' },
              color: '#FFFFFF',
              maxWidth: '700px',
              mx: 'auto',
              fontWeight: 600,
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
              border: '2px solid rgba(0, 255, 0, 0.3)',
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
              fontWeight: 800,
              mb: 3,
              fontSize: { xs: '1.5rem', md: '2rem' },
              color: '#22C55E',
            }}
          >
            See AlgoEdge&apos;s Real Results <Box component="span" sx={{ fontWeight: 500, fontSize: { xs: '1rem', md: '1.3rem' }, fontStyle: 'italic', color: '#FFFFFF' }}>(Just a few examples)</Box>
          </Typography>

          {/* Grid for Videos and Images - 2x2 on mobile, 4 columns on desktop */}
          <Grid container spacing={2} sx={{ maxWidth: '900px', mx: 'auto', justifyContent: 'center' }}>
            {/* Video 1 */}
            <Grid item xs={6} md={3}>
              <Box
                sx={{
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '1px solid rgba(0, 255, 0, 0.3)',
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
                  border: '1px solid rgba(0, 255, 0, 0.3)',
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
                  border: '1px solid rgba(0, 255, 0, 0.3)',
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
                  border: '1px solid rgba(0, 255, 0, 0.3)',
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
              background: 'linear-gradient(90deg, transparent, rgba(0, 255, 0, 0.5), transparent)',
            }}
          />
          <Typography
            variant="h3"
            align="center"
            sx={{
              fontWeight: 800,
              mb: 2,
              fontSize: { xs: '2rem', md: '2.5rem' },
              color: '#22C55E',
              textShadow: '0 2px 10px rgba(0, 255, 0, 0.3)',
            }}
          >
            Real Performance. Real Results.
          </Typography>
          <Typography
            align="center"
            sx={{
              mb: 6,
              fontSize: { xs: '1rem', md: '1.1rem' },
              color: '#FFFFFF',
              maxWidth: '600px',
              mx: 'auto',
              fontWeight: 600,
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
                    bgcolor: 'rgba(0, 255, 0, 0.05)',
                    borderRadius: 3,
                    border: '1px solid rgba(0, 255, 0, 0.2)',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: { xs: '160px', md: 'auto' },
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      borderColor: '#22C55E',
                      boxShadow: '0 10px 40px rgba(0, 255, 0, 0.2)',
                    },
                  }}
                >
                  <Box sx={{ color: '#22C55E', mb: { xs: 1.5, md: 2 }, opacity: 0.8 }}>{stat.icon}</Box>
                  <Typography
                    sx={{
                      fontSize: { xs: '1.75rem', md: '2.5rem' },
                      fontWeight: 900,
                      color: '#22C55E',
                      lineHeight: 1,
                      mb: 0.5,
                    }}
                  >
                    {stat.value}
                  </Typography>
                  <Typography sx={{ fontWeight: 700, color: '#FFFFFF', mb: 0.5, fontSize: { xs: '0.9rem', md: '1rem' } }}>
                    {stat.label}
                  </Typography>
                  <Typography sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' }, color: '#888888', fontWeight: 600 }}>
                    {stat.sublabel}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* ═══════════════════════════════════════════════════════════════════════
            PRODUCT SHOWCASE - Premium Trading Products
        ═══════════════════════════════════════════════════════════════════════ */}
        <ProductShowcase />

        {/* ═══════════════════════════════════════════════════════════════════════
            FEATURED SELLERS - Top Marketplace Sellers
        ═══════════════════════════════════════════════════════════════════════ */}
        <FeaturedSellers />

        {/* ═══════════════════════════════════════════════════════════════════════
            TESTIMONIALS - Social Proof Section
        ═══════════════════════════════════════════════════════════════════════ */}
        <Box sx={{ py: 8 }}>
          <Typography
            variant="h3"
            align="center"
            sx={{
              fontWeight: 800,
              mb: 2,
              fontSize: { xs: '2rem', md: '2.5rem' },
              color: '#22C55E',
              textShadow: '0 2px 10px rgba(0, 255, 0, 0.3)',
            }}
          >
            Trusted by Traders Worldwide
          </Typography>
          <Typography
            align="center"
            sx={{
              mb: 6,
              fontSize: { xs: '1rem', md: '1.1rem' },
              color: '#FFFFFF',
              maxWidth: '600px',
              mx: 'auto',
              fontWeight: 600,
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
                image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
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
                image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
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
                image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
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
                image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face',
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
                image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&h=100&fit=crop&crop=face',
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
                image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
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
                    border: '1px solid rgba(0, 255, 0, 0.2)',
                    borderRadius: 3,
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'visible',
                    '&:hover': {
                      transform: 'translateY(-5px)',
                      borderColor: '#22C55E',
                      boxShadow: '0 15px 50px rgba(0, 255, 0, 0.2)',
                    },
                  }}
                >
                  {/* Quote Icon */}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -12,
                      right: 20,
                      bgcolor: '#22C55E',
                      borderRadius: '50%',
                      p: 1,
                      boxShadow: '0 4px 15px rgba(0, 255, 0, 0.4)',
                    }}
                  >
                    <Quote size={20} color="black" />
                  </Box>

                  <CardContent sx={{ p: 0 }}>
                    {/* Header */}
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                      <Avatar
                        src={testimonial.image}
                        sx={{
                          bgcolor: '#22C55E',
                          width: 50,
                          height: 50,
                          fontWeight: 800,
                          fontSize: '1.2rem',
                          color: '#000000',
                          border: '2px solid #22C55E',
                        }}
                      >
                        {testimonial.avatar}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography sx={{ fontWeight: 700, color: '#FFFFFF' }}>
                          {testimonial.name}
                        </Typography>
                        <Typography sx={{ fontSize: '0.85rem', color: '#888888' }}>
                          {testimonial.location}
                        </Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography
                          sx={{
                            fontWeight: 900,
                            color: '#22C55E',
                            fontSize: '1.1rem',
                          }}
                        >
                          {testimonial.profit}
                        </Typography>
                        <Typography sx={{ fontSize: '0.75rem', color: '#888888' }}>
                          {testimonial.period}
                        </Typography>
                      </Box>
                    </Stack>

                    {/* Rating */}
                    <Stack direction="row" spacing={0.5} sx={{ mb: 2 }}>
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} size={18} fill="#22C55E" color="#22C55E" />
                      ))}
                    </Stack>

                    {/* Title */}
                    <Typography
                      sx={{
                        fontWeight: 800,
                        color: '#22C55E',
                        mb: 1.5,
                        fontSize: '1.1rem',
                      }}
                    >
                      "{testimonial.title}"
                    </Typography>

                    {/* Text */}
                    <Typography
                      sx={{
                        color: '#FFFFFF',
                        lineHeight: 1.7,
                        fontSize: '0.95rem',
                        fontWeight: 500,
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
                bgcolor: 'rgba(0, 255, 0, 0.1)',
                border: '1px solid rgba(0, 255, 0, 0.3)',
                borderRadius: 50,
                px: 3,
                py: 1,
                display: 'inline-flex',
              }}
            >
              <CheckCircle2 size={18} color="#22C55E" />
              <Typography sx={{ color: '#FFFFFF', fontSize: '0.9rem', fontWeight: 600 }}>
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
              fontWeight: 800,
              mb: 5,
              color: '#FFFFFF',
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
                        color: '#22C55E',
                      },
                    },
                  }}
                >
                  <Box
                    className="trust-icon"
                    sx={{
                      color: 'rgba(0, 255, 0, 0.7)',
                      mb: { xs: 1.5, md: 2 },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {badge.icon}
                  </Box>
                  <Typography
                    sx={{
                      fontWeight: 800,
                      color: '#FFFFFF',
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
                      color: '#888888',
                      lineHeight: 1.4,
                      fontWeight: 600,
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
                  bgcolor: 'rgba(0, 255, 0, 0.1)',
                  borderRadius: 50,
                  border: '1px solid rgba(0, 255, 0, 0.2)',
                }}
              >
                <CheckCircle2 size={14} color="#22C55E" />
                <Typography sx={{ fontSize: { xs: '0.75rem', md: '0.85rem' }, color: '#FFFFFF', fontWeight: 600 }}>
                  {badge}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>

        {/* ═══════════════════════════════════════════════════════════════════════
            PRICING PACKAGES - Compact Colorful Subscription Tiers
        ═══════════════════════════════════════════════════════════════════════ */}
        <Box sx={{ py: 5, position: 'relative' }} id="pricing">
          <Typography
            variant="h3"
            align="center"
            sx={{
              fontWeight: 900,
              mb: 1.5,
              fontSize: { xs: '1.75rem', md: '2.25rem' },
              background: 'linear-gradient(135deg, #22C55E 0%, #22C55E 50%, #FFD700 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Choose Your Plan
          </Typography>
          <Typography
            align="center"
            sx={{
              mb: 1,
              fontSize: { xs: '0.9rem', md: '1rem' },
              color: '#FFFFFF',
              fontWeight: 600,
            }}
          >
            Start with our proven trading system today
          </Typography>
          
          {/* Account creation notice */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.75,
              mb: 3,
              py: 1,
              px: 2,
              bgcolor: 'rgba(255, 215, 0, 0.1)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              borderRadius: 2,
              maxWidth: '420px',
              mx: 'auto',
            }}
          >
            <Zap size={16} color="#FFD700" />
            <Typography sx={{ fontSize: '0.8rem', color: '#FFD700', fontWeight: 700 }}>
              Create an account first, then choose your plan at checkout
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
            <Grid container spacing={{ xs: 1.5, md: 2 }} sx={{ maxWidth: '900px', px: { xs: 1.5, md: 0 }, justifyContent: 'center' }}>
            {/* WEEKLY PLAN */}
            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  height: '100%',
                  position: 'relative',
                  overflow: 'visible',
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, rgba(0, 102, 255, 0.1) 0%, rgba(30, 41, 59, 0.9) 100%)',
                  border: '2px solid rgba(0, 102, 255, 0.4)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: '#0066FF',
                    boxShadow: '0 12px 30px rgba(0, 102, 255, 0.25)',
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 2, md: 2.5 }, textAlign: 'center' }}>
                  {/* Plan Icon */}
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #0066FF 0%, #0044CC 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 1.5,
                      boxShadow: '0 4px 16px rgba(0, 102, 255, 0.4)',
                    }}
                  >
                    <Zap size={24} color="white" />
                  </Box>
                  
                  <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#0066FF', mb: 0.5 }}>
                    Weekly
                  </Typography>
                  
                  <Box sx={{ mb: 1.5 }}>
                    <Typography component="span" sx={{ fontSize: '2.25rem', fontWeight: 800, color: 'white' }}>
                      $19
                    </Typography>
                    <Typography component="span" sx={{ fontSize: '0.9rem', color: '#888888' }}>
                      /week
                    </Typography>
                  </Box>
                  
                  <Typography sx={{ color: '#888888', mb: 2, fontSize: '0.8rem', fontWeight: 600 }}>
                    Perfect for trying out our system
                  </Typography>
                  
                  <Stack spacing={0.75} sx={{ mb: 2.5, textAlign: 'left' }}>
                    {['Full Bot Access', 'All 7 Strategies', 'Real-time Signals', 'Performance Dashboard', 'Email Support', 'Cancel Anytime'].map((feature, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircle2 size={14} color="#0066FF" />
                        <Typography sx={{ color: '#FFFFFF', fontSize: '0.8rem', fontWeight: 600 }}>{feature}</Typography>
                      </Box>
                    ))}
                  </Stack>
                  
                  <Button
                    component={Link}
                    href="/auth/register"
                    variant="outlined"
                    fullWidth
                    sx={{
                      py: 1,
                      borderColor: '#0066FF',
                      color: '#0066FF',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      borderWidth: 2,
                      borderRadius: 2,
                      '&:hover': {
                        borderColor: '#0066FF',
                        bgcolor: 'rgba(0, 102, 255, 0.1)',
                        borderWidth: 2,
                      },
                    }}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* MONTHLY PLAN - MOST POPULAR */}
            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  height: '100%',
                  position: 'relative',
                  overflow: 'visible',
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, rgba(0, 255, 0, 0.15) 0%, rgba(30, 41, 59, 0.95) 100%)',
                  border: '2px solid #22C55E',
                  transform: { md: 'scale(1.03)' },
                  transition: 'all 0.3s ease',
                  boxShadow: '0 12px 40px rgba(0, 255, 0, 0.25)',
                  '&:hover': {
                    transform: { xs: 'translateY(-4px)', md: 'scale(1.05)' },
                    boxShadow: '0 16px 50px rgba(0, 255, 0, 0.35)',
                  },
                }}
              >
                {/* Most Popular Badge */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: -12,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                    color: '#000',
                    px: 2,
                    py: 0.5,
                    borderRadius: 50,
                    fontWeight: 700,
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    boxShadow: '0 4px 12px rgba(255, 215, 0, 0.4)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  🔥 Most Popular
                </Box>
                
                <CardContent sx={{ p: { xs: 2, md: 2.5 }, textAlign: 'center', pt: { xs: 3, md: 3.5 } }}>
                  {/* Plan Icon */}
                  <Box
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 1.5,
                      boxShadow: '0 4px 20px rgba(0, 255, 0, 0.4)',
                    }}
                  >
                    <TrendingUp size={28} color="black" />
                  </Box>
                  
                  <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color: '#22C55E', mb: 0.5 }}>
                    Monthly
                  </Typography>
                  
                  <Box sx={{ mb: 0.5 }}>
                    <Typography component="span" sx={{ fontSize: '2.5rem', fontWeight: 800, color: 'white' }}>
                      $49
                    </Typography>
                    <Typography component="span" sx={{ fontSize: '1rem', color: '#888888' }}>
                      /month
                    </Typography>
                  </Box>
                  
                  <Box sx={{ bgcolor: 'rgba(0, 255, 0, 0.2)', borderRadius: 50, px: 1.5, py: 0.25, mb: 2, display: 'inline-block' }}>
                    <Typography sx={{ color: '#22C55E', fontSize: '0.75rem', fontWeight: 700 }}>
                      Save 37% vs Weekly
                    </Typography>
                  </Box>
                  
                  <Stack spacing={0.75} sx={{ mb: 2.5, textAlign: 'left' }}>
                    {['Full Bot Access', 'All 7 Strategies', 'Priority Trade Execution', 'Advanced Analytics', '24/7 Support', 'Dedicated Account Manager'].map((feature, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircle2 size={14} color="#22C55E" />
                        <Typography sx={{ color: '#FFFFFF', fontSize: '0.8rem', fontWeight: i === 5 ? 700 : 600 }}>{feature}</Typography>
                      </Box>
                    ))}
                  </Stack>
                  
                  <Button
                    component={Link}
                    href="/auth/register"
                    variant="contained"
                    fullWidth
                    sx={{
                      py: 1.25,
                      bgcolor: '#22C55E',
                      color: '#000000',
                      fontWeight: 800,
                      fontSize: '0.95rem',
                      borderRadius: 2,
                      boxShadow: '0 4px 16px rgba(0, 255, 0, 0.4)',
                      '&:hover': {
                        bgcolor: '#16A34A',
                        boxShadow: '0 8px 24px rgba(0, 255, 0, 0.5)',
                      },
                    }}
                  >
                    Get Started Now
                  </Button>
                </CardContent>
              </Card>
            </Grid>

            {/* QUARTERLY PLAN */}
            <Grid item xs={12} md={4}>
              <Card
                sx={{
                  height: '100%',
                  position: 'relative',
                  overflow: 'visible',
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, rgba(160, 0, 255, 0.1) 0%, rgba(30, 41, 59, 0.9) 100%)',
                  border: '2px solid rgba(160, 0, 255, 0.4)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: '#A000FF',
                    boxShadow: '0 12px 30px rgba(160, 0, 255, 0.25)',
                  },
                }}
              >
                {/* Best Value Badge */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: -10,
                    right: 12,
                    background: 'linear-gradient(135deg, #A000FF 0%, #7700CC 100%)',
                    color: 'white',
                    px: 1.5,
                    py: 0.35,
                    borderRadius: 50,
                    fontWeight: 700,
                    fontSize: '0.65rem',
                    textTransform: 'uppercase',
                    boxShadow: '0 4px 10px rgba(160, 0, 255, 0.4)',
                  }}
                >
                  💎 Best Value
                </Box>
                
                <CardContent sx={{ p: { xs: 2, md: 2.5 }, textAlign: 'center' }}>
                  {/* Plan Icon */}
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #A000FF 0%, #7700CC 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 1.5,
                      boxShadow: '0 4px 16px rgba(160, 0, 255, 0.4)',
                    }}
                  >
                    <Award size={24} color="white" />
                  </Box>
                  
                  <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: '#A000FF', mb: 0.5 }}>
                    Quarterly
                  </Typography>
                  
                  <Box sx={{ mb: 0.5 }}>
                    <Typography component="span" sx={{ fontSize: '2.25rem', fontWeight: 800, color: 'white' }}>
                      $149
                    </Typography>
                    <Typography component="span" sx={{ fontSize: '0.9rem', color: '#888888' }}>
                      /3 months
                    </Typography>
                  </Box>
                  
                  <Box sx={{ bgcolor: 'rgba(160, 0, 255, 0.2)', borderRadius: 50, px: 1.5, py: 0.25, mb: 2, display: 'inline-block' }}>
                    <Typography sx={{ color: '#A000FF', fontSize: '0.75rem', fontWeight: 600 }}>
                      Save 49% vs Weekly
                    </Typography>
                  </Box>
                  
                  <Stack spacing={0.75} sx={{ mb: 2.5, textAlign: 'left' }}>
                    {['Full Bot Access', 'VIP Signal Priority', 'Custom Risk Settings', 'Exclusive Strategies', 'Priority 24/7 Support', '1-on-1 Consultation'].map((feature, i) => (
                      <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircle2 size={14} color="#A000FF" />
                        <Typography sx={{ color: '#FFFFFF', fontSize: '0.8rem', fontWeight: i >= 4 ? 700 : 600 }}>{feature}</Typography>
                      </Box>
                    ))}
                  </Stack>
                  
                  <Button
                    component={Link}
                    href="/auth/register"
                    variant="outlined"
                    fullWidth
                    sx={{
                      py: 1,
                      borderColor: '#A000FF',
                      color: '#A000FF',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      borderWidth: 2,
                      borderRadius: 2,
                      '&:hover': {
                        borderColor: '#A000FF',
                        bgcolor: 'rgba(160, 0, 255, 0.1)',
                        borderWidth: 2,
                      },
                    }}
                  >
                    Get Started
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          </Box>

          {/* Money-back guarantee note - Colorful & Compact */}
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1.5,
                background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(0, 255, 0, 0.15) 50%, rgba(0, 102, 255, 0.15) 100%)',
                border: '2px solid',
                borderColor: 'rgba(0, 255, 0, 0.4)',
                borderRadius: 3,
                px: 3,
                py: 1.5,
                position: 'relative',
                overflow: 'hidden',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: '#22C55E',
                  boxShadow: '0 8px 32px rgba(0, 255, 0, 0.25)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #fbbf24 0%, #22C55E 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)',
                }}
              >
                <Shield size={18} color="black" />
              </Box>
              <Box>
                <Typography 
                  sx={{ 
                    fontSize: '0.95rem', 
                    fontWeight: 800,
                    background: 'linear-gradient(135deg, #fbbf24 0%, #22C55E 50%, #3b82f6 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    letterSpacing: 0.5,
                  }}
                >
                  🛡️ 7-Day Money-Back Guarantee
                </Typography>
                <Typography sx={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.75rem', fontWeight: 600 }}>
                  No questions asked • 100% Risk-Free
                </Typography>
              </Box>
              <Box
                sx={{
                  ml: 1,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 50,
                  background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                  boxShadow: '0 2px 8px rgba(0, 255, 0, 0.4)',
                }}
              >
                <Typography sx={{ color: '#000000', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase' }}>
                  ✓ Protected
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* How It Works Section */}
        <Box sx={{ py: 6 }}>
          <Typography
            variant="h3"
            align="center"
            sx={{
              fontWeight: 800,
              mb: 2,
              fontSize: { xs: '2rem', md: '2.5rem' },
              color: '#22C55E',
              textShadow: '0 2px 10px rgba(0, 255, 0, 0.3)',
            }}
          >
            How It Works
          </Typography>
          <Typography
            align="center"
            sx={{
              mb: 6,
              fontSize: { xs: '1rem', md: '1.1rem' },
              color: '#FFFFFF',
              maxWidth: '700px',
              mx: 'auto',
              fontWeight: 600,
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
                  border: '2px solid rgba(0, 255, 0, 0.3)',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    borderColor: '#22C55E',
                    boxShadow: '0 12px 40px rgba(0, 255, 0, 0.3)',
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 1, md: 2 } }}>
                  <Box
                    sx={{
                      width: { xs: 60, md: 80 },
                      height: { xs: 60, md: 80 },
                      borderRadius: '50%',
                      bgcolor: 'rgba(0, 255, 0, 0.2)',
                      border: '3px solid #22C55E',
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
                        color: '#22C55E',
                      }}
                    >
                      1
                    </Typography>
                  </Box>
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ color: '#22C55E', fontWeight: 800, mb: 2, fontSize: { xs: '1.2rem', md: '1.5rem' } }}
                  >
                    We Install & Set Up
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#FFFFFF', lineHeight: 1.7, fontSize: { xs: '0.9rem', md: '1rem' }, fontWeight: 500 }}>
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
                  border: '2px solid rgba(0, 255, 0, 0.3)',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    borderColor: '#22C55E',
                    boxShadow: '0 12px 40px rgba(0, 255, 0, 0.3)',
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 1, md: 2 } }}>
                  <Box
                    sx={{
                      width: { xs: 60, md: 80 },
                      height: { xs: 60, md: 80 },
                      borderRadius: '50%',
                      bgcolor: 'rgba(0, 255, 0, 0.2)',
                      border: '3px solid #22C55E',
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
                        color: '#22C55E',
                      }}
                    >
                      2
                    </Typography>
                  </Box>
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ color: '#22C55E', fontWeight: 800, mb: 2, fontSize: { xs: '1.2rem', md: '1.5rem' } }}
                  >
                    Algorithm Trades
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#FFFFFF', lineHeight: 1.7, fontSize: { xs: '0.9rem', md: '1rem' }, fontWeight: 500 }}>
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
                  border: '2px solid rgba(0, 255, 0, 0.3)',
                  borderRadius: 3,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    borderColor: '#22C55E',
                    boxShadow: '0 12px 40px rgba(0, 255, 0, 0.3)',
                  },
                }}
              >
                <CardContent sx={{ p: { xs: 1, md: 2 } }}>
                  <Box
                    sx={{
                      width: { xs: 60, md: 80 },
                      height: { xs: 60, md: 80 },
                      borderRadius: '50%',
                      bgcolor: 'rgba(0, 255, 0, 0.2)',
                      border: '3px solid #22C55E',
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
                        color: '#22C55E',
                      }}
                    >
                      3
                    </Typography>
                  </Box>
                  <Typography
                    variant="h5"
                    gutterBottom
                    sx={{ color: '#22C55E', fontWeight: 800, mb: 2, fontSize: { xs: '1.2rem', md: '1.5rem' } }}
                  >
                    Watch Growth
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#FFFFFF', lineHeight: 1.7, fontSize: { xs: '0.9rem', md: '1rem' }, fontWeight: 500 }}>
                    Monitor your performance through real-time dashboards. Track profits, analyze statistics, and watch your account grow.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* Features Section - Moved to Bottom */}
        <Box sx={{ py: 8 }}>
          <Typography
            variant="h4"
            align="center"
            sx={{
              fontWeight: 800,
              mb: 5,
              color: '#22C55E',
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
                  border: '1px solid rgba(0, 255, 0, 0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    borderColor: '#22C55E',
                    boxShadow: '0 8px 32px rgba(0, 255, 0, 0.3)',
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ color: '#22C55E', mb: 2, display: 'flex', justifyContent: 'center' }}>
                    <TrendingUp size={48} />
                  </Box>
                  <Typography variant="h6" gutterBottom sx={{ color: '#22C55E', fontWeight: 800 }}>
                    8 Trading Strategies
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 500 }}>
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
                  border: '1px solid rgba(0, 255, 0, 0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    borderColor: '#22C55E',
                    boxShadow: '0 8px 32px rgba(0, 255, 0, 0.3)',
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ color: '#22C55E', mb: 2, display: 'flex', justifyContent: 'center' }}>
                    <Shield size={48} />
                  </Box>
                  <Typography variant="h6" gutterBottom sx={{ color: '#22C55E', fontWeight: 800 }}>
                    MT5 Integration
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 500 }}>
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
                  border: '1px solid rgba(0, 255, 0, 0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    borderColor: '#22C55E',
                    boxShadow: '0 8px 32px rgba(0, 255, 0, 0.3)',
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ color: '#22C55E', mb: 2, display: 'flex', justifyContent: 'center' }}>
                    <TrendingUp size={48} />
                  </Box>
                  <Typography variant="h6" gutterBottom sx={{ color: '#22C55E', fontWeight: 800 }}>
                    Smart Risk Control
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 500 }}>
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
                  border: '1px solid rgba(0, 255, 0, 0.2)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    borderColor: '#22C55E',
                    boxShadow: '0 8px 32px rgba(0, 255, 0, 0.3)',
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ color: '#22C55E', mb: 2, display: 'flex', justifyContent: 'center' }}>
                    <BarChart3 size={48} />
                  </Box>
                  <Typography variant="h6" gutterBottom sx={{ color: '#22C55E', fontWeight: 800 }}>
                    Live Dashboard
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 500 }}>
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
          mt: { xs: 6, md: 12 },
          borderTop: '1px solid rgba(0, 255, 0, 0.2)',
          bgcolor: 'rgba(10, 15, 26, 0.9)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Container maxWidth="lg" sx={{ px: { xs: 2, sm: 3 } }}>
          {/* Main Footer Content */}
          <Box
            sx={{
              py: { xs: 3, md: 4 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: { xs: 'center', md: 'flex-start' },
              gap: 3,
            }}
          >
            {/* Brand Section */}
            <Box sx={{ maxWidth: { xs: '100%', md: '50%' }, textAlign: { xs: 'center', md: 'left' } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                <Box
                  component="img"
                  src="/images/logo.png"
                  alt="AlgoEdge Logo"
                  sx={{ width: { xs: 40, md: 48 }, height: { xs: 40, md: 48 }, objectFit: 'contain' }}
                />
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 800, 
                    color: 'white',
                    letterSpacing: '0.5px',
                    fontSize: { xs: '1.1rem', md: '1.25rem' }
                  }}
                >
                  <Box component="span" sx={{ color: '#FF0000' }}>Algo</Box><Box component="span" sx={{ color: '#22C55E' }}>Edge</Box>
                </Typography>
              </Box>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'rgba(255,255,255,0.7)',
                  lineHeight: 1.6,
                  fontSize: { xs: '0.85rem', md: '0.875rem' }
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
                p: { xs: 1.5, md: 2 },
                borderRadius: 2,
                bgcolor: 'rgba(0, 255, 0, 0.1)',
                border: '1px solid rgba(0, 255, 0, 0.3)',
                width: { xs: '100%', sm: 'auto' },
                justifyContent: { xs: 'center', sm: 'flex-start' },
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
              py: { xs: 2, md: 3 },
              borderTop: '1px solid rgba(255,255,255,0.1)',
              textAlign: 'center',
            }}
          >
            {/* Quick Links */}
            <Stack 
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ xs: 0.5, sm: 1 }}
              sx={{ 
                justifyContent: 'center', 
                alignItems: 'center',
                mb: 2, 
                flexWrap: 'wrap', 
                gap: { xs: 0.5, sm: 1 } 
              }}
            >
              <Button
                component={Link}
                href="/blog"
                sx={{ 
                  color: 'rgba(255,255,255,0.7)', 
                  textTransform: 'none',
                  fontSize: { xs: '0.9rem', sm: '0.875rem' },
                  py: { xs: 1, sm: 0.5 },
                  px: { xs: 2, sm: 1.5 },
                  minHeight: 44, // Touch-friendly
                  '&:hover': { color: '#00c853' }
                }}
              >
                📚 Blog & Guides
              </Button>
              <Button
                component={Link}
                href="/auth/pricing"
                sx={{ 
                  color: 'rgba(255,255,255,0.7)', 
                  textTransform: 'none',
                  fontSize: { xs: '0.9rem', sm: '0.875rem' },
                  py: { xs: 1, sm: 0.5 },
                  px: { xs: 2, sm: 1.5 },
                  minHeight: 44,
                  '&:hover': { color: '#00c853' }
                }}
              >
                💰 Pricing
              </Button>
              <Button
                component={Link}
                href="/auth/register"
                sx={{ 
                  color: 'rgba(255,255,255,0.7)', 
                  textTransform: 'none',
                  fontSize: { xs: '0.9rem', sm: '0.875rem' },
                  py: { xs: 1, sm: 0.5 },
                  px: { xs: 2, sm: 1.5 },
                  minHeight: 44,
                  '&:hover': { color: '#00c853' }
                }}
              >
                🚀 Get Started
              </Button>
              <Button
                component={Link}
                href="/affiliate"
                sx={{ 
                  color: 'rgba(255,255,255,0.7)', 
                  textTransform: 'none',
                  fontSize: { xs: '0.9rem', sm: '0.875rem' },
                  py: { xs: 1, sm: 0.5 },
                  px: { xs: 2, sm: 1.5 },
                  minHeight: 44,
                  '&:hover': { color: '#00c853' }
                }}
              >
                🤝 Affiliate Program
              </Button>
            </Stack>
            
            {/* Support & Legal Links */}
            <Stack 
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ xs: 0.5, sm: 1 }}
              sx={{ 
                justifyContent: 'center', 
                alignItems: 'center',
                mb: 2, 
                flexWrap: 'wrap', 
                gap: { xs: 0.5, sm: 1 } 
              }}
            >
              <Button
                component={Link}
                href="/faq"
                sx={{ 
                  color: 'rgba(255,255,255,0.5)', 
                  textTransform: 'none',
                  fontSize: { xs: '0.8rem', sm: '0.75rem' },
                  py: { xs: 0.5, sm: 0.25 },
                  px: { xs: 1.5, sm: 1 },
                  minHeight: 36,
                  '&:hover': { color: '#00c853' }
                }}
              >
                FAQ
              </Button>
              <Button
                component={Link}
                href="/support"
                sx={{ 
                  color: 'rgba(255,255,255,0.5)', 
                  textTransform: 'none',
                  fontSize: { xs: '0.8rem', sm: '0.75rem' },
                  py: { xs: 0.5, sm: 0.25 },
                  px: { xs: 1.5, sm: 1 },
                  minHeight: 36,
                  '&:hover': { color: '#00c853' }
                }}
              >
                Support
              </Button>
              <Button
                component={Link}
                href="/testimonials"
                sx={{ 
                  color: 'rgba(255,255,255,0.5)', 
                  textTransform: 'none',
                  fontSize: { xs: '0.8rem', sm: '0.75rem' },
                  py: { xs: 0.5, sm: 0.25 },
                  px: { xs: 1.5, sm: 1 },
                  minHeight: 36,
                  '&:hover': { color: '#00c853' }
                }}
              >
                Testimonials
              </Button>
              <Button
                component={Link}
                href="/privacy-policy"
                sx={{ 
                  color: 'rgba(255,255,255,0.5)', 
                  textTransform: 'none',
                  fontSize: { xs: '0.8rem', sm: '0.75rem' },
                  py: { xs: 0.5, sm: 0.25 },
                  px: { xs: 1.5, sm: 1 },
                  minHeight: 36,
                  '&:hover': { color: '#00c853' }
                }}
              >
                Privacy Policy
              </Button>
              <Button
                component={Link}
                href="/terms-and-conditions"
                sx={{ 
                  color: 'rgba(255,255,255,0.5)', 
                  textTransform: 'none',
                  fontSize: { xs: '0.8rem', sm: '0.75rem' },
                  py: { xs: 0.5, sm: 0.25 },
                  px: { xs: 1.5, sm: 1 },
                  minHeight: 36,
                  '&:hover': { color: '#00c853' }
                }}
              >
                Terms & Conditions
              </Button>
            </Stack>
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mb: 1, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
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
