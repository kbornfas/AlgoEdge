'use client';

import { useState, useEffect } from 'react';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Stack,
  Divider,
} from '@mui/material';
import {
  Package,
  User,
  MapPin,
  Briefcase,
  Globe,
  MessageCircle,
  Twitter,
  Instagram,
  Youtube,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const tradingStyles = [
  'Scalping',
  'Day Trading',
  'Swing Trading',
  'Position Trading',
  'Algorithmic Trading',
  'News Trading',
  'Copy Trading',
  'Education & Mentoring',
];

const specialtyOptions = [
  'Forex',
  'Gold/XAUUSD',
  'Crypto',
  'Indices',
  'Stocks',
  'Commodities',
  'MT4/MT5 Development',
  'Technical Analysis',
  'Fundamental Analysis',
  'Risk Management',
  'Trading Psychology',
];

export default function BecomeSellerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    country: '',
    bio: '',
    tagline: '',
    experience_years: 0,
    trading_style: '',
    specialties: [] as string[],
    website: '',
    telegram: '',
    twitter: '',
    instagram: '',
    youtube: '',
    discord: '',
    why_join: '',
    terms_accepted: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSpecialtyToggle = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty],
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

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/profile/become-seller`, {
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
                Thank you for applying to become a seller. Our team will review your application
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
            href="/dashboard/seller"
            sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}
          >
            Back to Seller Dashboard
          </Button>
          
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, mb: 1 }}>
            Become a Seller
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.6)' }}>
            Complete your seller profile to start selling on AlgoEdge Marketplace
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
                <User size={24} color="#8B5CF6" />
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
                        '&.Mui-focused fieldset': { borderColor: '#8B5CF6' },
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
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Years of Trading Experience"
                    name="experience_years"
                    type="number"
                    value={formData.experience_years}
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

          {/* Professional Profile */}
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', mb: 3 }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <Briefcase size={24} color="#8B5CF6" />
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                  Professional Profile
                </Typography>
              </Stack>

              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Tagline (Short description)"
                    name="tagline"
                    value={formData.tagline}
                    onChange={handleChange}
                    placeholder="e.g., Expert Gold Trading Bot Developer"
                    inputProps={{ maxLength: 100 }}
                    helperText={`${formData.tagline.length}/100 characters`}
                    InputLabelProps={{ sx: { color: 'rgba(255,255,255,0.7)' } }}
                    FormHelperTextProps={{ sx: { color: 'rgba(255,255,255,0.5)' } }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        color: 'white',
                        '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bio"
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    required
                    multiline
                    rows={4}
                    placeholder="Tell potential buyers about your experience, expertise, and what makes your products unique..."
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
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: 'rgba(255,255,255,0.7)' }}>Trading Style</InputLabel>
                    <Select
                      value={formData.trading_style}
                      onChange={(e) => setFormData(prev => ({ ...prev, trading_style: e.target.value }))}
                      label="Trading Style"
                      sx={{
                        color: 'white',
                        '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                        '& .MuiSvgIcon-root': { color: 'white' },
                      }}
                    >
                      {tradingStyles.map(style => (
                        <MenuItem key={style} value={style}>{style}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
                    Specialties (Select all that apply)
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {specialtyOptions.map(specialty => (
                      <Chip
                        key={specialty}
                        label={specialty}
                        onClick={() => handleSpecialtyToggle(specialty)}
                        sx={{
                          bgcolor: formData.specialties.includes(specialty) 
                            ? 'rgba(139, 92, 246, 0.3)' 
                            : 'rgba(255,255,255,0.05)',
                          color: formData.specialties.includes(specialty) ? '#8B5CF6' : 'rgba(255,255,255,0.7)',
                          border: formData.specialties.includes(specialty) 
                            ? '1px solid #8B5CF6' 
                            : '1px solid rgba(255,255,255,0.2)',
                          '&:hover': {
                            bgcolor: 'rgba(139, 92, 246, 0.2)',
                          },
                        }}
                      />
                    ))}
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Social Links */}
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', mb: 3 }}>
            <CardContent>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <Globe size={24} color="#8B5CF6" />
                <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                  Social & Contact Links
                </Typography>
              </Stack>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Website"
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
                    label="Telegram Username"
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
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Discord Server/Username"
                    name="discord"
                    value={formData.discord}
                    onChange={handleChange}
                    placeholder="discord.gg/invite or username#0000"
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

          {/* Why Join */}
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, mb: 3 }}>
                Why do you want to join AlgoEdge as a seller?
              </Typography>
              <TextField
                fullWidth
                name="why_join"
                value={formData.why_join}
                onChange={handleChange}
                multiline
                rows={3}
                placeholder="Tell us about your goals and what you plan to sell..."
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
          <Card sx={{ bgcolor: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)', mb: 3 }}>
            <CardContent>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.terms_accepted}
                    onChange={handleChange}
                    name="terms_accepted"
                    sx={{ color: '#8B5CF6', '&.Mui-checked': { color: '#8B5CF6' } }}
                  />
                }
                label={
                  <Typography sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    I agree to the <Link href="/terms" style={{ color: '#8B5CF6' }}>Seller Terms & Conditions</Link> and 
                    understand that AlgoEdge takes a 20% commission on all sales. I will provide quality products
                    and support to buyers.
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
              disabled={loading || !formData.terms_accepted || !formData.full_name || !formData.bio}
              sx={{
                background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
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
