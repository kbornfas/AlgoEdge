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
  Avatar,
} from '@mui/material';
import {
  LogOut,
  Shield,
  CreditCard,
  UserX,
  UserCheck,
} from 'lucide-react';

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [blockLoading, setBlockLoading] = useState<number | null>(null);

  // Get subscribed users (filter users with active subscription)
  const subscribedUsers = users.filter(
    (u) => u.subscription_status === 'active' || u.subscription_plan
  );

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
      const usersRes = await fetch('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId: number, block: boolean) => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    setBlockLoading(userId);
    try {
      const response = await fetch(`/api/users/admin/${userId}/block`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ block }),
      });

      if (response.ok) {
        fetchData();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to update user status');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBlockLoading(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    router.push('/admin/login');
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

        <Paper sx={{ width: '100%', p: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <CreditCard size={28} color="#10b981" />
            <Box>
              <Typography variant="h5" fontWeight={700}>
                Subscribed Users
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Manage users with active subscriptions • {subscribedUsers.length} total
              </Typography>
            </Box>
          </Box>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Subscription Status</TableCell>
                  <TableCell>Package</TableCell>
                  <TableCell>Expires</TableCell>
                  <TableCell>Account Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="text.secondary" sx={{ py: 4 }}>
                        Loading...
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : subscribedUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography color="text.secondary" sx={{ py: 4 }}>
                        No subscribed users found
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  subscribedUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}>
                            {(user.full_name || user.username)?.charAt(0)?.toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {user.full_name || user.username || '-'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              @{user.username}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip
                          label={user.subscription_status || 'trial'}
                          color={user.subscription_status === 'active' ? 'success' : user.subscription_status === 'expired' ? 'error' : 'warning'}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.subscription_plan || 'None'}
                          variant="outlined"
                          size="small"
                          color={user.subscription_plan === 'quarterly' ? 'secondary' : user.subscription_plan === 'monthly' ? 'primary' : 'default'}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell>
                        {user.subscription_expires_at 
                          ? new Date(user.subscription_expires_at).toLocaleDateString()
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.is_blocked ? 'Blocked' : 'Active'}
                          color={user.is_blocked ? 'error' : 'success'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          variant={user.is_blocked ? 'contained' : 'outlined'}
                          color={user.is_blocked ? 'success' : 'error'}
                          startIcon={user.is_blocked ? <UserCheck size={16} /> : <UserX size={16} />}
                          onClick={() => handleBlockUser(user.id, !user.is_blocked)}
                          disabled={blockLoading === user.id}
                        >
                          {blockLoading === user.id ? 'Loading...' : user.is_blocked ? 'Unblock' : 'Block'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Container>
    </Box>
  );
}
