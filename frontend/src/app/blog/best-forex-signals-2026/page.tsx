'use client';

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Chip,
  Button,
  Stack,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Grid,
  Avatar,
} from '@mui/material';
import { Calendar, Clock, ArrowLeft, CheckCircle, Star, TrendingUp, AlertTriangle, Users, DollarSign, Target, Bell, Shield, ArrowRight, Award } from 'lucide-react';
import Link from 'next/link';

const signalProviders = [
  {
    rank: 1,
    name: 'AlgoEdge Elite Signals',
    rating: 5,
    winRate: '71%',
    pipsPerMonth: '850+',
    price: '$49.99/mo',
    signals: '5-15/day',
    style: 'Scalping & Swing',
    recommended: true,
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
  },
  {
    rank: 2,
    name: 'Gold Hunters Pro',
    rating: 4.5,
    winRate: '68%',
    pipsPerMonth: '720+',
    price: '$79.99/mo',
    signals: '3-8/day',
    style: 'XAUUSD Specialist',
    recommended: true,
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
  },
  {
    rank: 3,
    name: 'FX Master Signals',
    rating: 4,
    winRate: '65%',
    pipsPerMonth: '550+',
    price: '$39.99/mo',
    signals: '2-5/day',
    style: 'Major Pairs',
    recommended: false,
    image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
  },
  {
    rank: 4,
    name: 'Indices Daily',
    rating: 4,
    winRate: '62%',
    pipsPerMonth: '480+',
    price: '$59.99/mo',
    signals: '3-6/day',
    style: 'US30, NAS100',
    recommended: false,
    image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face',
  },
  {
    rank: 5,
    name: 'Crypto Momentum',
    rating: 3.5,
    winRate: '58%',
    pipsPerMonth: '400+',
    price: '$69.99/mo',
    signals: '4-10/day',
    style: 'BTC, ETH',
    recommended: false,
    image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&h=100&fit=crop&crop=face',
  },
];

const signalExample = {
  pair: 'XAUUSD (Gold)',
  direction: 'BUY',
  entry: 2035.50,
  stopLoss: 2028.00,
  takeProfit1: 2045.00,
  takeProfit2: 2055.00,
  takeProfit3: 2065.00,
  riskReward: '1:3.9',
  analysis: 'Bullish engulfing at H4 support zone. RSI oversold bounce with bullish divergence. London session breakout setup.',
  confidence: 'High',
  timestamp: '09:15 GMT',
};

export default function ForexSignalsGuidePage() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #0a0a0a 0%, #111111 100%)',
        py: 6,
      }}
    >
      <Container maxWidth="md">
        {/* Back Button */}
        <Button
          component={Link}
          href="/blog"
          startIcon={<ArrowLeft size={18} />}
          sx={{ color: 'text.secondary', mb: 4, textTransform: 'none' }}
        >
          Back to Blog
        </Button>

        {/* Article Header */}
        <Box sx={{ mb: 6 }}>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <Chip 
              label="Trading Signals" 
              size="small" 
              sx={{ bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6', fontWeight: 600 }} 
            />
            <Chip 
              label="Expert Guide" 
              size="small" 
              sx={{ bgcolor: 'rgba(34, 197, 94, 0.2)', color: '#22C55E', fontWeight: 600 }} 
            />
          </Stack>
          
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2rem', md: '2.75rem' },
              fontWeight: 800,
              color: 'white',
              mb: 2,
              lineHeight: 1.2,
            }}
          >
            Best Forex Signal Services 2026: Complete Guide to Copy Trading Success
          </Typography>

          <Typography
            sx={{
              fontSize: '1.2rem',
              color: 'rgba(255,255,255,0.8)',
              mb: 3,
              lineHeight: 1.7,
            }}
          >
            Discover the top-rated forex signal providers with proven track records. Learn how to choose reliable signals, 
            avoid scams, and maximize profits from professional trading alerts delivered to your phone.
          </Typography>

          <Stack direction="row" spacing={3} sx={{ color: 'text.secondary' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Calendar size={16} />
              <Typography variant="body2">January 25, 2026</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Clock size={16} />
              <Typography variant="body2">15 min read</Typography>
            </Stack>
          </Stack>
        </Box>

        {/* Featured Image */}
        <Box
          sx={{
            width: '100%',
            height: 400,
            borderRadius: 3,
            overflow: 'hidden',
            mb: 6,
            position: 'relative',
          }}
        >
          <Box
            component="img"
            src="https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=400&fit=crop"
            alt="Forex Trading Signals"
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.8) 100%)',
            }}
          />
        </Box>

        {/* Key Takeaways */}
        <Alert 
          severity="info" 
          icon={<TrendingUp size={20} />}
          sx={{ 
            mb: 6, 
            bgcolor: 'rgba(59, 130, 246, 0.1)', 
            border: '1px solid rgba(59, 130, 246, 0.3)',
            '& .MuiAlert-message': { color: 'rgba(255,255,255,0.9)' },
            '& .MuiAlert-icon': { color: '#3B82F6' },
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Key Takeaways
          </Typography>
          <List dense sx={{ py: 0 }}>
            <ListItem sx={{ py: 0.5, px: 0 }}>• Win rate alone doesn't determine profitability - risk/reward matters more</ListItem>
            <ListItem sx={{ py: 0.5, px: 0 }}>• Verified track records with at least 3 months of history are essential</ListItem>
            <ListItem sx={{ py: 0.5, px: 0 }}>• AlgoEdge Elite Signals rated #1 with 71% win rate and 850+ pips/month</ListItem>
            <ListItem sx={{ py: 0.5, px: 0 }}>• Always use proper risk management regardless of signal quality</ListItem>
          </List>
        </Alert>

        {/* Table of Contents */}
        <Paper sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, mb: 6, border: '1px solid rgba(255,255,255,0.08)' }}>
          <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 700 }}>
            📑 Table of Contents
          </Typography>
          <List dense>
            {[
              'What Are Forex Signals?',
              'Top Signal Providers Ranked',
              'How to Evaluate Signal Quality',
              'Sample Signal Breakdown',
              'Red Flags to Avoid',
              'Maximizing Signal Profits',
              'Getting Started with AlgoEdge',
            ].map((item, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <Typography sx={{ color: '#3B82F6', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                  {index + 1}. {item}
                </Typography>
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* Introduction */}
        <Typography variant="h2" sx={{ color: 'white', fontSize: '1.75rem', fontWeight: 700, mb: 3 }}>
          What Are Forex Signals?
        </Typography>
        
        <Typography sx={{ color: 'rgba(255,255,255,0.85)', mb: 3, lineHeight: 1.8, fontSize: '1.05rem' }}>
          <strong>Forex signals</strong> are trade recommendations provided by professional traders or automated systems. 
          They tell you exactly when to enter a trade, where to place your stop loss, and where to take profits. 
          Essentially, you're copying the trades of experienced analysts without doing the technical analysis yourself.
        </Typography>

        <Typography sx={{ color: 'rgba(255,255,255,0.85)', mb: 3, lineHeight: 1.8, fontSize: '1.05rem' }}>
          A typical forex signal includes:
        </Typography>

        <List sx={{ mb: 4 }}>
          {[
            { icon: <Target size={18} />, text: 'Currency pair (e.g., EURUSD, XAUUSD)' },
            { icon: <TrendingUp size={18} />, text: 'Direction (Buy or Sell)' },
            { icon: <DollarSign size={18} />, text: 'Entry price' },
            { icon: <Shield size={18} />, text: 'Stop loss level (risk protection)' },
            { icon: <Award size={18} />, text: 'Take profit targets (1-3 levels)' },
          ].map((item, index) => (
            <ListItem key={index} sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 36, color: '#3B82F6' }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} sx={{ '& .MuiListItemText-primary': { color: 'rgba(255,255,255,0.9)' } }} />
            </ListItem>
          ))}
        </List>

        <Typography sx={{ color: 'rgba(255,255,255,0.85)', mb: 4, lineHeight: 1.8, fontSize: '1.05rem' }}>
          The forex signals industry has grown exponentially, with the <strong>global copy trading market reaching $2.2 billion 
          in 2025</strong>. However, not all signal providers are created equal. Our team has tested and verified dozens of 
          services to bring you the most reliable options for 2026.
        </Typography>

        <Divider sx={{ my: 5, borderColor: 'rgba(255,255,255,0.1)' }} />

        {/* Signal Providers Comparison */}
        <Typography variant="h2" sx={{ color: 'white', fontSize: '1.75rem', fontWeight: 700, mb: 3 }}>
          Top Forex Signal Providers (2026 Ranking)
        </Typography>

        <TableContainer component={Paper} sx={{ mb: 5, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)' }}>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Rank</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Provider</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Win Rate</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Pips/Month</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Price</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Rating</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {signalProviders.map((provider) => (
                <TableRow 
                  key={provider.rank}
                  sx={{ 
                    bgcolor: provider.recommended ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' }
                  }}
                >
                  <TableCell sx={{ color: 'white' }}>
                    {provider.rank === 1 ? '🥇' : provider.rank === 2 ? '🥈' : provider.rank === 3 ? '🥉' : `#${provider.rank}`}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar src={provider.image} sx={{ width: 36, height: 36 }} />
                      <Box>
                        <Typography sx={{ color: 'white', fontWeight: provider.recommended ? 700 : 400, fontSize: '0.9rem' }}>
                          {provider.name}
                        </Typography>
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                          {provider.style}
                        </Typography>
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ color: '#22C55E', fontWeight: 600 }}>{provider.winRate}</TableCell>
                  <TableCell sx={{ color: '#3B82F6', fontWeight: 600 }}>{provider.pipsPerMonth}</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{provider.price}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill={i < provider.rating ? '#EAB308' : 'transparent'} color="#EAB308" />
                      ))}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Detailed Provider Reviews */}
        <Typography variant="h3" sx={{ color: 'white', fontSize: '1.5rem', fontWeight: 700, mb: 3 }}>
          Detailed Provider Reviews
        </Typography>

        {signalProviders.slice(0, 3).map((provider, index) => (
          <Card 
            key={provider.rank}
            sx={{ 
              mb: 3, 
              bgcolor: provider.rank === 1 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255,255,255,0.03)', 
              border: provider.rank === 1 ? '2px solid #3B82F6' : '1px solid rgba(255,255,255,0.08)',
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={3} alignItems="flex-start">
                <Avatar src={provider.image} sx={{ width: 72, height: 72, border: '3px solid #3B82F6' }} />
                <Box sx={{ flex: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
                    <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                      {provider.rank === 1 ? '🥇 ' : provider.rank === 2 ? '🥈 ' : '🥉 '}{provider.name}
                    </Typography>
                    {provider.recommended && (
                      <Chip label="Editor's Choice" size="small" sx={{ bgcolor: '#3B82F6', color: 'white' }} />
                    )}
                  </Stack>
                  <Stack direction="row" spacing={0.5} sx={{ mb: 2 }}>
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={16} fill={i < provider.rating ? '#EAB308' : 'transparent'} color="#EAB308" />
                    ))}
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', ml: 1 }}>{provider.rating}/5</Typography>
                  </Stack>
                  
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={6} sm={3}>
                      <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>Win Rate</Typography>
                      <Typography sx={{ color: '#22C55E', fontWeight: 700 }}>{provider.winRate}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>Monthly Pips</Typography>
                      <Typography sx={{ color: '#3B82F6', fontWeight: 700 }}>{provider.pipsPerMonth}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>Signals/Day</Typography>
                      <Typography sx={{ color: 'white', fontWeight: 700 }}>{provider.signals}</Typography>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>Price</Typography>
                      <Typography sx={{ color: '#F59E0B', fontWeight: 700 }}>{provider.price}</Typography>
                    </Grid>
                  </Grid>

                  <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem' }}>
                    {provider.rank === 1 && 'The gold standard in forex signals. AlgoEdge Elite combines AI analysis with human oversight to deliver consistent, high-probability setups. Their 71% win rate with excellent risk/reward makes them our top pick for 2026.'}
                    {provider.rank === 2 && 'Specialists in XAUUSD (gold) trading with deep expertise in precious metals. Their signals focus on quality over quantity, with detailed analysis for each trade setup.'}
                    {provider.rank === 3 && 'A solid choice for traders focused on major forex pairs. Good entry points with reasonable stop losses. Best for swing trading strategies.'}
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        ))}

        <Divider sx={{ my: 5, borderColor: 'rgba(255,255,255,0.1)' }} />

        {/* Sample Signal */}
        <Typography variant="h2" sx={{ color: 'white', fontSize: '1.75rem', fontWeight: 700, mb: 3 }}>
          Sample Signal Breakdown
        </Typography>

        <Typography sx={{ color: 'rgba(255,255,255,0.85)', mb: 4, lineHeight: 1.8 }}>
          Here's what a professional forex signal looks like from AlgoEdge Elite Signals:
        </Typography>

        <Paper sx={{ p: 4, bgcolor: 'rgba(59, 130, 246, 0.1)', borderRadius: 3, mb: 5, border: '2px solid #3B82F6' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Bell size={24} color="#3B82F6" />
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                🔔 NEW SIGNAL
              </Typography>
            </Stack>
            <Chip 
              label={signalExample.confidence + ' Confidence'} 
              sx={{ bgcolor: '#22C55E', color: 'white', fontWeight: 700 }} 
            />
          </Stack>

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 2 }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', mb: 1 }}>Pair</Typography>
                <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1.2rem' }}>{signalExample.pair}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, bgcolor: signalExample.direction === 'BUY' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)', borderRadius: 2 }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', mb: 1 }}>Direction</Typography>
                <Typography sx={{ color: signalExample.direction === 'BUY' ? '#22C55E' : '#EF4444', fontWeight: 700, fontSize: '1.2rem' }}>
                  {signalExample.direction === 'BUY' ? '📈 ' : '📉 '}{signalExample.direction}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 2 }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', mb: 1 }}>Entry</Typography>
                <Typography sx={{ color: '#3B82F6', fontWeight: 700 }}>{signalExample.entry}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, bgcolor: 'rgba(239, 68, 68, 0.1)', borderRadius: 2 }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', mb: 1 }}>Stop Loss</Typography>
                <Typography sx={{ color: '#EF4444', fontWeight: 700 }}>{signalExample.stopLoss}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={4} md={2}>
              <Paper sx={{ p: 2, bgcolor: 'rgba(34, 197, 94, 0.1)', borderRadius: 2 }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', mb: 1 }}>TP1</Typography>
                <Typography sx={{ color: '#22C55E', fontWeight: 700 }}>{signalExample.takeProfit1}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={4} md={2}>
              <Paper sx={{ p: 2, bgcolor: 'rgba(34, 197, 94, 0.1)', borderRadius: 2 }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', mb: 1 }}>TP2</Typography>
                <Typography sx={{ color: '#22C55E', fontWeight: 700 }}>{signalExample.takeProfit2}</Typography>
              </Paper>
            </Grid>
            <Grid item xs={4} md={2}>
              <Paper sx={{ p: 2, bgcolor: 'rgba(34, 197, 94, 0.1)', borderRadius: 2 }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', mb: 1 }}>TP3</Typography>
                <Typography sx={{ color: '#22C55E', fontWeight: 700 }}>{signalExample.takeProfit3}</Typography>
              </Paper>
            </Grid>
          </Grid>

          <Paper sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.3)', borderRadius: 2, mt: 3 }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', mb: 1 }}>Analysis</Typography>
            <Typography sx={{ color: 'white' }}>{signalExample.analysis}</Typography>
          </Paper>

          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mt: 3 }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
              R:R Ratio: <strong style={{ color: '#22C55E' }}>{signalExample.riskReward}</strong>
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
              Time: {signalExample.timestamp}
            </Typography>
          </Stack>
        </Paper>

        <Divider sx={{ my: 5, borderColor: 'rgba(255,255,255,0.1)' }} />

        {/* Red Flags Section */}
        <Typography variant="h2" sx={{ color: 'white', fontSize: '1.75rem', fontWeight: 700, mb: 3 }}>
          🚩 Red Flags: How to Spot Signal Scams
        </Typography>

        <Alert 
          severity="warning" 
          icon={<AlertTriangle size={20} />}
          sx={{ 
            mb: 4, 
            bgcolor: 'rgba(234, 179, 8, 0.1)', 
            border: '1px solid rgba(234, 179, 8, 0.3)',
            '& .MuiAlert-message': { color: 'rgba(255,255,255,0.9)' },
            '& .MuiAlert-icon': { color: '#EAB308' },
          }}
        >
          <Typography>
            The forex signals industry is full of scammers. Here's how to protect yourself:
          </Typography>
        </Alert>

        <Grid container spacing={3} sx={{ mb: 5 }}>
          {[
            { title: 'Unrealistic Claims', desc: '"100% win rate" or "guaranteed profits" - no legitimate provider makes these claims', icon: '⚠️' },
            { title: 'No Verified Track Record', desc: 'Refuse to show MyFXBook or similar third-party verification', icon: '📊' },
            { title: 'Pressure Tactics', desc: '"Join now or miss out!" - scammers create artificial urgency', icon: '⏰' },
            { title: 'No Stop Losses', desc: 'Signals without stop losses are recipes for blown accounts', icon: '🛑' },
            { title: 'Fake Screenshots', desc: 'Photoshopped profit screenshots are common - verify independently', icon: '📸' },
            { title: 'No Transparency', desc: 'Hidden fees, unclear entry/exit rules, no support contact', icon: '🔍' },
          ].map((flag, index) => (
            <Grid item xs={12} sm={6} key={index}>
              <Paper sx={{ p: 2, bgcolor: 'rgba(239, 68, 68, 0.05)', borderRadius: 2, border: '1px solid rgba(239, 68, 68, 0.2)', height: '100%' }}>
                <Typography sx={{ fontSize: '1.5rem', mb: 1 }}>{flag.icon}</Typography>
                <Typography variant="subtitle1" sx={{ color: '#EF4444', fontWeight: 700, mb: 1 }}>{flag.title}</Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>{flag.desc}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 5, borderColor: 'rgba(255,255,255,0.1)' }} />

        {/* Tips Section */}
        <Typography variant="h2" sx={{ color: 'white', fontSize: '1.75rem', fontWeight: 700, mb: 3 }}>
          💡 Tips for Maximizing Signal Profits
        </Typography>

        <List sx={{ mb: 5 }}>
          {[
            { title: 'Use Proper Risk Management', text: 'Never risk more than 1-2% per trade, regardless of signal confidence' },
            { title: 'Don\'t Chase Missed Signals', text: 'If you miss the entry, wait for the next signal - entering late ruins the R:R ratio' },
            { title: 'Keep a Trading Journal', text: 'Track your results independently to identify patterns and issues' },
            { title: 'Combine with Your Analysis', text: 'Use signals as confirmation, not blind entries - understand why the trade makes sense' },
            { title: 'Set Realistic Expectations', text: 'Even 70% win rate means 3 losses out of 10 trades - accept drawdowns as normal' },
            { title: 'Use a Demo Account First', text: 'Test any new signal service with paper trading before risking real money' },
          ].map((tip, index) => (
            <ListItem key={index} sx={{ alignItems: 'flex-start', py: 1 }}>
              <ListItemIcon sx={{ minWidth: 36, mt: 0.5 }}>
                <CheckCircle size={18} color="#22C55E" />
              </ListItemIcon>
              <ListItemText 
                primary={<Typography sx={{ color: 'white', fontWeight: 600 }}>{tip.title}</Typography>}
                secondary={<Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>{tip.text}</Typography>}
              />
            </ListItem>
          ))}
        </List>

        {/* CTA */}
        <Paper sx={{ 
          p: 4, 
          bgcolor: 'rgba(59, 130, 246, 0.1)', 
          borderRadius: 3, 
          border: '1px solid rgba(59, 130, 246, 0.3)',
          textAlign: 'center',
          mb: 5,
        }}>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, mb: 2 }}>
            Ready to Start Copy Trading?
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 3, maxWidth: 500, mx: 'auto' }}>
            Join AlgoEdge Elite Signals and get 5-15 professional trade setups delivered daily via Telegram, Email, and SMS.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button 
              component={Link}
              href="/marketplace/signals"
              variant="contained" 
              size="large"
              endIcon={<ArrowRight size={18} />}
              sx={{ 
                bgcolor: '#3B82F6', 
                color: 'white', 
                fontWeight: 700,
                px: 4,
                '&:hover': { bgcolor: '#2563EB' }
              }}
            >
              View Signal Plans
            </Button>
            <Button 
              component={Link}
              href="/auth/register"
              variant="outlined" 
              size="large"
              sx={{ 
                borderColor: '#3B82F6', 
                color: '#3B82F6',
                fontWeight: 700,
                px: 4,
                '&:hover': { borderColor: '#60A5FA', bgcolor: 'rgba(59, 130, 246, 0.1)' }
              }}
            >
              Create Account
            </Button>
          </Stack>
        </Paper>

        {/* FAQ */}
        <Typography variant="h2" sx={{ color: 'white', fontSize: '1.75rem', fontWeight: 700, mb: 3 }}>
          Frequently Asked Questions
        </Typography>

        {[
          { q: 'How do I receive the signals?', a: 'AlgoEdge signals are delivered instantly via Telegram, Email, and SMS. You can also view them in your dashboard with one-click copy to MT4/MT5.' },
          { q: 'What account size do I need?', a: 'We recommend a minimum of $500-1000 to properly manage risk. Signals work on any account size, but smaller accounts should use micro lots.' },
          { q: 'Can I use signals with any broker?', a: 'Yes! Our signals work with any MT4/MT5 broker. We recommend brokers with tight spreads on the pairs we trade (XAUUSD, EURUSD, etc.).' },
          { q: 'Is there a money-back guarantee?', a: 'Yes, we offer a 14-day money-back guarantee if you\'re not satisfied with the signal quality.' },
        ].map((faq, index) => (
          <Paper key={index} sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, mb: 2, border: '1px solid rgba(255,255,255,0.08)' }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>{faq.q}</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>{faq.a}</Typography>
          </Paper>
        ))}

        {/* Author */}
        <Divider sx={{ my: 5, borderColor: 'rgba(255,255,255,0.1)' }} />
        
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Written by <strong style={{ color: 'white' }}>AlgoEdge Research Team</strong>
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Last updated: January 25, 2026
            </Typography>
          </Box>
          <Button
            component={Link}
            href="/blog"
            variant="outlined"
            sx={{ borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}
          >
            More Articles
          </Button>
        </Stack>
      </Container>
    </Box>
  );
}
