'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  TextField,
  Alert,
  Card,
  CardContent,
  Chip,
  Stack,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  MessageCircle,
  ArrowLeft,
} from 'lucide-react';
import Link from 'next/link';

export default function PaymentProofPage() {
  const router = useRouter();
  const [proofUrl, setProofUrl] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<any>(null);

  const whatsappNumber = process.env.NEXT_PUBLIC_PAYMENT_WHATSAPP_NUMBER || '';
  const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_URL || 'https://wa.me/';

  useEffect(() => {
    fetchPaymentStatus();
  }, []);

  const fetchPaymentStatus = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    try {
      const response = await fetch('/api/payment-proof/status', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch payment status:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    try {
      const response = await fetch('/api/payment-proof/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          proofUrl,
          amount: amount ? parseFloat(amount) : undefined,
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit payment proof');
      }

      setSuccess('Payment proof submitted successfully! Awaiting admin approval.');
      setProofUrl('');
      setAmount('');
      setNotes('');
      fetchPaymentStatus();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle size={20} color="green" />;
      case 'rejected':
        return <XCircle size={20} color="red" />;
      case 'pending':
      case 'submitted':
        return <Clock size={20} color="orange" />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', py: 4 }}>
      <Container maxWidth="md">
        <Button
          component={Link}
          href="/dashboard"
          startIcon={<ArrowLeft size={20} />}
          sx={{ mb: 3 }}
        >
          Back to Dashboard
        </Button>

        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" gutterBottom fontWeight={600}>
            Payment Proof Submission
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Submit your payment proof to activate your account and access trading features.
          </Typography>

          {paymentStatus?.isActivated && (
            <Alert severity="success" sx={{ mb: 3 }}>
              Your account is activated! You have full access to AlgoEdge.
            </Alert>
          )}

          {!paymentStatus?.isActivated && (
            <Card sx={{ mb: 4, bgcolor: 'info.main', color: 'white' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Payment Instructions
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  1. Make payment via WhatsApp to our official number
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  2. Take a screenshot of the payment confirmation
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                  3. Upload the screenshot URL below
                </Typography>
                <Typography variant="body2" sx={{ mb: 3 }}>
                  4. Wait for admin approval (usually within 24 hours)
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<MessageCircle size={20} />}
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    bgcolor: '#25D366',
                    '&:hover': { bgcolor: '#1da851' },
                  }}
                >
                  Contact on WhatsApp
                </Button>
              </CardContent>
            </Card>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
              {success}
            </Alert>
          )}

          {!paymentStatus?.isActivated && (
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Payment Proof URL"
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                required
                margin="normal"
                placeholder="https://example.com/screenshot.png"
                helperText="Upload your screenshot to a service like Imgur or Postimg and paste the URL"
              />

              <TextField
                fullWidth
                label="Amount Paid (Optional)"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                margin="normal"
                placeholder="50"
              />

              <TextField
                fullWidth
                label="Notes (Optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={3}
                margin="normal"
                placeholder="Add any additional information..."
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                startIcon={<Upload size={20} />}
                sx={{ mt: 3 }}
              >
                {loading ? 'Submitting...' : 'Submit Payment Proof'}
              </Button>
            </form>
          )}

          {paymentStatus?.paymentProofs && paymentStatus.paymentProofs.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" gutterBottom>
                Your Submissions
              </Typography>
              <List>
                {paymentStatus.paymentProofs.map((proof: any, index: number) => (
                  <Box key={proof.id}>
                    <ListItem>
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={2} alignItems="center">
                            {getStatusIcon(proof.status)}
                            <Chip
                              label={proof.status}
                              color={
                                proof.status === 'approved'
                                  ? 'success'
                                  : proof.status === 'rejected'
                                  ? 'error'
                                  : 'warning'
                              }
                              size="small"
                            />
                            <Typography variant="body2">
                              {proof.amount ? `$${proof.amount}` : 'Amount not specified'}
                            </Typography>
                          </Stack>
                        }
                        secondary={`Submitted on ${new Date(
                          proof.submittedAt
                        ).toLocaleDateString()}`}
                      />
                    </ListItem>
                    {index < paymentStatus.paymentProofs.length - 1 && <Divider />}
                  </Box>
                ))}
              </List>
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
