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
  Stepper,
  Step,
  StepLabel,
  StepContent,
} from '@mui/material';
import { Calendar, Clock, ArrowLeft, CheckCircle, Settings, Link2, Play, Shield, Zap } from 'lucide-react';
import Link from 'next/link';

const setupSteps = [
  {
    label: 'Create Your MT5 Account',
    description: 'Sign up with a supported broker and download MetaTrader 5. Make sure to choose a broker that offers the currency pairs you want to trade.',
  },
  {
    label: 'Sign Up for AlgoEdge',
    description: 'Create your AlgoEdge account and choose a subscription plan. We offer starter, pro, and enterprise plans to fit your trading needs.',
  },
  {
    label: 'Connect Your MT5 Account',
    description: 'Enter your MT5 account number, password, and server name in the AlgoEdge dashboard. We use MetaAPI for secure, encrypted connections.',
  },
  {
    label: 'Configure Your Trading Settings',
    description: 'Set your risk parameters, lot sizes, and choose which trading robots you want to activate. Our AI will optimize settings for your account size.',
  },
  {
    label: 'Activate and Start Trading',
    description: 'Turn on your selected robots and watch the AI execute trades automatically. Monitor your performance in real-time from your dashboard.',
  },
];

export default function AutomateMT5Page() {
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
            label="MT5 Guides"
            sx={{
              mb: 2,
              bgcolor: 'rgba(33, 150, 243, 0.1)',
              color: '#2196F3',
              border: '1px solid rgba(33, 150, 243, 0.3)',
            }}
          />
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              mb: 2,
              fontSize: { xs: '2rem', md: '2.75rem' },
              background: 'linear-gradient(135deg, #2196F3 0%, #1565C0 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            How to Automate MT5 Trading: Step-by-Step Guide for 2026
          </Typography>
          <Stack direction="row" spacing={3} sx={{ color: 'text.secondary', mb: 4 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Calendar size={16} />
              <Typography variant="body2">January 12, 2026</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Clock size={16} />
              <Typography variant="body2">10 min read</Typography>
            </Stack>
          </Stack>
        </Box>

        {/* Article Content */}
        <Box sx={{ '& p': { color: 'text.secondary', lineHeight: 1.8, mb: 3 } }}>
          <Typography variant="body1" component="p" sx={{ fontSize: '1.1rem' }}>
            MetaTrader 5 (MT5) is the world&apos;s most popular trading platform, used by millions of 
            forex traders worldwide. But did you know you can <strong style={{ color: '#2196F3' }}>fully 
            automate your MT5 trading</strong> and earn passive income while you sleep? In this 
            comprehensive guide, we&apos;ll show you exactly how to set up automated trading on MT5.
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
            <strong>AlgoEdge Users:</strong> Our platform makes MT5 automation simple. Connect your 
            account in under 5 minutes and let AI trade for you 24/5.
          </Alert>

          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, mt: 5, color: 'white' }}>
            What is MT5 Automated Trading?
          </Typography>
          <Typography variant="body1" component="p">
            MT5 automated trading (also called algorithmic trading or algo trading) uses computer 
            programs to execute trades automatically based on predefined rules. Instead of manually 
            analyzing charts and clicking buy/sell, software does it for you with perfect discipline.
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
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2, color: '#2196F3' }}>
              Benefits of MT5 Automation:
            </Typography>
            <List>
              {[
                'Trade 24 hours a day, 5 days a week without being at your computer',
                'Remove emotional trading decisions that cause losses',
                'Execute trades in milliseconds - faster than any human',
                'Backtest strategies on historical data before going live',
                'Manage multiple currency pairs simultaneously',
                'Consistent application of your trading strategy',
              ].map((item, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <CheckCircle size={18} color="#2196F3" />
                  </ListItemIcon>
                  <ListItemText primary={item} sx={{ '& .MuiTypography-root': { color: 'text.secondary' } }} />
                </ListItem>
              ))}
            </List>
          </Paper>

          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, mt: 5, color: 'white' }}>
            3 Ways to Automate MT5 Trading
          </Typography>

          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, mt: 4, color: '#2196F3' }}>
            1. Expert Advisors (EAs) - Traditional Method
          </Typography>
          <Typography variant="body1" component="p">
            Expert Advisors are programs written in MQL5 that run directly inside MetaTrader 5. 
            They&apos;re the traditional way to automate trading but have limitations:
          </Typography>
          <List sx={{ mb: 3 }}>
            {[
              'Requires a VPS running 24/7 (additional cost)',
              'Programming knowledge needed to create or modify',
              'Each EA must be purchased separately',
              'Complex setup and configuration process',
            ].map((item, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Settings size={18} color="#ff9800" />
                </ListItemIcon>
                <ListItemText primary={item} sx={{ '& .MuiTypography-root': { color: 'text.secondary' } }} />
              </ListItem>
            ))}
          </List>

          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, mt: 4, color: '#2196F3' }}>
            2. Copy Trading - Social Method
          </Typography>
          <Typography variant="body1" component="p">
            Copy trading lets you automatically replicate trades from other successful traders. 
            While easy to set up, there are risks:
          </Typography>
          <List sx={{ mb: 3 }}>
            {[
              'Dependent on another trader\'s performance',
              'Fees reduce your profits',
              'Past performance doesn\'t guarantee future results',
              'Limited control over trade execution',
            ].map((item, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Link2 size={18} color="#ff9800" />
                </ListItemIcon>
                <ListItemText primary={item} sx={{ '& .MuiTypography-root': { color: 'text.secondary' } }} />
              </ListItem>
            ))}
          </List>

          <Typography variant="h5" sx={{ fontWeight: 600, mb: 2, mt: 4, color: '#00c853' }}>
            3. Cloud-Based Trading Bots - Modern Method ⭐
          </Typography>
          <Typography variant="body1" component="p">
            Cloud-based solutions like AlgoEdge connect to your MT5 account via secure APIs. 
            This is the most convenient and powerful approach:
          </Typography>
          <List sx={{ mb: 3 }}>
            {[
              'No VPS required - runs on our servers 24/7',
              'AI-powered strategies continuously optimized',
              'Simple dashboard to monitor and control',
              'Multiple robots available in one subscription',
              'Secure API connection (your password is encrypted)',
            ].map((item, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <CheckCircle size={18} color="#00c853" />
                </ListItemIcon>
                <ListItemText primary={item} sx={{ '& .MuiTypography-root': { color: 'text.secondary' } }} />
              </ListItem>
            ))}
          </List>

          <Divider sx={{ my: 5, borderColor: 'rgba(33, 150, 243, 0.2)' }} />

          <Typography variant="h4" sx={{ fontWeight: 700, mb: 4, color: 'white' }}>
            How to Connect MT5 to AlgoEdge (5-Minute Setup)
          </Typography>

          <Stepper orientation="vertical" sx={{ mb: 4 }}>
            {setupSteps.map((step, index) => (
              <Step key={step.label} active={true}>
                <StepLabel
                  sx={{
                    '& .MuiStepLabel-label': { color: 'white', fontWeight: 600 },
                    '& .MuiStepIcon-root': { color: '#2196F3' },
                    '& .MuiStepIcon-text': { fill: 'white' },
                  }}
                >
                  {step.label}
                </StepLabel>
                <StepContent>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {step.description}
                  </Typography>
                </StepContent>
              </Step>
            ))}
          </Stepper>

          <Alert 
            severity="info" 
            sx={{ 
              my: 4, 
              bgcolor: 'rgba(33, 150, 243, 0.1)', 
              border: '1px solid rgba(33, 150, 243, 0.3)',
              '& .MuiAlert-message': { color: 'white' }
            }}
          >
            <strong>Security Note:</strong> AlgoEdge uses bank-level encryption for all MT5 
            connections. We never store your password in plain text and use MetaAPI&apos;s 
            secure infrastructure trusted by thousands of traders.
          </Alert>

          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, mt: 5, color: 'white' }}>
            Best Practices for MT5 Automation
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
                { icon: Shield, text: 'Start with a demo account to test the system' },
                { icon: Zap, text: 'Use proper position sizing (1-2% risk per trade)' },
                { icon: Settings, text: 'Monitor performance daily in the first week' },
                { icon: Play, text: 'Start with one robot, then add more as you gain confidence' },
                { icon: CheckCircle, text: 'Keep your broker account funded with buffer capital' },
              ].map((item, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <item.icon size={18} color="#00c853" />
                  </ListItemIcon>
                  <ListItemText primary={item.text} sx={{ '& .MuiTypography-root': { color: 'text.secondary' } }} />
                </ListItem>
              ))}
            </List>
          </Paper>

          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, mt: 5, color: 'white' }}>
            Frequently Asked Questions
          </Typography>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#2196F3', mb: 1 }}>
              Is MT5 automation safe?
            </Typography>
            <Typography variant="body1" component="p">
              Yes, when using reputable services like AlgoEdge. We use encrypted API connections 
              and never have withdrawal access to your account.
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#2196F3', mb: 1 }}>
              How much money do I need to start?
            </Typography>
            <Typography variant="body1" component="p">
              We recommend starting with at least $500-$1000 for proper position sizing. 
              However, you can start with as little as $100 for testing.
            </Typography>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, color: '#2196F3', mb: 1 }}>
              Which brokers are supported?
            </Typography>
            <Typography variant="body1" component="p">
              AlgoEdge works with most MT5 brokers including XM, IC Markets, Exness, FBS, 
              OctaFX, and many more. Check our dashboard for the full list.
            </Typography>
          </Box>

          <Typography variant="h4" sx={{ fontWeight: 700, mb: 3, mt: 5, color: 'white' }}>
            Conclusion: Start Automating Your MT5 Today
          </Typography>
          <Typography variant="body1" component="p">
            MT5 automation is the future of retail forex trading. By leveraging AI-powered 
            trading bots, you can trade professionally without spending hours analyzing charts. 
            AlgoEdge makes the entire process simple, secure, and profitable.
          </Typography>
        </Box>

        {/* CTA Section */}
        <Box
          sx={{
            mt: 6,
            p: 5,
            borderRadius: 4,
            background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(21, 101, 192, 0.1) 100%)',
            border: '1px solid rgba(33, 150, 243, 0.3)',
            textAlign: 'center',
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: '#2196F3' }}>
            📊 Automate Your MT5 in 5 Minutes
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
            Connect your MT5 account to AlgoEdge and let our AI trade for you 24/5. 
            No VPS, no coding, no hassle.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button
              component={Link}
              href="/auth/register"
              variant="contained"
              size="large"
              sx={{
                bgcolor: '#2196F3',
                color: 'white',
                fontWeight: 700,
                px: 4,
                py: 1.5,
                borderRadius: 50,
                '&:hover': { bgcolor: '#1976D2' },
              }}
            >
              Connect MT5 Now →
            </Button>
            <Button
              component={Link}
              href="/auth/pricing"
              variant="outlined"
              size="large"
              sx={{
                borderColor: '#2196F3',
                color: '#2196F3',
                fontWeight: 700,
                px: 4,
                py: 1.5,
                borderRadius: 50,
                '&:hover': { borderColor: '#1976D2', bgcolor: 'rgba(33, 150, 243, 0.1)' },
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
