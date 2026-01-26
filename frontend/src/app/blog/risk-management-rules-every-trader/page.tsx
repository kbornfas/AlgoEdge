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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { 
  Calendar, 
  Clock, 
  ArrowLeft, 
  CheckCircle, 
  Shield,
  Percent,
  Calculator,
  AlertTriangle,
  Target,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

export default function RiskManagementRulesPage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0a0a' }}>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(220,38,38,0.1) 100%)',
          borderBottom: '1px solid rgba(239,68,68,0.2)',
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
            <Typography color="white">Risk Management</Typography>
          </Breadcrumbs>

          <Chip
            label="Risk Management"
            sx={{
              mb: 2,
              bgcolor: 'rgba(239,68,68,0.2)',
              color: '#EF4444',
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
            5 Risk Management Rules Every Forex Trader Must Follow
          </Typography>

          <Typography
            variant="h6"
            sx={{ color: 'rgba(255,255,255,0.7)', mb: 3, maxWidth: 700 }}
          >
            Protect your capital with these essential risk management strategies. Learn position 
            sizing, stop losses, and the 2% rule for long-term trading success.
          </Typography>

          <Stack direction="row" spacing={3} sx={{ color: 'rgba(255,255,255,0.5)' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Calendar size={16} />
              <Typography variant="body2">January 18, 2026</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Clock size={16} />
              <Typography variant="body2">7 min read</Typography>
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
              }}
            >
              <Typography variant="body1" paragraph sx={{ fontSize: '1.1rem' }}>
                Risk management is the foundation of successful trading. Without proper risk controls, 
                even the best strategy will eventually fail. Professional traders protect their capital 
                first and focus on profits second.
              </Typography>

              <Paper sx={{ p: 3, mb: 4, bgcolor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                <Typography variant="h6" sx={{ color: '#EF4444', mb: 1 }}>
                  ⚠️ Critical Statistic
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
                  95% of forex traders fail, and poor risk management is the #1 reason. 
                  Master these 5 rules to join the profitable 5%.
                </Typography>
              </Paper>

              {/* Rule 1 */}
              <Typography variant="h2">
                <Box component="span" sx={{ color: '#EF4444' }}>Rule 1:</Box> Never Risk More Than 2% Per Trade
              </Typography>
              <Typography paragraph>
                The 2% rule is the cornerstone of professional trading. By limiting risk to 2% of your 
                account per trade, you ensure survival even during losing streaks.
              </Typography>

              <TableContainer component={Paper} sx={{ mb: 3, bgcolor: 'rgba(255,255,255,0.03)' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Account Size</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>Max Risk (2%)</TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>10 Consecutive Losses</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.8)' }}>$1,000</TableCell>
                      <TableCell sx={{ color: '#EF4444' }}>$20</TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.8)' }}>-18.3% (recoverable)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.8)' }}>$5,000</TableCell>
                      <TableCell sx={{ color: '#EF4444' }}>$100</TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.8)' }}>-18.3% (recoverable)</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.8)' }}>$10,000</TableCell>
                      <TableCell sx={{ color: '#EF4444' }}>$200</TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.8)' }}>-18.3% (recoverable)</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Rule 2 */}
              <Typography variant="h2">
                <Box component="span" sx={{ color: '#EF4444' }}>Rule 2:</Box> Always Use Stop Losses
              </Typography>
              <Typography paragraph>
                A trade without a stop loss is gambling, not trading. Stop losses are non-negotiable 
                for professional risk management.
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><CheckCircle color="#22C55E" size={20} /></ListItemIcon>
                  <ListItemText primary="Set your stop loss BEFORE entering the trade" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircle color="#22C55E" size={20} /></ListItemIcon>
                  <ListItemText primary="Never move it further from entry to 'give it room'" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircle color="#22C55E" size={20} /></ListItemIcon>
                  <ListItemText primary="Consider trailing stops to lock in profits" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><AlertTriangle color="#F59E0B" size={20} /></ListItemIcon>
                  <ListItemText primary="NEVER trade without a stop loss—ever" />
                </ListItem>
              </List>

              {/* Rule 3 */}
              <Typography variant="h2">
                <Box component="span" sx={{ color: '#EF4444' }}>Rule 3:</Box> Maintain Positive Risk-Reward Ratio
              </Typography>
              <Typography paragraph>
                Only take trades where potential profit exceeds potential loss. A minimum 1:2 
                risk-reward ratio is recommended.
              </Typography>

              <Paper sx={{ p: 3, mb: 3, bgcolor: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <Typography variant="h6" sx={{ color: '#22C55E', mb: 2 }}>Profitability Math:</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <Typography sx={{ fontWeight: 600, color: 'white' }}>1:2 Risk-Reward</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Only need 34% win rate to be profitable
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography sx={{ fontWeight: 600, color: 'white' }}>1:3 Risk-Reward</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Only need 25% win rate to be profitable
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Typography sx={{ fontWeight: 600, color: 'white' }}>1:1 Risk-Reward</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                      Need 51%+ win rate to be profitable
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>

              {/* Rule 4 */}
              <Typography variant="h2">
                <Box component="span" sx={{ color: '#EF4444' }}>Rule 4:</Box> Diversify Your Trading
              </Typography>
              <Typography paragraph>
                Don't put all your eggs in one basket. Spread risk across multiple currency pairs, 
                strategies, and timeframes.
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><CheckCircle color="#22C55E" size={20} /></ListItemIcon>
                  <ListItemText primary="Trade multiple currency pairs" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircle color="#22C55E" size={20} /></ListItemIcon>
                  <ListItemText primary="Use multiple strategies (trend + range)" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircle color="#22C55E" size={20} /></ListItemIcon>
                  <ListItemText primary="Avoid correlated positions" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircle color="#22C55E" size={20} /></ListItemIcon>
                  <ListItemText primary="Limit total exposure to 6% of account" />
                </ListItem>
              </List>

              {/* Rule 5 */}
              <Typography variant="h2">
                <Box component="span" sx={{ color: '#EF4444' }}>Rule 5:</Box> Keep a Trading Journal
              </Typography>
              <Typography paragraph>
                Track every trade to identify patterns and improve your risk management over time. 
                What gets measured gets managed.
              </Typography>

              <Typography paragraph>
                Record for each trade:
              </Typography>
              <List>
                <ListItem>
                  <ListItemIcon><CheckCircle color="#22C55E" size={20} /></ListItemIcon>
                  <ListItemText primary="Entry price, stop loss, and take profit" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircle color="#22C55E" size={20} /></ListItemIcon>
                  <ListItemText primary="Risk amount and percentage" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircle color="#22C55E" size={20} /></ListItemIcon>
                  <ListItemText primary="Entry reason and market conditions" />
                </ListItem>
                <ListItem>
                  <ListItemIcon><CheckCircle color="#22C55E" size={20} /></ListItemIcon>
                  <ListItemText primary="Result and lessons learned" />
                </ListItem>
              </List>

              <Paper sx={{ p: 4, my: 4, bgcolor: 'rgba(0,200,83,0.1)', border: '1px solid rgba(0,200,83,0.3)', borderRadius: 2 }}>
                <Typography variant="h5" sx={{ color: '#00c853', fontWeight: 700, mb: 2 }}>
                  Built-In Risk Management with AlgoEdge Bots
                </Typography>
                <Typography sx={{ mb: 3, color: 'rgba(255,255,255,0.8)' }}>
                  Our trading bots automatically implement all 5 risk management rules—configurable 
                  risk per trade, automatic stop losses, smart position sizing, and diversification.
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
                  Explore Risk-Managed Bots →
                </Button>
              </Paper>

              <Typography variant="h2">Conclusion</Typography>
              <Typography paragraph>
                Risk management isn't glamorous, but it's the difference between traders who survive 
                and those who blow their accounts. Follow these 5 rules religiously, and you'll already 
                be ahead of 95% of traders.
              </Typography>
              <Typography paragraph>
                Remember: Protect your capital first. The market will always be there tomorrow, but 
                your trading account might not be if you ignore risk management.
              </Typography>
            </Box>
          </Grid>

          {/* Sidebar */}
          <Grid item xs={12} md={4}>
            <Box sx={{ position: 'sticky', top: 100 }}>
              <Paper sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>
                  The 5 Rules Summary
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemIcon><Percent color="#EF4444" size={18} /></ListItemIcon>
                    <ListItemText 
                      primary="Max 2% risk per trade"
                      primaryTypographyProps={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Shield color="#EF4444" size={18} /></ListItemIcon>
                    <ListItemText 
                      primary="Always use stop losses"
                      primaryTypographyProps={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Target color="#EF4444" size={18} /></ListItemIcon>
                    <ListItemText 
                      primary="Minimum 1:2 risk-reward"
                      primaryTypographyProps={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><TrendingUp color="#EF4444" size={18} /></ListItemIcon>
                    <ListItemText 
                      primary="Diversify your trading"
                      primaryTypographyProps={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><Calculator color="#EF4444" size={18} /></ListItemIcon>
                    <ListItemText 
                      primary="Keep a trading journal"
                      primaryTypographyProps={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.8)' }}
                    />
                  </ListItem>
                </List>
              </Paper>

              <Paper sx={{ p: 3, mt: 3, bgcolor: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <Typography variant="h6" sx={{ color: '#8B5CF6', fontWeight: 700, mb: 2 }}>
                  Related Resources
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
                  Risk Management eBook
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
                  Risk Manager Pro Bot
                </Button>
              </Paper>
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
