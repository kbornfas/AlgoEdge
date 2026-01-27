'use client';

import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  CircularProgress,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  HelpCircle,
  MessageSquare,
  Mail,
  Phone,
  Clock,
  ChevronDown,
  Send,
  Check,
  FileText,
  Video,
  Users,
} from 'lucide-react';

const faqs = [
  {
    category: 'Account & Billing',
    questions: [
      {
        question: 'How do I reset my password?',
        answer: 'Go to the login page and click "Forgot Password". Enter your email and we\'ll send you a reset link.',
      },
      {
        question: 'How do I upgrade my subscription?',
        answer: 'Go to Settings > Subscription and select your desired plan. Your new plan will be active immediately.',
      },
      {
        question: 'Can I get a refund?',
        answer: 'We offer a 7-day money-back guarantee for first-time subscribers. Contact support within 7 days of your purchase.',
      },
    ],
  },
  {
    category: 'Trading & Signals',
    questions: [
      {
        question: 'How do I connect my MT5 account?',
        answer: 'Go to Dashboard > MT5 Accounts and click "Add Account". Enter your broker, login credentials, and server details.',
      },
      {
        question: 'Are the signals guaranteed to be profitable?',
        answer: 'No trading signals are guaranteed. Our signals are based on analysis but trading involves risk. Always use proper risk management.',
      },
      {
        question: 'What timeframes do signals work on?',
        answer: 'Our signals cover multiple timeframes including M15, H1, H4, and D1. Each signal specifies the recommended timeframe.',
      },
    ],
  },
  {
    category: 'Wallet & Payments',
    questions: [
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept M-Pesa, Airtel Money, USDT (TRC20), and Bitcoin. More payment methods coming soon.',
      },
      {
        question: 'How long do withdrawals take?',
        answer: 'Withdrawals are processed within 24-48 hours. M-Pesa and Airtel Money are usually instant once approved.',
      },
      {
        question: 'What is the minimum withdrawal amount?',
        answer: 'The minimum withdrawal is $10. There\'s a 3% fee on all withdrawals.',
      },
    ],
  },
];

const supportChannels = [
  {
    icon: <Mail size={24} />,
    title: 'Email Support',
    description: 'support@algoedgehub.com',
    action: 'Send Email',
    link: 'mailto:support@algoedgehub.com',
    color: '#0066FF',
  },
  {
    icon: <MessageSquare size={24} />,
    title: 'Live Chat',
    description: 'Available 24/7',
    action: 'Start Chat',
    link: '#',
    color: '#22C55E',
  },
  {
    icon: <Users size={24} />,
    title: 'Telegram Community',
    description: 'Join our community',
    action: 'Join Now',
    link: 'https://t.me/algoedge',
    color: '#0088CC',
  },
];

export default function HelpSupportPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const response = await fetch(`${apiUrl}/api/support/ticket`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email, subject, message }),
      });

      if (response.ok) {
        setSubmitted(true);
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to submit ticket');
      }
    } catch (err) {
      setError('Failed to submit support ticket. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 2, sm: 3, md: 3 } }}>
      <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4, md: 6 } }}>
        <Typography variant="h3" sx={{ fontWeight: 800, fontSize: { xs: '1.75rem', sm: '2.25rem', md: '3rem' } }} gutterBottom>
          Help & Support
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' }, px: { xs: 1, sm: 0 } }}>
          We're here to help. Find answers to common questions or contact our support team.
        </Typography>
      </Box>

      {/* Support Channels */}
      <Grid container spacing={{ xs: 2, sm: 2, md: 3 }} sx={{ mb: { xs: 3, sm: 4, md: 6 } }}>
        {supportChannels.map((channel, index) => (
          <Grid item xs={6} sm={6} md={4} key={index}>
            <Card sx={{ height: '100%', textAlign: 'center', py: { xs: 2, sm: 2, md: 3 } }}>
              <CardContent>
                <Box
                  sx={{
                    width: { xs: 44, sm: 50, md: 60 },
                    height: { xs: 44, sm: 50, md: 60 },
                    borderRadius: 2,
                    bgcolor: `${channel.color}20`,
                    color: channel.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: { xs: 1, sm: 1.5, md: 2 },
                  }}
                >
                  {channel.icon}
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1rem', md: '1.25rem' } }} gutterBottom>
                  {channel.title}
                </Typography>
                <Typography color="text.secondary" sx={{ mb: { xs: 1.5, sm: 2, md: 2 }, fontSize: { xs: '0.75rem', sm: '0.85rem', md: '1rem' }, display: { xs: 'none', sm: 'block' } }}>
                  {channel.description}
                </Typography>
                <Button
                  variant="outlined"
                  href={channel.link}
                  target={channel.link.startsWith('http') ? '_blank' : undefined}
                  size="small"
                  sx={{ fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.875rem' }, px: { xs: 1.5, sm: 2, md: 2 } }}
                >
                  {channel.action}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
        {/* FAQs */}
        <Grid item xs={12} md={7}>
          <Typography variant="h5" sx={{ fontWeight: 700, fontSize: { xs: '1.1rem', sm: '1.3rem', md: '1.5rem' }, mb: { xs: 1.5, sm: 2, md: 2 } }}>
            Frequently Asked Questions
          </Typography>
          {faqs.map((category, categoryIndex) => (
            <Box key={categoryIndex} sx={{ mb: { xs: 2, sm: 2.5, md: 3 } }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' } }} color="primary" gutterBottom>
                {category.category}
              </Typography>
              {category.questions.map((faq, index) => (
                <Accordion key={index} sx={{ '& .MuiAccordionSummary-root': { minHeight: { xs: 40, sm: 48, md: 48 }, px: { xs: 1, sm: 2, md: 2 } } }}>
                  <AccordionSummary expandIcon={<ChevronDown size={18} />}>
                    <Typography sx={{ fontWeight: 500, fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' } }}>{faq.question}</Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: { xs: 1, sm: 2, md: 2 }, py: { xs: 1, sm: 1.5, md: 2 } }}>
                    <Typography color="text.secondary" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' }, lineHeight: 1.6 }}>{faq.answer}</Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          ))}
        </Grid>

        {/* Contact Form */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent sx={{ p: { xs: 2, sm: 2.5, md: 3 } }}>
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' } }} gutterBottom>
                Submit a Support Ticket
              </Typography>
              <Typography color="text.secondary" sx={{ mb: { xs: 2, sm: 2.5, md: 3 }, fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' } }}>
                Can't find what you're looking for? Send us a message.
              </Typography>

              {submitted ? (
                <Alert severity="success" icon={<Check />}>
                  <Typography fontWeight={600}>Ticket Submitted!</Typography>
                  <Typography variant="body2">
                    We've received your message and will respond within 24 hours.
                  </Typography>
                </Alert>
              ) : (
                <form onSubmit={handleSubmit}>
                  {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      {error}
                    </Alert>
                  )}
                  <TextField
                    fullWidth
                    label="Your Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    size="small"
                    sx={{ mb: { xs: 1.5, sm: 2, md: 2 }, '& .MuiInputBase-input': { fontSize: { xs: '0.9rem', sm: '1rem', md: '1rem' } } }}
                  />
                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    size="small"
                    sx={{ mb: { xs: 1.5, sm: 2, md: 2 }, '& .MuiInputBase-input': { fontSize: { xs: '0.9rem', sm: '1rem', md: '1rem' } } }}
                  />
                  <TextField
                    fullWidth
                    label="Subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    size="small"
                    sx={{ mb: { xs: 1.5, sm: 2, md: 2 }, '& .MuiInputBase-input': { fontSize: { xs: '0.9rem', sm: '1rem', md: '1rem' } } }}
                  />
                  <TextField
                    fullWidth
                    label="Message"
                    multiline
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    sx={{ mb: { xs: 1.5, sm: 2, md: 2 }, '& .MuiInputBase-input': { fontSize: { xs: '0.9rem', sm: '1rem', md: '1rem' } } }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={submitting}
                    startIcon={submitting ? <CircularProgress size={18} /> : <Send size={16} />}
                    sx={{ py: { xs: 1, sm: 1, md: 1.5 }, fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' } }}
                  >
                    {submitting ? 'Submitting...' : 'Submit Ticket'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mt: { xs: 2, sm: 2.5, md: 3 } }}>
            <CardContent sx={{ p: { xs: 2, sm: 2, md: 3 } }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: { xs: '0.9rem', sm: '1rem', md: '1rem' } }} gutterBottom>
                Support Hours
              </Typography>
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <Clock size={18} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Live Chat"
                    secondary="24/7 Available"
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <Mail size={18} />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email Support"
                    secondary="Response within 24 hours"
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
}
