'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  Button,
  Typography,
  Alert,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Divider,
} from '@mui/material';
import { CheckCircle, MessageSquare, Clock, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';

const steps = [
  'Email Verified',
  'Payment Required',
  'Admin Approval',
  'Account Active',
];

export default function PaymentInstructionsPage() {
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('');

  useEffect(() => {
    // Check if user is verified
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      router.push('/auth/register');
      return;
    }

    const user = JSON.parse(userStr);
    if (!user.isVerified) {
      router.push('/auth/verify-otp');
      return;
    }

    // Get WhatsApp URL from environment
    const url = process.env.NEXT_PUBLIC_WHATSAPP_URL;
    if (!url || url === 'https://wa.me/your_number') {
      console.error('NEXT_PUBLIC_WHATSAPP_URL not configured properly');
      // Still set it but show a warning
      setWhatsappUrl(url || 'https://wa.me/');
    } else {
      setWhatsappUrl(url);
    }
  }, [router]);

  const handleWhatsAppRedirect = () => {
    setRedirecting(true);
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');
    
    // After a delay, redirect to login
    setTimeout(() => {
      router.push('/auth/login');
    }, 3000);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        py: 4,
      }}
    >
      <Container maxWidth="md">
        <Card>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <CheckCircle size={56} style={{ color: '#10B981', marginBottom: 16 }} />
              <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
                Email Verified Successfully!
              </Typography>
              <Typography variant="body1" color="text.secondary">
                You&apos;re almost ready to start trading
              </Typography>
            </Box>

            <Stepper activeStep={1} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            <Alert severity="info" sx={{ mb: 3 }}>
              <Typography variant="body2" fontWeight="bold">
                Next Steps Required:
              </Typography>
              <Typography variant="body2">
                1. Complete payment via WhatsApp
                <br />
                2. Wait for admin approval
                <br />
                3. Login and start trading
              </Typography>
            </Alert>

            <Paper sx={{ p: 3, mb: 3, bgcolor: 'action.hover' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DollarSign size={24} />
                Payment Instructions
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body2" paragraph>
                To activate your AlgoEdge account and start using our automated trading platform, you need to:
              </Typography>
              <Box component="ul" sx={{ pl: 2 }}>
                <li>
                  <Typography variant="body2">
                    Contact us on WhatsApp for payment details and subscription plans
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Complete the payment using the provided instructions
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Submit your payment proof via WhatsApp
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Our admin team will review and approve your account within 24 hours
                  </Typography>
                </li>
              </Box>
            </Paper>

            <Paper sx={{ p: 3, mb: 3, bgcolor: 'warning.light', color: 'warning.contrastText' }}>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Clock size={20} />
                <strong>Important:</strong> Your account will remain pending until payment is verified and approved by our admin team.
              </Typography>
            </Paper>

            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={redirecting ? null : <MessageSquare />}
              onClick={handleWhatsAppRedirect}
              disabled={redirecting}
              sx={{ 
                mb: 2,
                bgcolor: '#25D366',
                '&:hover': {
                  bgcolor: '#128C7E',
                },
              }}
            >
              {redirecting ? 'Opening WhatsApp...' : 'Continue to WhatsApp'}
            </Button>

            <Button
              fullWidth
              variant="outlined"
              onClick={() => router.push('/auth/login')}
            >
              Go to Login
            </Button>

            <Alert severity="warning" sx={{ mt: 3 }}>
              <Typography variant="body2">
                <strong>Note:</strong> You won&apos;t be able to login until your payment is verified and your account is approved by an administrator.
              </Typography>
            </Alert>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
