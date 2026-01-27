'use client';

import { useState } from 'react';
import {
  Box,
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
  Chip,
  Avatar,
  Paper,
  InputAdornment,
  Stack,
  alpha,
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
  Search,
  BookOpen,
  Headphones,
  MessageCircle,
  ExternalLink,
  Zap,
  Shield,
  CreditCard,
  TrendingUp,
} from 'lucide-react';

// Glass Card Component
const GlassCard = ({ children, gradient, sx = {}, ...props }: any) => (
  <Box
    sx={{
      background: gradient || 'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 3,
      transition: 'all 0.3s ease',
      '&:hover': {
        border: '1px solid rgba(16, 185, 129, 0.3)',
        transform: 'translateY(-2px)',
      },
      ...sx,
    }}
    {...props}
  >
    {children}
  </Box>
);

const faqs = [
  {
    category: 'Getting Started',
    icon: <Zap size={20} />,
    color: '#10B981',
    questions: [
      {
        question: 'How do I connect my MT5 account?',
        answer: 'Go to Dashboard > MT5 Connection and click "Add Account". Enter your broker name, MT5 login ID, password, and server. We support all major brokers.',
      },
      {
        question: 'What is the minimum deposit to start?',
        answer: 'The minimum deposit is $19. You can deposit via M-Pesa, Airtel Money, USDT (TRC20), or Bitcoin.',
      },
      {
        question: 'How do trading signals work?',
        answer: 'Our AI analyzes market data and generates signals with entry price, stop loss, and take profit levels. You can follow them manually or enable auto-trading.',
      },
    ],
  },
  {
    category: 'Trading & Signals',
    icon: <TrendingUp size={20} />,
    color: '#3B82F6',
    questions: [
      {
        question: 'Are signals guaranteed to be profitable?',
        answer: 'No trading signals are guaranteed. Our signals have a historical win rate of 68-75%, but trading always involves risk. Always use proper risk management.',
      },
      {
        question: 'What currency pairs do you cover?',
        answer: 'We provide signals for XAUUSD (Gold), major forex pairs (EURUSD, GBPUSD, USDJPY), and indices. Premium plans get access to all instruments.',
      },
      {
        question: 'Can I use signals on a demo account?',
        answer: 'Yes! We recommend testing signals on a demo account first to understand how they work before trading with real money.',
      },
    ],
  },
  {
    category: 'Billing & Payments',
    icon: <CreditCard size={20} />,
    color: '#F59E0B',
    questions: [
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept M-Pesa, Airtel Money, USDT (TRC20), and Bitcoin. More payment methods coming soon.',
      },
      {
        question: 'How do withdrawals work?',
        answer: 'Request a withdrawal from your wallet. Minimum is $10 with a 3% fee. Processing takes 24-48 hours.',
      },
      {
        question: 'Can I get a refund?',
        answer: 'We offer a 7-day money-back guarantee for first-time subscribers. Contact support within 7 days of purchase.',
      },
    ],
  },
  {
    category: 'Account & Security',
    icon: <Shield size={20} />,
    color: '#EF4444',
    questions: [
      {
        question: 'How do I reset my password?',
        answer: 'Click "Forgot Password" on the login page, enter your email, and follow the reset link sent to your inbox.',
      },
      {
        question: 'Is my MT5 password secure?',
        answer: 'Yes, all credentials are encrypted with AES-256. We use read-only access where possible and never store passwords in plain text.',
      },
      {
        question: 'How do I enable 2FA?',
        answer: 'Go to Settings > Security and click "Enable 2FA". Scan the QR code with Google Authenticator or Authy.',
      },
    ],
  },
];

const supportChannels = [
  {
    icon: <MessageCircle size={28} />,
    title: 'Live Chat',
    description: 'Chat with our support team',
    availability: 'Available 24/7',
    action: 'Start Chat',
    color: '#10B981',
    primary: true,
  },
  {
    icon: <Mail size={28} />,
    title: 'Email Support',
    description: 'kbonface03@gmail.com',
    availability: 'Response within 24h',
    action: 'Send Email',
    link: 'mailto:kbonface03@gmail.com',
    color: '#3B82F6',
  },
  {
    icon: <MessageSquare size={28} />,
    title: 'Telegram',
    description: '@Algoedge_rs_bot',
    availability: 'Quick responses',
    action: 'Open Telegram',
    link: 'https://t.me/Algoedge_rs_bot',
    color: '#0088CC',
  },
  {
    icon: <Phone size={28} />,
    title: 'WhatsApp',
    description: '+254 704 618 663',
    availability: '9AM - 9PM EAT',
    action: 'Chat on WhatsApp',
    link: 'https://wa.me/254704618663',
    color: '#25D366',
  },
];

const quickLinks = [
  { icon: <BookOpen size={20} />, title: 'User Guide', description: 'Step-by-step tutorials', href: '/dashboard/learning-hub' },
  { icon: <Video size={20} />, title: 'Video Tutorials', description: 'Watch how-to videos', href: '/dashboard/learning-hub' },
  { icon: <FileText size={20} />, title: 'Documentation', description: 'API & technical docs', href: '/docs' },
  { icon: <Users size={20} />, title: 'Community', description: 'Join our Discord', href: '/dashboard/community' },
];

export default function SupportPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | false>('Getting Started');
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setSubmitted(true);
    setSubmitting(false);
    setContactForm({ name: '', email: '', subject: '', message: '' });
  };

  const filteredFaqs = faqs.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
           q.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <Box sx={{ minHeight: '100vh', px: { xs: 1, sm: 2, md: 0 } }}>
      {/* Header */}
      <Box sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: '#FFFFFF', fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' } }}>
          Help & Support
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' } }}>
          Find answers to common questions or get in touch with our support team
        </Typography>
      </Box>

      {/* Search Bar */}
      <GlassCard sx={{ p: { xs: 2, sm: 2.5, md: 3 }, mb: { xs: 2, sm: 3, md: 4 } }}>
        <TextField
          fullWidth
          placeholder="Search for help articles, FAQs, or topics..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search size={18} color="#6B7280" />
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: 'rgba(0,0,0,0.3)',
              fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
              '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
              '&:hover fieldset': { borderColor: 'rgba(16, 185, 129, 0.5)' },
              '&.Mui-focused fieldset': { borderColor: '#10B981' },
            },
            '& input::placeholder': { fontSize: { xs: '0.8rem', sm: '0.9rem', md: '1rem' } },
          }}
        />
      </GlassCard>

      {/* Support Channels */}
      <Typography variant="h6" sx={{ fontWeight: 600, mb: { xs: 2, sm: 2.5, md: 3 }, color: '#FFFFFF', fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' } }}>
        Contact Support
      </Typography>
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 3 }} sx={{ mb: { xs: 3, sm: 4, md: 5 } }}>
        {supportChannels.map((channel, index) => (
          <Grid item xs={6} sm={6} md={3} key={index}>
            <GlassCard
              sx={{
                p: { xs: 2, sm: 2.5, md: 3 },
                height: '100%',
                cursor: 'pointer',
                border: channel.primary ? `2px solid ${channel.color}` : undefined,
                background: channel.primary 
                  ? `linear-gradient(135deg, ${alpha(channel.color, 0.2)} 0%, ${alpha(channel.color, 0.05)} 100%)`
                  : undefined,
              }}
              component={channel.link ? 'a' : 'div'}
              href={channel.link}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Box
                sx={{
                  width: { xs: 40, sm: 48, md: 56 },
                  height: { xs: 40, sm: 48, md: 56 },
                  borderRadius: 2,
                  bgcolor: alpha(channel.color, 0.2),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: { xs: 1, sm: 1.5, md: 2 },
                  color: channel.color,
                  '& svg': { width: { xs: 20, sm: 24, md: 28 }, height: { xs: 20, sm: 24, md: 28 } },
                }}
              >
                {channel.icon}
              </Box>
              <Typography variant="h6" sx={{ fontWeight: 600, color: '#FFFFFF', mb: 0.5, fontSize: { xs: '0.85rem', sm: '0.95rem', md: '1.25rem' } }}>
                {channel.title}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: { xs: '0.7rem', sm: '0.8rem', md: '0.9rem' }, mb: 1, display: { xs: 'none', sm: 'block' } }}>
                {channel.description}
              </Typography>
              <Chip
                icon={<Clock size={10} />}
                label={channel.availability}
                size="small"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: { xs: '0.6rem', sm: '0.65rem', md: '0.75rem' },
                  mb: { xs: 1.5, sm: 2, md: 2 },
                  height: { xs: 20, sm: 24, md: 24 },
                  display: { xs: 'none', sm: 'flex' },
                  '& .MuiChip-icon': { fontSize: { xs: 10, sm: 12, md: 12 } },
                }}
              />
              <Button
                fullWidth
                variant={channel.primary ? 'contained' : 'outlined'}
                size="small"
                sx={{
                  bgcolor: channel.primary ? channel.color : 'transparent',
                  borderColor: channel.color,
                  color: channel.primary ? '#fff' : channel.color,
                  fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.875rem' },
                  py: { xs: 0.5, sm: 0.75, md: 1 },
                  '&:hover': {
                    bgcolor: channel.primary ? alpha(channel.color, 0.8) : alpha(channel.color, 0.1),
                  },
                  '& .MuiButton-endIcon': { display: { xs: 'none', sm: 'inherit' } },
                }}
                endIcon={<ExternalLink size={14} />}
              >
                {channel.action}
              </Button>
            </GlassCard>
          </Grid>
        ))}
      </Grid>

      {/* Quick Links */}
      <Typography variant="h6" sx={{ fontWeight: 600, mb: { xs: 2, sm: 2.5, md: 3 }, color: '#FFFFFF', fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' } }}>
        Quick Links
      </Typography>
      <Grid container spacing={{ xs: 1.5, sm: 2, md: 2 }} sx={{ mb: { xs: 3, sm: 4, md: 5 } }}>
        {quickLinks.map((link, index) => (
          <Grid item xs={6} sm={3} key={index}>
            <GlassCard
              component="a"
              href={link.href}
              sx={{
                p: { xs: 1.5, sm: 2, md: 2.5 },
                display: 'flex',
                alignItems: { xs: 'flex-start', sm: 'center' },
                flexDirection: { xs: 'column', sm: 'row' },
                gap: { xs: 1, sm: 2, md: 2 },
                textDecoration: 'none',
              }}
            >
              <Box sx={{ color: '#10B981', '& svg': { width: { xs: 18, sm: 20, md: 20 }, height: { xs: 18, sm: 20, md: 20 } } }}>{link.icon}</Box>
              <Box>
                <Typography sx={{ color: '#FFFFFF', fontWeight: 600, fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.9rem' } }}>
                  {link.title}
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: { xs: '0.65rem', sm: '0.75rem', md: '0.8rem' }, display: { xs: 'none', sm: 'block' } }}>
                  {link.description}
                </Typography>
              </Box>
            </GlassCard>
          </Grid>
        ))}
      </Grid>

      {/* FAQs */}
      <Typography variant="h6" sx={{ fontWeight: 600, mb: { xs: 2, sm: 2.5, md: 3 }, color: '#FFFFFF', fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' } }}>
        Frequently Asked Questions
      </Typography>
      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }} sx={{ mb: { xs: 3, sm: 4, md: 5 } }}>
        {(searchQuery ? filteredFaqs : faqs).map((category) => (
          <Grid item xs={12} md={6} key={category.category}>
            <GlassCard sx={{ overflow: 'hidden' }}>
              <Box
                sx={{
                  p: { xs: 1.5, sm: 2, md: 2 },
                  bgcolor: alpha(category.color, 0.1),
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: { xs: 1.5, sm: 2, md: 2 },
                }}
              >
                <Box sx={{ color: category.color, '& svg': { width: { xs: 16, sm: 18, md: 20 }, height: { xs: 16, sm: 18, md: 20 } } }}>{category.icon}</Box>
                <Typography sx={{ fontWeight: 600, color: '#FFFFFF', fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' } }}>
                  {category.category}
                </Typography>
              </Box>
              {category.questions.map((faq, index) => (
                <Accordion
                  key={index}
                  sx={{
                    bgcolor: 'transparent',
                    '&:before': { display: 'none' },
                    boxShadow: 'none',
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ChevronDown size={16} color="#6B7280" />}
                    sx={{
                      minHeight: { xs: 40, sm: 48, md: 48 },
                      px: { xs: 1.5, sm: 2, md: 2 },
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
                    }}
                  >
                    <Typography sx={{ color: '#FFFFFF', fontSize: { xs: '0.8rem', sm: '0.875rem', md: '0.95rem' } }}>
                      {faq.question}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ pt: 0, px: { xs: 1.5, sm: 2, md: 2 }, pb: { xs: 1.5, sm: 2, md: 2 } }}>
                    <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: { xs: '0.75rem', sm: '0.85rem', md: '0.9rem' }, lineHeight: 1.7 }}>
                      {faq.answer}
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </GlassCard>
          </Grid>
        ))}
      </Grid>

      {/* Contact Form */}
      <Typography variant="h6" sx={{ fontWeight: 600, mb: { xs: 2, sm: 2.5, md: 3 }, color: '#FFFFFF', fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' } }}>
        Submit a Support Ticket
      </Typography>
      <GlassCard sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        {submitted ? (
          <Box sx={{ textAlign: 'center', py: { xs: 2, sm: 3, md: 4 } }}>
            <Box
              sx={{
                width: { xs: 60, sm: 70, md: 80 },
                height: { xs: 60, sm: 70, md: 80 },
                borderRadius: '50%',
                bgcolor: alpha('#10B981', 0.2),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                mb: { xs: 2, sm: 2.5, md: 3 },
              }}
            >
              <Check size={32} color="#10B981" />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 600, color: '#FFFFFF', mb: 1, fontSize: { xs: '1.1rem', sm: '1.25rem', md: '1.5rem' } }}>
              Ticket Submitted!
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: { xs: 2, sm: 2.5, md: 3 }, fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' } }}>
              We've received your message and will respond within 24 hours.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setSubmitted(false)}
              size="small"
              sx={{ borderColor: '#10B981', color: '#10B981', fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' } }}
            >
              Submit Another Ticket
            </Button>
          </Box>
        ) : (
          <form onSubmit={handleSubmitTicket}>
            <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Your Name"
                  value={contactForm.name}
                  onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                  required
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' },
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                      '&:hover fieldset': { borderColor: 'rgba(16, 185, 129, 0.5)' },
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)', fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' } },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={contactForm.email}
                  onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                  required
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' },
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                      '&:hover fieldset': { borderColor: 'rgba(16, 185, 129, 0.5)' },
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)', fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' } },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Subject"
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                  required
                  size="small"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' },
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                      '&:hover fieldset': { borderColor: 'rgba(16, 185, 129, 0.5)' },
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)', fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' } },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Message"
                  multiline
                  rows={4}
                  value={contactForm.message}
                  onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' },
                      '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                      '&:hover fieldset': { borderColor: 'rgba(16, 185, 129, 0.5)' },
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.7)', fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' } },
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={submitting}
                  startIcon={submitting ? <CircularProgress size={18} /> : <Send size={18} />}
                  sx={{
                    bgcolor: '#10B981',
                    px: { xs: 3, sm: 3.5, md: 4 },
                    py: { xs: 1, sm: 1.25, md: 1.5 },
                    fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' },
                    width: { xs: '100%', sm: 'auto' },
                    '&:hover': { bgcolor: '#059669' },
                  }}
                >
                  {submitting ? 'Submitting...' : 'Submit Ticket'}
                </Button>
              </Grid>
            </Grid>
          </form>
        )}
      </GlassCard>

      {/* Business Hours */}
      <Box sx={{ mt: { xs: 3, sm: 3.5, md: 4 }, textAlign: 'center' }}>
        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: { xs: '0.8rem', sm: '0.85rem', md: '0.9rem' } }}>
          <Clock size={12} style={{ verticalAlign: 'middle', marginRight: 6 }} />
          Support available 24/7 via Live Chat and Telegram. Email responses within 24 hours.
        </Typography>
      </Box>
    </Box>
  );
}
