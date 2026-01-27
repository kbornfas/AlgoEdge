'use client';

import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Button,
  Stack,
  Chip,
  Avatar,
} from '@mui/material';
import {
  Users,
  DollarSign,
  TrendingUp,
  Share2,
  CheckCircle,
  Zap,
  Shield,
  Clock,
  Rocket,
  Star,
  ArrowRight,
  Gift,
  Wallet,
  Target,
  Globe,
  Award,
} from 'lucide-react';
import Link from 'next/link';

// Compact stat card
const StatCard = ({ icon: Icon, value, label, color }: any) => (
  <Box sx={{ textAlign: 'center' }}>
    <Box
      sx={{
        width: 56,
        height: 56,
        borderRadius: '14px',
        bgcolor: `${color}15`,
        border: `1px solid ${color}30`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        mx: 'auto',
        mb: 1.5,
      }}
    >
      <Icon size={24} color={color} />
    </Box>
    <Typography sx={{ fontSize: '1.75rem', fontWeight: 800, color: 'white' }}>{value}</Typography>
    <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>{label}</Typography>
  </Box>
);

// Feature card
const FeatureCard = ({ icon: Icon, title, description, color }: any) => (
  <Box
    sx={{
      p: 2.5,
      borderRadius: 2,
      bgcolor: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 2,
      transition: 'all 0.2s',
      '&:hover': {
        bgcolor: 'rgba(255,255,255,0.04)',
        borderColor: `${color}30`,
      },
    }}
  >
    <Box
      sx={{
        width: 40,
        height: 40,
        borderRadius: '10px',
        bgcolor: `${color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon size={20} color={color} />
    </Box>
    <Box>
      <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '0.95rem', mb: 0.3 }}>
        {title}
      </Typography>
      <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', lineHeight: 1.5 }}>
        {description}
      </Typography>
    </Box>
  </Box>
);

// Commission card
const CommissionCard = ({ plan, price, commission, period, popular }: any) => (
  <Box
    sx={{
      p: 2.5,
      borderRadius: 2,
      bgcolor: popular ? 'rgba(34, 197, 94, 0.08)' : 'rgba(255,255,255,0.02)',
      border: popular ? '1px solid rgba(34, 197, 94, 0.3)' : '1px solid rgba(255,255,255,0.06)',
      position: 'relative',
      textAlign: 'center',
    }}
  >
    {popular && (
      <Chip
        label="POPULAR"
        size="small"
        sx={{
          position: 'absolute',
          top: -10,
          right: 12,
          bgcolor: '#22C55E',
          color: 'white',
          fontWeight: 700,
          fontSize: '0.65rem',
          height: 20,
        }}
      />
    )}
    <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', mb: 0.5 }}>{plan}</Typography>
    <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1.1rem' }}>${price}<span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>/{period}</span></Typography>
    <Box sx={{ my: 1.5, height: 1, bgcolor: 'rgba(255,255,255,0.05)' }} />
    <Typography sx={{ color: '#22C55E', fontWeight: 800, fontSize: '1.5rem' }}>${commission.toFixed(2)}</Typography>
    <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>per referral</Typography>
  </Box>
);

// Step card
const StepCard = ({ step, title, description, icon: Icon }: any) => (
  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
    <Box
      sx={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        bgcolor: '#22C55E',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontWeight: 800,
        color: 'white',
        fontSize: '0.9rem',
      }}
    >
      {step}
    </Box>
    <Box>
      <Typography sx={{ color: 'white', fontWeight: 600, mb: 0.3 }}>{title}</Typography>
      <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', lineHeight: 1.5 }}>
        {description}
      </Typography>
    </Box>
  </Box>
);

// Testimonial card
const TestimonialCard = ({ name, role, earnings, avatar, text }: any) => (
  <Box
    sx={{
      p: 2.5,
      borderRadius: 2,
      bgcolor: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}
  >
    <Stack direction="row" spacing={1.5} alignItems="center" mb={1.5}>
      <Avatar src={avatar} sx={{ width: 40, height: 40, bgcolor: '#22C55E' }}>
        {name.charAt(0)}
      </Avatar>
      <Box>
        <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>{name}</Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>{role}</Typography>
      </Box>
      <Chip
        label={earnings}
        size="small"
        sx={{ ml: 'auto', bgcolor: 'rgba(34, 197, 94, 0.15)', color: '#22C55E', fontWeight: 700, fontSize: '0.7rem' }}
      />
    </Stack>
    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', lineHeight: 1.6, fontStyle: 'italic' }}>
      "{text}"
    </Typography>
  </Box>
);

export default function AffiliatePage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a' }}>
      {/* Subtle gradient background */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(ellipse at 20% 20%, rgba(34, 197, 94, 0.08) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(59, 130, 246, 0.06) 0%, transparent 50%)',
          pointerEvents: 'none',
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: { xs: 3, md: 6 } }}>
        {/* Hero Section - Compact */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Chip
            icon={<Gift size={14} />}
            label="AFFILIATE PROGRAM"
            sx={{
              mb: 2,
              bgcolor: 'rgba(34, 197, 94, 0.1)',
              color: '#22C55E',
              fontWeight: 700,
              border: '1px solid rgba(34, 197, 94, 0.3)',
              '& .MuiChip-icon': { color: '#22C55E' },
            }}
          />
          <Typography
            variant="h2"
            sx={{
              fontWeight: 900,
              fontSize: { xs: '2rem', md: '3rem' },
              mb: 1.5,
              background: 'linear-gradient(135deg, #22C55E 0%, #10B981 50%, #059669 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Earn Up to 20% Commission
          </Typography>
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.6)',
              fontSize: { xs: '1rem', md: '1.15rem' },
              maxWidth: 600,
              mx: 'auto',
              mb: 3,
              lineHeight: 1.6,
            }}
          >
            Join thousands of partners earning <strong style={{ color: '#22C55E' }}>recurring passive income</strong> by referring traders to AlgoEdge.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
            <Button
              component={Link}
              href="/auth/register"
              variant="contained"
              size="large"
              startIcon={<Rocket size={20} />}
              sx={{
                bgcolor: '#22C55E',
                px: 4,
                py: 1.5,
                fontWeight: 700,
                borderRadius: 2,
                '&:hover': { bgcolor: '#16A34A' },
              }}
            >
              Start Earning Today
            </Button>
            <Button
              component={Link}
              href="/auth/login"
              variant="outlined"
              size="large"
              sx={{
                borderColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                px: 4,
                py: 1.5,
                borderRadius: 2,
                '&:hover': { borderColor: '#22C55E', color: '#22C55E' },
              }}
            >
              Login to Dashboard
            </Button>
          </Stack>
        </Box>

        {/* Stats Row */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          <Grid item xs={6} sm={3}>
            <StatCard icon={DollarSign} value="$2.5M+" label="Paid Out" color="#22C55E" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard icon={Users} value="5,000+" label="Active Partners" color="#3B82F6" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard icon={Star} value="93%" label="Satisfaction" color="#F59E0B" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard icon={Clock} value="24h" label="Payout Speed" color="#8B5CF6" />
          </Grid>
        </Grid>

        {/* Two Column Layout */}
        <Grid container spacing={4} sx={{ mb: 6 }}>
          {/* Left: Commission Rates */}
          <Grid item xs={12} md={5}>
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                height: '100%',
              }}
            >
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, mb: 0.5 }}>
                💰 Commission Rates
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', mb: 3 }}>
                Earn 10% on every subscription
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <CommissionCard plan="Weekly" price={19} commission={1.90} period="wk" />
                </Grid>
                <Grid item xs={4}>
                  <CommissionCard plan="Monthly" price={49} commission={4.90} period="mo" popular />
                </Grid>
                <Grid item xs={4}>
                  <CommissionCard plan="Quarterly" price={149} commission={14.90} period="qtr" />
                </Grid>
              </Grid>

              <Box sx={{ mt: 3, p: 2, borderRadius: 2, bgcolor: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.15)' }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <TrendingUp size={18} color="#22C55E" />
                  <Typography sx={{ color: '#22C55E', fontWeight: 600, fontSize: '0.9rem' }}>
                    Recurring Earnings
                  </Typography>
                </Stack>
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', mt: 0.5 }}>
                  Earn commission every time your referral renews - for their entire lifetime!
                </Typography>
              </Box>
            </Box>
          </Grid>

          {/* Right: How It Works */}
          <Grid item xs={12} md={7}>
            <Box
              sx={{
                p: 3,
                borderRadius: 3,
                bgcolor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                height: '100%',
              }}
            >
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, mb: 3 }}>
                🚀 How It Works
              </Typography>
              
              <Stack spacing={3}>
                <StepCard
                  step={1}
                  title="Sign Up Free"
                  description="Create your AlgoEdge account in 30 seconds. Get your unique referral link instantly."
                  icon={Users}
                />
                <StepCard
                  step={2}
                  title="Share Your Link"
                  description="Share via social media, YouTube, blog, or direct messages. 90-day cookie tracking."
                  icon={Share2}
                />
                <StepCard
                  step={3}
                  title="Get Paid"
                  description="Earn 10-20% on every sale. Withdraw via M-Pesa, PayPal, or crypto ($50 min)."
                  icon={Wallet}
                />
              </Stack>

              <Button
                component={Link}
                href="/auth/register"
                fullWidth
                variant="contained"
                endIcon={<ArrowRight size={18} />}
                sx={{
                  mt: 3,
                  bgcolor: '#22C55E',
                  py: 1.5,
                  fontWeight: 700,
                  borderRadius: 2,
                  '&:hover': { bgcolor: '#16A34A' },
                }}
              >
                Get Your Referral Link
              </Button>
            </Box>
          </Grid>
        </Grid>

        {/* Benefits Grid */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, mb: 3, textAlign: 'center' }}>
            ✨ Why Partners Love Us
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <FeatureCard
                icon={DollarSign}
                title="Lifetime Commissions"
                description="Earn forever as long as your referral stays subscribed"
                color="#22C55E"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FeatureCard
                icon={Zap}
                title="Instant Tracking"
                description="Real-time dashboard shows all clicks, signups & earnings"
                color="#F59E0B"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FeatureCard
                icon={Shield}
                title="90-Day Cookies"
                description="Get credit even if they sign up weeks after clicking"
                color="#3B82F6"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FeatureCard
                icon={Clock}
                title="Fast Payouts"
                description="Request payout anytime, receive within 24-48 hours"
                color="#8B5CF6"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FeatureCard
                icon={Target}
                title="Marketing Materials"
                description="Get banners, copy, and assets to boost conversions"
                color="#EC4899"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={4}>
              <FeatureCard
                icon={Award}
                title="Tier Bonuses"
                description="Unlock up to 20% commission as you grow"
                color="#EF4444"
              />
            </Grid>
          </Grid>
        </Box>

        {/* Testimonials */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, mb: 3, textAlign: 'center' }}>
            💬 Partner Success Stories
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <TestimonialCard
                name="James K."
                role="Finance Blogger"
                earnings="$4,230/mo"
                avatar="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
                text="Best affiliate program I've joined. The recurring commissions are a game changer - I'm earning from referrals I made 6 months ago!"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TestimonialCard
                name="Sarah M."
                role="YouTube Creator"
                earnings="$2,890/mo"
                avatar="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face"
                text="Super easy to promote since the product actually works. My audience loves it and my commissions keep growing every month."
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TestimonialCard
                name="David O."
                role="Telegram Admin"
                earnings="$1,650/mo"
                avatar="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face"
                text="Started sharing in my trading group 3 months ago. Already at Silver tier with 12% commission. Payouts are always on time!"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TestimonialCard
                name="Michelle T."
                role="Trading Educator"
                earnings="$3,450/mo"
                avatar="https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face"
                text="My students needed a reliable trading platform. AlgoEdge delivers results, so promoting it feels natural. The 15% Gold tier commission is amazing!"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TestimonialCard
                name="Marcus W."
                role="Forex Signal Provider"
                earnings="$5,120/mo"
                avatar="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
                text="Hit Diamond tier in just 4 months. The real-time dashboard makes tracking easy and the support team is incredibly responsive. Top-notch program!"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <TestimonialCard
                name="Aisha N."
                role="Instagram Influencer"
                earnings="$2,340/mo"
                avatar="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&h=150&fit=crop&crop=face"
                text="Love how the marketing materials are ready to use. Started posting about AlgoEdge and commissions started flowing within the first week!"
              />
            </Grid>
          </Grid>
        </Box>

        {/* Tiers Preview */}
        <Box
          sx={{
            p: 3,
            borderRadius: 3,
            bgcolor: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            mb: 6,
          }}
        >
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, mb: 3, textAlign: 'center' }}>
            🏆 Tier System - Unlock Higher Commissions
          </Typography>
          <Grid container spacing={2} justifyContent="center">
            {[
              { name: 'Bronze', emoji: '🥉', rate: '10%', req: 'All affiliates', color: '#CD7F32' },
              { name: 'Silver', emoji: '🥈', rate: '12%', req: '10+ referrals', color: '#C0C0C0' },
              { name: 'Gold', emoji: '🥇', rate: '15%', req: '25+ referrals', color: '#FFD700' },
              { name: 'Diamond', emoji: '💎', rate: '18%', req: '50+ referrals', color: '#00CED1' },
              { name: 'Elite', emoji: '👑', rate: '20%', req: '100+ referrals', color: '#A855F7' },
            ].map((tier) => (
              <Grid item xs={6} sm={4} md={2.4} key={tier.name}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    bgcolor: `${tier.color}08`,
                    border: `1px solid ${tier.color}30`,
                    textAlign: 'center',
                  }}
                >
                  <Typography sx={{ fontSize: '1.5rem', mb: 0.5 }}>{tier.emoji}</Typography>
                  <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>{tier.name}</Typography>
                  <Typography sx={{ color: tier.color, fontWeight: 800, fontSize: '1.25rem' }}>{tier.rate}</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>{tier.req}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Final CTA */}
        <Box
          sx={{
            p: 4,
            borderRadius: 3,
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.05) 100%)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            textAlign: 'center',
          }}
        >
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, mb: 1 }}>
            Ready to Start Earning?
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.6)', mb: 3, maxWidth: 500, mx: 'auto' }}>
            Join 5,000+ partners already earning with AlgoEdge. It takes less than a minute to get started.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
            <Button
              component={Link}
              href="/auth/register"
              variant="contained"
              size="large"
              startIcon={<Rocket size={20} />}
              sx={{
                bgcolor: '#22C55E',
                px: 5,
                py: 1.5,
                fontWeight: 700,
                borderRadius: 2,
                '&:hover': { bgcolor: '#16A34A' },
              }}
            >
              Become an Affiliate
            </Button>
            <Button
              component={Link}
              href="/"
              variant="outlined"
              size="large"
              sx={{
                borderColor: 'rgba(255,255,255,0.2)',
                color: 'white',
                px: 4,
                py: 1.5,
                borderRadius: 2,
                '&:hover': { borderColor: 'white' },
              }}
            >
              Back to Home
            </Button>
          </Stack>
        </Box>

        {/* FAQ Compact */}
        <Box sx={{ mt: 6 }}>
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, mb: 3, textAlign: 'center' }}>
            ❓ Quick FAQ
          </Typography>
          <Grid container spacing={2}>
            {[
              { q: 'How do I get paid?', a: 'M-Pesa, PayPal, or crypto. Payouts processed within 48hrs.' },
              { q: 'What\'s the minimum payout?', a: '$50 for new affiliates, $0 for Gold tier and above.' },
              { q: 'How long do cookies last?', a: '90 days - you get credit even if they sign up later.' },
              { q: 'Can I promote on social media?', a: 'Yes! We provide banners, videos, and copy to use.' },
            ].map((faq, i) => (
              <Grid item xs={12} sm={6} key={i}>
                <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '0.9rem', mb: 0.5 }}>{faq.q}</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{faq.a}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}
