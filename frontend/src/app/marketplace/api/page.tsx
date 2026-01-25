'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
} from '@mui/material';
import {
  Code,
  ChevronRight,
  Check,
  X,
  Zap,
  Shield,
  Clock,
  BarChart3,
  Webhook,
  ChevronDown,
  Copy,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

interface ApiPlan {
  id: number;
  name: string;
  description: string;
  requests_per_minute: number;
  requests_per_day: number;
  requests_per_month: number;
  price_monthly: number;
  price_yearly: number;
  features: {
    signals: boolean;
    historical_data: boolean;
    webhooks: boolean;
    support: string;
    priority_support?: boolean;
    dedicated_support?: boolean;
    custom_endpoints?: boolean;
    sla?: string;
  };
  is_featured: boolean;
}

export default function ApiAccessPage() {
  const [plans, setPlans] = useState<ApiPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/api-plans`);
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans);
      }
    } catch (error) {
      console.error('Error fetching API plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const endpoints = [
    { method: 'GET', path: '/api/signals', description: 'Get real-time trading signals', auth: true },
    { method: 'GET', path: '/api/signals/history', description: 'Historical signal data', auth: true },
    { method: 'GET', path: '/api/market/prices', description: 'Live market prices', auth: true },
    { method: 'GET', path: '/api/market/candles', description: 'OHLCV candle data', auth: true },
    { method: 'POST', path: '/api/webhooks', description: 'Register webhooks for signals', auth: true },
    { method: 'GET', path: '/api/account/usage', description: 'API usage statistics', auth: true },
  ];

  const codeExample = `// Example: Fetch trading signals
const response = await fetch('https://api.algoedgehub.com/api/signals', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
});

const signals = await response.json();
console.log(signals);

// Response:
{
  "success": true,
  "signals": [
    {
      "id": 1234,
      "symbol": "XAUUSD",
      "type": "BUY",
      "entry": 2045.50,
      "stop_loss": 2040.00,
      "take_profit": [2055.00, 2060.00, 2070.00],
      "confidence": 85,
      "timestamp": "2026-01-25T10:30:00Z"
    }
  ]
}`;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a' }}>
      {/* Header */}
      <Box
        sx={{
          py: { xs: 4, md: 6 },
          background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.05) 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
            <Link href="/marketplace" style={{ textDecoration: 'none' }}>
              <Typography sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: '#8B5CF6' } }}>
                Marketplace
              </Typography>
            </Link>
            <ChevronRight size={16} color="rgba(255,255,255,0.4)" />
            <Typography sx={{ color: 'white' }}>API Access</Typography>
          </Stack>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Code size={40} color="#8B5CF6" />
            <Typography variant="h3" sx={{ color: 'white', fontWeight: 800 }}>
              API Access
            </Typography>
          </Box>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', maxWidth: 600 }}>
            Build powerful trading applications with our REST API. Access real-time signals,
            market data, and webhooks for automated trading.
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* Features Overview */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {[
            { icon: Zap, title: 'Real-time Signals', desc: 'Get trading signals as they\'re generated', color: '#22C55E' },
            { icon: BarChart3, title: 'Market Data', desc: 'Live prices and historical OHLCV data', color: '#3B82F6' },
            { icon: Webhook, title: 'Webhooks', desc: 'Receive signals via webhooks to your server', color: '#F59E0B' },
            { icon: Shield, title: '99.9% Uptime', desc: 'Enterprise-grade reliability and security', color: '#8B5CF6' },
          ].map((feature, i) => (
            <Grid item xs={6} md={3} key={i}>
              <Paper
                sx={{
                  p: 3,
                  textAlign: 'center',
                  bgcolor: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  height: '100%',
                }}
              >
                <Box
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: 2,
                    bgcolor: `${feature.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  <feature.icon size={24} color={feature.color} />
                </Box>
                <Typography sx={{ color: 'white', fontWeight: 700, mb: 0.5 }}>
                  {feature.title}
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
                  {feature.desc}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>

        {/* Pricing Plans */}
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, mb: 4, textAlign: 'center' }}>
          Choose Your Plan
        </Typography>

        <Grid container spacing={3} sx={{ mb: 6 }}>
          {plans.map((plan) => (
            <Grid item xs={12} sm={6} md={3} key={plan.id}>
              <Card
                sx={{
                  height: '100%',
                  bgcolor: plan.is_featured ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255,255,255,0.03)',
                  border: plan.is_featured ? '2px solid #8B5CF6' : '1px solid rgba(255,255,255,0.1)',
                  position: 'relative',
                }}
              >
                {plan.is_featured && (
                  <Chip
                    label="POPULAR"
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
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, mb: 1 }}>
                    {plan.name}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', mb: 3 }}>
                    {plan.description}
                  </Typography>

                  <Box sx={{ mb: 3 }}>
                    <Typography sx={{ color: '#8B5CF6', fontWeight: 900, fontSize: '2.5rem' }}>
                      ${plan.price_monthly}
                      <Typography component="span" sx={{ fontSize: '1rem', color: 'rgba(255,255,255,0.5)' }}>
                        /mo
                      </Typography>
                    </Typography>
                    {plan.price_yearly > 0 && (
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                        or ${plan.price_yearly}/year (save {Math.round(100 - (plan.price_yearly / (plan.price_monthly * 12)) * 100)}%)
                      </Typography>
                    )}
                  </Box>

                  {/* Rate Limits */}
                  <Box sx={{ mb: 3, p: 2, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 1 }}>
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', mb: 1 }}>
                      Rate Limits
                    </Typography>
                    <Typography sx={{ color: 'white', fontSize: '0.875rem' }}>
                      {plan.requests_per_minute}/min • {plan.requests_per_day.toLocaleString()}/day
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                      {plan.requests_per_month.toLocaleString()}/month
                    </Typography>
                  </Box>

                  {/* Features */}
                  <List dense sx={{ mb: 2 }}>
                    {[
                      { label: 'Trading Signals', enabled: plan.features.signals },
                      { label: 'Historical Data', enabled: plan.features.historical_data },
                      { label: 'Webhooks', enabled: plan.features.webhooks },
                      { label: 'Priority Support', enabled: plan.features.priority_support },
                      { label: 'Custom Endpoints', enabled: plan.features.custom_endpoints },
                    ].map((feature, i) => (
                      <ListItem key={i} sx={{ px: 0, py: 0.5 }}>
                        <ListItemIcon sx={{ minWidth: 28 }}>
                          {feature.enabled ? (
                            <Check size={16} color="#22C55E" />
                          ) : (
                            <X size={16} color="rgba(255,255,255,0.2)" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={feature.label}
                          sx={{
                            '& .MuiTypography-root': {
                              color: feature.enabled ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.3)',
                              fontSize: '0.875rem',
                            },
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>

                  {plan.features.sla && (
                    <Chip
                      label={`${plan.features.sla} SLA`}
                      size="small"
                      sx={{ bgcolor: 'rgba(34, 197, 94, 0.2)', color: '#22C55E', mb: 2 }}
                    />
                  )}

                  <Button
                    component={Link}
                    href={plan.price_monthly === 0 ? '/auth/register' : '/dashboard/api'}
                    fullWidth
                    variant={plan.is_featured ? 'contained' : 'outlined'}
                    sx={{
                      mt: 'auto',
                      bgcolor: plan.is_featured ? '#8B5CF6' : 'transparent',
                      borderColor: '#8B5CF6',
                      color: plan.is_featured ? 'white' : '#8B5CF6',
                      '&:hover': {
                        bgcolor: plan.is_featured ? '#7C3AED' : 'rgba(139, 92, 246, 0.1)',
                      },
                    }}
                  >
                    {plan.price_monthly === 0 ? 'Get Started Free' : 'Subscribe'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* API Endpoints */}
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, mb: 4 }}>
          Available Endpoints
        </Typography>

        <TableContainer
          component={Paper}
          sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', mb: 6 }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  Method
                </TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  Endpoint
                </TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  Description
                </TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.5)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  Auth
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {endpoints.map((endpoint, i) => (
                <TableRow key={i}>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <Chip
                      label={endpoint.method}
                      size="small"
                      sx={{
                        bgcolor: endpoint.method === 'GET' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                        color: endpoint.method === 'GET' ? '#22C55E' : '#3B82F6',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ color: 'white', fontFamily: 'monospace', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {endpoint.path}
                  </TableCell>
                  <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {endpoint.description}
                  </TableCell>
                  <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    {endpoint.auth && (
                      <Chip label="Required" size="small" sx={{ bgcolor: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B' }} />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Code Example */}
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, mb: 4 }}>
          Quick Start
        </Typography>

        <Paper
          sx={{
            p: 3,
            bgcolor: '#1a1a2e',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 2,
            mb: 6,
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
              JavaScript / Node.js
            </Typography>
            <Button
              size="small"
              startIcon={<Copy size={14} />}
              onClick={() => navigator.clipboard.writeText(codeExample)}
              sx={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Copy
            </Button>
          </Box>
          <Box
            component="pre"
            sx={{
              color: '#22C55E',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
              overflow: 'auto',
              m: 0,
              whiteSpace: 'pre-wrap',
            }}
          >
            {codeExample}
          </Box>
        </Paper>

        {/* FAQ */}
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, mb: 4 }}>
          Frequently Asked Questions
        </Typography>

        {[
          {
            q: 'How do I get an API key?',
            a: 'Sign up for an account, choose a plan, and generate your API key from the dashboard. Starter plan available for developers.',
          },
          {
            q: 'What are the rate limits?',
            a: 'Rate limits depend on your plan. Starter: 30 req/min. Developer: 60 req/min. Business: 120 req/min. Enterprise: 500 req/min.',
          },
          {
            q: 'Can I use the API for automated trading?',
            a: 'Yes! Our API is designed for automated trading. Use webhooks to receive signals in real-time and execute trades programmatically.',
          },
          {
            q: 'Is there a sandbox environment?',
            a: 'Yes, we provide a sandbox environment for testing. Use the base URL api-sandbox.algoedgehub.com with your API key.',
          },
        ].map((faq, i) => (
          <Accordion
            key={i}
            sx={{
              bgcolor: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.1)',
              mb: 1,
              '&:before': { display: 'none' },
            }}
          >
            <AccordionSummary expandIcon={<ChevronDown color="white" />}>
              <Typography sx={{ color: 'white', fontWeight: 600 }}>{faq.q}</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>{faq.a}</Typography>
            </AccordionDetails>
          </Accordion>
        ))}

        {/* CTA */}
        <Box
          sx={{
            mt: 6,
            p: 4,
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(59, 130, 246, 0.1) 100%)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: 3,
          }}
        >
          <Typography variant="h5" sx={{ color: 'white', fontWeight: 800, mb: 2 }}>
            Ready to Build?
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
            Start with our free tier and upgrade as you grow.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              component={Link}
              href="/auth/register"
              variant="contained"
              size="large"
              sx={{
                bgcolor: '#8B5CF6',
                '&:hover': { bgcolor: '#7C3AED' },
                fontWeight: 700,
                px: 4,
              }}
            >
              Get API Key
            </Button>
            <Button
              href="https://docs.algoedgehub.com/api"
              target="_blank"
              variant="outlined"
              size="large"
              endIcon={<ExternalLink size={16} />}
              sx={{
                borderColor: 'rgba(255,255,255,0.3)',
                color: 'white',
                '&:hover': { borderColor: '#8B5CF6' },
              }}
            >
              View Documentation
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
