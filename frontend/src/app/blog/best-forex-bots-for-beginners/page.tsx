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
  Rating,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { Calendar, Clock, ArrowLeft, CheckCircle, Star, AlertTriangle, TrendingUp, Shield, DollarSign } from 'lucide-react';
import Link from 'next/link';

const forexBots = [
  {
    rank: 1,
    name: 'AlgoEdge',
    rating: 5,
    winRate: '94%+',
    price: 'From $99/mo',
    pairs: 'XAUUSD, Major Pairs',
    pros: ['AI-powered', '8 robots included', 'Easy MT5 connection', '24/7 support'],
    recommended: true,
  },
  {
    rank: 2,
    name: 'Forex Fury',
    rating: 4,
    winRate: '93%',
    price: '$229 one-time',
    pairs: 'Major Pairs',
    pros: ['Long track record', 'Low risk settings', 'Regular updates'],
    recommended: false,
  },
  {
    rank: 3,
    name: 'GPS Forex Robot',
    rating: 3.5,
    winRate: '89%',
    price: '$149 one-time',
    pairs: 'EUR/USD, GBP/USD',
    pros: ['Simple to use', 'Affordable', 'Good for beginners'],
    recommended: false,
  },
  {
    rank: 4,
    name: 'WallStreet Forex Robot',
    rating: 3.5,
    winRate: '85%',
    price: '$297 one-time',
    pairs: 'Multiple pairs',
    pros: ['Multiple strategies', 'Scalping mode', 'Broker protection'],
    recommended: false,
  },
  {
    rank: 5,
    name: 'Flex EA',
    rating: 3,
    winRate: '80%',
    price: '$330 one-time',
    pairs: 'Any pair',
    pros: ['Flexible settings', 'Multiple strategies', 'Active community'],
    recommended: false,
  },
];

export default function ForexBotsPage() {
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
            label="Reviews"
            sx={{
              mb: 2,
              bgcolor: 'rgba(0, 200, 83, 0.1)',
              color: '#00c853',
              border: '1px solid rgba(0, 200, 83, 0.3)',
            }}
          />
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              mb: 2,
              fontSize: { xs: '2rem', md: '2.75rem' },
              background: 'linear-gradient(135deg, #00c853 0%, #00e676 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Best Forex Bots for Beginners 2026: Top 5 Automated Trading Systems
          </Typography>
          <Stack direction="row" spacing={3} sx={{ color: 'text.secondary', mb: 4 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Calendar size={16} />
              <Typography variant="body2">January 10, 2026</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Clock size={16} />
              <Typography variant="body2">12 min read</Typography>
            </Stack>
          </Stack>
        </Box>

        {/* Article Content */}
        <Box sx={{ '& p': { color: 'text.secondary', lineHeight: 1.8, mb: 3 } }}>
          <Typography variant="body1" component="p" sx={{ fontSize: '1.1rem' }}>
            Looking to start forex trading but don&apos;t have time to learn technical analysis? 
            <strong style={{ color: '#00c853' }}> Forex trading bots</strong> can automate the 
            entire process for you. In this comprehensive review, we&apos;ll compare the 
            <strong style={{ color: '#00c853' }}> best forex bots for beginners in 2026</strong>, 
            covering features, costs, pros, cons, and expected returns.
          </Typography>

          <Alert 
            severity="warning" 
            sx={{ 
              my: 4, 
              bgcolor: 'rgba(255, 152, 0, 0.1)', 
              border: '1px solid rgba(255, 152, 0, 0.3)',
              '& .MuiAlert-message': { color: 'white' }
            }}
          >
            <strong>Disclaimer:</strong> Forex trading involves significant risk. Past performance 
            does not guarantee future results. Only invest money you can afford to lose.
          </Alert>

          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, mt: 5, color: 'white' }}>
            What is a Forex Trading Bot?
          </Typography>
          <Typography variant="body1" component="p">
            A forex trading bot (also called Expert Advisor or EA) is software that automatically 
            executes trades on your behalf. These bots connect to trading platforms like MetaTrader 4 
            or MetaTrader 5 and trade 24/5 based on programmed strategies.
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
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#00c853' }}>
              Why Use a Forex Bot?
            </Typography>
            <List>
              {[
                'Trade 24/5 without watching screens',
                'No emotions = better trading decisions',
                'Execute strategies faster than humanly possible',
                'Start trading without years of learning',
                'Diversify across multiple currency pairs',
              ].map((item, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckCircle size={18} color="#00c853" />
                  </ListItemIcon>
                  <ListItemText primary={item} sx={{ '& .MuiTypography-root': { color: 'text.secondary' } }} />
                </ListItem>
              ))}
            </List>
          </Paper>

          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, mt: 5, color: 'white' }}>
            Top 5 Forex Bots for Beginners (2026 Comparison)
          </Typography>

          <TableContainer 
            component={Paper} 
            sx={{ 
              my: 4, 
              bgcolor: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'rgba(0, 200, 83, 0.1)' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Rank</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Bot Name</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Win Rate</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Price</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 700 }}>Rating</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {forexBots.map((bot) => (
                  <TableRow 
                    key={bot.rank}
                    sx={{ 
                      bgcolor: bot.recommended ? 'rgba(0, 200, 83, 0.05)' : 'transparent',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                    }}
                  >
                    <TableCell sx={{ color: 'text.secondary' }}>
                      {bot.recommended ? (
                        <Chip label="#1 Pick" size="small" sx={{ bgcolor: '#00c853', color: 'black', fontWeight: 700 }} />
                      ) : (
                        `#${bot.rank}`
                      )}
                    </TableCell>
                    <TableCell sx={{ color: 'white', fontWeight: 600 }}>{bot.name}</TableCell>
                    <TableCell sx={{ color: '#00c853', fontWeight: 600 }}>{bot.winRate}</TableCell>
                    <TableCell sx={{ color: 'text.secondary' }}>{bot.price}</TableCell>
                    <TableCell>
                      <Rating value={bot.rating} precision={0.5} size="small" readOnly />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Divider sx={{ my: 5, borderColor: 'rgba(0, 200, 83, 0.2)' }} />

          {/* Individual Reviews */}
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, color: 'white' }}>
            Detailed Reviews
          </Typography>

          {/* AlgoEdge Review */}
          <Paper
            sx={{
              p: 4,
              my: 4,
              bgcolor: 'rgba(0, 200, 83, 0.08)',
              border: '2px solid rgba(0, 200, 83, 0.3)',
              borderRadius: 3,
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#00c853' }}>
                #1: AlgoEdge (Best Overall) ⭐
              </Typography>
              <Chip label="Editor's Choice" sx={{ bgcolor: '#00c853', color: 'black', fontWeight: 700 }} />
            </Stack>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              <Rating value={5} size="small" readOnly />
              <Typography variant="body2" color="text.secondary">(5.0/5)</Typography>
            </Stack>
            <Typography variant="body1" component="p">
              AlgoEdge is a cloud-based forex trading platform that connects to your MT5 account 
              via secure API. Unlike traditional EAs, you don&apos;t need a VPS - everything runs on 
              their servers. The platform includes 8 AI-powered robots covering gold, forex pairs, 
              and indices.
            </Typography>
            <List>
              {[
                '94%+ verified win rate on XAUUSD',
                '8 different robots in one subscription',
                'Easy 5-minute MT5 connection',
                'Real-time dashboard with trade monitoring',
                'Telegram signals included',
                '24/7 customer support',
              ].map((item, index) => (
                <ListItem key={index} sx={{ py: 0.25 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckCircle size={16} color="#00c853" />
                  </ListItemIcon>
                  <ListItemText primary={item} sx={{ '& .MuiTypography-root': { color: 'text.secondary', fontSize: '0.9rem' } }} />
                </ListItem>
              ))}
            </List>
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Chip icon={<DollarSign size={14} />} label="From $99/month" size="small" />
              <Chip icon={<TrendingUp size={14} />} label="94%+ Win Rate" size="small" sx={{ bgcolor: 'rgba(0, 200, 83, 0.2)', color: '#00c853' }} />
            </Stack>
          </Paper>

          {/* Other Reviews */}
          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, mt: 4, color: 'white' }}>
            #2: Forex Fury
          </Typography>
          <Typography variant="body1" component="p">
            Forex Fury is one of the oldest forex EAs on the market with a proven track record. 
            It focuses on low-risk scalping during low volatility hours. Good option for 
            conservative traders who prefer one-time purchases over subscriptions.
          </Typography>
          <List sx={{ mb: 3 }}>
            <ListItem sx={{ py: 0.25 }}>
              <ListItemIcon sx={{ minWidth: 32 }}><CheckCircle size={16} color="#00c853" /></ListItemIcon>
              <ListItemText primary="Long track record (since 2015)" sx={{ '& .MuiTypography-root': { color: 'text.secondary' } }} />
            </ListItem>
            <ListItem sx={{ py: 0.25 }}>
              <ListItemIcon sx={{ minWidth: 32 }}><AlertTriangle size={16} color="#ff9800" /></ListItemIcon>
              <ListItemText primary="Requires VPS ($15-30/month extra)" sx={{ '& .MuiTypography-root': { color: 'text.secondary' } }} />
            </ListItem>
          </List>

          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, mt: 4, color: 'white' }}>
            #3: GPS Forex Robot
          </Typography>
          <Typography variant="body1" component="p">
            GPS Forex Robot is a budget-friendly option popular with beginners. It uses a 
            reverse strategy that bets against common retail positions. Simple to set up 
            but limited to only two currency pairs.
          </Typography>

          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, mt: 4, color: 'white' }}>
            #4: WallStreet Forex Robot
          </Typography>
          <Typography variant="body1" component="p">
            WallStreet Forex Robot offers multiple trading strategies including scalping and 
            trend following. It includes broker spy protection to detect unfavorable conditions. 
            Higher price point but includes lifetime updates.
          </Typography>

          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, mt: 4, color: 'white' }}>
            #5: Flex EA
          </Typography>
          <Typography variant="body1" component="p">
            Flex EA is highly customizable with 12 different strategies built-in. Popular 
            with intermediate traders who want to experiment with settings. Steep learning 
            curve makes it less suitable for complete beginners.
          </Typography>

          <Divider sx={{ my: 5, borderColor: 'rgba(0, 200, 83, 0.2)' }} />

          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, color: 'white' }}>
            How to Choose a Forex Bot (Beginner&apos;s Checklist)
          </Typography>

          <Paper
            sx={{
              p: 3,
              my: 4,
              bgcolor: 'rgba(33, 150, 243, 0.05)',
              border: '1px solid rgba(33, 150, 243, 0.2)',
              borderRadius: 2,
            }}
          >
            <List>
              {[
                { icon: Shield, text: 'Verified track record with real trading results' },
                { icon: Star, text: 'Positive reviews from real users' },
                { icon: DollarSign, text: 'Transparent pricing (no hidden fees)' },
                { icon: TrendingUp, text: 'Clear risk management features' },
                { icon: CheckCircle, text: 'Responsive customer support' },
                { icon: CheckCircle, text: 'Money-back guarantee or trial period' },
              ].map((item, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <item.icon size={18} color="#2196F3" />
                  </ListItemIcon>
                  <ListItemText primary={item.text} sx={{ '& .MuiTypography-root': { color: 'text.secondary' } }} />
                </ListItem>
              ))}
            </List>
          </Paper>

          <Alert 
            severity="info" 
            sx={{ 
              my: 4, 
              bgcolor: 'rgba(33, 150, 243, 0.1)', 
              border: '1px solid rgba(33, 150, 243, 0.3)',
              '& .MuiAlert-message': { color: 'white' }
            }}
          >
            <strong>Pro Tip:</strong> Always test forex bots on a demo account first. Most 
            legitimate providers offer demo testing or money-back guarantees.
          </Alert>

          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, mt: 5, color: 'white' }}>
            Conclusion: Best Forex Bot for Beginners in 2026
          </Typography>
          <Typography variant="body1" component="p">
            After testing dozens of forex trading bots, <strong style={{ color: '#00c853' }}>AlgoEdge 
            stands out as the best option for beginners</strong>. The cloud-based setup eliminates 
            VPS headaches, the AI-powered robots deliver consistent results, and the platform is 
            genuinely beginner-friendly.
          </Typography>
          <Typography variant="body1" component="p">
            For those who prefer one-time purchases, Forex Fury is a solid alternative with a 
            proven track record. Whatever you choose, remember that no bot guarantees profits - 
            always use proper risk management and never trade with money you can&apos;t afford to lose.
          </Typography>
        </Box>

        {/* CTA Section */}
        <Box
          sx={{
            mt: 6,
            p: 5,
            borderRadius: 4,
            background: 'linear-gradient(135deg, rgba(0, 200, 83, 0.1) 0%, rgba(0, 150, 36, 0.1) 100%)',
            border: '1px solid rgba(0, 200, 83, 0.3)',
            textAlign: 'center',
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: '#00c853' }}>
            🤖 Try AlgoEdge Risk-Free
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
            Join 10,000+ traders using our AI-powered forex bots. Start with demo trading 
            to see the results before going live.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              component={Link}
              href="/auth/register"
              variant="contained"
              size="large"
              sx={{
                bgcolor: '#00c853',
                color: 'black',
                fontWeight: 700,
                px: 4,
                py: 1.5,
                borderRadius: 50,
                '&:hover': { bgcolor: '#00e676' },
              }}
            >
              Start Free Trial →
            </Button>
            <Button
              component={Link}
              href="/auth/pricing"
              variant="outlined"
              size="large"
              sx={{
                borderColor: '#00c853',
                color: '#00c853',
                fontWeight: 700,
                px: 4,
                py: 1.5,
                borderRadius: 50,
                '&:hover': { borderColor: '#00e676', bgcolor: 'rgba(0, 200, 83, 0.1)' },
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
