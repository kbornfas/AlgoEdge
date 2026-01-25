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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 6 }}>
        <Typography variant="h3" fontWeight={800} gutterBottom>
          Help & Support
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto' }}>
          We're here to help. Find answers to common questions or contact our support team.
        </Typography>
      </Box>

      {/* Support Channels */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        {supportChannels.map((channel, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card sx={{ height: '100%', textAlign: 'center', py: 3 }}>
              <CardContent>
                <Box
                  sx={{
                    width: 60,
                    height: 60,
                    borderRadius: 2,
                    bgcolor: `${channel.color}20`,
                    color: channel.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mx: 'auto',
                    mb: 2,
                  }}
                >
                  {channel.icon}
                </Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {channel.title}
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  {channel.description}
                </Typography>
                <Button
                  variant="outlined"
                  href={channel.link}
                  target={channel.link.startsWith('http') ? '_blank' : undefined}
                >
                  {channel.action}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={4}>
        {/* FAQs */}
        <Grid item xs={12} md={7}>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Frequently Asked Questions
          </Typography>
          {faqs.map((category, categoryIndex) => (
            <Box key={categoryIndex} sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight={600} color="primary" gutterBottom>
                {category.category}
              </Typography>
              {category.questions.map((faq, index) => (
                <Accordion key={index}>
                  <AccordionSummary expandIcon={<ChevronDown />}>
                    <Typography fontWeight={500}>{faq.question}</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography color="text.secondary">{faq.answer}</Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          ))}
        </Grid>

        {/* Contact Form */}
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Submit a Support Ticket
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
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
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Email Address"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Message"
                    multiline
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    sx={{ mb: 2 }}
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    disabled={submitting}
                    startIcon={submitting ? <CircularProgress size={20} /> : <Send size={18} />}
                  >
                    {submitting ? 'Submitting...' : 'Submit Ticket'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
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
