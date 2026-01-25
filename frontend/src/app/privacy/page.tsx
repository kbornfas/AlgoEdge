'use client';

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
} from '@mui/material';
import {
  Shield,
  Lock,
  Eye,
  Database,
  Share2,
  UserCheck,
  Mail,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

export default function PrivacyPage() {
  const lastUpdated = 'January 25, 2026';

  const sections = [
    {
      title: '1. Information We Collect',
      icon: Database,
      content: `We collect information you provide directly to us, such as when you create an account, make a purchase, subscribe to our services, or contact us for support. This includes:
      
• Personal identification information (name, email address, phone number)
• Account credentials (username, password)
• Payment information (processed securely through Stripe/Whop)
• Trading account information (MT4/MT5 account numbers for bot connection)
• Communication preferences and history
• Usage data and interaction with our platform`,
    },
    {
      title: '2. How We Use Your Information',
      icon: Eye,
      content: `We use the information we collect to:

• Provide, maintain, and improve our services
• Process transactions and send related information
• Send technical notices, updates, security alerts, and support messages
• Respond to your comments, questions, and customer service requests
• Monitor and analyze trends, usage, and activities
• Detect, investigate, and prevent fraudulent transactions and other illegal activities
• Personalize and improve your experience on our platform
• Send promotional communications (with your consent)`,
    },
    {
      title: '3. Information Sharing',
      icon: Share2,
      content: `We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:

• With service providers who assist in our operations (payment processors, hosting providers)
• To comply with legal obligations or respond to lawful requests
• To protect our rights, privacy, safety, or property
• In connection with a merger, acquisition, or sale of assets
• With your consent or at your direction

All third-party service providers are contractually obligated to protect your information.`,
    },
    {
      title: '4. Data Security',
      icon: Lock,
      content: `We implement industry-standard security measures to protect your personal information:

• SSL/TLS encryption for all data transmission
• Encrypted storage for sensitive data
• Regular security audits and penetration testing
• Access controls and authentication mechanisms
• Secure payment processing through PCI-compliant providers
• Regular backups and disaster recovery procedures

While we strive to protect your information, no method of transmission over the Internet is 100% secure.`,
    },
    {
      title: '5. Your Rights and Choices',
      icon: UserCheck,
      content: `You have the following rights regarding your personal information:

• Access: Request a copy of the personal information we hold about you
• Correction: Request correction of inaccurate or incomplete information
• Deletion: Request deletion of your personal information (subject to legal requirements)
• Portability: Request a copy of your data in a structured, machine-readable format
• Opt-out: Unsubscribe from marketing communications at any time
• Restriction: Request restriction of processing in certain circumstances

To exercise these rights, please contact us at privacy@algoedge.io`,
    },
    {
      title: '6. Cookies and Tracking',
      icon: Eye,
      content: `We use cookies and similar tracking technologies to:

• Remember your preferences and settings
• Authenticate users and prevent fraud
• Analyze site traffic and usage patterns
• Personalize content and advertisements

You can control cookies through your browser settings. Note that disabling cookies may affect the functionality of our services.`,
    },
    {
      title: '7. Data Retention',
      icon: Database,
      content: `We retain your personal information for as long as necessary to:

• Provide our services to you
• Comply with legal obligations
• Resolve disputes and enforce agreements
• Maintain business records

When your account is deleted, we will remove or anonymize your personal information within 30 days, except where retention is required by law.`,
    },
    {
      title: '8. International Data Transfers',
      icon: Share2,
      content: `Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place, including:

• Standard contractual clauses approved by relevant authorities
• Data processing agreements with all service providers
• Compliance with applicable data protection regulations`,
    },
    {
      title: '9. Children\'s Privacy',
      icon: Shield,
      content: `Our services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected information from a child, we will take steps to delete it promptly.`,
    },
    {
      title: '10. Contact Us',
      icon: Mail,
      content: `If you have questions or concerns about this Privacy Policy or our data practices, please contact us:

Email: privacy@algoedge.io
Support: support@algoedge.io

We will respond to your inquiry within 30 days.`,
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', py: 8 }}>
      <Container maxWidth="md">
        {/* Back Button */}
        <Button
          component={Link}
          href="/"
          startIcon={<ArrowLeft size={18} />}
          sx={{
            mb: 4,
            color: 'rgba(255,255,255,0.7)',
            '&:hover': { color: '#22C55E' },
          }}
        >
          Back to Home
        </Button>

        {/* Header */}
        <Paper
          sx={{
            p: 4,
            mb: 4,
            bgcolor: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.1)',
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
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                Privacy Policy
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                Last updated: {lastUpdated}
              </Typography>
            </Box>
          </Box>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}>
            At AlgoEdge, we are committed to protecting your privacy and ensuring the security 
            of your personal information. This Privacy Policy explains how we collect, use, 
            disclose, and safeguard your information when you use our platform and services.
          </Typography>
        </Paper>

        {/* Sections */}
        {sections.map((section, index) => (
          <Paper
            key={index}
            sx={{
              p: 3,
              mb: 3,
              bgcolor: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 2,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <section.icon size={24} color="#22C55E" />
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 600 }}>
                {section.title}
              </Typography>
            </Box>
            <Typography
              sx={{
                color: 'rgba(255,255,255,0.7)',
                lineHeight: 1.8,
                whiteSpace: 'pre-line',
              }}
            >
              {section.content}
            </Typography>
          </Paper>
        ))}

        {/* Footer */}
        <Paper
          sx={{
            p: 3,
            bgcolor: 'rgba(34, 197, 94, 0.1)',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
            By using AlgoEdge, you agree to this Privacy Policy.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              component={Link}
              href="/terms"
              variant="outlined"
              sx={{
                borderColor: 'rgba(255,255,255,0.3)',
                color: 'white',
                '&:hover': { borderColor: '#22C55E', bgcolor: 'rgba(34,197,94,0.1)' },
              }}
            >
              Terms of Service
            </Button>
            <Button
              component={Link}
              href="/support"
              variant="contained"
              sx={{
                bgcolor: '#22C55E',
                '&:hover': { bgcolor: '#16A34A' },
              }}
            >
              Contact Support
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
