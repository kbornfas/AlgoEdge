'use client';

import React from 'react';
import {
  Box,
  Container,
  Typography,
  Breadcrumbs,
  Chip,
  Stack,
  Button,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import { 
  Calendar, 
  Clock, 
  ArrowLeft, 
  CheckCircle, 
  Brain,
  Target,
  Shield,
  Heart,
  TrendingUp,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import Link from 'next/link';

export default function TradingPsychologyPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0a0a' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, rgba(236,72,153,0.15) 0%, rgba(219,39,119,0.1) 100%)',
          borderBottom: '1px solid rgba(236,72,153,0.2)',
          py: 8,
        }}
      >
        <Container maxWidth="lg">
          <Button
            component={Link}
            href="/blog"
            startIcon={<ArrowLeft size={18} />}
            sx={{ mb: 3, color: 'rgba(255,255,255,0.7)' }}
          >
            Back to Blog
          </Button>

          <Breadcrumbs sx={{ mb: 3, color: 'rgba(255,255,255,0.5)' }}>
            <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
            <Link href="/blog" style={{ color: 'inherit', textDecoration: 'none' }}>Blog</Link>
            <Typography color="white">Trading Psychology</Typography>
          </Breadcrumbs>

          <Chip
            label="Psychology"
            sx={{
              mb: 2,
              bgcolor: 'rgba(236,72,153,0.2)',
              color: '#EC4899',
              fontWeight: 600,
            }}
          />

          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              mb: 3,
              color: 'white',
              maxWidth: 800,
            }}
          >
            Trading Psychology: Overcoming Fear and Greed in Forex
          </Typography>

          <Typography
            variant="h6"
            sx={{ color: 'rgba(255,255,255,0.7)', mb: 3, maxWidth: 700 }}
          >
            Master your trading mindset. Learn proven techniques to control emotions, 
            stay disciplined, and make rational trading decisions under pressure.
          </Typography>

          <Stack direction="row" spacing={3} sx={{ color: 'rgba(255,255,255,0.5)' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Calendar size={16} />
              <Typography variant="body2">January 20, 2026</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Clock size={16} />
              <Typography variant="body2">9 min read</Typography>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Content */}
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Box
              sx={{
                color: 'rgba(255,255,255,0.9)',
                '& h2': { color: 'white', fontWeight: 700, mt: 4, mb: 2 },
                '& h3': { color: 'white', fontWeight: 600, mt: 3, mb: 1.5 },
                '& p': { mb: 2, lineHeight: 1.8, color: 'rgba(255,255,255,0.8)' },
                '& ul': { mb: 2, pl: 3 },
                '& li': { mb: 1, color: 'rgba(255,255,255,0.8)' },
              }}
            >
              <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem' }}>
                The biggest barrier to trading success isn't strategy or knowledge—it's psychology. 
                Even the best trading system will fail if you can't control your emotions. Fear and 
                greed are the two primary emotions that destroy trading accounts.
              </Typography>

              <Typography variant="h2">Understanding Trading Emotions</Typography>

              <Paper sx={{ p: 3, mb: 3, bgcolor: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.2)' }}>
                <Typography variant="h6" sx={{ color: '#EC4899', mb: 2 }}>The Two Deadly Emotions:</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <AlertTriangle color="#EF4444" size={20} />
                      <Typography sx={{ fontWeight: 600, color: 'white' }}>Fear</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Causes you to exit trades too early, miss valid setups, or freeze when action is needed.
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Target color="#F59E0B" size={20} />
                      <Typography sx={{ fontWeight: 600, color: 'white' }}>Greed</Typography>
                    </Box>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Causes overtrading, holding losers too long, and risking too much per trade.
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              <Typography variant="h2">Signs You're Trading Emotionally</Typography>

              <List>
                <ListItem>
                  <ListItemIcon><CheckCircle color="#EC4899" size={20} /></ListItemIcon>
                  <ListItemText primary="Moving stop losses to avoid taking a loss" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircle color="#EC4899" size={20} /></ListItemIcon>
                  <ListItemText primary="Revenge trading after a losing trade" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircle color="#EC4899" size={20} /></ListItemIcon>
                  <ListItemText primary="Increasing position size to recover losses quickly" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircle color="#EC4899" size={20} /></ListItemIcon>
                  <ListItemText primary="Closing profitable trades too early out of fear" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircle color="#EC4899" size={20} /></ListItemIcon>
                  <ListItemText primary="Holding losing trades hoping they'll turn around" />
                </ListItem>
              </List>

              <Typography variant="h2">5 Techniques to Master Trading Psychology</Typography>

              <Typography variant="h3">1. Trade with a Written Plan</Typography>
              <Typography paragraph>
                Before every trade, write down your entry, stop loss, take profit, and the reason 
                for the trade. This forces logical thinking and creates accountability.
              </Typography>

              <Typography variant="h3">2. Use Proper Position Sizing</Typography>
              <Typography paragraph>
                Never risk more than 1-2% of your account on a single trade. When losses don't 
                threaten your account, emotions stay manageable.
              </Typography>

              <Typography variant="h3">3. Accept Losses as Business Expenses</Typography>
              <Typography paragraph>
                Even the best traders lose 40-50% of their trades. Losses are inevitable—your 
                job is to keep them small and let winners run.
              </Typography>

              <Typography variant="h3">4. Take Breaks After Losses</Typography>
              <Typography paragraph>
                After two consecutive losses, step away from the screen. Clear your mind before 
                the next trade. Revenge trading is the fastest way to blow an account.
              </Typography>

              <Typography variant="h3">5. Use Automated Trading Systems</Typography>
              <Typography paragraph>
                The most effective solution to emotional trading is removing yourself from execution. 
                Automated trading bots follow rules without fear or greed, executing your strategy 
                consistently 24/7.
              </Typography>

              <Paper sx={{ p: 4, my: 4, bgcolor: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,200,83,0.3)', borderRadius: 2 }}>
                <Typography variant="h5" sx={{ color: '#00c853', fontWeight: 700, mb: 2 }}>
                  Eliminate Emotional Trading with AlgoEdge
                </Typography>
                <Typography sx={{ mb: 3, color: 'rgba(255,255,255,0.8)' }}>
                  Our AI-powered trading bots execute your strategy with machine precision—no fear, 
                  no greed, no revenge trading. Just consistent, disciplined execution.
                </Typography>
                <Button
                  component={Link}
                  href="/marketplace/bots"
                  variant="contained"
                  sx={{
                    bgcolor: '#00c853',
                    color: 'black',
                    fontWeight: 700,
                    '&:hover': { bgcolor: '#00e676' },
                  }}
                >
                  Explore Trading Bots →
                </Button>
              </Paper>

              <Typography variant="h2">Building a Trading Journal</Typography>
              <Typography paragraph>
                A trading journal is your most powerful psychological tool. After every trade, record:
              </Typography>

              <List>
                <ListItem>
                  <ListItemIcon><BookOpen color="#EC4899" size={20} /></ListItemIcon>
                  <ListItemText primary="Your emotional state before, during, and after the trade" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><BookOpen color="#EC4899" size={20} /></ListItemIcon>
                  <ListItemText primary="Whether you followed your trading plan exactly" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><BookOpen color="#EC4899" size={20} /></ListItemIcon>
                  <ListItemText primary="What triggered any deviation from your plan" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><BookOpen color="#EC4899" size={20} /></ListItemIcon>
                  <ListItemText primary="Lessons learned and improvements to make" />
                </ListItem>
              </List>

              <Typography variant="h2">Conclusion</Typography>
              <Typography paragraph>
                Trading psychology separates profitable traders from the 95% who fail. By implementing 
                these techniques—trading with a plan, proper sizing, accepting losses, taking breaks, 
                and using automation—you can transform your mindset and results.
              </Typography>
              <Typography paragraph>
                Remember: The market will always be there. Your job is to preserve capital, control 
                emotions, and wait for high-probability setups. Patience and discipline always beat 
                impulsive trading.
              </Typography>
            </Box>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            <Box sx={{ position: 'sticky', top: 100 }}>
              <Paper sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>
                  Key Takeaways
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon><Brain color="#EC4899" size={18} /></ListItemIcon>
                    <ListItemText 
                      primary="Fear and greed destroy accounts"
                      primaryTypographyProps={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Target color="#EC4899" size={18} /></ListItemIcon>
                    <ListItemText 
                      primary="Trade with a written plan"
                      primaryTypographyProps={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Shield color="#EC4899" size={18} /></ListItemIcon>
                    <ListItemText 
                      primary="Risk only 1-2% per trade"
                      primaryTypographyProps={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Heart color="#EC4899" size={18} /></ListItemIcon>
                    <ListItemText 
                      primary="Take breaks after losses"
                      primaryTypographyProps={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><TrendingUp color="#EC4899" size={18} /></ListItemIcon>
                    <ListItemText 
                      primary="Automate for consistency"
                      primaryTypographyProps={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}
                    />
                  </ListItem>
                </List>
              </Paper>

              <Paper sx={{ p: 3, mt: 3, bgcolor: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <Typography variant="h6" sx={{ color: '#8B5CF6', fontWeight: 700, mb: 2 }}>
                  Related Products
                </Typography>
                <Button
                  component={Link}
                  href="/marketplace/products"
                  fullWidth
                  variant="outlined"
                  sx={{ 
                    mb: 1, 
                    color: '#8B5CF6', 
                    borderColor: 'rgba(139,92,246,0.5)',
                    '&:hover': { borderColor: '#8B5CF6', bgcolor: 'rgba(139,92,246,0.1)' }
                  }}
                >
                  Trading Psychology Course
                </Button>
                <Button
                  component={Link}
                  href="/marketplace/bots"
                  fullWidth
                  variant="outlined"
                  sx={{ 
                    color: '#8B5CF6', 
                    borderColor: 'rgba(139,92,246,0.5)',
                    '&:hover': { borderColor: '#8B5CF6', bgcolor: 'rgba(139,92,246,0.1)' }
                  }}
                >
                  Automated Trading Bots
                </Button>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
