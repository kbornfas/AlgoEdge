'use client';

import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  Chip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Mail,
  MessageCircle,
  Phone,
  Clock,
  Send,
  HelpCircle,
  FileText,
  Shield,
  Bot,
  ArrowLeft,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import Link from 'next/link';

const supportChannels = [
  {
    id: 'whatsapp',
    title: 'WhatsApp',
    description: 'Chat with us on WhatsApp',
    icon: <Phone size={32} />,
    action: 'https://wa.me/254704618663',
    actionType: 'link',
    responseTime: '1-4 hours',
    availability: '24/7',
  },
  {
    id: 'telegram',
    title: 'Telegram',
    description: 'Quick responses via Telegram',
    icon: <MessageCircle size={32} />,
    action: 'https://t.me/market_masterrer',
    actionType: 'link',
    responseTime: '1-4 hours',
    availability: '24/7',
  },
  {
    id: 'email',
    title: 'Email Support',
    description: 'Get detailed help via email',
    icon: <Mail size={32} />,
    action: 'kbonface03@gmail.com',
    actionType: 'email',
    responseTime: '24-48 hours',
    availability: 'Mon-Fri',
  },
];

const quickLinks = [
  {
    title: 'FAQs',
    description: 'Find answers to common questions',
    icon: <HelpCircle size={24} />,
    href: '/faq',
  },
  {
    title: 'Terms & Conditions',
    description: 'Read our service terms',
    icon: <FileText size={24} />,
    href: '/terms-and-conditions',
  },
  {
    title: 'Privacy Policy',
    description: 'How we protect your data',
    icon: <Shield size={24} />,
    href: '/privacy-policy',
  },
  {
    title: 'Trading Robots',
    description: 'Learn about our AI robots',
    icon: <Bot size={24} />,
    href: '/faq#trading-robots',
  },
];

const supportCategories = [
  'Account & Login',
  'MT5 Connection',
  'Trading Robots',
  'Billing & Payments',
  'Technical Issue',
  'Feature Request',
  'Other',
];

export default function SupportPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: '',
    subject: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // In production, this would send to your backend
      // For now, we'll simulate a successful submission
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // Here you would typically call your API:
      // await fetch('/api/support', { method: 'POST', body: JSON.stringify(formData) });
      
      setSubmitted(true);
    } catch {
      setError('Failed to submit. Please try again or email us directly.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [field]: e.target.value }));
  };

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
          <Mail size={48} color="#10B981" style={{ marginBottom: 16 }} />
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              color: 'white',
              fontSize: { xs: '1.75rem', md: '2.5rem' },
              mb: 2,
            }}
          >
            Support Center
          </Typography>
          <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)' }}>
            We&apos;re here to help! Choose your preferred way to reach us.
          </Typography>
        </Paper>

        {/* Support Channels */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {supportChannels.map((channel) => (
            <Grid item xs={12} md={4} key={channel.id}>
              <Card
                sx={{
                  height: '100%',
                  background: 'rgba(26, 35, 50, 0.5)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 2,
                  transition: 'all 0.3s',
                  '&:hover': {
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <CardContent sx={{ p: 3, textAlign: 'center' }}>
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: '50%',
                      bgcolor: 'rgba(16, 185, 129, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                      color: '#10B981',
                    }}
                  >
                    {channel.icon}
                  </Box>
                  <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 1 }}>
                    {channel.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
                    {channel.description}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mb: 2 }}>
                    <Chip
                      icon={<Clock size={14} />}
                      label={channel.responseTime}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(16, 185, 129, 0.1)',
                        color: '#10B981',
                        '& .MuiChip-icon': { color: '#10B981' },
                      }}
                    />
                    <Chip
                      label={channel.availability}
                      size="small"
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.05)',
                        color: 'rgba(255,255,255,0.7)',
                      }}
                    />
                  </Box>
                  <Button
                    variant="contained"
                    fullWidth
                    component={channel.actionType === 'link' ? 'a' : 'a'}
                    href={
                      channel.actionType === 'email'
                        ? `mailto:${channel.action}`
                        : channel.action
                    }
                    target={channel.actionType === 'link' ? '_blank' : undefined}
                    startIcon={channel.actionType === 'link' ? <ExternalLink size={18} /> : <Send size={18} />}
                    sx={{
                      bgcolor: '#10B981',
                      '&:hover': { bgcolor: '#059669' },
                    }}
                  >
                    {channel.actionType === 'email' ? 'Send Email' : 'Open Chat'}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={4}>
          {/* Contact Form */}
          <Grid item xs={12} md={7}>
            <Paper
              sx={{
                p: { xs: 3, md: 4 },
                background: 'rgba(26, 35, 50, 0.5)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 2,
              }}
            >
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 600, mb: 3 }}>
                Send Us a Message
              </Typography>

              {submitted ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <CheckCircle size={64} color="#10B981" style={{ marginBottom: 16 }} />
                  <Typography variant="h6" sx={{ color: 'white', mb: 2 }}>
                    Message Sent Successfully!
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 3 }}>
                    We&apos;ll get back to you within 24-48 hours. Check your email for updates.
                  </Typography>
                  <Button
                    variant="outlined"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({ name: '', email: '', category: '', subject: '', message: '' });
                    }}
                    sx={{
                      borderColor: '#10B981',
                      color: '#10B981',
                      '&:hover': { borderColor: '#059669', bgcolor: 'rgba(16, 185, 129, 0.1)' },
                    }}
                  >
                    Send Another Message
                  </Button>
                </Box>
              ) : (
                <form onSubmit={handleSubmit}>
                  {error && (
                    <Alert severity="error" sx={{ mb: 3 }}>
                      {error}
                    </Alert>
                  )}

                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Your Name"
                        value={formData.name}
                        onChange={handleChange('name')}
                        required
                        fullWidth
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'rgba(255,255,255,0.03)',
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                            '&:hover fieldset': { borderColor: 'rgba(16, 185, 129, 0.5)' },
                            '&.Mui-focused fieldset': { borderColor: '#10B981' },
                          },
                          '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                          '& .MuiInputBase-input': { color: 'white' },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        label="Email Address"
                        type="email"
                        value={formData.email}
                        onChange={handleChange('email')}
                        required
                        fullWidth
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'rgba(255,255,255,0.03)',
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                            '&:hover fieldset': { borderColor: 'rgba(16, 185, 129, 0.5)' },
                            '&.Mui-focused fieldset': { borderColor: '#10B981' },
                          },
                          '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                          '& .MuiInputBase-input': { color: 'white' },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        select
                        label="Category"
                        value={formData.category}
                        onChange={handleChange('category')}
                        required
                        fullWidth
                        SelectProps={{ native: true }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'rgba(255,255,255,0.03)',
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                            '&:hover fieldset': { borderColor: 'rgba(16, 185, 129, 0.5)' },
                            '&.Mui-focused fieldset': { borderColor: '#10B981' },
                          },
                          '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                          '& .MuiInputBase-input': { color: 'white' },
                          '& .MuiNativeSelect-icon': { color: 'rgba(255,255,255,0.5)' },
                        }}
                      >
                        <option value="" style={{ background: '#1a2332' }}>Select a category</option>
                        {supportCategories.map((cat) => (
                          <option key={cat} value={cat} style={{ background: '#1a2332' }}>
                            {cat}
                          </option>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Subject"
                        value={formData.subject}
                        onChange={handleChange('subject')}
                        required
                        fullWidth
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'rgba(255,255,255,0.03)',
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                            '&:hover fieldset': { borderColor: 'rgba(16, 185, 129, 0.5)' },
                            '&.Mui-focused fieldset': { borderColor: '#10B981' },
                          },
                          '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                          '& .MuiInputBase-input': { color: 'white' },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        label="Message"
                        value={formData.message}
                        onChange={handleChange('message')}
                        required
                        fullWidth
                        multiline
                        rows={5}
                        placeholder="Describe your issue or question in detail..."
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            bgcolor: 'rgba(255,255,255,0.03)',
                            '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                            '&:hover fieldset': { borderColor: 'rgba(16, 185, 129, 0.5)' },
                            '&.Mui-focused fieldset': { borderColor: '#10B981' },
                          },
                          '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
                          '& .MuiInputBase-input': { color: 'white' },
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Send size={20} />}
                        sx={{
                          bgcolor: '#10B981',
                          '&:hover': { bgcolor: '#059669' },
                          '&.Mui-disabled': { bgcolor: 'rgba(16, 185, 129, 0.3)' },
                        }}
                      >
                        {loading ? 'Sending...' : 'Send Message'}
                      </Button>
                    </Grid>
                  </Grid>
                </form>
              )}
            </Paper>
          </Grid>

          {/* Quick Links & Info */}
          <Grid item xs={12} md={5}>
            {/* Quick Links */}
            <Paper
              sx={{
                p: 3,
                mb: 3,
                background: 'rgba(26, 35, 50, 0.5)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
                Quick Links
              </Typography>
              <Grid container spacing={2}>
                {quickLinks.map((link) => (
                  <Grid item xs={6} key={link.title}>
                    <Button
                      component={Link}
                      href={link.href}
                      fullWidth
                      sx={{
                        p: 2,
                        flexDirection: 'column',
                        alignItems: 'center',
                        bgcolor: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 2,
                        color: 'white',
                        '&:hover': {
                          bgcolor: 'rgba(16, 185, 129, 0.1)',
                          border: '1px solid rgba(16, 185, 129, 0.3)',
                        },
                      }}
                    >
                      <Box sx={{ color: '#10B981', mb: 1 }}>{link.icon}</Box>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {link.title}
                      </Typography>
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </Paper>

            {/* Office Hours */}
            <Paper
              sx={{
                p: 3,
                background: 'rgba(26, 35, 50, 0.5)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 2,
              }}
            >
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
                Support Hours
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: 'rgba(16, 185, 129, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#10B981',
                    }}
                  >
                    <MessageCircle size={20} />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                      Live Chat (Telegram/WhatsApp)
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      24/7 • Response in 1-4 hours
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      bgcolor: 'rgba(16, 185, 129, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#10B981',
                    }}
                  >
                    <Mail size={20} />
                  </Box>
                  <Box>
                    <Typography variant="body2" sx={{ color: 'white', fontWeight: 500 }}>
                      Email Support
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                      Mon-Fri • Response in 24-48 hours
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box
                sx={{
                  mt: 3,
                  p: 2,
                  bgcolor: 'rgba(245, 158, 11, 0.1)',
                  border: '1px solid rgba(245, 158, 11, 0.2)',
                  borderRadius: 2,
                }}
              >
                <Typography variant="body2" sx={{ color: '#F59E0B', fontWeight: 500, mb: 1 }}>
                  ⚡ Priority Support
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                  Monthly & Quarterly subscribers get priority support with faster response times.
                </Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
