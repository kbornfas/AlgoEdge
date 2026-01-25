'use client';

import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  IconButton,
} from '@mui/material';
import {
  Shield,
  Lock,
  Eye,
  Database,
  Mail,
  Globe,
  Clock,
  Users,
  FileText,
  ChevronRight,
  ArrowLeft,
  MessageCircle,
  Phone,
  X,
  Copy,
  Check,
} from 'lucide-react';
import Link from 'next/link';

const sections = [
  {
    id: 'introduction',
    title: '1. Introduction',
    icon: <FileText size={24} />,
    content: `Welcome to AlgoEdge ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our automated forex trading platform, marketplace, and related services.

By accessing or using AlgoEdge, you agree to this Privacy Policy. If you do not agree with the terms of this policy, please do not access the platform.`,
  },
  {
    id: 'information-collected',
    title: '2. Information We Collect',
    icon: <Database size={24} />,
    content: `We collect information that you provide directly to us, including:`,
    list: [
      'Account Information: Name, email address, username, password, and country of residence',
      'Trading Account Information: MT5 account credentials (account ID, password, server) for trade execution',
      'Payment Information: Transaction records processed through Whop payment gateway and M-Pesa',
      'Marketplace Data: Products you purchase, sell, or list on our marketplace',
      'Affiliate Information: Referral links, commission earnings, and payout details',
      'Communication Data: Support tickets, messages, and feedback you send us via WhatsApp, Telegram, or email',
      'Notification Preferences: Email, Telegram, and push notification settings',
    ],
    additionalContent: `We also automatically collect certain information when you use our platform:`,
    additionalList: [
      'Device Information: IP address, browser type, operating system, and device identifiers',
      'Usage Data: Pages visited, features used, trading activities, robot performance, and session duration',
      'Trading Metrics: Win rates, profit/loss data, trade history, and portfolio analytics',
      'Log Data: Server logs, error reports, and API call records',
    ],
  },
  {
    id: 'how-we-use',
    title: '3. How We Use Your Information',
    icon: <Eye size={24} />,
    content: `We use the information we collect for the following purposes:`,
    list: [
      'Trading Services: Execute automated trades via MT5, manage trading robots, and provide signal copying',
      'Account Management: Create and manage your account, process subscriptions, and send notifications',
      'Marketplace Operations: Facilitate buying/selling of trading bots, signals, and digital products',
      'Affiliate Program: Track referrals, calculate commissions, and process affiliate payouts',
      'Performance Analytics: Generate trade reports, portfolio analysis, and performance metrics',
      'Communication: Send trade alerts, daily/weekly reports via email and Telegram',
      'Customer Support: Respond to inquiries via WhatsApp, Telegram, and email',
      'Security: Detect fraud, prevent unauthorized access, and enforce IP whitelisting',
      'Platform Improvement: Analyze usage patterns to enhance features and user experience',
    ],
  },
  {
    id: 'information-sharing',
    title: '4. Information Sharing and Disclosure',
    icon: <Users size={24} />,
    content: `We may share your information in the following circumstances:`,
    list: [
      'Trading Execution: MT5 brokers and MetaApi to execute your trades on connected accounts',
      'Payment Processing: Whop and M-Pesa for subscription and marketplace payments',
      'Notification Services: Telegram Bot API for trade alerts and daily reports',
      'Marketplace Sellers: Limited order information shared with sellers for digital product delivery',
      'Affiliate Tracking: Referral data with affiliate partners for commission calculation',
      'Legal Requirements: When required by law, court order, or government request',
      'Business Transfers: In connection with a merger, acquisition, or sale of assets',
    ],
    additionalContent: `We do NOT sell your personal information to third parties for marketing purposes. Your MT5 credentials are encrypted and only used for trade execution.`,
  },
  {
    id: 'data-security',
    title: '5. Data Security',
    icon: <Lock size={24} />,
    content: `We implement robust security measures to protect your information:`,
    list: [
      '256-bit SSL/TLS encryption for all data transmission',
      'Encrypted storage for MT5 credentials and sensitive API keys',
      'Two-factor authentication (2FA) via authenticator apps',
      'IP whitelisting for API access and admin functions',
      'Rate limiting to prevent brute force attacks',
      'Regular security audits and vulnerability assessments',
      'Secure cloud infrastructure on Railway and Vercel',
    ],
    additionalContent: `While we strive to protect your information, no method of transmission over the Internet is 100% secure. We will notify you of any breach that may affect your personal data within 72 hours.`,
  },
  {
    id: 'data-retention',
    title: '6. Data Retention',
    icon: <Clock size={24} />,
    content: `We retain your personal information for as long as necessary to:`,
    list: [
      'Maintain your active account and provide trading services',
      'Comply with financial record-keeping requirements (typically 5-7 years)',
      'Process affiliate commissions and payout history',
      'Resolve disputes and enforce our agreements',
      'Provide historical trade analytics and performance reports',
    ],
    additionalContent: `You may request deletion of your account and personal data at any time. Trade history may be retained in anonymized form for platform analytics. MT5 credentials are deleted immediately upon account disconnection.`,
  },
  {
    id: 'your-rights',
    title: '7. Your Rights',
    icon: <Shield size={24} />,
    content: `Depending on your location, you may have the following rights:`,
    list: [
      'Access: Request a copy of all personal data we hold about you',
      'Rectification: Request correction of inaccurate or incomplete data',
      'Erasure: Request deletion of your personal data ("right to be forgotten")',
      'Restriction: Request limitation of processing your data',
      'Portability: Export your trade history and account data',
      'Disconnect MT5: Remove connected trading accounts at any time',
      'Withdraw Consent: Opt-out of marketing communications and notifications',
      'Complaint: Lodge a complaint with a data protection authority',
    ],
    additionalContent: `To exercise these rights, please contact us through our support channels. We will respond to your request within 30 days.`,
  },
  {
    id: 'cookies',
    title: '8. Cookies and Tracking',
    icon: <Globe size={24} />,
    content: `We use cookies and similar technologies to:`,
    list: [
      'Essential Cookies: Maintain login sessions and security tokens',
      'Preference Cookies: Remember your theme, timezone, and notification settings',
      'Analytics Cookies: Understand platform usage through anonymized metrics',
      'Affiliate Cookies: Track referral links (90-day cookie duration)',
    ],
    additionalContent: `You can control cookies through your browser settings. Disabling essential cookies will prevent you from logging in and using the platform.`,
  },
  {
    id: 'third-party',
    title: '9. Third-Party Services',
    icon: <Globe size={24} />,
    content: `We integrate with the following third-party services:`,
    list: [
      'MetaApi: For MT5 account connection and trade execution',
      'Whop: For subscription payments and license management',
      'Telegram: For trade alerts, daily reports, and notifications',
      'M-Pesa: For mobile money payments in supported regions',
      'Railway/Vercel: For secure cloud hosting infrastructure',
    ],
    additionalContent: `Each third-party service has its own privacy policy. We recommend reviewing their policies for details on how they handle your data.`,
  },
  {
    id: 'international',
    title: '10. International Data Transfers',
    icon: <Globe size={24} />,
    content: `Your information may be transferred to and processed in countries other than your country of residence. We ensure appropriate safeguards are in place, including:`,
    list: [
      'Data processing agreements with all service providers',
      'Encryption of all data in transit and at rest',
      'Compliance with GDPR for EU/EEA residents',
      'Compliance with Kenya Data Protection Act for Kenyan residents',
    ],
  },
  {
    id: 'children',
    title: '11. Children\'s Privacy',
    icon: <Users size={24} />,
    content: `AlgoEdge is not intended for users under 18 years of age. Trading financial instruments requires adult supervision and legal capacity. We do not knowingly collect personal information from minors. If we learn we have collected information from a child under 18, we will delete it immediately and terminate the associated account.`,
  },
  {
    id: 'changes',
    title: '12. Changes to This Policy',
    icon: <FileText size={24} />,
    content: `We may update this Privacy Policy from time to time. We will notify you of any material changes by:`,
    list: [
      'Posting the updated policy on this page with a new "Last Updated" date',
      'Sending an email notification for significant changes',
      'Displaying a banner notification in your dashboard',
    ],
    additionalContent: `Your continued use of AlgoEdge after changes constitutes acceptance of the updated policy.`,
  },
  {
    id: 'contact',
    title: '13. Contact Us',
    icon: <Mail size={24} />,
    content: `If you have questions about this Privacy Policy or our data practices, please contact us through our support channels. Click "Contact Support" below to reach us via WhatsApp, Telegram, or Email.`,
  },
];

export default function PrivacyPolicyPage() {
  const [contactOpen, setContactOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: '#0a0f1a',
        py: { xs: 4, md: 8 },
      }}
    >
      <Container maxWidth="md">
        {/* Back Button */}
        <Button
          component={Link}
          href="/"
          startIcon={<ArrowLeft size={18} />}
          sx={{
            mb: 4,
            color: 'rgba(255, 255, 255, 0.7)',
            '&:hover': { color: '#22C55E' },
          }}
        >
          Back to Home
        </Button>

        {/* Header */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, md: 4 },
            mb: 4,
            background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(34, 197, 94, 0.05) 100%)',
            border: '1px solid rgba(34, 197, 94, 0.2)',
            borderRadius: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'rgba(34, 197, 94, 0.2)',
              }}
            >
              <Shield size={32} color="#22C55E" />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'white' }}>
                Privacy Policy
              </Typography>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Last Updated: January 25, 2026
              </Typography>
            </Box>
          </Box>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.8 }}>
            This Privacy Policy describes how AlgoEdge collects, uses, and protects your personal information when you use our automated forex trading platform, marketplace, and affiliate services.
          </Typography>
        </Paper>

        {/* Table of Contents */}
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 4,
            bgcolor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>
            Table of Contents
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {sections.map((section) => (
              <Button
                key={section.id}
                href={`#${section.id}`}
                size="small"
                sx={{
                  color: 'rgba(255, 255, 255, 0.6)',
                  fontSize: '0.8rem',
                  '&:hover': { color: '#22C55E', bgcolor: 'rgba(34, 197, 94, 0.1)' },
                }}
              >
                {section.title}
              </Button>
            ))}
          </Box>
        </Paper>

        {/* Sections */}
        {sections.map((section, index) => (
          <Paper
            key={section.id}
            id={section.id}
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              mb: 3,
              bgcolor: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: 2,
              scrollMarginTop: '20px',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{ color: '#22C55E' }}>{section.icon}</Box>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                {section.title}
              </Typography>
            </Box>

            <Typography
              sx={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.8, mb: section.list ? 2 : 0, whiteSpace: 'pre-line' }}
            >
              {section.content}
            </Typography>

            {section.list && (
              <List dense sx={{ mb: section.additionalContent ? 2 : 0 }}>
                {section.list.map((item, i) => (
                  <ListItem key={i} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <ChevronRight size={16} color="#22C55E" />
                    </ListItemIcon>
                    <ListItemText
                      primary={item}
                      primaryTypographyProps={{
                        sx: { color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem' },
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            )}

            {section.additionalContent && (
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.8, mb: section.additionalList ? 2 : 0 }}>
                {section.additionalContent}
              </Typography>
            )}

            {section.additionalList && (
              <List dense>
                {section.additionalList.map((item, i) => (
                  <ListItem key={i} sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <ChevronRight size={16} color="#22C55E" />
                    </ListItemIcon>
                    <ListItemText
                      primary={item}
                      primaryTypographyProps={{
                        sx: { color: 'rgba(255, 255, 255, 0.6)', fontSize: '0.9rem' },
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            )}

            {section.id === 'contact' && (
              <Button
                variant="contained"
                onClick={() => setContactOpen(true)}
                startIcon={<MessageCircle size={18} />}
                sx={{
                  mt: 2,
                  bgcolor: '#22C55E',
                  '&:hover': { bgcolor: '#16A34A' },
                }}
              >
                Contact Support
              </Button>
            )}
          </Paper>
        ))}

        {/* Footer Links */}
        <Box sx={{ textAlign: 'center', mt: 6 }}>
          <Stack direction="row" spacing={2} justifyContent="center" flexWrap="wrap">
            <Button
              component={Link}
              href="/terms-and-conditions"
              sx={{ color: 'rgba(255, 255, 255, 0.6)', '&:hover': { color: '#22C55E' } }}
            >
              Terms & Conditions
            </Button>
            <Button
              component={Link}
              href="/support"
              sx={{ color: 'rgba(255, 255, 255, 0.6)', '&:hover': { color: '#22C55E' } }}
            >
              Support Center
            </Button>
            <Button
              component={Link}
              href="/faq"
              sx={{ color: 'rgba(255, 255, 255, 0.6)', '&:hover': { color: '#22C55E' } }}
            >
              FAQ
            </Button>
          </Stack>
        </Box>
      </Container>

      {/* Contact Dialog */}
      <Dialog
        open={contactOpen}
        onClose={() => setContactOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#0a0f1a',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle sx={{ color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>Contact Support</span>
          <IconButton onClick={() => setContactOpen(false)} sx={{ color: 'rgba(255,255,255,0.5)' }}>
            <X size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            {/* WhatsApp */}
            <Button
              fullWidth
              variant="outlined"
              href="https://wa.me/254704618663"
              target="_blank"
              startIcon={<Phone size={20} />}
              sx={{
                py: 1.5,
                borderColor: '#25D366',
                color: '#25D366',
                justifyContent: 'flex-start',
                '&:hover': { bgcolor: 'rgba(37, 211, 102, 0.1)', borderColor: '#25D366' },
              }}
            >
              WhatsApp Support
            </Button>

            {/* Telegram */}
            <Button
              fullWidth
              variant="outlined"
              href="https://t.me/market_masterrer"
              target="_blank"
              startIcon={<MessageCircle size={20} />}
              sx={{
                py: 1.5,
                borderColor: '#0088cc',
                color: '#0088cc',
                justifyContent: 'flex-start',
                '&:hover': { bgcolor: 'rgba(0, 136, 204, 0.1)', borderColor: '#0088cc' },
              }}
            >
              Telegram: @market_masterrer
            </Button>

            {/* Email */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                p: 1.5,
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: 1,
              }}
            >
              <Mail size={20} color="#22C55E" />
              <Typography sx={{ color: 'rgba(255,255,255,0.8)', flex: 1, fontSize: '0.9rem' }}>
                kbonface03@gmail.com
              </Typography>
              <IconButton
                size="small"
                onClick={() => handleCopy('kbonface03@gmail.com', 'email')}
                sx={{ color: copied === 'email' ? '#22C55E' : 'rgba(255,255,255,0.5)' }}
              >
                {copied === 'email' ? <Check size={18} /> : <Copy size={18} />}
              </IconButton>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setContactOpen(false)} sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
