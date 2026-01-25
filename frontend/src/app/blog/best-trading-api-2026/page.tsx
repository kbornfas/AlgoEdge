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
} from '@mui/material';
import { Calendar, Clock, ArrowLeft, CheckCircle, Star, Code, Zap, Server, Shield, Database, Globe, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { Metadata } from 'next';

const apiProviders = [
  {
    rank: 1,
    name: 'AlgoEdge Trading API',
    rating: 5,
    latency: '<10ms',
    price: 'From $29.99/mo',
    features: ['Real-time market data', 'WebSocket streaming', 'Historical data 5+ years', '99.9% uptime SLA'],
    endpoints: '50+',
    recommended: true,
  },
  {
    rank: 2,
    name: 'Alpha Vantage',
    rating: 4,
    latency: '~50ms',
    price: 'From $49.99/mo',
    features: ['Stock & Forex data', 'Technical indicators', 'Fundamentals'],
    endpoints: '30+',
    recommended: false,
  },
  {
    rank: 3,
    name: 'Polygon.io',
    rating: 4,
    latency: '~15ms',
    price: 'From $29/mo',
    features: ['US stocks focus', 'Real-time data', 'WebSocket'],
    endpoints: '40+',
    recommended: false,
  },
  {
    rank: 4,
    name: 'Finnhub',
    rating: 3.5,
    latency: '~30ms',
    price: 'From $60/mo',
    features: ['Global markets', 'News API', 'Earnings calendar'],
    endpoints: '25+',
    recommended: false,
  },
  {
    rank: 5,
    name: 'Twelve Data',
    rating: 3.5,
    latency: '~40ms',
    price: 'From $29/mo',
    features: ['Forex & Crypto', 'Technical analysis', 'ETF data'],
    endpoints: '20+',
    recommended: false,
  },
];

const codeExamples = {
  rest: `// Fetch real-time forex quotes
const response = await fetch(
  'https://api.algoedge.io/v1/forex/quote?symbol=EURUSD',
  {
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    }
  }
);

const data = await response.json();
console.log(data);
// { symbol: "EURUSD", bid: 1.0854, ask: 1.0856, timestamp: "2026-01-25T10:30:00Z" }`,

  websocket: `// Real-time price streaming
const ws = new WebSocket('wss://stream.algoedge.io/v1');

ws.onopen = () => {
  ws.send(JSON.stringify({
    action: 'subscribe',
    symbols: ['EURUSD', 'GBPUSD', 'XAUUSD'],
    apiKey: 'YOUR_API_KEY'
  }));
};

ws.onmessage = (event) => {
  const tick = JSON.parse(event.data);
  console.log(\`\${tick.symbol}: \${tick.bid}/\${tick.ask}\`);
};`,

  python: `import algoedge

# Initialize client
client = algoedge.Client(api_key="YOUR_API_KEY")

# Get historical candles
candles = client.get_candles(
    symbol="XAUUSD",
    timeframe="1H",
    limit=100
)

# Calculate moving average
import pandas as pd
df = pd.DataFrame(candles)
df['SMA_20'] = df['close'].rolling(20).mean()

# Place a trade signal
signal = client.create_signal(
    symbol="XAUUSD",
    direction="buy",
    entry=2035.50,
    stop_loss=2030.00,
    take_profit=2050.00
)`,
};

export default function TradingAPIPage() {
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
              label="Trading APIs" 
              size="small" 
              sx={{ bgcolor: 'rgba(139, 92, 246, 0.2)', color: '#8B5CF6', fontWeight: 600 }} 
            />
            <Chip 
              label="Developer Guide" 
              size="small" 
              sx={{ bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6', fontWeight: 600 }} 
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
            Best Trading APIs for Algorithmic Trading in 2026: Complete Developer Guide
          </Typography>

          <Typography
            sx={{
              fontSize: '1.2rem',
              color: 'rgba(255,255,255,0.8)',
              mb: 3,
              lineHeight: 1.7,
            }}
          >
            Compare the top trading APIs for building automated trading systems. Real-time market data, 
            historical prices, WebSocket streaming, and everything developers need to build profitable trading bots.
          </Typography>

          <Stack direction="row" spacing={3} sx={{ color: 'text.secondary' }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Calendar size={16} />
              <Typography variant="body2">January 25, 2026</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Clock size={16} />
              <Typography variant="body2">12 min read</Typography>
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
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=400&fit=crop"
            alt="Trading API Development"
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
          icon={<Zap size={20} />}
          sx={{ 
            mb: 6, 
            bgcolor: 'rgba(139, 92, 246, 0.1)', 
            border: '1px solid rgba(139, 92, 246, 0.3)',
            '& .MuiAlert-message': { color: 'rgba(255,255,255,0.9)' },
            '& .MuiAlert-icon': { color: '#8B5CF6' },
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Key Takeaways
          </Typography>
          <List dense sx={{ py: 0 }}>
            <ListItem sx={{ py: 0.5, px: 0 }}>• Low latency (&lt;10ms) is critical for algorithmic trading success</ListItem>
            <ListItem sx={{ py: 0.5, px: 0 }}>• WebSocket connections essential for real-time price streaming</ListItem>
            <ListItem sx={{ py: 0.5, px: 0 }}>• Historical data depth determines backtesting accuracy</ListItem>
            <ListItem sx={{ py: 0.5, px: 0 }}>• AlgoEdge API rated #1 for forex and gold trading automation</ListItem>
          </List>
        </Alert>

        {/* Table of Contents */}
        <Paper sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, mb: 6, border: '1px solid rgba(255,255,255,0.08)' }}>
          <Typography variant="h6" sx={{ color: 'white', mb: 2, fontWeight: 700 }}>
            📑 Table of Contents
          </Typography>
          <List dense>
            {[
              'What is a Trading API?',
              'Best Trading APIs Compared',
              'Key Features to Look For',
              'Code Examples & Integration',
              'AlgoEdge API Deep Dive',
              'Pricing & Plans',
              'Getting Started Guide',
            ].map((item, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <Typography sx={{ color: '#8B5CF6', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}>
                  {index + 1}. {item}
                </Typography>
              </ListItem>
            ))}
          </List>
        </Paper>

        {/* Introduction */}
        <Typography variant="h2" sx={{ color: 'white', fontSize: '1.75rem', fontWeight: 700, mb: 3 }}>
          What is a Trading API?
        </Typography>
        
        <Typography sx={{ color: 'rgba(255,255,255,0.85)', mb: 3, lineHeight: 1.8, fontSize: '1.05rem' }}>
          A <strong>Trading API (Application Programming Interface)</strong> is a set of protocols and tools that allow 
          developers to programmatically access financial market data, execute trades, and build automated trading systems. 
          Whether you're building a trading bot, developing a fintech application, or creating custom technical analysis tools, 
          a reliable trading API is the foundation of your infrastructure.
        </Typography>

        <Typography sx={{ color: 'rgba(255,255,255,0.85)', mb: 4, lineHeight: 1.8, fontSize: '1.05rem' }}>
          In 2026, the algorithmic trading market has exploded, with over <strong>75% of forex trades</strong> now executed 
          by automated systems. Having access to fast, reliable market data through a well-designed API can mean the 
          difference between profitable and losing strategies.
        </Typography>

        <Divider sx={{ my: 5, borderColor: 'rgba(255,255,255,0.1)' }} />

        {/* API Comparison Table */}
        <Typography variant="h2" sx={{ color: 'white', fontSize: '1.75rem', fontWeight: 700, mb: 3 }}>
          Best Trading APIs Compared (2026)
        </Typography>

        <TableContainer component={Paper} sx={{ mb: 5, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(139, 92, 246, 0.1)' }}>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Rank</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>API Provider</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Rating</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Latency</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Price</TableCell>
                <TableCell sx={{ color: 'white', fontWeight: 700 }}>Endpoints</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {apiProviders.map((api) => (
                <TableRow 
                  key={api.rank}
                  sx={{ 
                    bgcolor: api.recommended ? 'rgba(139, 92, 246, 0.08)' : 'transparent',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' }
                  }}
                >
                  <TableCell sx={{ color: 'white' }}>
                    {api.rank === 1 ? '🥇' : api.rank === 2 ? '🥈' : api.rank === 3 ? '🥉' : `#${api.rank}`}
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: api.recommended ? 700 : 400 }}>
                    {api.name}
                    {api.recommended && (
                      <Chip label="Editor's Choice" size="small" sx={{ ml: 1, bgcolor: '#8B5CF6', color: 'white', fontSize: '0.65rem' }} />
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill={i < api.rating ? '#EAB308' : 'transparent'} color="#EAB308" />
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ color: api.latency === '<10ms' ? '#22C55E' : 'rgba(255,255,255,0.7)' }}>
                    {api.latency}
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{api.price}</TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)' }}>{api.endpoints}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Key Features Section */}
        <Typography variant="h2" sx={{ color: 'white', fontSize: '1.75rem', fontWeight: 700, mb: 3 }}>
          Key Features to Look For in a Trading API
        </Typography>

        <Grid container spacing={3} sx={{ mb: 5 }}>
          {[
            { icon: <Zap size={24} />, title: 'Low Latency', desc: 'Sub-10ms response times for real-time trading decisions', color: '#F59E0B' },
            { icon: <Server size={24} />, title: 'WebSocket Support', desc: 'Streaming data for live price updates without polling', color: '#3B82F6' },
            { icon: <Database size={24} />, title: 'Historical Data', desc: '5+ years of tick data for accurate backtesting', color: '#8B5CF6' },
            { icon: <Shield size={24} />, title: '99.9% Uptime', desc: 'Enterprise-grade reliability with SLA guarantees', color: '#22C55E' },
            { icon: <Globe size={24} />, title: 'Global Markets', desc: 'Forex, stocks, crypto, commodities - all in one API', color: '#EC4899' },
            { icon: <Code size={24} />, title: 'SDKs & Libraries', desc: 'Python, JavaScript, C# libraries for quick integration', color: '#14B8A6' },
          ].map((feature, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card sx={{ 
                bgcolor: 'rgba(255,255,255,0.03)', 
                border: '1px solid rgba(255,255,255,0.08)',
                height: '100%',
                transition: 'all 0.3s',
                '&:hover': { borderColor: feature.color, transform: 'translateY(-4px)' }
              }}>
                <CardContent>
                  <Box sx={{ color: feature.color, mb: 2 }}>{feature.icon}</Box>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>{feature.title}</Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>{feature.desc}</Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Divider sx={{ my: 5, borderColor: 'rgba(255,255,255,0.1)' }} />

        {/* Code Examples */}
        <Typography variant="h2" sx={{ color: 'white', fontSize: '1.75rem', fontWeight: 700, mb: 3 }}>
          Code Examples & Integration
        </Typography>

        <Typography sx={{ color: 'rgba(255,255,255,0.85)', mb: 4, lineHeight: 1.8 }}>
          Here are practical code examples showing how to integrate the AlgoEdge Trading API into your applications:
        </Typography>

        {/* REST API Example */}
        <Paper sx={{ p: 3, bgcolor: '#1a1a2e', borderRadius: 2, mb: 4, border: '1px solid rgba(139, 92, 246, 0.3)' }}>
          <Typography variant="subtitle1" sx={{ color: '#8B5CF6', fontWeight: 700, mb: 2 }}>
            📡 REST API - Fetch Real-time Quotes (JavaScript)
          </Typography>
          <Box
            component="pre"
            sx={{
              bgcolor: '#0d0d1a',
              p: 2,
              borderRadius: 1,
              overflow: 'auto',
              fontSize: '0.85rem',
              color: '#22C55E',
              fontFamily: 'Consolas, Monaco, monospace',
            }}
          >
            {codeExamples.rest}
          </Box>
        </Paper>

        {/* WebSocket Example */}
        <Paper sx={{ p: 3, bgcolor: '#1a1a2e', borderRadius: 2, mb: 4, border: '1px solid rgba(59, 130, 246, 0.3)' }}>
          <Typography variant="subtitle1" sx={{ color: '#3B82F6', fontWeight: 700, mb: 2 }}>
            🔌 WebSocket - Real-time Price Streaming (JavaScript)
          </Typography>
          <Box
            component="pre"
            sx={{
              bgcolor: '#0d0d1a',
              p: 2,
              borderRadius: 1,
              overflow: 'auto',
              fontSize: '0.85rem',
              color: '#3B82F6',
              fontFamily: 'Consolas, Monaco, monospace',
            }}
          >
            {codeExamples.websocket}
          </Box>
        </Paper>

        {/* Python Example */}
        <Paper sx={{ p: 3, bgcolor: '#1a1a2e', borderRadius: 2, mb: 4, border: '1px solid rgba(34, 197, 94, 0.3)' }}>
          <Typography variant="subtitle1" sx={{ color: '#22C55E', fontWeight: 700, mb: 2 }}>
            🐍 Python SDK - Historical Data & Trading Signals
          </Typography>
          <Box
            component="pre"
            sx={{
              bgcolor: '#0d0d1a',
              p: 2,
              borderRadius: 1,
              overflow: 'auto',
              fontSize: '0.85rem',
              color: '#22C55E',
              fontFamily: 'Consolas, Monaco, monospace',
            }}
          >
            {codeExamples.python}
          </Box>
        </Paper>

        <Divider sx={{ my: 5, borderColor: 'rgba(255,255,255,0.1)' }} />

        {/* AlgoEdge API Deep Dive */}
        <Typography variant="h2" sx={{ color: 'white', fontSize: '1.75rem', fontWeight: 700, mb: 3 }}>
          Why AlgoEdge API is #1 for Forex Trading
        </Typography>

        <Alert 
          severity="success" 
          icon={<TrendingUp size={20} />}
          sx={{ 
            mb: 4, 
            bgcolor: 'rgba(34, 197, 94, 0.1)', 
            border: '1px solid rgba(34, 197, 94, 0.3)',
            '& .MuiAlert-message': { color: 'rgba(255,255,255,0.9)' },
            '& .MuiAlert-icon': { color: '#22C55E' },
          }}
        >
          <Typography>
            AlgoEdge API processes over <strong>2 million API calls daily</strong> with an average latency of just <strong>8ms</strong>.
            Our infrastructure is specifically optimized for forex and gold (XAUUSD) trading automation.
          </Typography>
        </Alert>

        <List sx={{ mb: 4 }}>
          {[
            'Ultra-low latency data centers in New York, London, and Tokyo',
            'Native support for MT4/MT5 integration',
            'Pre-built trading strategies you can deploy via API',
            'Comprehensive backtesting endpoints with tick-level precision',
            'Real-time news sentiment analysis API',
            'Economic calendar integration with market impact scores',
            'Dedicated account managers for Professional and Enterprise plans',
          ].map((feature, index) => (
            <ListItem key={index} sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                <CheckCircle size={18} color="#22C55E" />
              </ListItemIcon>
              <ListItemText 
                primary={feature} 
                sx={{ '& .MuiListItemText-primary': { color: 'rgba(255,255,255,0.9)' } }} 
              />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 5, borderColor: 'rgba(255,255,255,0.1)' }} />

        {/* Pricing */}
        <Typography variant="h2" sx={{ color: 'white', fontSize: '1.75rem', fontWeight: 700, mb: 3 }}>
          AlgoEdge API Pricing Plans
        </Typography>

        <Grid container spacing={3} sx={{ mb: 5 }}>
          {[
            { name: 'Starter', price: '$29.99', requests: '1,000/day', features: ['All REST endpoints', 'WebSocket access', '30-day history', 'Email support'] },
            { name: 'Professional', price: '$99.99', requests: '10,000/day', features: ['Priority queue', '5-year history', 'Custom alerts', 'Priority support'], popular: true },
            { name: 'Enterprise', price: '$499.99', requests: '100,000/day', features: ['Dedicated server', 'Custom SLA', '99.9% uptime', 'Account manager'] },
          ].map((plan) => (
            <Grid item xs={12} md={4} key={plan.name}>
              <Card sx={{ 
                bgcolor: plan.popular ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.03)', 
                border: plan.popular ? '2px solid #8B5CF6' : '1px solid rgba(255,255,255,0.08)',
                height: '100%',
                position: 'relative',
              }}>
                {plan.popular && (
                  <Chip 
                    label="Most Popular" 
                    size="small" 
                    sx={{ 
                      position: 'absolute', 
                      top: -12, 
                      left: '50%', 
                      transform: 'translateX(-50%)',
                      bgcolor: '#8B5CF6', 
                      color: 'white',
                      fontWeight: 700,
                    }} 
                  />
                )}
                <CardContent sx={{ textAlign: 'center', pt: 4 }}>
                  <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>{plan.name}</Typography>
                  <Typography sx={{ color: '#8B5CF6', fontSize: '2rem', fontWeight: 800, my: 2 }}>{plan.price}<Typography component="span" sx={{ fontSize: '1rem', color: 'rgba(255,255,255,0.6)' }}>/mo</Typography></Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.6)', mb: 3 }}>{plan.requests}</Typography>
                  <Divider sx={{ mb: 2, borderColor: 'rgba(255,255,255,0.1)' }} />
                  <List dense>
                    {plan.features.map((f, i) => (
                      <ListItem key={i} sx={{ py: 0.5, px: 0, justifyContent: 'center' }}>
                        <CheckCircle size={14} color="#22C55E" style={{ marginRight: 8 }} />
                        <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>{f}</Typography>
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* CTA */}
        <Paper sx={{ 
          p: 4, 
          bgcolor: 'rgba(139, 92, 246, 0.1)', 
          borderRadius: 3, 
          border: '1px solid rgba(139, 92, 246, 0.3)',
          textAlign: 'center',
          mb: 5,
        }}>
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, mb: 2 }}>
            Ready to Build Your Trading Bot?
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 3, maxWidth: 500, mx: 'auto' }}>
            Get started with the AlgoEdge Trading API today. Full documentation, SDKs, and 24/7 developer support included.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button 
              component={Link}
              href="/marketplace/api"
              variant="contained" 
              size="large"
              endIcon={<ArrowRight size={18} />}
              sx={{ 
                bgcolor: '#8B5CF6', 
                color: 'white', 
                fontWeight: 700,
                px: 4,
                '&:hover': { bgcolor: '#7C3AED' }
              }}
            >
              View API Plans
            </Button>
            <Button 
              component={Link}
              href="/docs/api"
              variant="outlined" 
              size="large"
              sx={{ 
                borderColor: '#8B5CF6', 
                color: '#8B5CF6',
                fontWeight: 700,
                px: 4,
                '&:hover': { borderColor: '#A78BFA', bgcolor: 'rgba(139, 92, 246, 0.1)' }
              }}
            >
              Read Documentation
            </Button>
          </Stack>
        </Paper>

        {/* FAQ Section */}
        <Typography variant="h2" sx={{ color: 'white', fontSize: '1.75rem', fontWeight: 700, mb: 3 }}>
          Frequently Asked Questions
        </Typography>

        {[
          { q: 'What programming languages does the API support?', a: 'Our API is language-agnostic REST/WebSocket. We provide official SDKs for Python, JavaScript/TypeScript, C#, and Java. Community libraries exist for Go, Rust, and Ruby.' },
          { q: 'Can I use the API for live trading?', a: 'Yes! The AlgoEdge API supports both paper trading (simulation) and live trading through MT4/MT5 broker integration. You can test strategies risk-free before going live.' },
          { q: 'What markets are covered?', a: 'We cover all major forex pairs, gold (XAUUSD), silver, indices (US30, NAS100, S&P500), and major cryptocurrencies. Enterprise plans can request additional instruments.' },
          { q: 'Is there a rate limit?', a: 'Rate limits depend on your plan: Starter (1,000/day), Professional (10,000/day), Enterprise (100,000/day). WebSocket connections are unlimited on all paid plans.' },
        ].map((faq, index) => (
          <Paper key={index} sx={{ p: 3, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, mb: 2, border: '1px solid rgba(255,255,255,0.08)' }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>{faq.q}</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>{faq.a}</Typography>
          </Paper>
        ))}

        {/* Author & Related */}
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
