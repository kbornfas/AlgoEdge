'use client';

import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  InputAdornment,
  Chip,
  Button,
  Grid,
} from '@mui/material';
import {
  ChevronDown,
  Search,
  HelpCircle,
  CreditCard,
  Bot,
  Link2,
  Shield,
  TrendingUp,
  AlertTriangle,
  Mail,
  ArrowLeft,
  MessageCircle,
} from 'lucide-react';
import Link from 'next/link';

interface FAQ {
  question: string;
  answer: string;
}

interface FAQCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  faqs: FAQ[];
}

const faqCategories: FAQCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: <HelpCircle size={24} />,
    description: 'New to AlgoEdge? Start here.',
    faqs: [
      {
        question: 'What is AlgoEdge?',
        answer: 'AlgoEdge is an AI-powered automated trading platform that connects to your MT5 broker account. Our intelligent trading robots analyze the market 24/7 and execute trades automatically based on proven strategies, helping you trade forex and crypto markets without manual intervention.',
      },
      {
        question: 'How do I get started?',
        answer: `Getting started with AlgoEdge is simple:

1. **Create an account** - Sign up with your email or Google account
2. **Choose a subscription plan** - Select Weekly ($19), Monthly ($49), or Quarterly ($149)
3. **Connect your MT5 account** - Link your existing broker account using MetaApi
4. **Configure your robots** - Choose which trading robots to activate and set your risk preferences
5. **Start trading** - Your robots will automatically analyze and execute trades!`,
      },
      {
        question: 'Do I need trading experience?',
        answer: 'No prior trading experience is required! AlgoEdge is designed to be beginner-friendly. Our robots handle all the complex analysis and trade execution. However, we recommend understanding basic trading concepts and risks before starting. We provide educational resources to help you learn.',
      },
      {
        question: 'What brokers are supported?',
        answer: 'AlgoEdge works with any MT5 (MetaTrader 5) broker that supports MetaApi integration. This includes most major forex and crypto brokers worldwide. Popular supported brokers include IC Markets, Pepperstone, XM, FXTM, Exness, and many more.',
      },
      {
        question: 'Can I use a demo account first?',
        answer: 'Yes! We highly recommend starting with a demo account to familiarize yourself with the platform and test strategies risk-free. You can connect your broker\'s demo MT5 account to AlgoEdge and practice with virtual funds before trading real money.',
      },
    ],
  },
  {
    id: 'trading-robots',
    title: 'Trading Robots',
    icon: <Bot size={24} />,
    description: 'Learn about our AI-powered trading robots.',
    faqs: [
      {
        question: 'How do the trading robots work?',
        answer: `Our trading robots use advanced algorithms and AI to:

• **Analyze multiple timeframes** - Scan markets from 1-minute to daily charts
• **Identify trading opportunities** - Detect patterns, trends, and momentum shifts
• **Calculate optimal entry/exit points** - Use technical indicators like RSI, MACD, EMA, and ATR
• **Manage risk automatically** - Set stop-loss and take-profit levels based on market conditions
• **Execute trades** - Place orders directly on your MT5 account

The robots operate 24/7, analyzing over 30 currency pairs and cryptocurrencies.`,
      },
      {
        question: 'What trading strategies are used?',
        answer: `AlgoEdge offers multiple robot strategies:

• **Trend Following** - Rides major market trends with dynamic trailing stops
• **Scalper Pro** - Quick trades capturing small price movements on lower timeframes
• **Swing Master** - Medium-term positions based on swing highs/lows
• **Momentum Hunter** - Captures explosive moves during high-volume periods
• **Multi-Timeframe** - Confirms signals across multiple timeframes for higher accuracy

Each robot can be enabled/disabled and configured independently.`,
      },
      {
        question: 'Can I control which robots are active?',
        answer: 'Absolutely! From your dashboard, you can enable or disable individual robots, adjust risk settings, select which currency pairs to trade, and configure maximum positions. You have full control over your trading automation.',
      },
      {
        question: 'What is the expected win rate?',
        answer: 'Our robots target a 55-70% win rate depending on market conditions and the strategy used. However, trading results vary based on market volatility, broker execution, and risk settings. Past performance does not guarantee future results. We recommend starting with conservative settings.',
      },
      {
        question: 'How many trades per day can I expect?',
        answer: 'The number of trades varies based on market conditions and your settings. Typically, you can expect 1-10 trades per day. Scalping strategies trade more frequently, while swing strategies may only trigger a few trades per week. You can limit maximum daily trades in settings.',
      },
    ],
  },
  {
    id: 'mt5-connection',
    title: 'MT5 Connection',
    icon: <Link2 size={24} />,
    description: 'Connecting and managing your MT5 account.',
    faqs: [
      {
        question: 'How do I connect my MT5 account?',
        answer: `To connect your MT5 account:

1. Go to **Dashboard → MT5 Accounts**
2. Click **"Add MT5 Account"**
3. Enter your MT5 login credentials (account number, password, server)
4. We use **MetaApi** for secure connection - your credentials are encrypted
5. Wait for verification (usually under 1 minute)
6. Once connected, you'll see your balance and can start trading!`,
      },
      {
        question: 'Is my MT5 password safe?',
        answer: 'Yes, security is our top priority. Your MT5 credentials are encrypted using industry-standard AES-256 encryption. We use MetaApi, a trusted third-party service, for secure broker connections. We never store plain-text passwords and all data transmission uses SSL/TLS encryption.',
      },
      {
        question: 'Why is my MT5 account showing as disconnected?',
        answer: `Common reasons for disconnection:

• **Invalid credentials** - Double-check your account number and password
• **Wrong server** - Ensure you selected the correct MT5 server
• **Broker maintenance** - Try reconnecting after a few hours
• **MetaApi limits** - Free MetaApi accounts have connection limits
• **Session timeout** - Reconnect from the MT5 Accounts page

If issues persist, contact support with your account details.`,
      },
      {
        question: 'Can I connect multiple MT5 accounts?',
        answer: 'Yes! You can connect multiple MT5 accounts to AlgoEdge. This is useful if you have accounts with different brokers or want to run different strategies on separate accounts. Each account can have its own robot configuration.',
      },
      {
        question: 'Does AlgoEdge have access to withdraw my funds?',
        answer: 'No. AlgoEdge only has trading permissions on your MT5 account. We cannot withdraw funds, access your banking information, or transfer money. Withdrawals can only be done through your broker\'s official platform with your authentication.',
      },
    ],
  },
  {
    id: 'payments',
    title: 'Payments & Billing',
    icon: <CreditCard size={24} />,
    description: 'Subscription plans, payments, and refunds.',
    faqs: [
      {
        question: 'What subscription plans are available?',
        answer: `AlgoEdge offers three flexible plans:

• **Weekly** - $19/week - Perfect for testing the service
• **Monthly** - $49/month - Most popular, save 37% vs weekly
• **Quarterly** - $149/quarter - Best value, save 49%

All plans include full access to trading robots, signals, analytics, and support.`,
      },
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept payments through Whop, which supports:\n\n• Credit/Debit Cards (Visa, MasterCard, Amex)\n• PayPal\n• Apple Pay & Google Pay\n• Cryptocurrency (Bitcoin, Ethereum, USDT)\n\nAll transactions are processed securely.',
      },
      {
        question: 'How do I cancel my subscription?',
        answer: 'You can cancel your subscription anytime from your Whop dashboard or by contacting support. Your access will remain active until the end of your current billing period. No cancellation fees apply.',
      },
      {
        question: 'Do you offer refunds?',
        answer: 'Yes, we offer refunds within 7 days of your initial purchase. To request a refund, email support@algoedge.io with your account email and reason for the refund. Refunds are processed within 5-10 business days.',
      },
      {
        question: 'Will my subscription auto-renew?',
        answer: 'Yes, subscriptions automatically renew at the end of each billing period. You\'ll receive an email reminder before renewal. To stop auto-renewal, cancel your subscription before the renewal date.',
      },
    ],
  },
  {
    id: 'risk-management',
    title: 'Risk Management',
    icon: <Shield size={24} />,
    description: 'Protecting your capital and managing risk.',
    faqs: [
      {
        question: 'What risk management features are available?',
        answer: `AlgoEdge includes comprehensive risk management:

• **Kill Switch** - Automatically stops trading if drawdown exceeds limits (5%, 10%, 15%)
• **Maximum Daily Loss** - Limits losses per day to protect your account
• **Position Sizing** - Risk-based lot sizing (1-5% per trade)
• **Stop Loss/Take Profit** - Automatic SL/TP on every trade
• **Trailing Stops** - Lock in profits as trades move in your favor
• **Partial Profit Taking** - Close portions of winning trades at targets`,
      },
      {
        question: 'What is the Kill Switch?',
        answer: `The Kill Switch is an emergency protection feature that automatically stops all trading if your account experiences significant losses:

• **Soft Kill (5% drawdown)** - Reduces position sizes and becomes more selective
• **Hard Kill (10% drawdown)** - Pauses trading for 4 hours
• **Emergency Kill (15% drawdown)** - Stops all trading until manually reset

This prevents catastrophic losses during volatile market conditions.`,
      },
      {
        question: 'How much should I risk per trade?',
        answer: 'We recommend risking 1-2% of your account per trade for conservative growth. More aggressive traders might use 3-5%, but this increases risk significantly. Never risk more than you can afford to lose. Start with lower risk settings and adjust based on your comfort level.',
      },
      {
        question: 'Can I lose more than my account balance?',
        answer: 'With proper risk management and stop-losses, losses are limited to your account balance. However, in extreme market conditions (gaps, slippage), losses could theoretically exceed your balance depending on your broker\'s margin policies. We recommend using a broker with negative balance protection.',
      },
    ],
  },
  {
    id: 'signals-alerts',
    title: 'Signals & Alerts',
    icon: <TrendingUp size={24} />,
    description: 'Trading signals and notifications.',
    faqs: [
      {
        question: 'How do I receive trade alerts?',
        answer: `AlgoEdge can notify you through multiple channels:

• **Email** - Detailed trade alerts sent to your registered email
• **Telegram** - Real-time alerts via our Telegram bot
• **Dashboard** - Live updates on your AlgoEdge dashboard

Configure your notification preferences in Settings → Notifications.`,
      },
      {
        question: 'What information is included in alerts?',
        answer: 'Each trade alert includes:\n\n• Currency pair/symbol\n• Trade direction (Buy/Sell)\n• Entry price\n• Stop loss level\n• Take profit target\n• Lot size\n• Strategy/robot that generated the signal\n• Reason for the trade',
      },
      {
        question: 'Can I trade manually based on signals?',
        answer: 'Yes! While AlgoEdge can execute trades automatically, you can also use it as a signal provider. Disable auto-trading and receive alerts only, then decide which trades to take manually on your own MT5 platform.',
      },
      {
        question: 'How do I connect Telegram alerts?',
        answer: 'To enable Telegram alerts:\n\n1. Go to Settings → Notifications\n2. Click "Connect Telegram"\n3. Open the link to our Telegram bot\n4. Send /start to the bot\n5. Enter the verification code shown in your dashboard\n6. Done! You\'ll now receive real-time trade alerts.',
      },
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting',
    icon: <AlertTriangle size={24} />,
    description: 'Common issues and solutions.',
    faqs: [
      {
        question: 'Why are no trades being executed?',
        answer: `Common reasons for no trades:

• **Market closed** - Forex markets close on weekends
• **Kill Switch active** - Check if drawdown protection triggered
• **No signals** - Market conditions may not meet strategy criteria
• **MT5 disconnected** - Verify your account connection
• **Robots disabled** - Ensure at least one robot is enabled
• **Insufficient margin** - Check your account balance

Check the Analytics page for detailed status.`,
      },
      {
        question: 'My trade closed at a loss immediately, why?',
        answer: 'This can happen due to:\n\n• **Spread** - The buy/sell spread caused immediate unrealized loss\n• **Slippage** - Order filled at a different price than requested\n• **Volatile markets** - Rapid price movement hit stop loss\n• **News events** - High-impact news caused sudden movement\n\nThis is normal in trading. Our risk management limits these losses.',
      },
      {
        question: 'Dashboard not loading or showing errors?',
        answer: 'Try these steps:\n\n1. Clear your browser cache and cookies\n2. Try a different browser (Chrome recommended)\n3. Disable browser extensions temporarily\n4. Check your internet connection\n5. Log out and log back in\n\nIf issues persist, contact support with screenshots.',
      },
      {
        question: 'How do I reset the Kill Switch?',
        answer: 'If the Kill Switch has been triggered:\n\n1. Go to Dashboard → Analytics\n2. Find the "Kill Switch Status" card\n3. Click "Reset Kill Switch"\n4. Confirm the reset\n\nNote: Only reset if you\'ve assessed the market conditions and are comfortable resuming trading.',
      },
    ],
  },
];

export default function FAQPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | false>('getting-started');
  const [expandedFaq, setExpandedFaq] = useState<string | false>(false);

  // Filter FAQs based on search
  const filteredCategories = faqCategories.map(category => ({
    ...category,
    faqs: category.faqs.filter(
      faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter(category => category.faqs.length > 0);

  const totalFaqs = faqCategories.reduce((acc, cat) => acc + cat.faqs.length, 0);
  const filteredFaqsCount = filteredCategories.reduce((acc, cat) => acc + cat.faqs.length, 0);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#0a0f1a',
        py: { xs: 4, md: 8 },
      }}
    >
      <Container maxWidth="lg">
        {/* Back Button */}
        <Button
          component={Link}
          href="/"
          startIcon={<ArrowLeft size={20} />}
          sx={{
            mb: 4,
            color: 'rgba(255,255,255,0.7)',
            '&:hover': { color: '#10B981' },
          }}
        >
          Back to Home
        </Button>

        {/* Header */}
        <Paper
          sx={{
            p: { xs: 3, md: 5 },
            mb: 4,
            background: 'linear-gradient(135deg, #1a2332 0%, #0d1421 100%)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: 3,
            textAlign: 'center',
          }}
        >
          <HelpCircle size={48} color="#10B981" style={{ marginBottom: 16 }} />
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: 'white',
              fontSize: { xs: '1.75rem', md: '2.5rem' },
              mb: 2,
            }}
          >
            Frequently Asked Questions
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
            Find answers to common questions about AlgoEdge
          </Typography>

          {/* Search */}
          <TextField
            placeholder="Search FAQs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              maxWidth: 500,
              width: '100%',
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(255,255,255,0.05)',
                borderRadius: 2,
                '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                '&:hover fieldset': { borderColor: 'rgba(16, 185, 129, 0.5)' },
                '&.Mui-focused fieldset': { borderColor: '#10B981' },
              },
              '& .MuiInputBase-input': { color: 'white' },
            }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={20} color="rgba(255,255,255,0.5)" />
                </InputAdornment>
              ),
            }}
          />

          {searchQuery && (
            <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', mt: 2 }}>
              Found {filteredFaqsCount} of {totalFaqs} FAQs
            </Typography>
          )}
        </Paper>

        {/* Category Quick Links */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4, justifyContent: 'center' }}>
          {faqCategories.map((category) => (
            <Chip
              key={category.id}
              label={category.title}
              onClick={() => {
                setExpandedCategory(category.id);
                document.getElementById(category.id)?.scrollIntoView({ behavior: 'smooth' });
              }}
              sx={{
                bgcolor: expandedCategory === category.id ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                color: expandedCategory === category.id ? '#10B981' : 'rgba(255,255,255,0.7)',
                border: expandedCategory === category.id ? '1px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
                '&:hover': {
                  bgcolor: 'rgba(16, 185, 129, 0.1)',
                  color: '#10B981',
                },
              }}
            />
          ))}
        </Box>

        {/* FAQ Categories */}
        {(searchQuery ? filteredCategories : faqCategories).map((category) => (
          <Paper
            key={category.id}
            id={category.id}
            sx={{
              mb: 3,
              background: 'rgba(26, 35, 50, 0.5)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 2,
              overflow: 'hidden',
              scrollMarginTop: '100px',
            }}
          >
            {/* Category Header */}
            <Box
              sx={{
                p: 3,
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                cursor: 'pointer',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' },
              }}
              onClick={() => setExpandedCategory(expandedCategory === category.id ? false : category.id)}
            >
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'rgba(16, 185, 129, 0.1)',
                  color: '#10B981',
                }}
              >
                {category.icon}
              </Box>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'white' }}>
                  {category.title}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                  {category.description} • {category.faqs.length} questions
                </Typography>
              </Box>
              <ChevronDown
                size={24}
                color="rgba(255,255,255,0.5)"
                style={{
                  transform: expandedCategory === category.id ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.3s',
                }}
              />
            </Box>

            {/* FAQs */}
            {(expandedCategory === category.id || searchQuery) && (
              <Box sx={{ p: 2 }}>
                {category.faqs.map((faq, index) => (
                  <Accordion
                    key={index}
                    expanded={expandedFaq === `${category.id}-${index}`}
                    onChange={() =>
                      setExpandedFaq(
                        expandedFaq === `${category.id}-${index}` ? false : `${category.id}-${index}`
                      )
                    }
                    sx={{
                      bgcolor: 'transparent',
                      boxShadow: 'none',
                      '&:before': { display: 'none' },
                      border: '1px solid rgba(255,255,255,0.05)',
                      borderRadius: '8px !important',
                      mb: 1,
                      '&.Mui-expanded': {
                        bgcolor: 'rgba(16, 185, 129, 0.05)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                      },
                    }}
                  >
                    <AccordionSummary
                      expandIcon={<ChevronDown size={20} color="#10B981" />}
                      sx={{
                        '& .MuiAccordionSummary-content': { my: 1.5 },
                      }}
                    >
                      <Typography sx={{ color: 'white', fontWeight: 500 }}>
                        {faq.question}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography
                        sx={{
                          color: 'rgba(255,255,255,0.7)',
                          whiteSpace: 'pre-line',
                          lineHeight: 1.8,
                        }}
                      >
                        {faq.answer}
                      </Typography>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Box>
            )}
          </Paper>
        ))}

        {/* Still Need Help */}
        <Paper
          sx={{
            p: 4,
            mt: 4,
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(26, 35, 50, 0.5) 100%)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          <MessageCircle size={48} color="#10B981" style={{ marginBottom: 16 }} />
          <Typography variant="h5" sx={{ color: 'white', mb: 2, fontWeight: 600 }}>
            Still Have Questions?
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
            Can&apos;t find what you&apos;re looking for? Our support team is here to help!
          </Typography>
          <Grid container spacing={2} justifyContent="center">
            <Grid item>
              <Button
                component={Link}
                href="/support"
                variant="contained"
                startIcon={<Mail size={18} />}
                sx={{
                  bgcolor: '#10B981',
                  '&:hover': { bgcolor: '#059669' },
                }}
              >
                Contact Support
              </Button>
            </Grid>
            <Grid item>
              <Button
                component="a"
                href="https://t.me/algoedge_support"
                target="_blank"
                variant="outlined"
                startIcon={<MessageCircle size={18} />}
                sx={{
                  borderColor: 'rgba(255,255,255,0.3)',
                  color: 'white',
                  '&:hover': { borderColor: '#10B981', color: '#10B981' },
                }}
              >
                Telegram Support
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
}
