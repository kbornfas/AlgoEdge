'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  Switch,
  TextField,
  Chip,
} from '@mui/material';
import { Settings, AlertTriangle, CheckCircle } from 'lucide-react';

export default function MaintenanceModePage() {
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/maintenance/status`);
      if (res.ok) {
        const data = await res.json();
        setMaintenanceMode(data.maintenance_mode);
        setMessage(data.message);
      }
    } catch (error) {
      console.error('Failed to fetch maintenance status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/maintenance/toggle`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enabled: !maintenanceMode,
          message,
        }),
      });

      if (res.ok) {
        setMaintenanceMode(!maintenanceMode);
      }
    } catch (error) {
      console.error('Failed to toggle maintenance mode:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return null;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', py: { xs: 2, md: 4 }, px: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Box sx={{ p: 1.5, bgcolor: 'rgba(245, 158, 11, 0.2)', borderRadius: 2 }}>
            <Settings size={24} color="#F59E0B" />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
              Maintenance Mode
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
              Enable site-wide maintenance mode with custom message
            </Typography>
          </Box>
        </Stack>

        {/* Status Card */}
        <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', mb: 3 }}>
          <CardContent>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                {maintenanceMode ? (
                  <AlertTriangle size={32} color="#F59E0B" />
                ) : (
                  <CheckCircle size={32} color="#22C55E" />
                )}
                <Box>
                  <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '1.1rem' }}>
                    {maintenanceMode ? 'Maintenance Mode Active' : 'System Running Normally'}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                    {maintenanceMode
                      ? 'Users cannot access the site'
                      : 'All features are accessible to users'}
                  </Typography>
                </Box>
              </Stack>
              <Switch
                checked={maintenanceMode}
                onChange={handleToggle}
                disabled={saving}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: '#F59E0B' },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#F59E0B' },
                }}
              />
            </Stack>

            {maintenanceMode && (
              <Chip
                label="⚠️ Site is in maintenance mode"
                sx={{
                  bgcolor: 'rgba(245, 158, 11, 0.2)',
                  color: '#F59E0B',
                  fontWeight: 600,
                  width: '100%',
                  height: 40,
                  fontSize: '0.95rem',
                }}
              />
            )}
          </CardContent>
        </Card>

        {/* Message Configuration */}
        <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <CardContent>
            <Typography sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
              Maintenance Message
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter a message to display to users during maintenance..."
              sx={{
                '& .MuiInputBase-root': { color: 'white' },
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                mb: 2,
              }}
            />
            <Button
              variant="contained"
              onClick={handleToggle}
              disabled={saving}
              sx={{
                bgcolor: maintenanceMode ? '#EF4444' : '#F59E0B',
                '&:hover': { bgcolor: maintenanceMode ? '#DC2626' : '#D97706' },
              }}
            >
              {saving ? 'Saving...' : maintenanceMode ? 'Disable Maintenance Mode' : 'Enable Maintenance Mode'}
            </Button>
          </CardContent>
        </Card>

        {/* Info Box */}
        <Card sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', mt: 3 }}>
          <CardContent>
            <Typography sx={{ color: '#3B82F6', fontWeight: 600, mb: 1 }}>
              ℹ️ How it works
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
              • When enabled, all non-admin users will see the maintenance message
              <br />
              • Admin users can still access the dashboard
              <br />
              • API endpoints will return 503 Service Unavailable to regular users
              <br />
              • Changes take effect immediately
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
