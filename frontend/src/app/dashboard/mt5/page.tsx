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
  AlertTitle,
  Chip,
  Divider,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Link as LinkIcon,
  Unlink,
  CheckCircle,
  AlertCircle,
  Server,
  User,
  Shield,
  RefreshCw,
} from 'lucide-react';

interface MT5Account {
  id: number;
  accountId: string;
  server: string;
  status: string;
  connectedAt: string;
  balance?: number;
  equity?: number;
}

export default function MT5ConnectionPage() {
  const router = useRouter();
  const [account, setAccount] = useState<MT5Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [refreshing, setRefreshing] = useState(false);
  
  const [formData, setFormData] = useState({
    accountId: '',
    password: '',
    server: '',
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    fetchMT5Account();
  }, [router]);

  const fetchMT5Account = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/mt5-account', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setAccount(data.account);
      }
    } catch (err) {
      console.error('Failed to fetch MT5 account:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!account) return;
    
    setRefreshing(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/mt5-account/refresh', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (response.ok) {
        setAccount(data.account);
        setSuccess('Balance updated from MetaAPI');
      } else {
        setError(data.error || 'Failed to refresh balance');
      }
    } catch (err) {
      setError('Failed to refresh balance');
    } finally {
      setRefreshing(false);
    }
  };

  const handleDebug = async () => {
    setRefreshing(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/mt5-account/debug', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      console.log('=== MetaAPI Debug Info ===');
      console.log(JSON.stringify(data, null, 2));
      
      // Show meaningful info to user
      if (data.error) {
        setError('ERROR: ' + data.error);
      } else if (data.SUCCESS) {
        setSuccess(data.SUCCESS);
        // Refresh the page data after successful debug
        await fetchMT5Account();
      } else if (data.step4_matchingAccount && typeof data.step4_matchingAccount === 'string' && data.step4_matchingAccount.includes('NOT FOUND')) {
        setError('Account not found in MetaAPI. Please DISCONNECT and RECONNECT with your MT5 password.');
      } else if (data.step5 && typeof data.step5 === 'string') {
        setError(data.step5);
      } else if (!data.step1_tokenCheck?.hasMetaApiToken) {
        setError('METAAPI_TOKEN is not configured. Contact admin to add it in Vercel settings.');
      } else if (data.step6_accountInfo) {
        const bal = data.step6_accountInfo.balance || 0;
        if (bal > 0) {
          setSuccess(`Found balance: $${bal}. Refresh complete!`);
          await fetchMT5Account();
        } else {
          setError('Account connected but balance is 0. Ensure your MT5 account has funds.');
        }
      } else if (data.step6_error) {
        // Show detailed error info
        const errInfo = data.step6_error;
        if (errInfo.status === 404) {
          setError(`Account not synced with MetaAPI. Click Disconnect, then Reconnect with your MT5 password.`);
        } else {
          setError(`MetaAPI Error (${errInfo.status}): ${errInfo.message || JSON.stringify(errInfo.response || errInfo)}`);
        }
      } else if (data.step3_metaApiList?.error) {
        setError(`MetaAPI list error: ${data.step3_metaApiList.error}`);
      } else {
        // Show actual debug data for troubleshooting
        const debugSummary = [
          `Token: ${data.step1_tokenCheck?.hasMetaApiToken ? 'YES' : 'NO'}`,
          `DB Account: ${data.step2_dbAccount?.accountId || 'NONE'}`,
          `MetaAPI accounts: ${data.step3_metaApiList?.totalAccounts || 0}`,
          `Matching: ${typeof data.step4_matchingAccount === 'object' ? 
            `${data.step4_matchingAccount.state}/${data.step4_matchingAccount.connectionStatus}` : 
            data.step4_matchingAccount}`,
        ].join(' | ');
        setError(`Debug: ${debugSummary}`);
      }
    } catch (err: any) {
      console.error('Debug error:', err);
      setError('Debug failed: ' + (err.message || err));
    } finally {
      setRefreshing(false);
    }
  };

  const handleConnect = async () => {
    if (!formData.accountId || !formData.password || !formData.server) {
      setError('Please fill in all fields');
      return;
    }

    setConnecting(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/user/mt5-account/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('MT5 account connected successfully!');
        setDialogOpen(false);
        setFormData({ accountId: '', password: '', server: '' });
        fetchMT5Account();
      } else {
        setError(data.error || 'Failed to connect MT5 account');
      }
    } catch (err) {
      setError('Failed to connect. Please try again.');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!account) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/user/mt5-account/${account.id}/disconnect`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setSuccess('MT5 account disconnected');
        setAccount(null);
      }
    } catch (err) {
      setError('Failed to disconnect');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
        MT5 Connection
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Connect your MetaTrader 5 account to enable automated trading
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

      {account ? (
        // Connected Account View
        <Paper sx={{ p: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <CheckCircle size={32} color="#4caf50" />
            <Box sx={{ ml: 2 }}>
              <Typography variant="h6">Account Connected</Typography>
              <Chip label={account.status} color="success" size="small" sx={{ mt: 0.5 }} />
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <User size={20} />
                    <Typography sx={{ ml: 1, fontWeight: 500 }}>Account ID</Typography>
                  </Box>
                  <Typography variant="h6">{account.accountId}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card variant="outlined">
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Server size={20} />
                    <Typography sx={{ ml: 1, fontWeight: 500 }}>Server</Typography>
                  </Box>
                  <Typography variant="h6">{account.server}</Typography>
                </CardContent>
              </Card>
            </Grid>

            {account.balance !== undefined && (
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>Balance</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      ${account.balance?.toLocaleString()}
                    </Typography>
                    {account.balance === 0 && (
                      <Typography variant="caption" color="warning.main">
                        Balance may take 1-2 min to sync. Click Refresh.
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            )}

            {account.equity !== undefined && (
              <Grid item xs={12} md={6}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary" gutterBottom>Equity</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 600 }}>
                      ${account.equity?.toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              startIcon={refreshing ? <CircularProgress size={18} /> : <RefreshCw size={18} />}
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Unlink size={18} />}
              onClick={handleDisconnect}
            >
              Disconnect
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleDebug}
            >
              Debug
            </Button>
          </Box>
        </Paper>
      ) : (
        // No Account Connected View
        <Paper sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <AlertCircle size={64} color="#ff9800" style={{ marginBottom: 16 }} />
            <Typography variant="h5" gutterBottom>
              No MT5 Account Connected
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4 }}>
              Connect your MetaTrader 5 account to start automated trading with AlgoEdge robots
            </Typography>
            <Button
              variant="contained"
              size="large"
              startIcon={<LinkIcon size={20} />}
              onClick={() => setDialogOpen(true)}
            >
              Connect MT5 Account
            </Button>
          </Box>

          <Divider sx={{ my: 4 }} />

          <Alert severity="info" icon={<Shield size={20} />}>
            <AlertTitle>Secure Connection</AlertTitle>
            Your MT5 credentials are encrypted and securely stored. We use MetaAPI for safe broker connectivity.
          </Alert>
        </Paper>
      )}

      {/* Connect Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Connect MT5 Account</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Account ID"
              placeholder="Enter your MT5 account number"
              value={formData.accountId}
              onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              type="password"
              label="Password"
              placeholder="Enter your MT5 password (investor or master)"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Server"
              placeholder="e.g., ICMarketsSC-Demo, Exness-MT5Real"
              value={formData.server}
              onChange={(e) => setFormData({ ...formData, server: e.target.value })}
              margin="normal"
              helperText="Enter your broker's MT5 server name"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleConnect}
            disabled={connecting}
            startIcon={connecting ? <CircularProgress size={16} /> : <LinkIcon size={16} />}
          >
            {connecting ? 'Connecting...' : 'Connect'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
