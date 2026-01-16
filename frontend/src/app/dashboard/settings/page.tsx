'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  Divider,
  Switch,
  FormControlLabel,
  Grid,
  Avatar,
  IconButton,
  Tabs,
  Tab,
  InputAdornment,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import {
  User,
  Lock,
  Bell,
  Shield,
  Save,
  Eye,
  EyeOff,
  TrendingUp,
  Send,
  LogOut,
  Trash2,
  Download,
  AlertTriangle,
  Monitor,
  Copy,
  Key,
  QrCode,
  CheckCircle,
} from 'lucide-react';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

// Timezone options
const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (ET) - New York' },
  { value: 'America/Chicago', label: 'Central Time (CT) - Chicago' },
  { value: 'America/Denver', label: 'Mountain Time (MT) - Denver' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT) - Los Angeles' },
  { value: 'Europe/London', label: 'GMT - London' },
  { value: 'Europe/Paris', label: 'CET - Paris, Berlin' },
  { value: 'Europe/Moscow', label: 'MSK - Moscow' },
  { value: 'Asia/Dubai', label: 'GST - Dubai' },
  { value: 'Asia/Singapore', label: 'SGT - Singapore' },
  { value: 'Asia/Tokyo', label: 'JST - Tokyo' },
  { value: 'Asia/Hong_Kong', label: 'HKT - Hong Kong' },
  { value: 'Australia/Sydney', label: 'AEST - Sydney' },
  { value: 'Africa/Nairobi', label: 'EAT - Nairobi' },
  { value: 'Africa/Lagos', label: 'WAT - Lagos' },
  { value: 'Africa/Johannesburg', label: 'SAST - Johannesburg' },
];

// Mock active sessions for demo
const mockSessions = [
  { id: 1, device: 'Chrome on Windows', location: 'New York, USA', lastActive: 'Active now', current: true },
  { id: 2, device: 'Safari on iPhone', location: 'London, UK', lastActive: '2 hours ago', current: false },
  { id: 3, device: 'Firefox on MacOS', location: 'Singapore', lastActive: '1 day ago', current: false },
];

export default function SettingsPage() {
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Dialogs
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [showTelegramDialog, setShowTelegramDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  const [profile, setProfile] = useState({
    fullName: '',
    email: '',
    username: '',
    phone: '',
  });

  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    tradeAlerts: true,
    marketNews: false,
    weeklyReports: true,
    telegramAlerts: false,
  });

  // Trading Preferences
  const [tradingPrefs, setTradingPrefs] = useState({
    defaultRiskPercent: 2,
    maxDailyTrades: 10,
    maxDailyLossPercent: 5,
    maxLotSize: 0.5,
    tradingHoursStart: '00:00',
    tradingHoursEnd: '23:59',
    timezone: 'UTC',
    autoStopOnDailyLoss: true,
    weekendTrading: false,
  });

  // Security settings
  const [security, setSecurity] = useState({
    twoFactorEnabled: false,
    twoFactorSecret: '',
    twoFactorQrCode: '',
    telegramConnected: false,
    telegramChatId: '',
  });

  // Sessions
  const [sessions, setSessions] = useState(mockSessions);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchProfile();
  }, [router]);

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        // Profile API returns data directly (not nested under 'user')
        setProfile({
          fullName: data.fullName || '',
          email: data.email || '',
          username: data.username || '',
          phone: data.phone || '',
        });
        
        // Set 2FA status from user data
        setSecurity(prev => ({
          ...prev,
          twoFactorEnabled: data.twoFaEnabled || false,
        }));
        
        if (data.settings) {
          setNotifications({
            emailNotifications: data.settings.emailNotifications ?? true,
            tradeAlerts: data.settings.tradeAlerts ?? true,
            marketNews: data.settings.marketNews ?? false,
            weeklyReports: data.settings.weeklyReports ?? true,
            telegramAlerts: data.settings.telegramAlerts ?? false,
          });
          if (data.settings.tradingPrefs) {
            setTradingPrefs(prev => ({ ...prev, ...data.settings.tradingPrefs }));
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  };

  const handleUpdateProfile = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        setSuccess('Profile updated successfully');
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          user.fullName = profile.fullName;
          localStorage.setItem('user', JSON.stringify(user));
        }
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update profile');
      }
    } catch (err) {
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwords.newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: passwords.currentPassword,
          newPassword: passwords.newPassword,
        }),
      });

      if (response.ok) {
        setSuccess('Password changed successfully');
        setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to change password');
      }
    } catch (err) {
      setError('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateNotifications = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(notifications),
      });

      if (response.ok) {
        setSuccess('Notification settings updated');
      } else {
        setError('Failed to update settings');
      }
    } catch (err) {
      setError('Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTradingPrefs = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tradingPrefs }),
      });

      if (response.ok) {
        setSuccess('Trading preferences saved');
      } else {
        setError('Failed to save trading preferences');
      }
    } catch (err) {
      setError('Failed to save trading preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSecurity({ 
          ...security, 
          twoFactorSecret: data.secret,
          twoFactorQrCode: data.qrCode 
        });
        setShow2FADialog(true);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to setup 2FA');
      }
    } catch (err) {
      setError('Failed to setup 2FA');
    } finally {
      setLoading(false);
    }
  };

  const [twoFACode, setTwoFACode] = useState('');

  const handleConfirm2FA = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ token: twoFACode }),
      });

      if (response.ok) {
        setSecurity({ ...security, twoFactorEnabled: true });
        setShow2FADialog(false);
        setTwoFACode('');
        setSuccess('Two-factor authentication enabled');
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Invalid 2FA code');
      }
    } catch (err) {
      setError('Failed to verify 2FA code');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSecurity({ ...security, twoFactorEnabled: false, twoFactorSecret: '', twoFactorQrCode: '' });
        setSuccess('Two-factor authentication disabled');
      } else {
        setError('Failed to disable 2FA');
      }
    } catch (err) {
      setError('Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  // Telegram state
  const [telegramConnectLink, setTelegramConnectLink] = useState('');
  const [telegramLoading, setTelegramLoading] = useState(false);

  const handleConnectTelegram = async () => {
    setTelegramLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/telegram/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setTelegramConnectLink(data.connectLink);
        setShowTelegramDialog(true);
      } else {
        if (data.error === 'Telegram already connected') {
          setError('Telegram is already connected to your account');
        } else {
          setError(data.error || 'Failed to generate connection link');
        }
      }
    } catch (err) {
      setError('Failed to connect to Telegram');
    } finally {
      setTelegramLoading(false);
    }
  };

  const handleOpenTelegramLink = () => {
    if (telegramConnectLink) {
      window.open(telegramConnectLink, '_blank');
    }
  };

  const handleCheckTelegramConnection = async () => {
    setTelegramLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/telegram/status', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.connected) {
        setSecurity({ 
          ...security, 
          telegramConnected: true, 
          telegramChatId: data.chatId || '',
        });
        setNotifications({ ...notifications, telegramAlerts: data.alertsEnabled ?? true });
        setShowTelegramDialog(false);
        setTelegramConnectLink('');
        setSuccess('🎉 Telegram connected successfully!');
      } else {
        setError('Not connected yet. Please click the link and start the bot.');
      }
    } catch (err) {
      setError('Failed to check connection status');
    } finally {
      setTelegramLoading(false);
    }
  };

  const handleDisconnectTelegram = async () => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/telegram/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setSecurity({ ...security, telegramConnected: false, telegramChatId: '' });
        setNotifications({ ...notifications, telegramAlerts: false });
        setSuccess('Telegram disconnected');
      } else {
        setError('Failed to disconnect Telegram');
      }
    } catch (err) {
      setError('Failed to disconnect Telegram');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoutSession = (sessionId: number) => {
    setSessions(sessions.filter(s => s.id !== sessionId));
    setSuccess('Session logged out');
  };

  const handleLogoutAllSessions = () => {
    setSessions(sessions.filter(s => s.current));
    setSuccess('All other sessions logged out');
  };

  const handleExportData = () => {
    setSuccess('Data export started. You will receive an email with download link.');
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText === 'DELETE') {
      setShowDeleteDialog(false);
      router.push('/');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Copied to clipboard');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
        Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your account settings and preferences
      </Typography>

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

      <Paper sx={{ width: '100%' }}>
        <Tabs
          value={tabValue}
          onChange={(_, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab icon={<User size={18} />} label="Profile" iconPosition="start" />
          <Tab icon={<TrendingUp size={18} />} label="Trading" iconPosition="start" />
          <Tab icon={<Lock size={18} />} label="Security" iconPosition="start" />
          <Tab icon={<Bell size={18} />} label="Notifications" iconPosition="start" />
          <Tab icon={<Monitor size={18} />} label="Sessions" iconPosition="start" />
          <Tab icon={<AlertTriangle size={18} />} label="Danger Zone" iconPosition="start" sx={{ color: 'error.main' }} />
        </Tabs>

        {/* Profile Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <Avatar
                sx={{ width: 80, height: 80, mr: 3, bgcolor: 'primary.main', fontSize: '2rem' }}
              >
                {profile.fullName?.charAt(0) || profile.username?.charAt(0) || 'U'}
              </Avatar>
              <Box>
                <Typography variant="h6">{profile.fullName || profile.username}</Typography>
                <Typography color="text.secondary">{profile.email}</Typography>
              </Box>
            </Box>

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  value={profile.fullName}
                  onChange={(e) => setProfile({ ...profile, fullName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Username"
                  value={profile.username}
                  disabled
                  helperText="Username cannot be changed"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={profile.email}
                  disabled
                  helperText="Email cannot be changed"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone Number"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+1 234 567 8900"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Timezone</InputLabel>
                  <Select
                    value={tradingPrefs.timezone}
                    label="Timezone"
                    onChange={(e) => setTradingPrefs({ ...tradingPrefs, timezone: e.target.value })}
                  >
                    {TIMEZONES.map((tz) => (
                      <MenuItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Box sx={{ mt: 4 }}>
              <Button
                variant="contained"
                startIcon={<Save size={18} />}
                onClick={handleUpdateProfile}
                disabled={loading}
              >
                Save Changes
              </Button>
            </Box>
          </Box>
        </TabPanel>

        {/* Trading Preferences Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Risk Management
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Configure your default trading risk settings
            </Typography>

            <Grid container spacing={4}>
              <Grid item xs={12} md={6}>
                <Typography gutterBottom>Default Risk Per Trade: {tradingPrefs.defaultRiskPercent}%</Typography>
                <Slider
                  value={tradingPrefs.defaultRiskPercent}
                  onChange={(_, value) => setTradingPrefs({ ...tradingPrefs, defaultRiskPercent: value as number })}
                  min={0.5}
                  max={10}
                  step={0.5}
                  marks={[
                    { value: 1, label: '1%' },
                    { value: 5, label: '5%' },
                    { value: 10, label: '10%' },
                  ]}
                  valueLabelDisplay="auto"
                  sx={{ color: tradingPrefs.defaultRiskPercent > 5 ? 'error.main' : 'primary.main' }}
                />
                <Typography variant="caption" color="text.secondary">
                  Recommended: 1-2% for conservative trading
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography gutterBottom>Max Daily Loss Limit: {tradingPrefs.maxDailyLossPercent}%</Typography>
                <Slider
                  value={tradingPrefs.maxDailyLossPercent}
                  onChange={(_, value) => setTradingPrefs({ ...tradingPrefs, maxDailyLossPercent: value as number })}
                  min={1}
                  max={20}
                  step={1}
                  marks={[
                    { value: 5, label: '5%' },
                    { value: 10, label: '10%' },
                    { value: 20, label: '20%' },
                  ]}
                  valueLabelDisplay="auto"
                  sx={{ color: tradingPrefs.maxDailyLossPercent > 10 ? 'error.main' : 'primary.main' }}
                />
                <Typography variant="caption" color="text.secondary">
                  Bot stops trading when daily loss reaches this limit
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Max Daily Trades"
                  value={tradingPrefs.maxDailyTrades}
                  onChange={(e) => setTradingPrefs({ ...tradingPrefs, maxDailyTrades: parseInt(e.target.value) || 0 })}
                  InputProps={{ inputProps: { min: 1, max: 100 } }}
                  helperText="Maximum number of trades per day (1-100)"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="number"
                  label="Max Lot Size"
                  value={tradingPrefs.maxLotSize}
                  onChange={(e) => setTradingPrefs({ ...tradingPrefs, maxLotSize: parseFloat(e.target.value) || 0.01 })}
                  InputProps={{ inputProps: { min: 0.01, max: 10, step: 0.01 } }}
                  helperText="Maximum lot size per trade (overrides account tier)"
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            <Typography variant="h6" gutterBottom>
              Trading Hours
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Set when the bot is allowed to open new trades
            </Typography>

            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="time"
                  label="Start Time"
                  value={tradingPrefs.tradingHoursStart}
                  onChange={(e) => setTradingPrefs({ ...tradingPrefs, tradingHoursStart: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="time"
                  label="End Time"
                  value={tradingPrefs.tradingHoursEnd}
                  onChange={(e) => setTradingPrefs({ ...tradingPrefs, tradingHoursEnd: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Timezone</InputLabel>
                  <Select
                    value={tradingPrefs.timezone}
                    label="Timezone"
                    onChange={(e) => setTradingPrefs({ ...tradingPrefs, timezone: e.target.value })}
                  >
                    {TIMEZONES.map((tz) => (
                      <MenuItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={tradingPrefs.autoStopOnDailyLoss}
                    onChange={(e) => setTradingPrefs({ ...tradingPrefs, autoStopOnDailyLoss: e.target.checked })}
                  />
                }
                label={
                  <Box>
                    <Typography>Auto-stop on Daily Loss Limit</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Automatically pause trading when daily loss limit is reached
                    </Typography>
                  </Box>
                }
              />
            </Box>

            <Box sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={tradingPrefs.weekendTrading}
                    onChange={(e) => setTradingPrefs({ ...tradingPrefs, weekendTrading: e.target.checked })}
                  />
                }
                label={
                  <Box>
                    <Typography>Weekend Trading</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Allow trading on Saturday and Sunday (when markets are open)
                    </Typography>
                  </Box>
                }
              />
            </Box>

            <Box sx={{ mt: 4 }}>
              <Button
                variant="contained"
                startIcon={<Save size={18} />}
                onClick={handleUpdateTradingPrefs}
                disabled={loading}
              >
                Save Trading Preferences
              </Button>
            </Box>
          </Box>
        </TabPanel>

        {/* Security Tab */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ p: 3 }}>
            {/* Password Section */}
            <Typography variant="h6" gutterBottom>
              Change Password
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Update your password to keep your account secure
            </Typography>

            <Grid container spacing={3} sx={{ maxWidth: 500 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type={showPassword ? 'text' : 'password'}
                  label="Current Password"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)}>
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type={showNewPassword ? 'text' : 'password'}
                  label="New Password"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowNewPassword(!showNewPassword)}>
                          {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="password"
                  label="Confirm New Password"
                  value={passwords.confirmPassword}
                  onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3 }}>
              <Button
                variant="contained"
                startIcon={<Shield size={18} />}
                onClick={handleChangePassword}
                disabled={loading || !passwords.currentPassword || !passwords.newPassword}
              >
                Change Password
              </Button>
            </Box>

            <Divider sx={{ my: 4 }} />

            {/* 2FA Section */}
            <Typography variant="h6" gutterBottom>
              Two-Factor Authentication (2FA)
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Add an extra layer of security to your account
            </Typography>

            <Card sx={{ maxWidth: 500, bgcolor: 'background.default' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: security.twoFactorEnabled ? 'success.main' : 'grey.700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Key size={24} color="white" />
                    </Box>
                    <Box>
                      <Typography fontWeight={600}>Authenticator App</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {security.twoFactorEnabled ? 'Enabled' : 'Not configured'}
                      </Typography>
                    </Box>
                  </Box>
                  {security.twoFactorEnabled ? (
                    <Chip label="Active" color="success" size="small" />
                  ) : (
                    <Chip label="Disabled" color="default" size="small" />
                  )}
                </Box>
                <Box sx={{ mt: 2 }}>
                  {security.twoFactorEnabled ? (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={handleDisable2FA}
                    >
                      Disable 2FA
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<QrCode size={16} />}
                      onClick={handleEnable2FA}
                    >
                      Enable 2FA
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>

            <Divider sx={{ my: 4 }} />

            {/* Telegram Section */}
            <Typography variant="h6" gutterBottom>
              Telegram Integration
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Connect Telegram for instant trade notifications on your phone
            </Typography>

            <Card sx={{ maxWidth: 500, bgcolor: 'background.default' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: security.telegramConnected ? '#0088cc' : 'grey.700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Send size={24} color="white" />
                    </Box>
                    <Box>
                      <Typography fontWeight={600}>Telegram Bot</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {security.telegramConnected 
                          ? `Connected (ID: ${security.telegramChatId})` 
                          : 'Not connected'}
                      </Typography>
                    </Box>
                  </Box>
                  {security.telegramConnected ? (
                    <Chip label="Connected" color="info" size="small" />
                  ) : (
                    <Chip label="Disconnected" color="default" size="small" />
                  )}
                </Box>
                <Box sx={{ mt: 2 }}>
                  {security.telegramConnected ? (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      onClick={handleDisconnectTelegram}
                    >
                      Disconnect
                    </Button>
                  ) : (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<Send size={16} />}
                      onClick={handleConnectTelegram}
                      sx={{ bgcolor: '#0088cc', '&:hover': { bgcolor: '#006699' } }}
                    >
                      Connect Telegram
                    </Button>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Email Notifications
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Choose which notifications you would like to receive
            </Typography>

            <Box sx={{ maxWidth: 500 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.emailNotifications}
                    onChange={(e) => setNotifications({ ...notifications, emailNotifications: e.target.checked })}
                  />
                }
                label={
                  <Box>
                    <Typography>Email Notifications</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Receive important account updates via email
                    </Typography>
                  </Box>
                }
                sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}
              />

              <Divider sx={{ my: 2 }} />

              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.tradeAlerts}
                    onChange={(e) => setNotifications({ ...notifications, tradeAlerts: e.target.checked })}
                  />
                }
                label={
                  <Box>
                    <Typography>Trade Alerts</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Get notified when trades are opened or closed
                    </Typography>
                  </Box>
                }
                sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}
              />

              <Divider sx={{ my: 2 }} />

              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.marketNews}
                    onChange={(e) => setNotifications({ ...notifications, marketNews: e.target.checked })}
                  />
                }
                label={
                  <Box>
                    <Typography>Market News</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Receive market news and trading insights
                    </Typography>
                  </Box>
                }
                sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}
              />

              <Divider sx={{ my: 2 }} />

              <FormControlLabel
                control={
                  <Switch
                    checked={notifications.weeklyReports}
                    onChange={(e) => setNotifications({ ...notifications, weeklyReports: e.target.checked })}
                  />
                }
                label={
                  <Box>
                    <Typography>Weekly Reports</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Receive weekly trading performance summaries
                    </Typography>
                  </Box>
                }
                sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}
              />

              {security.telegramConnected && (
                <>
                  <Divider sx={{ my: 2 }} />
                  
                  <FormControlLabel
                    control={
                      <Switch
                        checked={notifications.telegramAlerts}
                        onChange={(e) => setNotifications({ ...notifications, telegramAlerts: e.target.checked })}
                      />
                    }
                    label={
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography>Telegram Alerts</Typography>
                          <Chip label="NEW" size="small" color="info" sx={{ height: 20 }} />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Receive instant trade alerts via Telegram
                        </Typography>
                      </Box>
                    }
                    sx={{ mb: 2, display: 'flex', alignItems: 'flex-start' }}
                  />
                </>
              )}
            </Box>

            <Box sx={{ mt: 4 }}>
              <Button
                variant="contained"
                startIcon={<Save size={18} />}
                onClick={handleUpdateNotifications}
                disabled={loading}
              >
                Save Preferences
              </Button>
            </Box>
          </Box>
        </TabPanel>

        {/* Sessions Tab */}
        <TabPanel value={tabValue} index={4}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
              <Box>
                <Typography variant="h6" gutterBottom>
                  Active Sessions
                </Typography>
                <Typography color="text.secondary">
                  Manage devices where you are currently logged in
                </Typography>
              </Box>
              <Button
                variant="outlined"
                color="error"
                size="small"
                startIcon={<LogOut size={16} />}
                onClick={handleLogoutAllSessions}
                disabled={sessions.length <= 1}
              >
                Logout All Others
              </Button>
            </Box>

            <List sx={{ maxWidth: 600 }}>
              {sessions.map((session) => (
                <Paper key={session.id} sx={{ mb: 2 }}>
                  <ListItem>
                    <ListItemIcon>
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: 2,
                          bgcolor: session.current ? 'primary.main' : 'grey.700',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Monitor size={20} color="white" />
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography fontWeight={500}>{session.device}</Typography>
                          {session.current && (
                            <Chip label="Current" size="small" color="primary" sx={{ height: 20 }} />
                          )}
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {session.location}
                          </Typography>
                          <Typography variant="caption" color={session.current ? 'success.main' : 'text.secondary'}>
                            {session.lastActive}
                          </Typography>
                        </Box>
                      }
                    />
                    {!session.current && (
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          color="error"
                          onClick={() => handleLogoutSession(session.id)}
                        >
                          <LogOut size={18} />
                        </IconButton>
                      </ListItemSecondaryAction>
                    )}
                  </ListItem>
                </Paper>
              ))}
            </List>

            {sessions.length === 0 && (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No active sessions found
              </Typography>
            )}
          </Box>
        </TabPanel>

        {/* Danger Zone Tab */}
        <TabPanel value={tabValue} index={5}>
          <Box sx={{ p: 3 }}>
            <Alert severity="warning" sx={{ mb: 4 }}>
              <Typography fontWeight={600}>Caution</Typography>
              Actions in this section are permanent and cannot be undone.
            </Alert>

            {/* Export Data */}
            <Card sx={{ mb: 3, bgcolor: 'background.default', border: '1px solid', borderColor: 'divider' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: 'info.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Download size={24} color="white" />
                    </Box>
                    <Box>
                      <Typography fontWeight={600}>Export Your Data</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Download a copy of all your data including trades, settings, and account info
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="outlined"
                    startIcon={<Download size={16} />}
                    onClick={handleExportData}
                  >
                    Export Data
                  </Button>
                </Box>
              </CardContent>
            </Card>

            {/* Delete Account */}
            <Card sx={{ bgcolor: 'background.default', border: '1px solid', borderColor: 'error.main' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box
                      sx={{
                        width: 48,
                        height: 48,
                        borderRadius: 2,
                        bgcolor: 'error.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Trash2 size={24} color="white" />
                    </Box>
                    <Box>
                      <Typography fontWeight={600} color="error.main">Delete Account</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </Typography>
                    </Box>
                  </Box>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Trash2 size={16} />}
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    Delete Account
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </TabPanel>
      </Paper>

      {/* 2FA Setup Dialog */}
      <Dialog open={show2FADialog} onClose={() => setShow2FADialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
          </Typography>
          
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box
              sx={{
                width: 220,
                height: 220,
                bgcolor: 'white',
                mx: 'auto',
                p: 2,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {security.twoFactorQrCode ? (
                <img 
                  src={security.twoFactorQrCode} 
                  alt="2FA QR Code" 
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'contain',
                    imageRendering: 'pixelated'
                  }} 
                />
              ) : (
                <CircularProgress />
              )}
            </Box>
          </Box>

          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Or enter this code manually:
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
            <TextField
              fullWidth
              value={security.twoFactorSecret}
              InputProps={{ readOnly: true }}
              size="small"
              sx={{ 
                '& input': { 
                  fontFamily: 'monospace', 
                  letterSpacing: '0.1em',
                  fontWeight: 600 
                } 
              }}
            />
            <IconButton onClick={() => copyToClipboard(security.twoFactorSecret)}>
              <Copy size={18} />
            </IconButton>
          </Box>

          <TextField
            fullWidth
            label="Enter 6-digit code from app"
            placeholder="000000"
            value={twoFACode}
            onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            inputProps={{ maxLength: 6 }}
            sx={{ 
              '& input': { 
                textAlign: 'center',
                fontSize: '1.5rem',
                letterSpacing: '0.5em',
                fontWeight: 600 
              } 
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShow2FADialog(false); setTwoFACode(''); }}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={handleConfirm2FA}
            disabled={twoFACode.length !== 6 || loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Verify & Enable'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Telegram Connect Dialog */}
      <Dialog open={showTelegramDialog} onClose={() => { setShowTelegramDialog(false); setTelegramConnectLink(''); }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Send size={24} color="#0088cc" />
          Connect Telegram
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Click the button below to open Telegram and connect your account:
          </Typography>
          
          {/* Step 1: Open Link */}
          <Card variant="outlined" sx={{ mb: 2, bgcolor: 'background.default' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>1</Avatar>
                <Typography fontWeight={600}>Open Telegram Bot</Typography>
              </Box>
              <Button
                fullWidth
                variant="contained"
                component="a"
                href={telegramConnectLink || '#'}
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<Send size={18} />}
                disabled={!telegramConnectLink}
                sx={{ 
                  bgcolor: '#0088cc', 
                  '&:hover': { bgcolor: '#006699' },
                  py: 1.5,
                  textDecoration: 'none',
                }}
              >
                Open @Algoedge_rs_bot in Telegram
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                This will open Telegram with a unique connection link
              </Typography>
            </CardContent>
          </Card>

          {/* Step 2: Press Start */}
          <Card variant="outlined" sx={{ mb: 2, bgcolor: 'background.default' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>2</Avatar>
                <Typography fontWeight={600}>Press START in Telegram</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                After opening the bot, press the <b>START</b> button or send <code>/start</code>
              </Typography>
            </CardContent>
          </Card>

          {/* Step 3: Verify */}
          <Card variant="outlined" sx={{ bgcolor: 'background.default' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32 }}>3</Avatar>
                <Typography fontWeight={600}>Verify Connection</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                After pressing START, click below to verify your connection:
              </Typography>
              <Button
                fullWidth
                variant="outlined"
                onClick={handleCheckTelegramConnection}
                disabled={telegramLoading}
                startIcon={telegramLoading ? <CircularProgress size={18} /> : <CheckCircle size={18} />}
              >
                {telegramLoading ? 'Checking...' : 'I Pressed START - Verify Now'}
              </Button>
            </CardContent>
          </Card>

          {/* Connection Link (for manual copy) */}
          {telegramConnectLink && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                Or copy this link manually:
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <TextField
                  fullWidth
                  size="small"
                  value={telegramConnectLink}
                  InputProps={{ readOnly: true }}
                  sx={{ '& input': { fontSize: '0.75rem' } }}
                />
                <IconButton size="small" onClick={() => copyToClipboard(telegramConnectLink)}>
                  <Copy size={16} />
                </IconButton>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowTelegramDialog(false); setTelegramConnectLink(''); }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: 'error.main' }}>Delete Account</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mb: 3 }}>
            This action is <strong>permanent</strong> and cannot be undone. All your data including:
            <ul style={{ marginBottom: 0 }}>
              <li>Trade history</li>
              <li>MT5 connection settings</li>
              <li>Account preferences</li>
              <li>Payment history</li>
            </ul>
            will be permanently deleted.
          </Alert>
          
          <Typography sx={{ mb: 2 }}>
            To confirm, type <strong>DELETE</strong> below:
          </Typography>
          <TextField
            fullWidth
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="Type DELETE to confirm"
            error={deleteConfirmText.length > 0 && deleteConfirmText !== 'DELETE'}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setShowDeleteDialog(false); setDeleteConfirmText(''); }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleDeleteAccount}
            disabled={deleteConfirmText !== 'DELETE'}
          >
            Delete My Account
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
