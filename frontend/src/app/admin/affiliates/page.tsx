'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Alert,
  AppBar,
  Toolbar,
  Card,
  CardContent,
  Grid,
  TextField,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
  IconButton,
  Tooltip,
  LinearProgress,
  Pagination,
} from '@mui/material';
import {
  LogOut,
  Shield,
  Users,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Search,
  Download,
  CheckCircle,
  XCircle,
  Eye,
  Ban,
  RefreshCw,
  Wallet,
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

export default function AdminAffiliatePage() {
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Overview data
  const [overview, setOverview] = useState<any>(null);
  
  // Affiliates data
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [affiliatesPage, setAffiliatesPage] = useState(1);
  const [affiliatesTotal, setAffiliatesTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  
  // Payouts data
  const [payouts, setPayouts] = useState<any[]>([]);
  const [payoutsPage, setPayoutsPage] = useState(1);
  const [payoutsTotalPages, setPayoutsTotalPages] = useState(1);
  const [payoutStatusFilter, setPayoutStatusFilter] = useState('pending');
  
  // Fraud flags
  const [fraudFlags, setFraudFlags] = useState<any[]>([]);
  
  // Dialogs
  const [payoutDialog, setPayoutDialog] = useState<{ open: boolean; payout: any; action: string }>({
    open: false, payout: null, action: ''
  });
  const [affiliateDialog, setAffiliateDialog] = useState<{ open: boolean; affiliate: any }>({
    open: false, affiliate: null
  });
  const [transactionId, setTransactionId] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  };

  useEffect(() => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    fetchOverview();
    fetchAffiliates();
    fetchPayouts();
    fetchFraudFlags();
  }, []);

  useEffect(() => {
    fetchAffiliates();
  }, [affiliatesPage, searchTerm, tierFilter]);

  useEffect(() => {
    fetchPayouts();
  }, [payoutsPage, payoutStatusFilter]);

  const fetchOverview = async () => {
    try {
      const response = await fetch('/api/admin/affiliate/overview', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setOverview(data);
      }
    } catch (err) {
      console.error('Error fetching overview:', err);
    }
  };

  const fetchAffiliates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: affiliatesPage.toString(),
        limit: '20',
        ...(searchTerm && { search: searchTerm }),
        ...(tierFilter && { tier: tierFilter }),
      });
      const response = await fetch(`/api/admin/affiliate/affiliates?${params}`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setAffiliates(data.affiliates);
        setAffiliatesTotalPages(data.totalPages);
      }
    } catch (err) {
      console.error('Error fetching affiliates:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayouts = async () => {
    try {
      const params = new URLSearchParams({
        page: payoutsPage.toString(),
        limit: '20',
        ...(payoutStatusFilter && { status: payoutStatusFilter }),
      });
      const response = await fetch(`/api/admin/affiliate/payouts?${params}`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setPayouts(data.payouts);
        setPayoutsTotalPages(data.totalPages);
      }
    } catch (err) {
      console.error('Error fetching payouts:', err);
    }
  };

  const fetchFraudFlags = async () => {
    try {
      const response = await fetch('/api/admin/affiliate/fraud-flags?resolved=false', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setFraudFlags(data.fraudFlags);
      }
    } catch (err) {
      console.error('Error fetching fraud flags:', err);
    }
  };

  const handleApprovePayout = async () => {
    if (!payoutDialog.payout) return;
    try {
      const response = await fetch(`/api/admin/affiliate/payouts/${payoutDialog.payout.id}/approve`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ transactionId, notes: adminNotes }),
      });
      if (response.ok) {
        setSuccess('Payout approved successfully');
        setPayoutDialog({ open: false, payout: null, action: '' });
        fetchPayouts();
        fetchOverview();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to approve payout');
      }
    } catch (err) {
      setError('Failed to approve payout');
    }
  };

  const handleRejectPayout = async () => {
    if (!payoutDialog.payout || !rejectionReason) return;
    try {
      const response = await fetch(`/api/admin/affiliate/payouts/${payoutDialog.payout.id}/reject`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ reason: rejectionReason }),
      });
      if (response.ok) {
        setSuccess('Payout rejected');
        setPayoutDialog({ open: false, payout: null, action: '' });
        fetchPayouts();
        fetchOverview();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to reject payout');
      }
    } catch (err) {
      setError('Failed to reject payout');
    }
  };

  const handleBlockAffiliate = async (affiliateId: number, block: boolean) => {
    try {
      const response = await fetch(`/api/admin/affiliate/affiliates/${affiliateId}`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ blocked: block, blockedReason: block ? 'Blocked by admin' : '' }),
      });
      if (response.ok) {
        setSuccess(block ? 'Affiliate blocked' : 'Affiliate unblocked');
        fetchAffiliates();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update affiliate');
      }
    } catch (err) {
      setError('Failed to update affiliate');
    }
  };

  const handleExport = async (type: string) => {
    try {
      const response = await fetch(`/api/admin/affiliate/export?type=${type}`, {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_export.csv`;
        a.click();
      }
    } catch (err) {
      setError('Failed to export data');
    }
  };

  const handleRunApprovalJob = async () => {
    try {
      const response = await fetch('/api/admin/affiliate/run-approval-job', {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setSuccess(`Approved ${data.count} commissions`);
        fetchOverview();
      }
    } catch (err) {
      setError('Failed to run approval job');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
  };

  const formatCurrency = (amount: number) => `$${(amount || 0).toFixed(2)}`;
  const formatDate = (date: string) => new Date(date).toLocaleDateString();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static">
        <Toolbar>
          <Shield size={32} style={{ marginRight: 16 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            AlgoEdge Admin - Affiliate Management
          </Typography>
          <Button
            color="inherit"
            startIcon={<LogOut size={20} />}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
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

        {/* Overview Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Users color="#3b82f6" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Total Affiliates</Typography>
                    <Typography variant="h5" fontWeight={700}>
                      {overview?.stats?.total_affiliates || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <DollarSign color="#10b981" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Total Commissions</Typography>
                    <Typography variant="h5" fontWeight={700}>
                      {formatCurrency(overview?.stats?.total_commissions)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Wallet color="#f59e0b" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Pending Payouts</Typography>
                    <Typography variant="h5" fontWeight={700}>
                      {formatCurrency(overview?.pendingPayouts?.pending_amount)} ({overview?.pendingPayouts?.pending_count || 0})
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <AlertTriangle color="#ef4444" />
                  <Box>
                    <Typography variant="body2" color="text.secondary">Fraud Alerts</Typography>
                    <Typography variant="h5" fontWeight={700}>
                      {overview?.unresolvedFraud || 0}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            startIcon={<RefreshCw size={18} />}
            onClick={handleRunApprovalJob}
          >
            Run Commission Approval
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download size={18} />}
            onClick={() => handleExport('affiliates')}
          >
            Export Affiliates
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download size={18} />}
            onClick={() => handleExport('commissions')}
          >
            Export Commissions
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download size={18} />}
            onClick={() => handleExport('payouts')}
          >
            Export Payouts
          </Button>
        </Box>

        {/* Tabs */}
        <Paper sx={{ width: '100%' }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)}>
            <Tab label="Affiliates" />
            <Tab label={`Payouts (${overview?.pendingPayouts?.pending_count || 0})`} />
            <Tab label={`Fraud Alerts (${fraudFlags.length})`} />
          </Tabs>

          {/* Affiliates Tab */}
          <TabPanel value={tabValue} index={0}>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <TextField
                size="small"
                placeholder="Search affiliates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={18} />
                    </InputAdornment>
                  ),
                }}
                sx={{ width: 300 }}
              />
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Tier</InputLabel>
                <Select
                  value={tierFilter}
                  label="Tier"
                  onChange={(e) => setTierFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="bronze">Bronze</MenuItem>
                  <MenuItem value="silver">Silver</MenuItem>
                  <MenuItem value="gold">Gold</MenuItem>
                  <MenuItem value="diamond">Diamond</MenuItem>
                  <MenuItem value="elite">Elite</MenuItem>
                </Select>
              </FormControl>
            </Box>

            {loading && <LinearProgress />}

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Username</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Code</TableCell>
                    <TableCell>Tier</TableCell>
                    <TableCell align="right">Referrals</TableCell>
                    <TableCell align="right">Earnings</TableCell>
                    <TableCell align="right">Balance</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {affiliates.map((affiliate) => (
                    <TableRow key={affiliate.id}>
                      <TableCell>{affiliate.username}</TableCell>
                      <TableCell>{affiliate.email}</TableCell>
                      <TableCell>
                        <Chip label={affiliate.referral_code} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={affiliate.affiliate_tier || 'bronze'} 
                          size="small"
                          color={
                            affiliate.affiliate_tier === 'elite' ? 'secondary' :
                            affiliate.affiliate_tier === 'diamond' ? 'info' :
                            affiliate.affiliate_tier === 'gold' ? 'warning' :
                            'default'
                          }
                        />
                      </TableCell>
                      <TableCell align="right">
                        {affiliate.total_referrals} ({affiliate.active_referrals} active)
                      </TableCell>
                      <TableCell align="right">{formatCurrency(affiliate.total_earned)}</TableCell>
                      <TableCell align="right">{formatCurrency(affiliate.available_balance)}</TableCell>
                      <TableCell>
                        {affiliate.affiliate_blocked ? (
                          <Chip label="Blocked" size="small" color="error" />
                        ) : (
                          <Chip label="Active" size="small" color="success" />
                        )}
                      </TableCell>
                      <TableCell>
                        <Tooltip title={affiliate.affiliate_blocked ? 'Unblock' : 'Block'}>
                          <IconButton
                            size="small"
                            onClick={() => handleBlockAffiliate(affiliate.id, !affiliate.affiliate_blocked)}
                            color={affiliate.affiliate_blocked ? 'success' : 'error'}
                          >
                            {affiliate.affiliate_blocked ? <CheckCircle size={18} /> : <Ban size={18} />}
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={affiliatesTotal}
                page={affiliatesPage}
                onChange={(_, page) => setAffiliatesPage(page)}
              />
            </Box>
          </TabPanel>

          {/* Payouts Tab */}
          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <FormControl size="small" sx={{ minWidth: 150 }}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={payoutStatusFilter}
                  label="Status"
                  onChange={(e) => setPayoutStatusFilter(e.target.value)}
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Requested</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {payouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell>#{payout.id}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{payout.username}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {payout.email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography fontWeight={700}>{formatCurrency(payout.amount)}</Typography>
                      </TableCell>
                      <TableCell>{payout.payout_method}</TableCell>
                      <TableCell>{formatDate(payout.requested_at)}</TableCell>
                      <TableCell>
                        <Chip
                          label={payout.status}
                          size="small"
                          color={
                            payout.status === 'completed' ? 'success' :
                            payout.status === 'rejected' ? 'error' :
                            'warning'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {payout.status === 'pending' && (
                          <>
                            <Tooltip title="Approve">
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => setPayoutDialog({ open: true, payout, action: 'approve' })}
                              >
                                <CheckCircle size={18} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => setPayoutDialog({ open: true, payout, action: 'reject' })}
                              >
                                <XCircle size={18} />
                              </IconButton>
                            </Tooltip>
                          </>
                        )}
                        {payout.transaction_id && (
                          <Typography variant="caption" sx={{ display: 'block' }}>
                            TX: {payout.transaction_id}
                          </Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination
                count={payoutsTotalPages}
                page={payoutsPage}
                onChange={(_, page) => setPayoutsPage(page)}
              />
            </Box>
          </TabPanel>

          {/* Fraud Alerts Tab */}
          <TabPanel value={tabValue} index={2}>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Severity</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Created</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {fraudFlags.map((flag) => (
                    <TableRow key={flag.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2">{flag.username}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {flag.email}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>{flag.flag_type}</TableCell>
                      <TableCell>
                        <Chip
                          label={flag.severity}
                          size="small"
                          color={
                            flag.severity === 'critical' ? 'error' :
                            flag.severity === 'high' ? 'warning' :
                            'default'
                          }
                        />
                      </TableCell>
                      <TableCell>{flag.description}</TableCell>
                      <TableCell>{formatDate(flag.created_at)}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => {
                            // Handle resolve
                          }}
                        >
                          Resolve
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {fraudFlags.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="text.secondary">No unresolved fraud alerts</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        </Paper>
      </Container>

      {/* Payout Dialog */}
      <Dialog
        open={payoutDialog.open}
        onClose={() => setPayoutDialog({ open: false, payout: null, action: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {payoutDialog.action === 'approve' ? 'Approve Payout' : 'Reject Payout'}
        </DialogTitle>
        <DialogContent>
          {payoutDialog.payout && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                <strong>User:</strong> {payoutDialog.payout.username}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Amount:</strong> {formatCurrency(payoutDialog.payout.amount)}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Method:</strong> {payoutDialog.payout.payout_method}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Address:</strong> {payoutDialog.payout.payout_address}
              </Typography>
            </Box>
          )}
          
          {payoutDialog.action === 'approve' ? (
            <>
              <TextField
                fullWidth
                label="Transaction ID"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Admin Notes"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                multiline
                rows={2}
              />
            </>
          ) : (
            <TextField
              fullWidth
              label="Rejection Reason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              required
              multiline
              rows={3}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayoutDialog({ open: false, payout: null, action: '' })}>
            Cancel
          </Button>
          {payoutDialog.action === 'approve' ? (
            <Button variant="contained" color="success" onClick={handleApprovePayout}>
              Approve
            </Button>
          ) : (
            <Button
              variant="contained"
              color="error"
              onClick={handleRejectPayout}
              disabled={!rejectionReason}
            >
              Reject
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
