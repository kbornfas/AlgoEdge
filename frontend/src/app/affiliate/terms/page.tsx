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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  CheckCircle,
  ChevronDown,
  ArrowLeft,
  FileText,
  Shield,
  AlertTriangle,
  DollarSign,
  Users,
  Ban,
  Scale,
} from 'lucide-react';
import Link from 'next/link';

export default function AffiliateTermsPage() {
  const effectiveDate = 'January 1, 2026';
  const version = '1.0';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', py: { xs: 4, md: 8 } }}>
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button
            component={Link}
            href="/affiliate"
            startIcon={<ArrowLeft size={18} />}
            sx={{ color: '#22C55E', mb: 2 }}
          >
            Back to Affiliate Program
          </Button>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Scale size={32} color="#22C55E" />
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #22C55E 0%, #0066FF 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Affiliate Program Terms & Conditions
            </Typography>
          </Box>
          
          <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Version {version} • Effective Date: {effectiveDate}
          </Typography>
        </Box>

        <Paper sx={{ p: { xs: 3, md: 4 }, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
          {/* Introduction */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>
              1. Introduction
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
              Welcome to the AlgoEdge Affiliate Program. By participating in our affiliate program, you agree 
              to be bound by these Terms and Conditions. Please read them carefully before joining the program.
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
              AlgoEdge reserves the right to modify these terms at any time. Continued participation in the 
              program after changes constitute acceptance of the modified terms.
            </Typography>
          </Box>

          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', my: 3 }} />

          {/* Eligibility */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Users size={20} color="#22C55E" />
              2. Eligibility
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
              To participate in the AlgoEdge Affiliate Program, you must:
            </Typography>
            <List dense>
              {[
                'Be at least 18 years of age',
                'Have a valid AlgoEdge account in good standing',
                'Agree to these Terms and Conditions',
                'Comply with all applicable laws and regulations',
                'Have a valid payment method for receiving commissions',
              ].map((item, i) => (
                <ListItem key={i} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckCircle size={16} color="#22C55E" />
                  </ListItemIcon>
                  <ListItemText primary={item} sx={{ '& .MuiTypography-root': { color: 'rgba(255,255,255,0.7)' } }} />
                </ListItem>
              ))}
            </List>
          </Box>

          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', my: 3 }} />

          {/* Commission Structure */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <DollarSign size={20} color="#22C55E" />
              3. Commission Structure
            </Typography>
            
            <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
              <strong>3.1 Base Commission Rate:</strong> Affiliates earn a base commission of 10% on all qualifying 
              subscription purchases made by referred users.
            </Typography>

            <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
              <strong>3.2 Tier System:</strong>
            </Typography>
            <List dense>
              {[
                'Bronze Tier (0-9 active referrals): 10% commission',
                'Silver Tier (10-24 active referrals): 12% commission',
                'Gold Tier (25-49 active referrals): 15% commission',
                'Diamond Tier (50-99 active referrals): 18% commission',
                'Elite Tier (100+ active referrals): 20% commission',
              ].map((item, i) => (
                <ListItem key={i} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckCircle size={16} color="#22C55E" />
                  </ListItemIcon>
                  <ListItemText primary={item} sx={{ '& .MuiTypography-root': { color: 'rgba(255,255,255,0.7)' } }} />
                </ListItem>
              ))}
            </List>

            <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2, mt: 2 }}>
              <strong>3.3 Qualifying Purchases:</strong> Commissions are only paid on first-time subscription 
              purchases. Renewals may or may not qualify based on the specific product terms.
            </Typography>

            <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
              <strong>3.4 Commission Lock Period:</strong> Commissions remain in "pending" status for 7 days 
              after the qualifying purchase to allow for the refund period. After this period, commissions 
              move to "approved" status and become available for withdrawal.
            </Typography>
          </Box>

          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', my: 3 }} />

          {/* Cookie Duration & Attribution */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>
              4. Cookie Duration & Attribution
            </Typography>
            
            <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
              <strong>4.1 Cookie Duration:</strong> Referral cookies last for 90 days from the initial click.
            </Typography>

            <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
              <strong>4.2 Attribution:</strong> The last-click attribution model is used. If a user clicks 
              multiple affiliate links, the most recent affiliate receives the commission.
            </Typography>

            <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
              <strong>4.3 Direct Links:</strong> If a user registers directly without clicking a referral 
              link but enters a referral code, the commission is attributed to the code owner.
            </Typography>
          </Box>

          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', my: 3 }} />

          {/* Payouts */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>
              5. Payouts
            </Typography>
            
            <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
              <strong>5.1 Minimum Payout:</strong> The minimum payout threshold varies by tier:
            </Typography>
            <List dense>
              {[
                'Bronze/Silver/Gold: $50 minimum',
                'Diamond: $20 minimum',
                'Elite: No minimum (VIP processing)',
              ].map((item, i) => (
                <ListItem key={i} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckCircle size={16} color="#22C55E" />
                  </ListItemIcon>
                  <ListItemText primary={item} sx={{ '& .MuiTypography-root': { color: 'rgba(255,255,255,0.7)' } }} />
                </ListItem>
              ))}
            </List>

            <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2, mt: 2 }}>
              <strong>5.2 Payment Methods:</strong> We support payouts via USDT (TRC20), BTC, ETH, M-Pesa, 
              and Airtel Money. Processing fees may apply depending on the method.
            </Typography>

            <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
              <strong>5.3 Processing Time:</strong> Payout requests are processed within 48 business hours 
              after approval. Approval typically occurs within 24-48 hours of request.
            </Typography>

            <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
              <strong>5.4 Tax Responsibility:</strong> Affiliates are solely responsible for reporting and 
              paying any taxes owed on affiliate earnings.
            </Typography>
          </Box>

          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', my: 3 }} />

          {/* Prohibited Activities */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Ban size={20} color="#ef4444" />
              6. Prohibited Activities
            </Typography>
            
            <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
              The following activities are strictly prohibited and will result in immediate termination 
              and forfeiture of commissions:
            </Typography>

            <List dense>
              {[
                'Self-referrals: Creating accounts to refer yourself',
                'Fake accounts: Creating multiple accounts to generate artificial referrals',
                'Spam: Sending unsolicited bulk messages or emails',
                'Misleading advertising: Making false claims about AlgoEdge services',
                'Trademark infringement: Bidding on AlgoEdge brand keywords in paid ads',
                'Cookie stuffing: Forcing cookies without user knowledge',
                'Incentivized clicks: Offering incentives for clicking affiliate links',
                'Bot traffic: Using automated systems to generate fake clicks or referrals',
              ].map((item, i) => (
                <ListItem key={i} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <AlertTriangle size={16} color="#ef4444" />
                  </ListItemIcon>
                  <ListItemText primary={item} sx={{ '& .MuiTypography-root': { color: 'rgba(255,255,255,0.7)' } }} />
                </ListItem>
              ))}
            </List>
          </Box>

          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', my: 3 }} />

          {/* Fraud Prevention */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Shield size={20} color="#22C55E" />
              7. Fraud Prevention & Account Review
            </Typography>
            
            <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
              <strong>7.1 Monitoring:</strong> AlgoEdge employs automated fraud detection systems that monitor 
              for suspicious activity including unusual signup patterns, duplicate IP addresses, and abnormal 
              conversion rates.
            </Typography>

            <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
              <strong>7.2 Account Review:</strong> Accounts may be placed under review at any time. During 
              review, payouts may be temporarily suspended until the investigation is complete.
            </Typography>

            <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
              <strong>7.3 Commission Reversal:</strong> Commissions may be reversed in cases of:
            </Typography>
            <List dense>
              {[
                'Refunded or charged-back purchases',
                'Fraudulent referrals',
                'Violation of these terms',
                'Duplicate accounts',
              ].map((item, i) => (
                <ListItem key={i} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <AlertTriangle size={16} color="#f59e0b" />
                  </ListItemIcon>
                  <ListItemText primary={item} sx={{ '& .MuiTypography-root': { color: 'rgba(255,255,255,0.7)' } }} />
                </ListItem>
              ))}
            </List>
          </Box>

          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', my: 3 }} />

          {/* Termination */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>
              8. Termination
            </Typography>
            
            <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
              <strong>8.1 By Affiliate:</strong> You may terminate your participation at any time by 
              contacting support. Approved commissions will be paid out, but pending commissions may be forfeited.
            </Typography>

            <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
              <strong>8.2 By AlgoEdge:</strong> We reserve the right to terminate any affiliate account 
              with or without cause. Upon termination for cause (violation of terms), all pending and 
              unpaid commissions are forfeited.
            </Typography>

            <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
              <strong>8.3 Program Changes:</strong> AlgoEdge may modify, suspend, or discontinue the 
              affiliate program at any time with 30 days notice.
            </Typography>
          </Box>

          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', my: 3 }} />

          {/* Promotional Guidelines */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>
              9. Promotional Guidelines
            </Typography>
            
            <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
              When promoting AlgoEdge, affiliates must:
            </Typography>

            <List dense>
              {[
                'Clearly disclose the affiliate relationship',
                'Only make accurate claims about our services',
                'Comply with FTC guidelines and local advertising laws',
                'Not engage in negative comparisons with competitors',
                'Respect intellectual property rights',
              ].map((item, i) => (
                <ListItem key={i} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckCircle size={16} color="#22C55E" />
                  </ListItemIcon>
                  <ListItemText primary={item} sx={{ '& .MuiTypography-root': { color: 'rgba(255,255,255,0.7)' } }} />
                </ListItem>
              ))}
            </List>
          </Box>

          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', my: 3 }} />

          {/* Limitation of Liability */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>
              10. Limitation of Liability
            </Typography>
            
            <Typography sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
              AlgoEdge shall not be liable for any indirect, incidental, special, consequential, or punitive 
              damages arising from your participation in the affiliate program. Our total liability shall not 
              exceed the total commissions paid to you in the preceding 12 months.
            </Typography>
          </Box>

          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', my: 3 }} />

          {/* Governing Law */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>
              11. Governing Law
            </Typography>
            
            <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
              These Terms shall be governed by and construed in accordance with applicable laws. Any disputes 
              arising from these terms shall be resolved through binding arbitration.
            </Typography>
          </Box>

          <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)', my: 3 }} />

          {/* Contact */}
          <Box>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 2 }}>
              12. Contact Information
            </Typography>
            
            <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
              For questions about these terms or the affiliate program, please contact us at:
            </Typography>
            <Typography sx={{ color: '#22C55E', mt: 1 }}>
              support@algoedgehub.com
            </Typography>
          </Box>

          {/* Acceptance */}
          <Box
            sx={{
              mt: 4,
              p: 3,
              bgcolor: 'rgba(34, 197, 94, 0.1)',
              border: '1px solid rgba(34, 197, 94, 0.3)',
              borderRadius: 2,
            }}
          >
            <Typography sx={{ color: 'white', fontWeight: 600, mb: 1 }}>
              By participating in the AlgoEdge Affiliate Program, you acknowledge that you have read, 
              understood, and agree to be bound by these Terms and Conditions.
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
              Last updated: {effectiveDate} • Version {version}
            </Typography>
          </Box>
        </Paper>

        {/* CTA */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Button
            component={Link}
            href="/auth/register"
            variant="contained"
            size="large"
            sx={{
              px: 4,
              py: 1.5,
              fontSize: '1rem',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #16A34A 0%, #15803D 100%)',
              },
            }}
          >
            Join Affiliate Program
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
