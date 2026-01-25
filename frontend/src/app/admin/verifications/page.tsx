'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Tooltip,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Check,
  X,
  Search,
  RefreshCcw,
  DollarSign,
  Users,
  Clock,
  Eye,
  FileText,
  Package,
  Bot,
  Signal,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';

// Twitter-style verified badge SVG
const VerifiedBadgeSVG = ({ size = 20, color = '#1D9BF0' }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 22 22" fill="none">
    <path 
      d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" 
      fill={color}
    />
  </svg>
);

interface VerificationRequest {
  id: number;
  user_id: number;
  email: string;
  name: string;
  payment_method: string;
  payment_proof?: string;
  created_at: string;
  status: 'pending' | 'approved' | 'rejected';
  wallet_balance: number;
  products_count: number;
  bots_count: number;
  signals_count: number;
  total_sales: number;
  rejection_reason?: string;
}

interface Stats {
  total_pending: number;
  approved_today: number;
  rejected_today: number;
  total_verified_sellers: number;
  total_revenue: number;
}

export default function AdminVerificationsPage() {
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [search, setSearch] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchVerifications();
    fetchStats();
  }, [tabValue]);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Use the correct marketplace admin endpoint
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/admin/pending-verifications`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        const data = await res.json();
        // Filter based on tab
        const allRequests = data.pendingVerifications || [];
        if (tabValue === 0) {
          setRequests(allRequests.map((r: any) => ({ ...r, status: 'pending' })));
        } else {
          setRequests([]);
        }
      }
    } catch (error) {
      console.error('Error fetching verifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/admin/pending-verifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats({
          total_pending: data.pendingVerifications?.length || 0,
          approved_today: 0,
          rejected_today: 0,
          total_verified_sellers: 0,
          total_revenue: (data.pendingVerifications?.length || 0) * 50,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleApprove = async (id: number) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/admin/approve-verification/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Seller verification approved successfully!' });
        fetchVerifications();
        fetchStats();
        setDetailsOpen(false);
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to approve verification' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error approving verification' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/marketplace/admin/reject-verification/${selectedRequest.id}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ reason: rejectionReason }),
        }
      );
      if (res.ok) {
        setMessage({ type: 'success', text: 'Verification request rejected' });
        fetchVerifications();
        fetchStats();
        setRejectDialogOpen(false);
        setDetailsOpen(false);
        setRejectionReason('');
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Failed to reject verification' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error rejecting verification' });
    } finally {
      setActionLoading(false);
    }
  };

  const filteredRequests = requests.filter(
    (req) =>
      req.name?.toLowerCase().includes(search.toLowerCase()) ||
      req.email?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <VerifiedBadgeSVG size={32} />
              <Typography variant="h4" sx={{ color: 'white', fontWeight: 800 }}>
                Seller Verifications
              </Typography>
            </Stack>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', mt: 0.5 }}>
              Manage seller verification requests ($50 each)
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<RefreshCcw size={18} />}
            onClick={() => {
              fetchVerifications();
              fetchStats();
            }}
            sx={{
              borderColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              '&:hover': { borderColor: 'rgba(255,255,255,0.5)', bgcolor: 'rgba(255,255,255,0.05)' },
            }}
          >
            Refresh
          </Button>
        </Stack>

        {/* Message */}
        {message && (
          <Alert
            severity={message.type}
            onClose={() => setMessage(null)}
            sx={{ mb: 3 }}
          >
            {message.text}
          </Alert>
        )}

        {/* Stats Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card
              sx={{
                bgcolor: 'rgba(29, 155, 240, 0.1)',
                border: '1px solid rgba(29, 155, 240, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(29, 155, 240, 0.2)',
                },
              }}
            >
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: 'rgba(29, 155, 240, 0.2)',
                      borderRadius: 2,
                    }}
                  >
                    <Clock size={24} color="#1D9BF0" />
                  </Box>
                  <Box>
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
                      Pending
                    </Typography>
                    <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.5rem' }}>
                      {stats?.total_pending || 0}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card
              sx={{
                bgcolor: 'rgba(34, 197, 94, 0.1)',
                border: '1px solid rgba(34, 197, 94, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(34, 197, 94, 0.2)',
                },
              }}
            >
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: 'rgba(34, 197, 94, 0.2)',
                      borderRadius: 2,
                    }}
                  >
                    <Check size={24} color="#22C55E" />
                  </Box>
                  <Box>
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
                      Approved Today
                    </Typography>
                    <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.5rem' }}>
                      {stats?.approved_today || 0}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card
              sx={{
                bgcolor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(239, 68, 68, 0.2)',
                },
              }}
            >
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: 'rgba(239, 68, 68, 0.2)',
                      borderRadius: 2,
                    }}
                  >
                    <X size={24} color="#EF4444" />
                  </Box>
                  <Box>
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
                      Rejected Today
                    </Typography>
                    <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.5rem' }}>
                      {stats?.rejected_today || 0}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card
              sx={{
                bgcolor: 'rgba(139, 92, 246, 0.1)',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(139, 92, 246, 0.2)',
                },
              }}
            >
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: 'rgba(139, 92, 246, 0.2)',
                      borderRadius: 2,
                    }}
                  >
                    <Users size={24} color="#8B5CF6" />
                  </Box>
                  <Box>
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
                      Verified Sellers
                    </Typography>
                    <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.5rem' }}>
                      {stats?.total_verified_sellers || 0}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card
              sx={{
                bgcolor: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 30px rgba(245, 158, 11, 0.2)',
                },
              }}
            >
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: 'rgba(245, 158, 11, 0.2)',
                      borderRadius: 2,
                    }}
                  >
                    <DollarSign size={24} color="#F59E0B" />
                  </Box>
                  <Box>
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
                      Total Revenue
                    </Typography>
                    <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.5rem' }}>
                      ${stats?.total_revenue?.toLocaleString() || '0'}
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs and Search */}
        <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'rgba(255,255,255,0.1)', px: 2 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Tabs
                value={tabValue}
                onChange={(_, v) => setTabValue(v)}
                sx={{
                  '& .MuiTab-root': { color: 'rgba(255,255,255,0.5)', fontWeight: 600 },
                  '& .Mui-selected': { color: '#1D9BF0' },
                  '& .MuiTabs-indicator': { bgcolor: '#1D9BF0' },
                }}
              >
                <Tab label={`Pending (${stats?.total_pending || 0})`} />
                <Tab label="Approved" />
                <Tab label="Rejected" />
              </Tabs>
              <TextField
                size="small"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                InputProps={{
                  startAdornment: <Search size={18} color="rgba(255,255,255,0.5)" />,
                  sx: { color: 'white', '& input': { pl: 1 } },
                }}
                sx={{
                  width: 300,
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255,255,255,0.05)',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                    '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                    '&.Mui-focused fieldset': { borderColor: '#1D9BF0' },
                  },
                }}
              />
            </Stack>
          </Box>

          <CardContent>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress sx={{ color: '#1D9BF0' }} />
              </Box>
            ) : filteredRequests.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <VerifiedBadgeSVG size={48} color="rgba(255,255,255,0.2)" />
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', mt: 2 }}>
                  No verification requests found
                </Typography>
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ bgcolor: 'transparent' }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>Seller</TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>Listings</TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>Total Sales</TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>Payment</TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>Requested</TableCell>
                      <TableCell sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 700 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow
                        key={request.id}
                        sx={{
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' },
                          transition: 'background-color 0.2s',
                        }}
                      >
                        <TableCell>
                          <Stack direction="row" spacing={2} alignItems="center">
                            <Avatar sx={{ bgcolor: '#1D9BF0' }}>
                              {request.name?.charAt(0) || 'U'}
                            </Avatar>
                            <Box>
                              <Typography sx={{ color: 'white', fontWeight: 600 }}>
                                {request.name}
                              </Typography>
                              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
                                {request.email}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="Products">
                              <Chip
                                icon={<Package size={12} />}
                                label={request.products_count || 0}
                                size="small"
                                sx={{ bgcolor: 'rgba(34, 197, 94, 0.2)', color: '#22C55E' }}
                              />
                            </Tooltip>
                            <Tooltip title="Bots">
                              <Chip
                                icon={<Bot size={12} />}
                                label={request.bots_count || 0}
                                size="small"
                                sx={{ bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6' }}
                              />
                            </Tooltip>
                            <Tooltip title="Signals">
                              <Chip
                                icon={<Signal size={12} />}
                                label={request.signals_count || 0}
                                size="small"
                                sx={{ bgcolor: 'rgba(139, 92, 246, 0.2)', color: '#8B5CF6' }}
                              />
                            </Tooltip>
                          </Stack>
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ color: '#22C55E', fontWeight: 700 }}>
                            ${request.total_sales?.toLocaleString() || '0'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={request.payment_method || 'Stripe'}
                            size="small"
                            sx={{ bgcolor: 'rgba(255,255,255,0.1)', color: 'white' }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
                            {formatDate(request.created_at)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Stack direction="row" spacing={1}>
                            <Tooltip title="View Details">
                              <IconButton
                                size="small"
                                onClick={() => {
                                  setSelectedRequest(request);
                                  setDetailsOpen(true);
                                }}
                                sx={{
                                  color: 'rgba(255,255,255,0.6)',
                                  '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                                }}
                              >
                                <Eye size={18} />
                              </IconButton>
                            </Tooltip>
                            {tabValue === 0 && (
                              <>
                                <Tooltip title="Approve">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleApprove(request.id)}
                                    sx={{
                                      color: '#22C55E',
                                      '&:hover': { bgcolor: 'rgba(34, 197, 94, 0.2)' },
                                    }}
                                  >
                                    <Check size={18} />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Reject">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setSelectedRequest(request);
                                      setRejectDialogOpen(true);
                                    }}
                                    sx={{
                                      color: '#EF4444',
                                      '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.2)' },
                                    }}
                                  >
                                    <X size={18} />
                                  </IconButton>
                                </Tooltip>
                              </>
                            )}
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>

        {/* Details Dialog */}
        <Dialog
          open={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: '#0a0f1a',
              border: '1px solid rgba(255,255,255,0.1)',
            },
          }}
        >
          <DialogTitle sx={{ color: 'white', fontWeight: 800 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <VerifiedBadgeSVG size={28} />
              <span>Verification Request Details</span>
            </Stack>
          </DialogTitle>
          <DialogContent>
            {selectedRequest && (
              <Box>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <CardContent>
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', mb: 1 }}>
                          Seller Information
                        </Typography>
                        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                          <Avatar sx={{ bgcolor: '#1D9BF0', width: 56, height: 56 }}>
                            {selectedRequest.name?.charAt(0) || 'U'}
                          </Avatar>
                          <Box>
                            <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1.25rem' }}>
                              {selectedRequest.name}
                            </Typography>
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
                              {selectedRequest.email}
                            </Typography>
                          </Box>
                        </Stack>
                        <Stack spacing={1}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>Wallet Balance</Typography>
                            <Typography sx={{ color: '#22C55E', fontWeight: 600 }}>
                              ${selectedRequest.wallet_balance?.toFixed(2) || '0.00'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>Total Sales</Typography>
                            <Typography sx={{ color: 'white', fontWeight: 600 }}>
                              ${selectedRequest.total_sales?.toLocaleString() || '0'}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Card sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <CardContent>
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', mb: 2 }}>
                          Listings
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={4}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Package size={24} color="#22C55E" />
                              <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.5rem' }}>
                                {selectedRequest.products_count || 0}
                              </Typography>
                              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                                Products
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={4}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Bot size={24} color="#3B82F6" />
                              <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.5rem' }}>
                                {selectedRequest.bots_count || 0}
                              </Typography>
                              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                                Bots
                              </Typography>
                            </Box>
                          </Grid>
                          <Grid item xs={4}>
                            <Box sx={{ textAlign: 'center' }}>
                              <Signal size={24} color="#8B5CF6" />
                              <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.5rem' }}>
                                {selectedRequest.signals_count || 0}
                              </Typography>
                              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                                Signals
                              </Typography>
                            </Box>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </Card>
                  </Grid>
                  <Grid item xs={12}>
                    <Card sx={{ bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <CardContent>
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem', mb: 2 }}>
                          Payment Details
                        </Typography>
                        <Stack direction="row" spacing={3}>
                          <Box>
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>Method</Typography>
                            <Typography sx={{ color: 'white', fontWeight: 600 }}>
                              {selectedRequest.payment_method || 'Stripe'}
                            </Typography>
                          </Box>
                          <Box>
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>Amount</Typography>
                            <Typography sx={{ color: '#22C55E', fontWeight: 700 }}>$50.00</Typography>
                          </Box>
                          <Box>
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>Request Date</Typography>
                            <Typography sx={{ color: 'white', fontWeight: 600 }}>
                              {formatDate(selectedRequest.created_at)}
                            </Typography>
                          </Box>
                        </Stack>
                        {selectedRequest.payment_proof && (
                          <Box sx={{ mt: 2 }}>
                            <Typography sx={{ color: 'rgba(255,255,255,0.5)', mb: 1 }}>
                              Payment Proof
                            </Typography>
                            <Button
                              variant="outlined"
                              startIcon={<ExternalLink size={16} />}
                              href={selectedRequest.payment_proof}
                              target="_blank"
                              sx={{
                                borderColor: 'rgba(255,255,255,0.2)',
                                color: 'white',
                              }}
                            >
                              View Proof
                            </Button>
                          </Box>
                        )}
                        {selectedRequest.rejection_reason && (
                          <Box sx={{ mt: 2 }}>
                            <Alert severity="error" icon={<AlertTriangle size={18} />}>
                              <Typography sx={{ fontWeight: 600 }}>Rejection Reason</Typography>
                              <Typography>{selectedRequest.rejection_reason}</Typography>
                            </Alert>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setDetailsOpen(false)} sx={{ color: 'rgba(255,255,255,0.6)' }}>
              Close
            </Button>
            {selectedRequest?.status === 'pending' && (
              <>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => setRejectDialogOpen(true)}
                  disabled={actionLoading}
                >
                  Reject
                </Button>
                <Button
                  variant="contained"
                  onClick={() => handleApprove(selectedRequest.id)}
                  disabled={actionLoading}
                  sx={{ bgcolor: '#1D9BF0', '&:hover': { bgcolor: '#1A8CD8' } }}
                >
                  {actionLoading ? <CircularProgress size={20} /> : 'Approve Verification'}
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>

        {/* Reject Dialog */}
        <Dialog
          open={rejectDialogOpen}
          onClose={() => setRejectDialogOpen(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: '#0a0f1a',
              border: '1px solid rgba(255,255,255,0.1)',
            },
          }}
        >
          <DialogTitle sx={{ color: 'white', fontWeight: 800 }}>Reject Verification</DialogTitle>
          <DialogContent>
            <Typography sx={{ color: 'rgba(255,255,255,0.6)', mb: 2 }}>
              Please provide a reason for rejecting this verification request. This will be shared with the
              seller.
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: 'white',
                  bgcolor: 'rgba(255,255,255,0.05)',
                  '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                  '&:hover fieldset': { borderColor: 'rgba(255,255,255,0.2)' },
                  '&.Mui-focused fieldset': { borderColor: '#EF4444' },
                },
              }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setRejectDialogOpen(false)} sx={{ color: 'rgba(255,255,255,0.6)' }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={handleReject}
              disabled={!rejectionReason || actionLoading}
            >
              {actionLoading ? <CircularProgress size={20} /> : 'Reject Request'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
}
