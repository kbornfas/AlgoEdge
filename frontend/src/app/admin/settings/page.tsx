'use client';

import { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  CircularProgress,
  Stack,
  Chip,
  InputAdornment,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Settings,
  Save,
  RefreshCcw,
  DollarSign,
  Percent,
  Globe,
  Shield,
  Users,
  Bot,
  CreditCard,
  Mail,
  Bell,
  Lock,
} from 'lucide-react';

interface PlatformSettings {
  // Platform General
  platformName: string;
  platformDescription: string;
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  
  // Commission Settings
  marketplaceCommission: number;
  signalProviderCommission: number;
  affiliateCommission: number;
  affiliateTier1Commission: number;
  affiliateTier2Commission: number;
  
  // Minimum Thresholds
  minimumWithdrawal: number;
  minimumDeposit: number;
  minimumProductPrice: number;
  minimumBotPrice: number;
  
  // Signal Provider Settings
  signalProviderMinTrades: number;
  signalProviderMinPips: number;
  signalProviderMonthlyFee: number;
  
  // Verification Settings
  requireEmailVerification: boolean;
  requireSellerVerification: boolean;
  autoApproveProducts: boolean;
  autoApproveBots: boolean;
  
  // Payment Settings
  enableCryptoPayments: boolean;
  enableBankTransfer: boolean;
  supportedCurrencies: string[];
  
  // Rate Limiting
  apiRateLimit: number;
  loginAttemptLimit: number;
}

const defaultSettings: PlatformSettings = {
  platformName: 'AlgoEdge',
  platformDescription: 'Professional Trading Tools & Signals Marketplace',
  maintenanceMode: false,
  allowNewRegistrations: true,
  
  marketplaceCommission: 15,
  signalProviderCommission: 10,
  affiliateCommission: 5,
  affiliateTier1Commission: 5,
  affiliateTier2Commission: 2,
  
  minimumWithdrawal: 10,
  minimumDeposit: 5,
  minimumProductPrice: 5,
  minimumBotPrice: 10,
  
  signalProviderMinTrades: 50,
  signalProviderMinPips: 100,
  signalProviderMonthlyFee: 0,
  
  requireEmailVerification: true,
  requireSellerVerification: true,
  autoApproveProducts: false,
  autoApproveBots: false,
  
  enableCryptoPayments: true,
  enableBankTransfer: true,
  supportedCurrencies: ['USD', 'EUR', 'GBP'],
  
  apiRateLimit: 100,
  loginAttemptLimit: 5,
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings({ ...defaultSettings, ...data.settings });
      }
      // If no settings exist yet, use defaults
    } catch (err) {
      console.error('Error fetching settings:', err);
      // Use defaults on error
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const response = await fetch(`${API_URL}/api/admin/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ settings }),
      });
      
      if (!response.ok) throw new Error('Failed to save settings');
      
      setSuccess('Settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof PlatformSettings) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.type === 'checkbox' 
      ? event.target.checked 
      : event.target.value;
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSliderChange = (field: keyof PlatformSettings) => (
    _: Event,
    value: number | number[]
  ) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  const tabPanels = [
    // General Settings
    <Grid container spacing={3} key="general">
      <Grid item xs={12}>
        <Card>
          <CardHeader 
            title={
              <Stack direction="row" alignItems="center" spacing={1}>
                <Globe size={20} />
                <Typography variant="h6">General Settings</Typography>
              </Stack>
            }
          />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Platform Name"
                  value={settings.platformName}
                  onChange={handleChange('platformName')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Platform Description"
                  value={settings.platformDescription}
                  onChange={handleChange('platformDescription')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.maintenanceMode}
                      onChange={handleChange('maintenanceMode')}
                      color="warning"
                    />
                  }
                  label={
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Typography>Maintenance Mode</Typography>
                      {settings.maintenanceMode && <Chip label="ON" color="warning" size="small" />}
                    </Stack>
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.allowNewRegistrations}
                      onChange={handleChange('allowNewRegistrations')}
                      color="primary"
                    />
                  }
                  label="Allow New Registrations"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>,

    // Commission Settings
    <Grid container spacing={3} key="commissions">
      <Grid item xs={12}>
        <Card>
          <CardHeader 
            title={
              <Stack direction="row" alignItems="center" spacing={1}>
                <Percent size={20} />
                <Typography variant="h6">Commission Settings</Typography>
              </Stack>
            }
          />
          <CardContent>
            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography gutterBottom>Marketplace Commission: {settings.marketplaceCommission}%</Typography>
                <Slider
                  value={settings.marketplaceCommission}
                  onChange={handleSliderChange('marketplaceCommission')}
                  min={0}
                  max={50}
                  valueLabelDisplay="auto"
                  marks={[
                    { value: 0, label: '0%' },
                    { value: 25, label: '25%' },
                    { value: 50, label: '50%' },
                  ]}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography gutterBottom>Signal Provider Commission: {settings.signalProviderCommission}%</Typography>
                <Slider
                  value={settings.signalProviderCommission}
                  onChange={handleSliderChange('signalProviderCommission')}
                  min={0}
                  max={50}
                  valueLabelDisplay="auto"
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                  Affiliate Commissions
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Base Affiliate Commission"
                  type="number"
                  value={settings.affiliateCommission}
                  onChange={handleChange('affiliateCommission')}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Tier 1 Commission"
                  type="number"
                  value={settings.affiliateTier1Commission}
                  onChange={handleChange('affiliateTier1Commission')}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Tier 2 Commission"
                  type="number"
                  value={settings.affiliateTier2Commission}
                  onChange={handleChange('affiliateTier2Commission')}
                  InputProps={{
                    endAdornment: <InputAdornment position="end">%</InputAdornment>,
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>,

    // Financial Settings
    <Grid container spacing={3} key="financial">
      <Grid item xs={12}>
        <Card>
          <CardHeader 
            title={
              <Stack direction="row" alignItems="center" spacing={1}>
                <DollarSign size={20} />
                <Typography variant="h6">Financial Thresholds</Typography>
              </Stack>
            }
          />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Minimum Withdrawal"
                  type="number"
                  value={settings.minimumWithdrawal}
                  onChange={handleChange('minimumWithdrawal')}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Minimum Deposit"
                  type="number"
                  value={settings.minimumDeposit}
                  onChange={handleChange('minimumDeposit')}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Minimum Product Price"
                  type="number"
                  value={settings.minimumProductPrice}
                  onChange={handleChange('minimumProductPrice')}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Minimum Bot Price"
                  type="number"
                  value={settings.minimumBotPrice}
                  onChange={handleChange('minimumBotPrice')}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12}>
        <Card>
          <CardHeader 
            title={
              <Stack direction="row" alignItems="center" spacing={1}>
                <CreditCard size={20} />
                <Typography variant="h6">Payment Methods</Typography>
              </Stack>
            }
          />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.enableCryptoPayments}
                      onChange={handleChange('enableCryptoPayments')}
                      color="primary"
                    />
                  }
                  label="Enable Crypto Payments (USDT, BTC)"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.enableBankTransfer}
                      onChange={handleChange('enableBankTransfer')}
                      color="primary"
                    />
                  }
                  label="Enable Bank Transfer"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>,

    // Verification & Security
    <Grid container spacing={3} key="security">
      <Grid item xs={12}>
        <Card>
          <CardHeader 
            title={
              <Stack direction="row" alignItems="center" spacing={1}>
                <Shield size={20} />
                <Typography variant="h6">Verification Settings</Typography>
              </Stack>
            }
          />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.requireEmailVerification}
                      onChange={handleChange('requireEmailVerification')}
                      color="primary"
                    />
                  }
                  label="Require Email Verification"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.requireSellerVerification}
                      onChange={handleChange('requireSellerVerification')}
                      color="primary"
                    />
                  }
                  label="Require Seller Verification"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.autoApproveProducts}
                      onChange={handleChange('autoApproveProducts')}
                      color="warning"
                    />
                  }
                  label="Auto-Approve New Products"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.autoApproveBots}
                      onChange={handleChange('autoApproveBots')}
                      color="warning"
                    />
                  }
                  label="Auto-Approve New Bots"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
      
      <Grid item xs={12}>
        <Card>
          <CardHeader 
            title={
              <Stack direction="row" alignItems="center" spacing={1}>
                <Lock size={20} />
                <Typography variant="h6">Rate Limiting</Typography>
              </Stack>
            }
          />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="API Rate Limit (requests/minute)"
                  type="number"
                  value={settings.apiRateLimit}
                  onChange={handleChange('apiRateLimit')}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Max Login Attempts"
                  type="number"
                  value={settings.loginAttemptLimit}
                  onChange={handleChange('loginAttemptLimit')}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>,

    // Signal Provider Settings
    <Grid container spacing={3} key="signals">
      <Grid item xs={12}>
        <Card>
          <CardHeader 
            title={
              <Stack direction="row" alignItems="center" spacing={1}>
                <Bot size={20} />
                <Typography variant="h6">Signal Provider Requirements</Typography>
              </Stack>
            }
          />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Minimum Trades Required"
                  type="number"
                  value={settings.signalProviderMinTrades}
                  onChange={handleChange('signalProviderMinTrades')}
                  helperText="Minimum trades before becoming visible"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Minimum Total Pips"
                  type="number"
                  value={settings.signalProviderMinPips}
                  onChange={handleChange('signalProviderMinPips')}
                  helperText="Minimum profit pips required"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Monthly Subscription Fee"
                  type="number"
                  value={settings.signalProviderMonthlyFee}
                  onChange={handleChange('signalProviderMonthlyFee')}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">$</InputAdornment>,
                  }}
                  helperText="Platform fee for signal providers"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>,
  ];

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 3, md: 4 } }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4} flexWrap="wrap" gap={2}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Settings size={32} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Platform Settings
            </Typography>
            <Typography color="text.secondary">
              Configure platform-wide settings and preferences
            </Typography>
          </Box>
        </Stack>
        
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshCcw size={18} />}
            onClick={fetchSettings}
          >
            Reset
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save size={18} />}
            onClick={saveSettings}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      
      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<Globe size={18} />} iconPosition="start" label="General" />
          <Tab icon={<Percent size={18} />} iconPosition="start" label="Commissions" />
          <Tab icon={<DollarSign size={18} />} iconPosition="start" label="Financial" />
          <Tab icon={<Shield size={18} />} iconPosition="start" label="Security" />
          <Tab icon={<Bot size={18} />} iconPosition="start" label="Signals" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabPanels[activeTab]}
    </Container>
  );
}
