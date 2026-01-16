'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Paper,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  IconButton,
  AppBar,
  Toolbar,
  Avatar,
  Tooltip,
} from '@mui/material';
import {
  Users,
  FileCheck,
  LogOut,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Shield,
  Mail,
} from 'lucide-react';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);
  const [users, setUsers] = useState<any[]>([]);
  const [paymentProofs, setPaymentProofs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProof, setSelectedProof] = useState<any>(null);
  const [reviewDialog, setReviewDialog] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [rejectDialog, setRejectDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    // Check if admin is logged in
    const token = localStorage.getItem('adminToken');
    if (!token) {
      router.push('/admin/login');
      return;
    }

    fetchData();
  }, []);

  const fetchData = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setLoading(true);
    try {
      const [usersRes, proofsRes] = await Promise.all([
        fetch('/api/admin/users', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('/api/admin/payment-proofs', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }

      if (proofsRes.ok) {
        const proofsData = await proofsRes.json();
        setPaymentProofs(proofsData.paymentProofs || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleActivateUser = async (userId: number, activate: boolean) => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    // If rejecting, show rejection dialog
    if (!activate) {
      const user = users.find(u => u.id === userId);
      setSelectedUser(user);
      setRejectDialog(true);
      return;
    }

    try {
      const response = await fetch('/api/admin/users/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, activate }),
      });

      if (response.ok) {
        fetchData();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRejectUser = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token || !selectedUser) return;

    try {
      const response = await fetch('/api/admin/users/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: selectedUser.id,
          activate: false,
          rejectionReason,
        }),
      });

      if (response.ok) {
        setRejectDialog(false);
        setSelectedUser(null);
        setRejectionReason('');
        fetchData();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleReviewPayment = async (status: 'approved' | 'rejected') => {
    const token = localStorage.getItem('adminToken');
    if (!token || !selectedProof) return;

    try {
      const response = await fetch('/api/admin/payment-proofs/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          proofId: selectedProof.id,
          status,
          notes: reviewNotes,
        }),
      });

      if (response.ok) {
        setReviewDialog(false);
        setSelectedProof(null);
        setReviewNotes('');
        fetchData();
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
      case 'active':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
      case 'submitted':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static">
        <Toolbar>
          <Shield size={32} style={{ marginRight: 16 }} />
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            AlgoEdge Admin Panel
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

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <Paper sx={{ width: '100%' }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab
              icon={<Users size={20} />}
              label="Users Management"
              iconPosition="start"
            />
            <Tab
              icon={<FileCheck size={20} />}
              label="Payment Proofs"
              iconPosition="start"
            />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Typography variant="h6" gutterBottom>
              User Management
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Full Name</TableCell>
                    <TableCell>Method</TableCell>
                    <TableCell>Verified</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Payment</TableCell>
                    <TableCell>Joined</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {user.profilePicture ? (
                            <Avatar 
                              src={user.profilePicture} 
                              alt={user.username}
                              sx={{ width: 32, height: 32 }}
                            />
                          ) : (
                            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                              {user.username?.charAt(0)?.toUpperCase()}
                            </Avatar>
                          )}
                          {user.username}
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.fullName || '-'}</TableCell>
                      <TableCell>
                        <Tooltip title={user.googleId ? 'Registered with Google' : 'Registered with Email'}>
                          <Chip
                            icon={user.googleId ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                              </svg>
                            ) : <Mail size={14} />}
                            label={user.googleId ? 'Google' : 'Email'}
                            size="small"
                            variant="outlined"
                            color={user.googleId ? 'info' : 'default'}
                          />
                        </Tooltip>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.isVerified ? 'Verified' : 'Unverified'}
                          color={user.isVerified ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.isActivated ? 'Active' : user.approvalStatus || 'Inactive'}
                          color={user.isActivated ? 'success' : getStatusColor(user.approvalStatus || 'pending')}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.paymentStatus}
                          color={getStatusColor(user.paymentStatus)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          {/* Show Approve button if payment is pending or user is not activated */}
                          {(user.paymentStatus === 'pending' || !user.isActivated) && user.approvalStatus !== 'rejected' && (
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<CheckCircle size={16} />}
                              onClick={() => handleActivateUser(user.id, true)}
                            >
                              Approve
                            </Button>
                          )}
                          {/* Show Reject button if not already rejected */}
                          {user.approvalStatus !== 'rejected' && user.paymentStatus !== 'approved' && (
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              startIcon={<XCircle size={16} />}
                              onClick={() => handleActivateUser(user.id, false)}
                            >
                              Reject
                            </Button>
                          )}
                          {/* Show rejected status */}
                          {user.approvalStatus === 'rejected' && (
                            <Chip label="Rejected" color="error" size="small" />
                          )}
                          {/* Show approved status when fully approved */}
                          {user.paymentStatus === 'approved' && user.isActivated && user.approvalStatus !== 'rejected' && (
                            <Chip label="Approved" color="success" size="small" />
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>
              Payment Proof Review
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paymentProofs.map((proof) => (
                    <TableRow key={proof.id}>
                      <TableCell>{proof.user.username}</TableCell>
                      <TableCell>{proof.user.email}</TableCell>
                      <TableCell>
                        {proof.amount ? `$${proof.amount}` : '-'}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={proof.status}
                          color={getStatusColor(proof.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(proof.submittedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Eye size={16} />}
                          onClick={() => {
                            setSelectedProof(proof);
                            setReviewDialog(true);
                          }}
                        >
                          Review
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>
        </Paper>
      </Container>

      <Dialog open={reviewDialog} onClose={() => setReviewDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Review Payment Proof</DialogTitle>
        <DialogContent>
          {selectedProof && (
            <Box>
              <Typography variant="body2" gutterBottom>
                <strong>User:</strong> {selectedProof.user.email}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Amount:</strong> {selectedProof.amount ? `$${selectedProof.amount}` : 'Not specified'}
              </Typography>
              <Box sx={{ my: 2 }}>
                <Typography variant="body2" gutterBottom>
                  <strong>Proof:</strong>
                </Typography>
                <img
                  src={selectedProof.proofUrl}
                  alt="Payment Proof"
                  style={{ width: '100%', maxHeight: 400, objectFit: 'contain' }}
                />
              </Box>
              <TextField
                fullWidth
                label="Review Notes (Optional)"
                multiline
                rows={3}
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                margin="normal"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReviewDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<XCircle size={16} />}
            onClick={() => handleReviewPayment('rejected')}
          >
            Reject
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<CheckCircle size={16} />}
            onClick={() => handleReviewPayment('approved')}
          >
            Approve
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={rejectDialog} onClose={() => setRejectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject User Account</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box>
              <Typography variant="body2" gutterBottom>
                Are you sure you want to reject this user&apos;s account?
              </Typography>
              <Typography variant="body2" gutterBottom sx={{ mt: 2 }}>
                <strong>User:</strong> {selectedUser.email}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Name:</strong> {selectedUser.fullName || '-'}
              </Typography>
              <TextField
                fullWidth
                label="Rejection Reason (Optional)"
                multiline
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                margin="normal"
                helperText="This message will be shown to the user when they try to login"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setRejectDialog(false);
            setSelectedUser(null);
            setRejectionReason('');
          }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            startIcon={<XCircle size={16} />}
            onClick={handleRejectUser}
          >
            Reject User
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
