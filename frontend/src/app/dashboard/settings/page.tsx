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
} from '@mui/material';
import {
  User,
  Lock,
  Bell,
  Shield,
  Save,
  Eye,
  EyeOff,
  Camera,
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

export default function SettingsPage() {
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
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
  });

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
        setProfile({
          fullName: data.user.fullName || '',
          email: data.user.email || '',
          username: data.user.username || '',
          phone: data.user.phone || '',
        });
        if (data.settings) {
          setNotifications({
            emailNotifications: data.settings.emailNotifications ?? true,
            tradeAlerts: data.settings.tradeAlerts ?? true,
            marketNews: data.settings.marketNews ?? false,
            weeklyReports: data.settings.weeklyReports ?? true,
          });
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
        // Update localStorage
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
          sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}
        >
          <Tab icon={<User size={18} />} label="Profile" iconPosition="start" />
          <Tab icon={<Lock size={18} />} label="Security" iconPosition="start" />
          <Tab icon={<Bell size={18} />} label="Notifications" iconPosition="start" />
        </Tabs>

        {/* Profile Tab */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
              <Avatar
                sx={{ width: 80, height: 80, mr: 3, bgcolor: 'primary.main' }}
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
                />
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

        {/* Security Tab */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 3 }}>
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

            <Box sx={{ mt: 4 }}>
              <Button
                variant="contained"
                startIcon={<Shield size={18} />}
                onClick={handleChangePassword}
                disabled={loading || !passwords.currentPassword || !passwords.newPassword}
              >
                Change Password
              </Button>
            </Box>
          </Box>
        </TabPanel>

        {/* Notifications Tab */}
        <TabPanel value={tabValue} index={2}>
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
      </Paper>
    </Box>
  );
}
