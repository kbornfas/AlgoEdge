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
} from '@mui/material';
import { Calendar, Clock, ArrowLeft, CheckCircle, TrendingUp, Shield, Zap, Target } from 'lucide-react';
import Link from 'next/link';

export default function XAUUSDStrategyPage() {
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
          <Chip
            label="Trading Strategies"
            sx={{
              mb: 2,
              bgcolor: 'rgba(255, 215, 0, 0.1)',
              color: '#FFD700',
              border: '1px solid rgba(255, 215, 0, 0.3)',
            }}
          />
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              mb: 2,
              fontSize: { xs: '2rem', md: '2.75rem' },
              background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Best XAUUSD Strategy 2026: Complete Gold Trading Guide
          </Typography>
          <Stack direction="row" spacing={3} sx={{ color: 'text.secondary', mb: 4 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Calendar size={16} />
              <Typography variant="body2">January 15, 2026</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Clock size={16} />
              <Typography variant="body2">8 min read</Typography>
            </Stack>
          </Stack>
        </Box>

        {/* Article Content */}
        <Box sx={{ '& p': { color: 'text.secondary', lineHeight: 1.8, mb: 3 } }}>
          <Typography variant="body1" component="p" sx={{ fontSize: '1.1rem' }}>
            Gold trading (XAUUSD) remains one of the most profitable forex pairs in 2026. With global 
            economic uncertainty and inflation concerns, traders are flocking to gold as a safe-haven 
            asset. In this comprehensive guide, we&apos;ll reveal the <strong style={{ color: '#FFD700' }}>best 
            XAUUSD trading strategies</strong> that professional traders use to achieve consistent profits.
          </Typography>

          <Alert 
            severity="success" 
            sx={{ 
              my: 4, 
              bgcolor: 'rgba(0, 200, 83, 0.1)', 
              border: '1px solid rgba(0, 200, 83, 0.3)',
              '& .MuiAlert-message': { color: 'white' }
            }}
          >
            <strong>AlgoEdge Gold Bot Performance:</strong> Our AI-powered XAUUSD bot has achieved a 
            94.2% win rate with an average monthly return of 15-25% in 2026.
          </Alert>

          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, mt: 5, color: 'white' }}>
            Why Trade XAUUSD in 2026?
          </Typography>
          <Typography variant="body1" component="p">
            XAUUSD (Gold vs US Dollar) is the most traded precious metal pair in forex. Here&apos;s why 
            smart traders focus on gold:
          </Typography>

          <Paper
            sx={{
              p: 3,
              my: 4,
              bgcolor: 'rgba(255, 215, 0, 0.05)',
              border: '1px solid rgba(255, 215, 0, 0.2)',
              borderRadius: 2,
            }}
          >
            <List>
              {[
                'High volatility = More profit opportunities',
                'Safe-haven asset during market uncertainty',
                'Strong technical patterns for algorithmic trading',
                '24/5 trading availability',
                'Inversely correlated with USD for hedging',
              ].map((item, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckCircle size={18} color="#FFD700" />
                  </ListItemIcon>
                  <ListItemText primary={item} sx={{ '& .MuiTypography-root': { color: 'text.secondary' } }} />
                </ListItem>
              ))}
            </List>
          </Paper>

          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, mt: 5, color: 'white' }}>
            Top 3 XAUUSD Trading Strategies for 2026
          </Typography>

          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, mt: 4, color: '#FFD700' }}>
            1. Trend Following with AI Confirmation
          </Typography>
          <Typography variant="body1" component="p">
            The most profitable XAUUSD strategy in 2026 combines traditional trend-following indicators 
            with AI-powered confirmation signals. Our AlgoEdge bot uses a sophisticated algorithm that:
          </Typography>
          <List sx={{ mb: 3 }}>
            {[
              'Identifies major trends using 50/200 EMA crossovers',
              'Confirms entry with AI pattern recognition',
              'Uses dynamic stop-loss based on ATR (Average True Range)',
              'Scales positions based on trend strength',
            ].map((item, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <TrendingUp size={18} color="#00c853" />
                </ListItemIcon>
                <ListItemText primary={item} sx={{ '& .MuiTypography-root': { color: 'text.secondary' } }} />
              </ListItem>
            ))}
          </List>

          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, mt: 4, color: '#FFD700' }}>
            2. London Session Breakout Strategy
          </Typography>
          <Typography variant="body1" component="p">
            Gold prices often make significant moves during the London trading session (8:00 AM - 4:00 PM GMT). 
            This strategy captures early breakouts by:
          </Typography>
          <List sx={{ mb: 3 }}>
            {[
              'Marking the Asian session high/low range',
              'Waiting for a breakout above/below the range in London session',
              'Entering with momentum confirmation',
              'Targeting 2:1 risk-reward ratio minimum',
            ].map((item, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Zap size={18} color="#00c853" />
                </ListItemIcon>
                <ListItemText primary={item} sx={{ '& .MuiTypography-root': { color: 'text.secondary' } }} />
              </ListItem>
            ))}
          </List>

          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, mt: 4, color: '#FFD700' }}>
            3. Support/Resistance with Volume Analysis
          </Typography>
          <Typography variant="body1" component="p">
            Professional gold traders know that key price levels combined with volume can predict 
            major moves. This strategy works by:
          </Typography>
          <List sx={{ mb: 3 }}>
            {[
              'Identifying weekly support and resistance zones',
              'Analyzing volume at key price levels',
              'Looking for rejection candles with high volume',
              'Entering on confirmation with tight stops',
            ].map((item, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Target size={18} color="#00c853" />
                </ListItemIcon>
                <ListItemText primary={item} sx={{ '& .MuiTypography-root': { color: 'text.secondary' } }} />
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 5, borderColor: 'rgba(255, 215, 0, 0.2)' }} />

          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: 'white' }}>
            Risk Management for Gold Trading
          </Typography>
          <Typography variant="body1" component="p">
            Even the best XAUUSD strategy will fail without proper risk management. Gold is highly 
            volatile, with daily ranges of 200-500 pips being common. Here are essential rules:
          </Typography>

          <Paper
            sx={{
              p: 3,
              my: 4,
              bgcolor: 'rgba(0, 200, 83, 0.05)',
              border: '1px solid rgba(0, 200, 83, 0.2)',
              borderRadius: 2,
            }}
          >
            <List>
              {[
                'Never risk more than 1-2% per trade',
                'Use stop-losses on EVERY trade',
                'Avoid trading during high-impact news releases',
                'Scale into positions rather than all-in entries',
                'Take partial profits at key levels',
              ].map((item, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Shield size={18} color="#00c853" />
                  </ListItemIcon>
                  <ListItemText primary={item} sx={{ '& .MuiTypography-root': { color: 'text.secondary' } }} />
                </ListItem>
              ))}
            </List>
          </Paper>

          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, mt: 5, color: 'white' }}>
            Why Use an Automated Gold Trading Bot?
          </Typography>
          <Typography variant="body1" component="p">
            Manual trading requires 24/5 screen time and emotional discipline most traders lack. 
            Automated trading bots like AlgoEdge offer significant advantages:
          </Typography>
          <List sx={{ mb: 3 }}>
            {[
              'Trade 24/5 without missing opportunities',
              'Remove emotional decision-making',
              'Execute trades with millisecond precision',
              'Backtest strategies on years of data',
              'Consistent application of risk management',
            ].map((item, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <CheckCircle size={18} color="#00c853" />
                </ListItemIcon>
                <ListItemText primary={item} sx={{ '& .MuiTypography-root': { color: 'text.secondary' } }} />
              </ListItem>
            ))}
          </List>

          <Alert 
            severity="info" 
            sx={{ 
              my: 4, 
              bgcolor: 'rgba(33, 150, 243, 0.1)', 
              border: '1px solid rgba(33, 150, 243, 0.3)',
              '& .MuiAlert-message': { color: 'white' }
            }}
          >
            <strong>Pro Tip:</strong> The best time to trade XAUUSD is during the London-New York 
            overlap (1:00 PM - 5:00 PM GMT) when liquidity and volatility are highest.
          </Alert>

          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, mt: 5, color: 'white' }}>
            Conclusion: Start Trading Gold Profitably in 2026
          </Typography>
          <Typography variant="body1" component="p">
            XAUUSD trading in 2026 offers incredible profit potential for traders who use the right 
            strategies and tools. Whether you trade manually or use an automated system like AlgoEdge, 
            the key is consistency, proper risk management, and patience.
          </Typography>
          <Typography variant="body1" component="p">
            Our AI-powered gold trading bot has helped thousands of traders achieve consistent 
            profits with minimal effort. Ready to start your gold trading journey?
          </Typography>
        </Box>

        {/* CTA Section */}
        <Box
          sx={{
            mt: 6,
            p: 5,
            borderRadius: 4,
            background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.1) 0%, rgba(255, 165, 0, 0.1) 100%)',
            border: '1px solid rgba(255, 215, 0, 0.3)',
            textAlign: 'center',
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: '#FFD700' }}>
            🪙 Start Trading Gold with AlgoEdge
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
            Join 10,000+ traders using our AI-powered XAUUSD bot. Get access to a proven 
            94%+ win rate trading system.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              component={Link}
              href="/auth/register"
              variant="contained"
              size="large"
              sx={{
                bgcolor: '#FFD700',
                color: 'black',
                fontWeight: 700,
                px: 4,
                py: 1.5,
                borderRadius: 50,
                '&:hover': { bgcolor: '#FFA500' },
              }}
            >
              Start Trading Now →
            </Button>
            <Button
              component={Link}
              href="/auth/pricing"
              variant="outlined"
              size="large"
              sx={{
                borderColor: '#FFD700',
                color: '#FFD700',
                fontWeight: 700,
                px: 4,
                py: 1.5,
                borderRadius: 50,
                '&:hover': { borderColor: '#FFA500', bgcolor: 'rgba(255, 215, 0, 0.1)' },
              }}
            >
              View Pricing
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
