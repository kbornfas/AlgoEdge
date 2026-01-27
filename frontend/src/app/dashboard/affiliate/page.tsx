'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Divider,
  TextField,
  IconButton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Users,
  DollarSign,
  TrendingUp,
  Gift,
  Share2,
  CheckCircle,
  Copy,
  Zap,
  Shield,
  Clock,
  Wallet,
  Send,
  X,
  Smartphone,
  Bitcoin,
} from 'lucide-react';
import Link from 'next/link';

// Animated background - reduced for mobile
const AnimatedBackground = () => (
  <Box
    sx={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      overflow: 'hidden',
      zIndex: 0,
      pointerEvents: 'none',
    }}
  >
    <Box
      sx={{
        position: 'absolute',
        width: { xs: '300px', md: '600px' },
        height: { xs: '300px', md: '600px' },
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34, 197, 94, 0.15) 0%, transparent 70%)',
        top: '-10%',
        right: '-15%',
        animation: 'float1 20s ease-in-out infinite',
        '@keyframes float1': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(-30px, 30px)' },
        },
      }}
    />
    <Box
      sx={{
        position: 'absolute',
        width: { xs: '250px', md: '500px' },
        height: { xs: '250px', md: '500px' },
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(0, 102, 255, 0.12) 0%, transparent 70%)',
        bottom: '10%',
        left: '-15%',
        animation: 'float2 25s ease-in-out infinite',
        '@keyframes float2': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(40px, -30px)' },
        },
      }}
    />
  </Box>
);

// Compact Glass Card
const GlassCard = ({ children, borderColor = 'rgba(255,255,255,0.1)', sx = {}, ...props }: any) => (
  <Box
    sx={{
      background: 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      backdropFilter: 'blur(10px)',
      border: `1px solid ${borderColor}`,
      borderRadius: 2,
      ...sx,
    }}
    {...props}
  >
    {children}
  </Box>
);

const tiers = [
  { name: 'Bronze', emoji: '🥉', commission: '10%', minReferrals: 0, color: '#CD7F32' },
  { name: 'Silver', emoji: '🥈', commission: '12%', minReferrals: 10, color: '#C0C0C0' },
  { name: 'Gold', emoji: '🥇', commission: '15%', minReferrals: 25, color: '#FFD700' },
  { name: 'Diamond', emoji: '💎', commission: '18%', minReferrals: 50, color: '#00CED1' },
  { name: 'Elite', emoji: '👑', commission: '20%', minReferrals: 100, color: '#A000FF' },
];

const commissionRates = [
  { plan: 'Weekly', price: 19, commission: 1.90, color: '#0066FF' },
  { plan: 'Monthly', price: 49, commission: 4.90, color: '#22C55E' },
  { plan: 'Quarterly', price: 149, commission: 14.90, color: '#A000FF' },
];

interface AffiliateStats {
  referralCode: string;
  referralLink: string;
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
  availableBalance: number;
  currentTier: string;
  commissionRate: number;
  referrals: Array<{
    id: number;
    username: string;
    status: string;
    joinedAt: string;
    plan: string;
    commission: number;
  }>;
}

export default function DashboardAffiliatePage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [payoutDialog, setPayoutDialog] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState('');
  const [payoutDetails, setPayoutDetails] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);
  const [payoutError, setPayoutError] = useState('');
  const [isAffiliate, setIsAffiliate] = useState<boolean | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);

  useEffect(() => {
    checkAffiliateStatus();
  }, []);

  const checkAffiliateStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/profile/status/affiliate`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setIsAffiliate(data.is_affiliate);
        if (data.application) {
          setApplicationStatus(data.application.status);
        }
        if (data.is_affiliate) {
          fetchAffiliateStats();
        } else {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to check affiliate status:', error);
      setLoading(false);
    }
  };

  const fetchAffiliateStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/affiliate/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch affiliate stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePayoutRequest = async () => {
    setPayoutLoading(true);
    setPayoutError('');
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/affiliate/payout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount: parseFloat(payoutAmount), method: payoutMethod, details: payoutDetails }),
      });
      const data = await response.json();
      if (response.ok) {
        setPayoutSuccess(true);
        setPayoutDialog(false);
        fetchAffiliateStats();
      } else {
        setPayoutError(data.error || 'Payout request failed');
      }
    } catch (error) {
      setPayoutError('Failed to process payout request');
    } finally {
      setPayoutLoading(false);
    }
  };

  const getCurrentTier = () => {
    if (!stats) return tiers[0];
    const activeCount = stats.activeReferrals || 0;
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (activeCount >= tiers[i].minReferrals) return tiers[i];
    }
    return tiers[0];
  };

  const getNextTier = () => {
    const current = getCurrentTier();
    const idx = tiers.findIndex(t => t.name === current.name);
    return idx < tiers.length - 1 ? tiers[idx + 1] : null;
  };

  const currentTier = getCurrentTier();
  const nextTier = getNextTier();

  // Show Become an Affiliate screen for non-affiliates
  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Skeleton variant="circular" width={60} height={60} sx={{ mx: 'auto', mb: 2 }} />
          <Skeleton variant="text" width={200} height={40} sx={{ mx: 'auto' }} />
        </Box>
      </Box>
    );
  }

  if (isAffiliate === false) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', py: { xs: 3, sm: 8 }, position: 'relative' }}>
        <AnimatedBackground />
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, px: { xs: 1.5, sm: 3 } }}>
          <GlassCard borderColor="rgba(34, 197, 94, 0.3)" sx={{ p: { xs: 2.5, sm: 4, md: 6 }, textAlign: 'center' }}>
            <Share2 size={isMobile ? 48 : 64} color="#22C55E" style={{ marginBottom: isMobile ? 16 : 24 }} />
            
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, mb: 1.5, fontSize: { xs: '1.3rem', sm: '1.8rem', md: '2rem' } }}>
              Become an Affiliate
            </Typography>
            
            <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 3, maxWidth: 500, mx: 'auto', fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } }}>
              Join our affiliate program and earn commissions by referring new users. 
              Start earning passive income today!
            </Typography>

            {applicationStatus === 'pending' && (
              <Alert severity="info" sx={{ mb: 3, maxWidth: 400, mx: 'auto', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Your affiliate application is under review. We&apos;ll notify you once approved.
              </Alert>
            )}

            <Box sx={{ mb: 3 }}>
              <Grid container spacing={{ xs: 1.5, sm: 3 }} justifyContent="center">
                {tiers.slice(0, 3).map((tier) => (
                  <Grid item xs={4} sm={4} key={tier.name}>
                    <Box sx={{ 
                      p: { xs: 1.25, sm: 2 }, 
                      borderRadius: 2, 
                      bgcolor: 'rgba(255,255,255,0.03)',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}>
                      <Typography sx={{ fontSize: { xs: '1.1rem', sm: '1.5rem' }, mb: 0.5 }}>{tier.emoji}</Typography>
                      <Typography sx={{ color: tier.color, fontWeight: 700, mb: 0.25, fontSize: { xs: '0.65rem', sm: '0.85rem' } }}>
                        {tier.name}
                      </Typography>
                      <Typography sx={{ color: '#22C55E', fontWeight: 800, fontSize: { xs: '0.9rem', sm: '1.2rem' } }}>
                        {tier.commission}
                      </Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: { xs: '0.55rem', sm: '0.75rem' } }}>
                        {tier.minReferrals}+ refs
                      </Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CheckCircle size={14} color="#22C55E" />
                <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: { xs: '0.65rem', sm: '0.85rem' } }}>
                  Up to 20% commission
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CheckCircle size={14} color="#22C55E" />
                <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: { xs: '0.65rem', sm: '0.85rem' } }}>
                  Weekly payouts
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CheckCircle size={14} color="#22C55E" />
                <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: { xs: '0.65rem', sm: '0.85rem' } }}>
                  Unique link
                </Typography>
              </Box>
            </Box>

            <Button
              variant="contained"
              size={isMobile ? 'medium' : 'large'}
              component={Link}
              href="/dashboard/affiliate/apply"
              disabled={applicationStatus === 'pending'}
              sx={{
                mt: { xs: 2.5, sm: 4 },
                background: applicationStatus === 'pending' 
                  ? 'rgba(255,255,255,0.1)' 
                  : 'linear-gradient(135deg, #22C55E 0%, #0066FF 100%)',
                color: 'white',
                fontWeight: 700,
                px: { xs: 3, sm: 6 },
                py: { xs: 1, sm: 1.5 },
                fontSize: { xs: '0.8rem', sm: '1rem' },
              }}
            >
              {applicationStatus === 'pending' ? 'Application Pending' : (isMobile ? 'Apply Now' : 'Apply to Become an Affiliate')}
            </Button>
          </GlassCard>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', position: 'relative' }}>
      <AnimatedBackground />
      
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: { xs: 1.5, md: 4 }, px: { xs: 1, sm: 2, md: 3 } }}>
        {/* Header with Stats */}
        <GlassCard borderColor="rgba(34, 197, 94, 0.2)" sx={{ p: { xs: 1.5, sm: 2, md: 3 }, mb: 2 }}>
          {/* Tier Badge */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1.5, flexWrap: 'wrap' }}>
            <Typography sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }}>{currentTier.emoji}</Typography>
            <Chip
              label={`${currentTier.name} • ${currentTier.commission}`}
              size="small"
              sx={{ bgcolor: `${currentTier.color}20`, color: currentTier.color, fontWeight: 700, fontSize: { xs: '0.65rem', sm: '0.75rem' }, height: { xs: 22, sm: 26 } }}
            />
          </Box>

          {/* Title */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.8rem' },
              mb: 0.5,
              background: 'linear-gradient(135deg, #22C55E 0%, #0066FF 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Affiliate Dashboard
          </Typography>
          
          <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.85rem' }, mb: 1.5 }}>
            Share your link and earn {currentTier.commission} on every subscription
          </Typography>

          {/* Referral Link */}
          <Box
            sx={{
              p: { xs: 1, sm: 1.5 },
              borderRadius: 1.5,
              bgcolor: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: { xs: 0.5, sm: 1 },
              mb: 1.5,
            }}
          >
            <Box sx={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
              <Typography
                sx={{
                  color: 'white',
                  fontSize: { xs: '0.6rem', sm: '0.7rem', md: '0.85rem' },
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {loading ? 'Loading...' : (stats?.referralLink || 'Sign up to get your referral link')}
              </Typography>
            </Box>
            <Button
              size="small"
              onClick={() => stats?.referralLink && copyToClipboard(stats.referralLink)}
              startIcon={copied ? <CheckCircle size={12} /> : <Copy size={12} />}
              sx={{
                minWidth: 'auto',
                px: { xs: 1, sm: 1.5 },
                py: 0.5,
                bgcolor: copied ? '#22C55E' : 'rgba(34, 197, 94, 0.2)',
                color: copied ? 'white' : '#22C55E',
                fontSize: { xs: '0.65rem', sm: '0.75rem' },
                flexShrink: 0,
                '&:hover': { bgcolor: '#22C55E', color: 'white' },
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </Box>

          {/* Stats Grid - 2x2 on mobile */}
          <Grid container spacing={0.75}>
            {[
              { label: 'Balance', value: `$${Number(stats?.availableBalance || 0).toFixed(2)}`, color: '#22C55E' },
              { label: 'Earned', value: `$${Number(stats?.totalEarnings || 0).toFixed(2)}`, color: '#0066FF' },
              { label: 'Referrals', value: stats?.totalReferrals || 0, color: '#FFD700' },
              { label: 'Active', value: stats?.activeReferrals || 0, color: '#A000FF' },
            ].map((stat, i) => (
              <Grid item xs={6} sm={3} key={i}>
                <Box sx={{ p: { xs: 1, sm: 1.5 }, borderRadius: 1.5, bgcolor: 'rgba(0,0,0,0.2)', textAlign: 'center' }}>
                  {loading ? (
                    <Skeleton width="60%" sx={{ mx: 'auto', bgcolor: 'rgba(255,255,255,0.1)' }} />
                  ) : (
                    <Typography sx={{ fontSize: { xs: '0.9rem', sm: '1.1rem', md: '1.4rem' }, fontWeight: 800, color: stat.color }}>
                      {stat.value}
                    </Typography>
                  )}
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>{stat.label}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Payout Button */}
          <Button
            fullWidth
            size="small"
            onClick={() => setPayoutDialog(true)}
            startIcon={<Wallet size={14} />}
            disabled={!stats || stats.availableBalance < 50}
            sx={{
              mt: 1.5,
              py: { xs: 0.75, sm: 1 },
              bgcolor: '#22C55E',
              fontWeight: 700,
              fontSize: { xs: '0.7rem', sm: '0.85rem' },
              '&:hover': { bgcolor: '#16A34A' },
              '&:disabled': { bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' },
            }}
          >
            {stats && Number(stats.availableBalance) >= 50 ? 'Request Payout' : `$${(50 - Number(stats?.availableBalance || 0)).toFixed(0)} more to withdraw`}
          </Button>
        </GlassCard>

        {/* Tier Progress */}
        {nextTier && (
          <GlassCard sx={{ p: { xs: 1.5, sm: 2 }, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
              <Typography sx={{ color: 'white', fontSize: { xs: '0.75rem', sm: '0.85rem' }, fontWeight: 600 }}>
                {currentTier.emoji} → {nextTier.emoji}
              </Typography>
              <Typography sx={{ color: nextTier.color, fontSize: { xs: '0.7rem', sm: '0.8rem' }, fontWeight: 700 }}>
                {stats?.activeReferrals || 0}/{nextTier.minReferrals}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(((stats?.activeReferrals || 0) / nextTier.minReferrals) * 100, 100)}
              sx={{
                height: { xs: 6, sm: 8 },
                borderRadius: 4,
                bgcolor: 'rgba(255,255,255,0.1)',
                '& .MuiLinearProgress-bar': { bgcolor: nextTier.color, borderRadius: 4 },
              }}
            />
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: { xs: '0.6rem', sm: '0.7rem' }, mt: 0.5 }}>
              {nextTier.minReferrals - (stats?.activeReferrals || 0)} more for {nextTier.commission}
            </Typography>
          </GlassCard>
        )}

        {/* Commission Rates - Horizontal scroll on mobile */}
        <Typography sx={{ color: 'white', fontWeight: 700, fontSize: { xs: '0.85rem', sm: '1rem' }, mb: 1 }}>
          Commission Rates
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2, overflowX: 'auto', pb: 0.5, mx: { xs: -1, sm: 0 }, px: { xs: 1, sm: 0 }, '::-webkit-scrollbar': { height: 4 } }}>
          {commissionRates.map((rate) => (
            <GlassCard
              key={rate.plan}
              borderColor={`${rate.color}30`}
              sx={{ p: { xs: 1.25, sm: 2 }, minWidth: { xs: 90, sm: 120, md: 150 }, textAlign: 'center', flex: { xs: '0 0 auto', md: 1 } }}
            >
              <Typography sx={{ color: rate.color, fontSize: { xs: '0.6rem', sm: '0.75rem' }, fontWeight: 600, textTransform: 'uppercase' }}>
                {rate.plan}
              </Typography>
              <Typography sx={{ color: 'white', fontSize: { xs: '1.1rem', sm: '1.5rem' }, fontWeight: 900 }}>
                ${rate.commission.toFixed(2)}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: { xs: '0.55rem', sm: '0.65rem' } }}>
                per referral
              </Typography>
            </GlassCard>
          ))}
        </Box>

        {/* Tier System - Compact horizontal scroll */}
        <Typography sx={{ color: 'white', fontWeight: 700, fontSize: { xs: '0.85rem', sm: '1rem' }, mb: 1 }}>
          Tier System
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2, overflowX: 'auto', pb: 0.5, mx: { xs: -1, sm: 0 }, px: { xs: 1, sm: 0 }, '::-webkit-scrollbar': { height: 4 } }}>
          {tiers.map((tier) => (
            <GlassCard
              key={tier.name}
              borderColor={tier.name === currentTier.name ? tier.color : `${tier.color}30`}
              sx={{
                p: { xs: 1, sm: 1.5 },
                minWidth: { xs: 70, sm: 100 },
                textAlign: 'center',
                flex: '0 0 auto',
                ...(tier.name === currentTier.name && { boxShadow: `0 0 15px ${tier.color}40` }),
              }}
            >
              {tier.name === currentTier.name && (
                <Chip label="YOU" size="small" sx={{ bgcolor: tier.color, color: '#000', fontSize: '0.5rem', height: 14, mb: 0.25 }} />
              )}
              <Typography sx={{ fontSize: { xs: '1.1rem', sm: '1.5rem' } }}>{tier.emoji}</Typography>
              <Typography sx={{ color: tier.color, fontSize: { xs: '0.6rem', sm: '0.75rem' }, fontWeight: 700 }}>{tier.name}</Typography>
              <Typography sx={{ color: 'white', fontSize: { xs: '0.85rem', sm: '1.1rem' }, fontWeight: 800 }}>{tier.commission}</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: { xs: '0.5rem', sm: '0.6rem' } }}>
                {tier.minReferrals}+ refs
              </Typography>
            </GlassCard>
          ))}
        </Box>

        {/* How It Works - Compact */}
        <Typography sx={{ color: 'white', fontWeight: 700, fontSize: { xs: '0.85rem', sm: '1rem' }, mb: 1 }}>
          How It Works
        </Typography>
        <Grid container spacing={1} sx={{ mb: 2 }}>
          {[
            { step: 1, title: 'Copy Link', icon: <Copy size={14} />, color: '#22C55E' },
            { step: 2, title: 'Share', icon: <Share2 size={14} />, color: '#0066FF' },
            { step: 3, title: 'Earn', icon: <DollarSign size={14} />, color: '#FFD700' },
          ].map((item) => (
            <Grid item xs={4} key={item.step}>
              <GlassCard borderColor={`${item.color}30`} sx={{ p: { xs: 1, sm: 1.5 }, textAlign: 'center' }}>
                <Box
                  sx={{
                    width: { xs: 28, sm: 36 },
                    height: { xs: 28, sm: 36 },
                    borderRadius: '8px',
                    bgcolor: `${item.color}20`,
                    border: `1px solid ${item.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 0.5,
                    color: item.color,
                    position: 'relative',
                  }}
                >
                  {item.icon}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      width: { xs: 12, sm: 16 },
                      height: { xs: 12, sm: 16 },
                      borderRadius: '50%',
                      bgcolor: item.color,
                      color: item.color === '#FFD700' ? '#000' : 'white',
                      fontSize: { xs: '0.5rem', sm: '0.6rem' },
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.step}
                  </Box>
                </Box>
                <Typography sx={{ color: 'white', fontSize: { xs: '0.6rem', sm: '0.75rem' }, fontWeight: 600 }}>{item.title}</Typography>
              </GlassCard>
            </Grid>
          ))}
        </Grid>

        {/* Benefits - 2 column grid */}
        <Typography sx={{ color: 'white', fontWeight: 700, fontSize: { xs: '0.85rem', sm: '1rem' }, mb: 1 }}>
          Why Join?
        </Typography>
        <Grid container spacing={0.75} sx={{ mb: 2 }}>
          {[
            { icon: <DollarSign size={14} />, title: '10% Commission', color: '#22C55E' },
            { icon: <Clock size={14} />, title: 'Lifetime Earn', color: '#0066FF' },
            { icon: <Zap size={14} />, title: 'Fast Payouts', color: '#FFD700' },
            { icon: <Shield size={14} />, title: '90-Day Track', color: '#A000FF' },
          ].map((benefit, i) => (
            <Grid item xs={6} key={i}>
              <GlassCard borderColor={`${benefit.color}30`} sx={{ p: { xs: 1, sm: 1.5 }, display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
                <Box
                  sx={{
                    width: { xs: 24, sm: 32 },
                    height: { xs: 24, sm: 32 },
                    borderRadius: '6px',
                    bgcolor: `${benefit.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: benefit.color,
                    flexShrink: 0,
                  }}
                >
                  {benefit.icon}
                </Box>
                <Typography sx={{ color: 'white', fontSize: { xs: '0.6rem', sm: '0.75rem' }, fontWeight: 600 }}>{benefit.title}</Typography>
              </GlassCard>
            </Grid>
          ))}
        </Grid>

        {/* Referrals Table - Mobile optimized */}
        {stats?.referrals && stats.referrals.length > 0 && (
          <GlassCard sx={{ p: { xs: 1.25, sm: 2 }, mb: 2 }}>
            <Typography sx={{ color: 'white', fontWeight: 700, fontSize: { xs: '0.85rem', sm: '1rem' }, mb: 1 }}>
              Your Referrals
            </Typography>
            <Box sx={{ overflowX: 'auto', mx: { xs: -0.5, sm: 0 } }}>
              <Table size="small" sx={{ minWidth: { xs: 240, sm: 'auto' } }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.1)', py: 0.75, px: { xs: 0.5, sm: 1 }, fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>User</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.1)', py: 0.75, px: { xs: 0.5, sm: 1 }, fontSize: { xs: '0.6rem', sm: '0.7rem' } }}>Status</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.1)', py: 0.75, px: { xs: 0.5, sm: 1 }, fontSize: { xs: '0.6rem', sm: '0.7rem' } }} align="right">Earned</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats.referrals.slice(0, 5).map((referral) => (
                    <TableRow key={referral.id}>
                      <TableCell sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.1)', py: 0.75, px: { xs: 0.5, sm: 1 }, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}>
                        {referral.username.substring(0, 8)}...
                      </TableCell>
                      <TableCell sx={{ borderColor: 'rgba(255,255,255,0.1)', py: 0.75, px: { xs: 0.5, sm: 1 } }}>
                        <Chip
                          label={referral.status}
                          size="small"
                          sx={{
                            height: { xs: 16, sm: 20 },
                            fontSize: { xs: '0.5rem', sm: '0.6rem' },
                            bgcolor: referral.status === 'active' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.1)',
                            color: referral.status === 'active' ? '#22C55E' : 'rgba(255,255,255,0.5)',
                          }}
                        />
                      </TableCell>
                      <TableCell sx={{ color: '#22C55E', fontWeight: 700, borderColor: 'rgba(255,255,255,0.1)', py: 0.75, px: { xs: 0.5, sm: 1 }, fontSize: { xs: '0.65rem', sm: '0.75rem' } }} align="right">
                        ${Number(referral.commission || 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </GlassCard>
        )}

        {/* Terms */}
        <Typography sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.65rem', mt: 2 }}>
          Commission rates subject to change.{' '}
          <Link href="/terms-and-conditions" style={{ color: '#22C55E' }}>Terms</Link>
        </Typography>
      </Container>

      {/* Payout Dialog - Mobile friendly */}
      <Dialog
        open={payoutDialog}
        onClose={() => setPayoutDialog(false)}
        fullWidth
        maxWidth="xs"
        PaperProps={{
          sx: { bgcolor: '#0a0f1a', border: '1px solid rgba(34, 197, 94, 0.3)', borderRadius: 2, m: 2 },
        }}
      >
        <DialogTitle sx={{ color: 'white', display: 'flex', alignItems: 'center', gap: 1, py: 1.5, fontSize: '1rem' }}>
          <Wallet size={20} color="#22C55E" />
          Request Payout
          <IconButton onClick={() => setPayoutDialog(false)} sx={{ ml: 'auto', color: 'rgba(255,255,255,0.5)' }} size="small">
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ py: 1 }}>
          {payoutError && <Alert severity="error" sx={{ mb: 1.5, py: 0.5 }}>{payoutError}</Alert>}
          
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 2, fontSize: '0.85rem' }}>
            Available: <strong style={{ color: '#22C55E' }}>${Number(stats?.availableBalance || 0).toFixed(2)}</strong>
          </Typography>

          <TextField
            fullWidth
            size="small"
            label="Amount"
            type="number"
            value={payoutAmount}
            onChange={(e) => setPayoutAmount(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{ startAdornment: <DollarSign size={16} /> }}
          />

          <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 1, fontSize: '0.8rem' }}>Method</Typography>
          <Grid container spacing={1} sx={{ mb: 2 }}>
            {[
              { id: 'mpesa', label: 'M-Pesa', icon: <Smartphone size={18} /> },
              { id: 'crypto', label: 'USDT', icon: <Bitcoin size={18} /> },
            ].map((m) => (
              <Grid item xs={6} key={m.id}>
                <Box
                  onClick={() => setPayoutMethod(m.id)}
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    border: `2px solid ${payoutMethod === m.id ? '#22C55E' : 'rgba(255,255,255,0.1)'}`,
                    bgcolor: payoutMethod === m.id ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  <Box sx={{ color: payoutMethod === m.id ? '#22C55E' : 'white', mb: 0.5 }}>{m.icon}</Box>
                  <Typography sx={{ color: 'white', fontSize: '0.75rem', fontWeight: 600 }}>{m.label}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          <TextField
            fullWidth
            size="small"
            label={payoutMethod === 'mpesa' ? 'Phone Number' : 'Wallet (TRC20)'}
            value={payoutDetails}
            onChange={(e) => setPayoutDetails(e.target.value)}
            placeholder={payoutMethod === 'mpesa' ? '+254...' : 'T...'}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={() => setPayoutDialog(false)} sx={{ color: 'rgba(255,255,255,0.5)' }} size="small">
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handlePayoutRequest}
            disabled={payoutLoading || !payoutAmount || !payoutMethod || !payoutDetails}
            startIcon={!payoutLoading && <Send size={14} />}
            size="small"
            sx={{ bgcolor: '#22C55E', '&:hover': { bgcolor: '#16A34A' } }}
          >
            {payoutLoading ? 'Processing...' : 'Request'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Alert */}
      {payoutSuccess && (
        <Alert
          severity="success"
          onClose={() => setPayoutSuccess(false)}
          sx={{ position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 9999 }}
        >
          Payout request submitted! Funds within 48 hours.
        </Alert>
      )}
    </Box>
  );
}
