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

  useEffect(() => {
    fetchAffiliateStats();
  }, []);

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

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', position: 'relative' }}>
      <AnimatedBackground />
      
      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: { xs: 2, md: 4 }, px: { xs: 2, md: 3 } }}>
        {/* Header with Stats */}
        <GlassCard borderColor="rgba(34, 197, 94, 0.2)" sx={{ p: { xs: 2, md: 3 }, mb: 2 }}>
          {/* Tier Badge */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography sx={{ fontSize: '1.2rem' }}>{currentTier.emoji}</Typography>
            <Chip
              label={`${currentTier.name} Partner • ${currentTier.commission}`}
              size="small"
              sx={{ bgcolor: `${currentTier.color}20`, color: currentTier.color, fontWeight: 700 }}
            />
          </Box>

          {/* Title */}
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.3rem', md: '1.8rem' },
              mb: 1,
              background: 'linear-gradient(135deg, #22C55E 0%, #0066FF 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Affiliate Dashboard
          </Typography>
          
          <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', mb: 2 }}>
            Share your link and earn {currentTier.commission} on every subscription
          </Typography>

          {/* Referral Link */}
          <Box
            sx={{
              p: 1.5,
              borderRadius: 1.5,
              bgcolor: 'rgba(0,0,0,0.3)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: 2,
            }}
          >
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <Typography
                sx={{
                  color: 'white',
                  fontSize: { xs: '0.7rem', md: '0.85rem' },
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {loading ? 'Loading your referral link...' : (stats?.referralLink || 'Sign up to get your referral link')}
              </Typography>
            </Box>
            <Button
              size="small"
              onClick={() => stats?.referralLink && copyToClipboard(stats.referralLink)}
              startIcon={copied ? <CheckCircle size={14} /> : <Copy size={14} />}
              sx={{
                minWidth: 'auto',
                px: 1.5,
                py: 0.5,
                bgcolor: copied ? '#22C55E' : 'rgba(34, 197, 94, 0.2)',
                color: copied ? 'white' : '#22C55E',
                fontSize: '0.75rem',
                '&:hover': { bgcolor: '#22C55E', color: 'white' },
              }}
            >
              {copied ? 'Copied!' : 'Copy'}
            </Button>
          </Box>

          {/* Stats Grid - 2x2 on mobile */}
          <Grid container spacing={1}>
            {[
              { label: 'Balance', value: `$${(stats?.availableBalance || 0).toFixed(2)}`, color: '#22C55E' },
              { label: 'Total Earned', value: `$${(stats?.totalEarnings || 0).toFixed(2)}`, color: '#0066FF' },
              { label: 'Referrals', value: stats?.totalReferrals || 0, color: '#FFD700' },
              { label: 'Active', value: stats?.activeReferrals || 0, color: '#A000FF' },
            ].map((stat, i) => (
              <Grid item xs={6} sm={3} key={i}>
                <Box sx={{ p: 1.5, borderRadius: 1.5, bgcolor: 'rgba(0,0,0,0.2)', textAlign: 'center' }}>
                  {loading ? (
                    <Skeleton width="60%" sx={{ mx: 'auto', bgcolor: 'rgba(255,255,255,0.1)' }} />
                  ) : (
                    <Typography sx={{ fontSize: { xs: '1.1rem', md: '1.4rem' }, fontWeight: 800, color: stat.color }}>
                      {stat.value}
                    </Typography>
                  )}
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem' }}>{stat.label}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Payout Button */}
          <Button
            fullWidth
            size="small"
            onClick={() => setPayoutDialog(true)}
            startIcon={<Wallet size={16} />}
            disabled={!stats || stats.availableBalance < 50}
            sx={{
              mt: 2,
              py: 1,
              bgcolor: '#22C55E',
              fontWeight: 700,
              fontSize: '0.85rem',
              '&:hover': { bgcolor: '#16A34A' },
              '&:disabled': { bgcolor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.3)' },
            }}
          >
            {stats && stats.availableBalance >= 50 ? 'Request Payout' : `$${(50 - (stats?.availableBalance || 0)).toFixed(2)} more to withdraw`}
          </Button>
        </GlassCard>

        {/* Tier Progress */}
        {nextTier && (
          <GlassCard sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
              <Typography sx={{ color: 'white', fontSize: '0.85rem', fontWeight: 600 }}>
                {currentTier.emoji} → {nextTier.emoji} Progress
              </Typography>
              <Typography sx={{ color: nextTier.color, fontSize: '0.8rem', fontWeight: 700 }}>
                {stats?.activeReferrals || 0}/{nextTier.minReferrals}
              </Typography>
            </Box>
            <LinearProgress
              variant="determinate"
              value={Math.min(((stats?.activeReferrals || 0) / nextTier.minReferrals) * 100, 100)}
              sx={{
                height: 8,
                borderRadius: 4,
                bgcolor: 'rgba(255,255,255,0.1)',
                '& .MuiLinearProgress-bar': { bgcolor: nextTier.color, borderRadius: 4 },
              }}
            />
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', mt: 0.5 }}>
              {nextTier.minReferrals - (stats?.activeReferrals || 0)} more for {nextTier.commission} commission
            </Typography>
          </GlassCard>
        )}

        {/* Commission Rates - Horizontal scroll on mobile */}
        <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1rem', mb: 1.5 }}>
          Commission Rates
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, mb: 3, overflowX: 'auto', pb: 1, '::-webkit-scrollbar': { height: 4 } }}>
          {commissionRates.map((rate) => (
            <GlassCard
              key={rate.plan}
              borderColor={`${rate.color}30`}
              sx={{ p: 2, minWidth: { xs: 120, md: 150 }, textAlign: 'center', flex: { xs: '0 0 auto', md: 1 } }}
            >
              <Typography sx={{ color: rate.color, fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>
                {rate.plan}
              </Typography>
              <Typography sx={{ color: 'white', fontSize: '1.5rem', fontWeight: 900 }}>
                ${rate.commission.toFixed(2)}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem' }}>
                per referral
              </Typography>
            </GlassCard>
          ))}
        </Box>

        {/* Tier System - Compact horizontal scroll */}
        <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1rem', mb: 1.5 }}>
          Tier System
        </Typography>
        <Box sx={{ display: 'flex', gap: 1.5, mb: 3, overflowX: 'auto', pb: 1, '::-webkit-scrollbar': { height: 4 } }}>
          {tiers.map((tier) => (
            <GlassCard
              key={tier.name}
              borderColor={tier.name === currentTier.name ? tier.color : `${tier.color}30`}
              sx={{
                p: 1.5,
                minWidth: 100,
                textAlign: 'center',
                flex: '0 0 auto',
                ...(tier.name === currentTier.name && { boxShadow: `0 0 15px ${tier.color}40` }),
              }}
            >
              {tier.name === currentTier.name && (
                <Chip label="YOU" size="small" sx={{ bgcolor: tier.color, color: '#000', fontSize: '0.6rem', height: 16, mb: 0.5 }} />
              )}
              <Typography sx={{ fontSize: '1.5rem' }}>{tier.emoji}</Typography>
              <Typography sx={{ color: tier.color, fontSize: '0.75rem', fontWeight: 700 }}>{tier.name}</Typography>
              <Typography sx={{ color: 'white', fontSize: '1.1rem', fontWeight: 800 }}>{tier.commission}</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.6rem' }}>
                {tier.minReferrals}+ refs
              </Typography>
            </GlassCard>
          ))}
        </Box>

        {/* How It Works - Compact */}
        <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1rem', mb: 1.5 }}>
          How It Works
        </Typography>
        <Grid container spacing={1.5} sx={{ mb: 3 }}>
          {[
            { step: 1, title: 'Copy Link', icon: <Copy size={18} />, color: '#22C55E' },
            { step: 2, title: 'Share', icon: <Share2 size={18} />, color: '#0066FF' },
            { step: 3, title: 'Earn', icon: <DollarSign size={18} />, color: '#FFD700' },
          ].map((item) => (
            <Grid item xs={4} key={item.step}>
              <GlassCard borderColor={`${item.color}30`} sx={{ p: 1.5, textAlign: 'center' }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '10px',
                    bgcolor: `${item.color}20`,
                    border: `1px solid ${item.color}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 1,
                    color: item.color,
                    position: 'relative',
                  }}
                >
                  {item.icon}
                  <Box
                    sx={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      bgcolor: item.color,
                      color: item.color === '#FFD700' ? '#000' : 'white',
                      fontSize: '0.6rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {item.step}
                  </Box>
                </Box>
                <Typography sx={{ color: 'white', fontSize: '0.75rem', fontWeight: 600 }}>{item.title}</Typography>
              </GlassCard>
            </Grid>
          ))}
        </Grid>

        {/* Benefits - 2 column grid */}
        <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1rem', mb: 1.5 }}>
          Why Join?
        </Typography>
        <Grid container spacing={1.5} sx={{ mb: 3 }}>
          {[
            { icon: <DollarSign size={18} />, title: '10% Commission', color: '#22C55E' },
            { icon: <Clock size={18} />, title: 'Lifetime Earnings', color: '#0066FF' },
            { icon: <Zap size={18} />, title: 'Fast Payouts', color: '#FFD700' },
            { icon: <Shield size={18} />, title: '90-Day Tracking', color: '#A000FF' },
          ].map((benefit, i) => (
            <Grid item xs={6} key={i}>
              <GlassCard borderColor={`${benefit.color}30`} sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '8px',
                    bgcolor: `${benefit.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: benefit.color,
                  }}
                >
                  {benefit.icon}
                </Box>
                <Typography sx={{ color: 'white', fontSize: '0.75rem', fontWeight: 600 }}>{benefit.title}</Typography>
              </GlassCard>
            </Grid>
          ))}
        </Grid>

        {/* Referrals Table - Mobile optimized */}
        {stats?.referrals && stats.referrals.length > 0 && (
          <GlassCard sx={{ p: 2, mb: 2, overflowX: 'auto' }}>
            <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1rem', mb: 1.5 }}>
              Your Referrals
            </Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.1)', py: 1, px: 1, fontSize: '0.7rem' }}>User</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.1)', py: 1, px: 1, fontSize: '0.7rem' }}>Status</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.6)', borderColor: 'rgba(255,255,255,0.1)', py: 1, px: 1, fontSize: '0.7rem' }} align="right">Earned</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {stats.referrals.slice(0, 5).map((referral) => (
                  <TableRow key={referral.id}>
                    <TableCell sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.1)', py: 1, px: 1, fontSize: '0.75rem' }}>
                      {referral.username.substring(0, 10)}...
                    </TableCell>
                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.1)', py: 1, px: 1 }}>
                      <Chip
                        label={referral.status}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: '0.6rem',
                          bgcolor: referral.status === 'active' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.1)',
                          color: referral.status === 'active' ? '#22C55E' : 'rgba(255,255,255,0.5)',
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ color: '#22C55E', fontWeight: 700, borderColor: 'rgba(255,255,255,0.1)', py: 1, px: 1, fontSize: '0.75rem' }} align="right">
                      ${(referral.commission || 0).toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
            Available: <strong style={{ color: '#22C55E' }}>${(stats?.availableBalance || 0).toFixed(2)}</strong>
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
