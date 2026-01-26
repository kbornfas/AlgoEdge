'use client';

import { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Chip,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Stack,
} from '@mui/material';
import {
  User,
  MapPin,
  Globe,
  MessageCircle,
  Twitter,
  Instagram,
  Youtube,
  ArrowLeft,
  CheckCircle,
  Share2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const promotionMethods = [
  'Social Media',
  'YouTube',
  'Blog/Website',
  'Trading Community',
  'Telegram Channel',
  'Discord Server',
  'Email Marketing',
  'Podcasts',
  'Word of Mouth',
  'Paid Advertising',
];

const audienceSize = [
  '0 - 100',
  '100 - 500',
  '500 - 1,000',
  '1,000 - 5,000',
  '5,000 - 10,000',
  '10,000+',
];

export default function BecomeAffiliatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    country: '',
    website: '',
    telegram: '',
    twitter: '',
    instagram: '',
    youtube: '',
    audience_size: '',
    promotion_methods: [] as string[],
    why_join: '',
    experience: '',
    terms_accepted: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleMethodToggle = (method: string) => {
    setFormData(prev => ({
      ...prev,
      promotion_methods: prev.promotion_methods.includes(method)
        ? prev.promotion_methods.filter(m => m !== method)
        : [...prev.promotion_methods, method],
    }));
  };

  const handleAudienceSelect = (size: string) => {
    setFormData(prev => ({
      ...prev,
      audience_size: size,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to apply');
        setLoading(false);
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/become-affiliate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
      } else {
        setError(data.error || 'Failed to submit application');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', py: 4 }}>
        <Container maxWidth="md">
          <Card sx={{ 
            bgcolor: 'rgba(34, 197, 94, 0.1)', 
            border: '1px solid rgba(34, 197, 94, 0.3)',
            borderRadius: 4,
            textAlign: 'center',
            py: 8,
            px: 4
          }}>
            <CardContent>
              <CheckCircle size={80} color="#22C55E" style={{ marginBottom: 24 }} />
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, mb: 2 }}>
                Application Submitted!
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 4 }}>
                Thank you for applying to become an affiliate. Our team will review your application
                and notify you via email once it&apos;s approved.
              </Typography>
              <Button
                variant="contained"
                component={Link}
                href="/dashboard"
                sx={{
                  background: 'linear-gradient(135deg, #22C55E 0%, #16A34A 100%)',
                  color: 'white',
                  fontWeight: 700,
                  px: 4,
                }}
              >
                Return to Dashboard
              </Button>
            </CardContent>
          </Card>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', py: 4 }}>
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Button
            startIcon={<ArrowLeft size={18} />}
            component={Link}
            href="/dashboard/affiliate"
            sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}
          >
            Back to Affiliate Dashboard
          </Button>
          
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
            <Share2 size={32} color="#22C55E" />
            <Typography variant="h4" sx={{ color: 'white', fontWeight: 800 }}>
              Become an Affiliate
            </Typography>
          </Stack>
          <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Join our affiliate program and start earning commissions
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {/* Personal Information */}
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', mb: 3 }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <User size={24} color="#22C55E" />
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                  Personal Information
                </Typography>
              </Stack>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                    InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                        '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.3)' },
                        '&.Mui-focused fieldset': { borderColor: '#22C55E' },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', mb: 3 }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <Globe size={24} color="#22C55E" />
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                  Online Presence
                </Typography>
              </Stack>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Website/Blog"
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://yourwebsite.com"
                    InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Telegram Username/Channel"
                    name="telegram"
                    value={formData.telegram}
                    onChange={handleChange}
                    placeholder="@username"
                    InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Twitter/X Handle"
                    name="twitter"
                    value={formData.twitter}
                    onChange={handleChange}
                    placeholder="@username"
                    InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Instagram Handle"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleChange}
                    placeholder="@username"
                    InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="YouTube Channel"
                    name="youtube"
                    value={formData.youtube}
                    onChange={handleChange}
                    placeholder="https://youtube.com/@channel"
                    InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Promotion Strategy */}
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 3 }}>
                Promotion Strategy
              </Typography>

              <Box sx={{ mb: 4 }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
                  How will you promote AlgoEdge? (Select all that apply)
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {promotionMethods.map(method => (
                    <Chip
                      key={method}
                      label={method}
                      onClick={() => handleMethodToggle(method)}
                      sx={{
                        bgcolor: formData.promotion_methods.includes(method) 
                          ? 'rgba(34, 197, 94, 0.3)' 
                          : 'rgba(255,255,255,0.05)',
                        color: formData.promotion_methods.includes(method) ? '#22C55E' : 'rgba(255,255,255,0.7)',
                        border: formData.promotion_methods.includes(method) 
                          ? '1px solid #22C55E' 
                          : '1px solid rgba(255,255,255,0.2)',
                        '&:hover': {
                          bgcolor: 'rgba(34, 197, 94, 0.2)',
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
                  What&apos;s your estimated audience size?
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {audienceSize.map(size => (
                    <Chip
                      key={size}
                      label={size}
                      onClick={() => handleAudienceSelect(size)}
                      sx={{
                        bgcolor: formData.audience_size === size 
                          ? 'rgba(34, 197, 94, 0.3)' 
                          : 'rgba(255,255,255,0.05)',
                        color: formData.audience_size === size ? '#22C55E' : 'rgba(255,255,255,0.7)',
                        border: formData.audience_size === size 
                          ? '1px solid #22C55E' 
                          : '1px solid rgba(255,255,255,0.2)',
                        '&:hover': {
                          bgcolor: 'rgba(34, 197, 94, 0.2)',
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>

              <TextField
                fullWidth
                label="Tell us about your experience with affiliate marketing"
                name="experience"
                value={formData.experience}
                onChange={handleChange}
                multiline
                rows={3}
                placeholder="Have you promoted trading products before? What results have you achieved?"
                InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  },
                }}
              />

              <TextField
                fullWidth
                label="Why do you want to join AlgoEdge affiliate program?"
                name="why_join"
                value={formData.why_join}
                onChange={handleChange}
                multiline
                rows={3}
                placeholder="What interests you about promoting AlgoEdge products?"
                InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  },
                }}
              />
            </CardContent>
          </Card>

          {/* Terms */}
          <Card sx={{ bgcolor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)', mb: 3 }}>
            <CardContent>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.terms_accepted}
                    onChange={handleChange}
                    name="terms_accepted"
                    sx={{ color: '#22C55E', '&.Mui-checked': { color: '#22C55E' } }}
                  />
                }
                label={
                  <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    I agree to the <Link href="/terms" style={{ color: '#22C55E' }}>Affiliate Terms & Conditions</Link> and 
                    understand the commission structure. I will promote AlgoEdge ethically and follow all applicable laws.
                  </Typography>
                }
              />
            </CardContent>
          </Card>

          {/* Submit */}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={loading || !formData.terms_accepted || !formData.full_name}
              sx={{
                background: 'linear-gradient(135deg, #22C55E 0%, #0066FF 100%)',
                color: 'white',
                fontWeight: 700,
                px: 6,
                py: 1.5,
                '&:disabled': {
                  background: 'rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.3)',
                },
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 'Submit Application'}
            </Button>
          </Box>
        </form>
      </Container>
    </Box>
  );
}
