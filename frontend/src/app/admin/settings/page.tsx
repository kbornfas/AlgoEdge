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
  Alert,
  CircularProgress,
  InputAdornment,
  Tab,
  Tabs,
} from '@mui/material';
import { Save } from 'lucide-react';

interface PlatformSettings {
  platformName: string;
  platformDescription: string;
  maintenanceMode: boolean;
  allowNewRegistrations: boolean;
  marketplaceCommission: number;
  signalProviderCommission: number;
  affiliateCommission: number;
  minimumWithdrawal: number;
  minimumDeposit: number;
}

const defaultSettings: PlatformSettings = {
  platformName: 'AlgoEdge',
  platformDescription: 'Professional Trading Tools & Signals Marketplace',
  maintenanceMode: false,
  allowNewRegistrations: true,
  marketplaceCommission: 20,
  signalProviderCommission: 10,
  affiliateCommission: 5,
  minimumWithdrawal: 10,
  minimumDeposit: 5,
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
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
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

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4, pl: { xs: 6, md: 3 } }}>
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Platform Settings
        </Typography>
        <Typography color="text.secondary">
          Configure platform-wide settings and preferences
        </Typography>
      </Box>

      <Alert severity="success" sx={{ mb: 3 }}>
        <strong>Settings are now active!</strong> Commission rates and minimums saved here will be applied to all new marketplace purchases.
        Changes take effect within 5 minutes due to caching.
      </Alert>

      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 3 }}>
        <Tab label="General" />
        <Tab label="Commissions" />
        <Tab label="Limits" />
      </Tabs>

      {activeTab === 0 && (
        <Card>
          <CardHeader title="General Settings" />
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
                  control={<Switch checked={settings.maintenanceMode} onChange={handleChange('maintenanceMode')} />}
                  label="Maintenance Mode"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControlLabel
                  control={<Switch checked={settings.allowNewRegistrations} onChange={handleChange('allowNewRegistrations')} />}
                  label="Allow New Registrations"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {activeTab === 1 && (
        <Card>
          <CardHeader title="Commission Rates" />
          <CardContent>
            <Alert severity="info" sx={{ mb: 3 }}>
              Commission rates are applied to all new marketplace purchases. Platform keeps this percentage, sellers receive the remainder.
            </Alert>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Marketplace Commission (%)"
                  type="number"
                  value={settings.marketplaceCommission}
                  onChange={handleChange('marketplaceCommission')}
                  InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Signal Provider Commission (%)"
                  type="number"
                  value={settings.signalProviderCommission}
                  onChange={handleChange('signalProviderCommission')}
                  InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Affiliate Commission (%)"
                  type="number"
                  value={settings.affiliateCommission}
                  onChange={handleChange('affiliateCommission')}
                  InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {activeTab === 2 && (
        <Card>
          <CardHeader title="Minimum Thresholds" />
          <CardContent>
            <Alert severity="info" sx={{ mb: 3 }}>
              These minimum amounts are enforced for all wallet operations.
            </Alert>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Minimum Withdrawal ($)"
                  type="number"
                  value={settings.minimumWithdrawal}
                  onChange={handleChange('minimumWithdrawal')}
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Minimum Deposit ($)"
                  type="number"
                  value={settings.minimumDeposit}
                  onChange={handleChange('minimumDeposit')}
                  InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      <Box mt={3} display="flex" justifyContent="flex-end">
        <Button
          variant="contained"
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : <Save size={18} />}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </Box>
    </Container>
  );
}
