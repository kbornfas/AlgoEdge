'use client';

import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  IconButton,
} from '@mui/material';
import {
  FileText,
  Scale,
  Shield,
  AlertTriangle,
  CreditCard,
  Ban,
  RefreshCw,
  Mail,
  ChevronRight,
  ArrowLeft,
  CheckCircle,
  XCircle,
  MessageCircle,
  Phone,
  X,
  Copy,
  Check,
  Store,
  Users,
  Bot,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';

const sections = [
  {
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    icon: <CheckCircle size={24} />,
    content: `By accessing or using the AlgoEdge platform ("Service"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, you may not access or use the Service.

These Terms constitute a legally binding agreement between you and AlgoEdge. We reserve the right to modify these Terms at any time, and such modifications will be effective immediately upon posting. Your continued use of the Service constitutes acceptance of any modified Terms.`,
  },
  {
    id: 'eligibility',
    title: '2. Eligibility',
    icon: <Shield size={24} />,
    content: `To use AlgoEdge, you must:`,
    list: [
      'Be at least 18 years of age or the age of majority in your jurisdiction',
      'Have the legal capacity to enter into binding contracts',
      'Not be prohibited from using the Service under applicable laws',
      'Provide accurate and complete registration information',
      'Have a valid trading account with a supported MT5 broker (for trading features)',
      'Understand and accept the risks associated with forex and financial trading',
    ],
    additionalContent: `By using the Service, you represent and warrant that you meet all eligibility requirements.`,
  },
  {
    id: 'service-description',
    title: '3. Service Description',
    icon: <FileText size={24} />,
    content: `AlgoEdge provides the following services:`,
    list: [
      'Automated Trading: AI-powered trading robots that execute trades on your connected MT5 account',
      'Signal Copying: Copy trades from professional signal providers to your account',
      'Marketplace: Buy and sell trading bots, signal services, and digital trading products',
      'Portfolio Analytics: Track your trading performance, win rates, and profit/loss metrics',
      'Risk Management: Configurable stop-loss, take-profit, and position sizing settings',
      'Notifications: Trade alerts and daily reports via email and Telegram',
      'Affiliate Program: Earn commissions by referring new users (10-20% recurring)',
    ],
    additionalContent: `The Service is provided "as is" and we make no guarantees regarding trading performance or profitability. Past performance does not guarantee future results.`,
  },
  {
    id: 'risk-disclosure',
    title: '4. Risk Disclosure',
    icon: <AlertTriangle size={24} />,
    important: true,
    content: `IMPORTANT: Trading foreign exchange (Forex), cryptocurrencies, and other financial instruments carries a HIGH LEVEL OF RISK and may not be suitable for all investors.`,
    list: [
      'You may lose some or ALL of your invested capital',
      'Leverage can magnify both profits AND losses',
      'Past performance of trading robots or signals is NOT indicative of future results',
      'Automated trading systems have inherent risks including technical failures and connectivity issues',
      'Market conditions can change rapidly; strategies that worked before may fail',
      'Broker execution, slippage, and spread widening can affect results',
      'You should ONLY trade with money you can afford to lose completely',
      'We are NOT responsible for any trading losses you incur',
    ],
    additionalContent: `By using AlgoEdge, you acknowledge that you fully understand these risks and accept complete responsibility for your trading decisions and outcomes. AlgoEdge does NOT provide personalized financial advice. Consult a licensed financial advisor before trading.`,
  },
  {
    id: 'account',
    title: '5. Account Registration and Security',
    icon: <Shield size={24} />,
    content: `When creating an account, you agree to:`,
    list: [
      'Provide accurate, current, and complete information',
      'Maintain and promptly update your information as needed',
      'Keep your password confidential and secure (minimum 8 characters recommended)',
      'Enable two-factor authentication (2FA) for enhanced security',
      'Notify us immediately of any unauthorized access to your account',
      'Not share your account credentials or MT5 connection details with others',
      'Not create multiple accounts for fraudulent purposes or to abuse promotions',
    ],
    additionalContent: `You are responsible for all activities that occur under your account. We reserve the right to suspend or terminate accounts that violate these Terms or engage in suspicious activity.`,
  },
  {
    id: 'mt5-connection',
    title: '6. MT5 Account Connection',
    icon: <Bot size={24} />,
    content: `When connecting your MT5 trading account:`,
    list: [
      'You authorize AlgoEdge to execute trades on your behalf based on your selected robots/signals',
      'You must provide valid MT5 credentials (account ID, password, broker server)',
      'Your credentials are encrypted and stored securely; we cannot access your broker funds directly',
      'You can disconnect your MT5 account at any time from your dashboard',
      'Trade execution depends on your broker\'s availability and market conditions',
      'We are not responsible for broker-related issues, delays, or execution failures',
      'You must ensure your MT5 account has sufficient margin for trades',
    ],
    additionalContent: `AlgoEdge uses MetaApi for secure MT5 connectivity. We do not have withdrawal access to your brokerage account.`,
  },
  {
    id: 'subscription',
    title: '7. Subscription and Payments',
    icon: <CreditCard size={24} />,
    content: `AlgoEdge offers subscription-based access with the following terms:`,
    list: [
      'All prices are in USD unless otherwise specified',
      'Subscriptions automatically renew unless cancelled before the renewal date',
      'Payments are processed through Whop or M-Pesa (for supported regions)',
      'You authorize recurring charges for your selected subscription plan',
      'Applicable taxes may be added based on your location',
      'Failed payments may result in service suspension until resolved',
      'Price changes will be communicated at least 7 days in advance',
    ],
    additionalContent: `Current subscription plans:
• Weekly: $19/week - Full access to all features
• Monthly: $49/month - Most Popular plan
• Quarterly: $149/quarter - Best Value (save 24%)

Marketplace purchases are separate from subscriptions and are one-time or as priced by sellers.`,
  },
  {
    id: 'marketplace',
    title: '8. Marketplace Terms',
    icon: <Store size={24} />,
    content: `The AlgoEdge Marketplace allows users to buy and sell trading products:`,
    list: [
      'Sellers must provide accurate descriptions of their products (bots, signals, courses)',
      'Sellers set their own prices and are responsible for product quality and support',
      'AlgoEdge charges a platform fee of 25% on marketplace sales (sellers receive 75%)',
      'Buyers receive access to purchased products according to seller terms',
      'Refunds for marketplace products are handled according to seller policies',
      'AlgoEdge is not responsible for third-party product performance or accuracy',
      'Reviews and ratings must be honest and based on actual experience',
      'Sellers must not make unrealistic profit guarantees or misleading claims',
    ],
    additionalContent: `We reserve the right to remove products or suspend sellers who violate marketplace guidelines or receive consistent negative feedback.`,
  },
  {
    id: 'affiliate',
    title: '9. Affiliate Program',
    icon: <Users size={24} />,
    content: `The AlgoEdge Affiliate Program allows you to earn commissions:`,
    list: [
      'Earn 10% commission on referred users\' subscriptions (up to 20% for top affiliates)',
      'Commissions are recurring for the lifetime of the referred customer',
      '90-day cookie duration for tracking referrals',
      'Minimum payout threshold: $50 (reduced for higher tiers)',
      'Payouts via M-Pesa, PayPal, or cryptocurrency',
      'Self-referrals and fraudulent referrals are prohibited',
      'You may not use misleading advertising or spam to promote',
      'Commission rates and terms may change with 14 days notice',
    ],
    additionalContent: `Affiliate accounts found engaging in fraud, fake signups, or policy violations will be terminated and forfeit pending commissions.`,
  },
  {
    id: 'refunds',
    title: '10. Refund Policy',
    icon: <RefreshCw size={24} />,
    content: `Our refund policy for subscriptions:`,
    list: [
      'Full refunds available within 7 days of initial subscription purchase',
      'Refund requests must be submitted via our support channels',
      'Partial refunds are not available for unused subscription time',
      'Marketplace product refunds are subject to individual seller policies',
      'Refunds are processed within 5-10 business days',
      'Abuse of the refund policy may result in account termination',
    ],
    additionalContent: `To request a refund, contact us via WhatsApp, Telegram, or email with your account details and reason for the request.`,
  },
  {
    id: 'prohibited',
    title: '11. Prohibited Activities',
    icon: <Ban size={24} />,
    content: `You agree NOT to:`,
    list: [
      'Use the Service for any illegal purpose or in violation of any laws',
      'Attempt to reverse engineer, decompile, or hack the platform',
      'Share, resell, or redistribute your account access or subscription',
      'Use automated tools to scrape data or overload our servers',
      'Manipulate or attempt to manipulate platform features or metrics',
      'Harass, threaten, or abuse other users, sellers, or staff',
      'Impersonate any person, entity, or AlgoEdge representative',
      'Introduce viruses, malware, or malicious code',
      'Circumvent security measures, rate limits, or access restrictions',
      'Make false claims about trading results or platform endorsements',
      'Use the Service if prohibited by your jurisdiction',
    ],
  },
  {
    id: 'intellectual-property',
    title: '12. Intellectual Property',
    icon: <FileText size={24} />,
    content: `All content, features, and functionality of AlgoEdge are owned by us and protected by intellectual property laws:`,
    list: [
      'Trading algorithms, robots, and proprietary strategies',
      'Software, code, APIs, and user interface designs',
      'Logos, branding, and visual elements',
      'Documentation, tutorials, and educational content',
      'Data compilations, analytics, and performance metrics',
    ],
    additionalContent: `You are granted a limited, non-exclusive, non-transferable license to use the Service for personal trading purposes only. You may not copy, modify, distribute, sell, or create derivative works without our written consent. Marketplace sellers retain ownership of their original products.`,
  },
  {
    id: 'limitation-liability',
    title: '13. Limitation of Liability',
    icon: <Scale size={24} />,
    important: true,
    content: `TO THE MAXIMUM EXTENT PERMITTED BY LAW:`,
    list: [
      'AlgoEdge is NOT liable for any trading losses you incur using our platform',
      'We are not responsible for broker actions, failures, slippage, or execution delays',
      'We are not liable for technical issues, server downtime, or connectivity problems',
      'Our total liability shall not exceed fees paid by you in the last 12 months',
      'We are not liable for indirect, incidental, consequential, or punitive damages',
      'We are not responsible for unauthorized access due to your negligence',
      'We are not liable for third-party marketplace product performance',
    ],
    additionalContent: `You agree to indemnify and hold AlgoEdge, its officers, employees, and affiliates harmless from any claims, losses, damages, or expenses arising from your use of the Service, violation of these Terms, or infringement of any rights.`,
  },
  {
    id: 'disclaimers',
    title: '14. Disclaimers',
    icon: <AlertTriangle size={24} />,
    content: `THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO:`,
    list: [
      'Merchantability or fitness for a particular purpose',
      'Accuracy, reliability, or completeness of trading signals or robot performance',
      'Uninterrupted, timely, secure, or error-free operation',
      'Specific results, profits, or outcomes from using the Service',
      'Security or freedom from viruses, bugs, or harmful components',
      'Compatibility with your broker, MT5 setup, or trading conditions',
    ],
  },
  {
    id: 'termination',
    title: '15. Termination',
    icon: <XCircle size={24} />,
    content: `We may suspend or terminate your access to the Service:`,
    list: [
      'Immediately if you violate these Terms or engage in prohibited activities',
      'If your payment fails and is not resolved within 7 days',
      'If we suspect fraudulent activity or abuse of the platform',
      'At our discretion with 30 days notice for any reason',
      'If required by law or regulatory authorities',
    ],
    additionalContent: `Upon termination:
• Your access to the platform and connected MT5 accounts will be revoked
• Pending affiliate commissions may be forfeited if terminated for cause
• You may request export of your trade history data
• Subscription fees are non-refundable after the 7-day refund window`,
  },
  {
    id: 'governing-law',
    title: '16. Governing Law',
    icon: <Scale size={24} />,
    content: `These Terms shall be governed by and construed in accordance with applicable laws. Any disputes arising from these Terms or your use of the Service shall be resolved through:`,
    list: [
      'Good faith negotiation between the parties',
      'Mediation by a mutually agreed neutral third party',
      'Binding arbitration if mediation fails',
      'Courts of competent jurisdiction as a last resort',
    ],
    additionalContent: `You agree to waive any right to participate in class action lawsuits against AlgoEdge.`,
  },
  {
    id: 'changes',
    title: '17. Changes to Terms',
    icon: <FileText size={24} />,
    content: `We may update these Terms from time to time. We will notify you of material changes by:`,
    list: [
      'Posting the updated Terms on this page with a new "Last Updated" date',
      'Sending an email notification for significant changes',
      'Displaying a notification banner in your dashboard',
    ],
    additionalContent: `Your continued use of AlgoEdge after changes constitutes acceptance of the updated Terms. If you disagree with changes, you must stop using the Service and cancel your subscription.`,
  },
  {
    id: 'contact',
    title: '18. Contact Us',
    icon: <Mail size={24} />,
    content: `If you have questions about these Terms and Conditions, please contact us through our support channels. Click "Contact Support" below to reach us via WhatsApp, Telegram, or Email.`,
  },
];

export default function TermsAndConditionsPage() {
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
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 2,
                bgcolor: 'rgba(59, 130, 246, 0.2)',
              }}
            >
              <Scale size={32} color="#3B82F6" />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: 'white' }}>
                Terms & Conditions
              </Typography>
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Last Updated: January 25, 2026
              </Typography>
            </Box>
          </Box>
          <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.8 }}>
            Please read these Terms and Conditions carefully before using AlgoEdge. By accessing or using our automated trading platform, marketplace, and related services, you agree to be bound by these Terms.
          </Typography>
        </Paper>

        {/* Risk Warning */}
        <Alert
          severity="warning"
          icon={<AlertTriangle size={24} />}
          sx={{
            mb: 4,
            bgcolor: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            '& .MuiAlert-icon': { color: '#F59E0B' },
            '& .MuiAlert-message': { color: 'rgba(255, 255, 255, 0.9)' },
          }}
        >
          <Typography sx={{ fontWeight: 700, mb: 1 }}>Risk Warning</Typography>
          <Typography sx={{ fontSize: '0.9rem' }}>
            Trading forex and financial instruments involves substantial risk of loss. Past performance is not indicative of future results. Only trade with money you can afford to lose.
          </Typography>
        </Alert>

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
                  fontSize: '0.75rem',
                  '&:hover': { color: '#3B82F6', bgcolor: 'rgba(59, 130, 246, 0.1)' },
                }}
              >
                {section.title}
              </Button>
            ))}
          </Box>
        </Paper>

        {/* Sections */}
        {sections.map((section) => (
          <Paper
            key={section.id}
            id={section.id}
            elevation={0}
            sx={{
              p: { xs: 3, md: 4 },
              mb: 3,
              bgcolor: section.important ? 'rgba(245, 158, 11, 0.05)' : 'rgba(255, 255, 255, 0.02)',
              border: section.important ? '1px solid rgba(245, 158, 11, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: 2,
              scrollMarginTop: '20px',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{ color: section.important ? '#F59E0B' : '#3B82F6' }}>{section.icon}</Box>
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
                      <ChevronRight size={16} color={section.important ? '#F59E0B' : '#3B82F6'} />
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
              <Typography sx={{ color: 'rgba(255, 255, 255, 0.7)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                {section.additionalContent}
              </Typography>
            )}

            {section.id === 'contact' && (
              <Button
                variant="contained"
                onClick={() => setContactOpen(true)}
                startIcon={<MessageCircle size={18} />}
                sx={{
                  mt: 2,
                  bgcolor: '#3B82F6',
                  '&:hover': { bgcolor: '#2563EB' },
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
              href="/privacy-policy"
              sx={{ color: 'rgba(255, 255, 255, 0.6)', '&:hover': { color: '#3B82F6' } }}
            >
              Privacy Policy
            </Button>
            <Button
              component={Link}
              href="/support"
              sx={{ color: 'rgba(255, 255, 255, 0.6)', '&:hover': { color: '#3B82F6' } }}
            >
              Support Center
            </Button>
            <Button
              component={Link}
              href="/faq"
              sx={{ color: 'rgba(255, 255, 255, 0.6)', '&:hover': { color: '#3B82F6' } }}
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
              <Mail size={20} color="#3B82F6" />
              <Typography sx={{ color: 'rgba(255,255,255,0.8)', flex: 1, fontSize: '0.9rem' }}>
                kbonface03@gmail.com
              </Typography>
              <IconButton
                size="small"
                onClick={() => handleCopy('kbonface03@gmail.com', 'email')}
                sx={{ color: copied === 'email' ? '#3B82F6' : 'rgba(255,255,255,0.5)' }}
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
