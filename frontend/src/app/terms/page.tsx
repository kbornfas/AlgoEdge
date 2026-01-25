'use client';

import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  FileText,
  ChevronDown,
  Shield,
  CreditCard,
  AlertTriangle,
  Users,
  Scale,
  Ban,
  RefreshCw,
  Mail,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function TermsPage() {
  const [expanded, setExpanded] = useState<string | false>('panel1');
  const lastUpdated = 'January 25, 2026';

  const handleChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  const sections = [
    {
      id: 'panel1',
      title: '1. Acceptance of Terms',
      icon: FileText,
      content: `By accessing or using AlgoEdge ("the Platform"), you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.

These terms apply to all users of the Platform, including without limitation users who are browsers, vendors, customers, merchants, and/or contributors of content.

We reserve the right to update or modify these Terms at any time without prior notice. Your continued use of the Platform following any changes constitutes acceptance of those changes.`,
    },
    {
      id: 'panel2',
      title: '2. Account Registration',
      icon: Users,
      content: `To access certain features of the Platform, you must register for an account. When registering, you agree to:

• Provide accurate, current, and complete information
• Maintain and promptly update your account information
• Keep your password secure and confidential
• Accept responsibility for all activities under your account
• Notify us immediately of any unauthorized access

You must be at least 18 years old to create an account. We reserve the right to refuse service, terminate accounts, or remove content at our sole discretion.

Account sharing is strictly prohibited. Each account is for individual use only.`,
    },
    {
      id: 'panel3',
      title: '3. Subscription Services',
      icon: CreditCard,
      content: `AlgoEdge offers various subscription plans that provide access to our trading tools and services.

BILLING:
• Subscriptions are billed in advance on a monthly or annual basis
• All fees are non-refundable except as required by law
• We may change subscription fees upon 30 days notice
• Failed payments may result in service suspension

CANCELLATION:
• You may cancel your subscription at any time through your account settings
• Cancellation takes effect at the end of the current billing period
• No refunds for partial billing periods

AUTO-RENEWAL:
• Subscriptions automatically renew unless cancelled
• You authorize us to charge your payment method for renewal fees`,
    },
    {
      id: 'panel4',
      title: '4. Trading Bots & Signals',
      icon: AlertTriangle,
      content: `IMPORTANT RISK DISCLAIMER:

Trading in financial markets involves substantial risk of loss and is not suitable for all investors. Past performance is not indicative of future results.

BY USING OUR TRADING BOTS OR SIGNALS, YOU ACKNOWLEDGE THAT:

• You may lose some or all of your invested capital
• AlgoEdge does not guarantee any profits or specific results
• Market conditions can change rapidly and unpredictably
• Technical failures may occur affecting trade execution
• You are solely responsible for your trading decisions

We strongly recommend:
• Only trading with funds you can afford to lose
• Starting with a demo account to understand the systems
• Implementing proper risk management strategies
• Consulting with a financial advisor before trading

AlgoEdge is not a registered investment advisor, broker-dealer, or financial planner.`,
    },
    {
      id: 'panel5',
      title: '5. Marketplace Terms',
      icon: Scale,
      content: `The AlgoEdge Marketplace allows sellers to offer trading products and services.

FOR BUYERS:
• Products are sold "as is" unless otherwise stated
• Review product descriptions carefully before purchase
• Refund policies are set by individual sellers
• AlgoEdge acts as a platform, not a party to transactions

FOR SELLERS:
• You must have an active AlgoEdge subscription to sell
• Products must comply with our content guidelines
• You are responsible for your product descriptions and claims
• AlgoEdge charges a commission on each sale (25%)
• You must provide accurate performance data
• Misleading claims may result in account termination

PROHIBITED PRODUCTS:
• Products promoting guaranteed returns
• Pyramid or multi-level marketing schemes
• Products infringing intellectual property
• Malicious software or harmful content`,
    },
    {
      id: 'panel6',
      title: '6. Intellectual Property',
      icon: Shield,
      content: `All content on the Platform, including but not limited to text, graphics, logos, images, software, and trading algorithms, is the property of AlgoEdge or its content suppliers and is protected by intellectual property laws.

YOU MAY NOT:
• Copy, modify, or distribute our content without permission
• Reverse engineer or decompile our software
• Remove any copyright or proprietary notices
• Use our trademarks without written consent
• Scrape or harvest data from our Platform

PURCHASED PRODUCTS:
• You receive a license to use, not ownership of, digital products
• Licenses are personal and non-transferable
• Sharing or reselling licensed products is prohibited`,
    },
    {
      id: 'panel7',
      title: '7. Prohibited Activities',
      icon: Ban,
      content: `You agree not to engage in any of the following prohibited activities:

• Using the Platform for any illegal purpose
• Attempting to gain unauthorized access to our systems
• Interfering with or disrupting the Platform's operation
• Transmitting viruses, malware, or malicious code
• Impersonating another person or entity
• Engaging in market manipulation or fraudulent trading
• Using automated systems to access the Platform without permission
• Harvesting user data without consent
• Posting false, misleading, or defamatory content
• Violating any applicable laws or regulations

Violation of these terms may result in immediate account termination and legal action.`,
    },
    {
      id: 'panel8',
      title: '8. Limitation of Liability',
      icon: AlertTriangle,
      content: `TO THE MAXIMUM EXTENT PERMITTED BY LAW:

AlgoEdge shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:

• Loss of profits, data, or business opportunities
• Trading losses incurred using our tools or signals
• Service interruptions or system failures
• Errors or inaccuracies in content or data
• Unauthorized access to your account
• Third-party actions or content

Our total liability for any claim shall not exceed the amount you paid to AlgoEdge in the 12 months preceding the claim.

Some jurisdictions do not allow limitation of liability, so some of these limitations may not apply to you.`,
    },
    {
      id: 'panel9',
      title: '9. Dispute Resolution',
      icon: Scale,
      content: `Any disputes arising from these Terms or your use of the Platform shall be resolved as follows:

INFORMAL RESOLUTION:
Before filing any formal claim, you agree to attempt to resolve the dispute informally by contacting us at legal@algoedge.io. We will attempt to resolve the dispute within 30 days.

ARBITRATION:
If informal resolution fails, disputes shall be resolved through binding arbitration, except where prohibited by law. Arbitration shall be conducted in accordance with established arbitration rules.

CLASS ACTION WAIVER:
You agree to resolve disputes individually and waive any right to participate in class action lawsuits or class-wide arbitration.

GOVERNING LAW:
These Terms are governed by the laws of the jurisdiction in which AlgoEdge operates, without regard to conflict of law principles.`,
    },
    {
      id: 'panel10',
      title: '10. Changes and Termination',
      icon: RefreshCw,
      content: `MODIFICATIONS:
We reserve the right to modify these Terms at any time. Material changes will be communicated via email or Platform notification at least 30 days before taking effect.

TERMINATION BY YOU:
You may terminate your account at any time by contacting support or through account settings.

TERMINATION BY US:
We may suspend or terminate your account at any time for:
• Violation of these Terms
• Fraudulent or illegal activity
• Non-payment of fees
• Extended periods of inactivity
• At our sole discretion with reasonable cause

EFFECT OF TERMINATION:
Upon termination:
• Your access to the Platform will be revoked
• Your account data may be deleted after 30 days
• Accrued obligations remain in effect
• Sections intended to survive termination will survive`,
    },
    {
      id: 'panel11',
      title: '11. Contact Information',
      icon: Mail,
      content: `If you have any questions about these Terms of Service, please contact us:

General Inquiries: support@algoedge.io
Legal Department: legal@algoedge.io
Privacy Concerns: privacy@algoedge.io

Response Time: We aim to respond to all inquiries within 2 business days.

Mailing Address:
AlgoEdge Technologies
[Business Address]

For urgent matters regarding account security or fraud, please contact us immediately.`,
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
                bgcolor: 'rgba(59, 130, 246, 0.2)',
              }}
            >
              <FileText size={32} color="#3B82F6" />
            </Box>
            <Box>
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                Terms of Service
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                Last updated: {lastUpdated}
              </Typography>
            </Box>
          </Box>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}>
            Please read these Terms of Service carefully before using the AlgoEdge platform. 
            These terms govern your access to and use of our services, including our website, 
            trading tools, marketplace, and any related services.
          </Typography>
        </Paper>

        {/* Sections */}
        {sections.map((section) => (
          <Accordion
            key={section.id}
            expanded={expanded === section.id}
            onChange={handleChange(section.id)}
            sx={{
              mb: 2,
              bgcolor: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px !important',
              '&:before': { display: 'none' },
              '&.Mui-expanded': {
                borderColor: 'rgba(59, 130, 246, 0.3)',
                bgcolor: 'rgba(59, 130, 246, 0.05)',
              },
            }}
          >
            <AccordionSummary
              expandIcon={<ChevronDown color="rgba(255,255,255,0.5)" />}
              sx={{
                '& .MuiAccordionSummary-content': {
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                },
              }}
            >
              <section.icon size={24} color="#3B82F6" />
              <Typography sx={{ color: 'white', fontWeight: 600 }}>
                {section.title}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography
                sx={{
                  color: 'rgba(255,255,255,0.7)',
                  lineHeight: 1.8,
                  whiteSpace: 'pre-line',
                  pl: 5,
                }}
              >
                {section.content}
              </Typography>
            </AccordionDetails>
          </Accordion>
        ))}

        {/* Footer */}
        <Paper
          sx={{
            p: 3,
            mt: 4,
            bgcolor: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            borderRadius: 2,
            textAlign: 'center',
          }}
        >
          <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
            By using AlgoEdge, you agree to these Terms of Service.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
            <Button
              component={Link}
              href="/privacy"
              variant="outlined"
              sx={{
                borderColor: 'rgba(255,255,255,0.3)',
                color: 'white',
                '&:hover': { borderColor: '#3B82F6', bgcolor: 'rgba(59,130,246,0.1)' },
              }}
            >
              Privacy Policy
            </Button>
            <Button
              component={Link}
              href="/support"
              variant="contained"
              sx={{
                bgcolor: '#3B82F6',
                '&:hover': { bgcolor: '#2563EB' },
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
