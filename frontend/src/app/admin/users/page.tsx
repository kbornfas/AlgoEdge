'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Stack,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Avatar,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Skeleton,
  Tooltip,
  InputAdornment,
  Menu,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Pagination,
  Badge,
  Checkbox,
} from '@mui/material';
import {
  Search,
  Users,
  UserCheck,
  UserX,
  Shield,
  Mail,
  MoreVertical,
  Filter,
  Download,
  RefreshCcw,
  Eye,
  Ban,
  Trash2,
  Edit,
  Crown,
  CreditCard,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Star,
  Store,
} from 'lucide-react';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import AdminBulkActions from '@/components/AdminBulkActions';

interface User {
  id: number;
  email: string;
  username?: string;
  full_name?: string;
  is_admin: boolean;
  is_verified: boolean;
  is_seller?: boolean;
  seller_featured?: boolean;
  has_blue_badge?: boolean;
  verification_pending: boolean;
  is_blocked: boolean;
  subscription_status?: string;
  subscription_plan?: string;
  subscription_expires_at?: string;
  created_at: string;
  last_login?: string;
  profile_image?: string;
}

export default function AdminUsersPage() {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [subscriptionFilter, setSubscriptionFilter] = useState('all');
  const [verifiedFilter, setVerifiedFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(15);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<'block' | 'verify' | 'admin' | 'delete' | 'feature' | 'seller'>('block');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<number[]>([]);

  const stats = {
    total: users.length,
    active: users.filter(u => !u.is_blocked).length,
    blocked: users.filter(u => u.is_blocked).length,
    verified: users.filter(u => u.has_blue_badge).length,
    admins: users.filter(u => u.is_admin).length,
    sellers: users.filter(u => u.is_seller).length,
    subscribers: users.filter(u => u.subscription_status === 'active').length,
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, statusFilter, subscriptionFilter, verifiedFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setAlert({ type: 'error', message: 'Failed to fetch users' });
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        u =>
          u.email?.toLowerCase().includes(query) ||
          u.username?.toLowerCase().includes(query) ||
          u.full_name?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') filtered = filtered.filter(u => !u.is_blocked);
      if (statusFilter === 'blocked') filtered = filtered.filter(u => u.is_blocked);
      if (statusFilter === 'admin') filtered = filtered.filter(u => u.is_admin);
      if (statusFilter === 'seller') filtered = filtered.filter(u => u.is_seller);
    }

    // Subscription filter
    if (subscriptionFilter !== 'all') {
      if (subscriptionFilter === 'active') filtered = filtered.filter(u => u.subscription_status === 'active');
      if (subscriptionFilter === 'expired') filtered = filtered.filter(u => u.subscription_status === 'expired');
      if (subscriptionFilter === 'none') filtered = filtered.filter(u => !u.subscription_status || u.subscription_status === 'none');
    }

    // Verified filter (Blue Badge)
    if (verifiedFilter !== 'all') {
      if (verifiedFilter === 'verified') filtered = filtered.filter(u => u.has_blue_badge);
      if (verifiedFilter === 'pending') filtered = filtered.filter(u => u.verification_pending);
      if (verifiedFilter === 'unverified') filtered = filtered.filter(u => !u.has_blue_badge && !u.verification_pending);
    }

    setFilteredUsers(filtered);
    setPage(1);
  };

  const handleAction = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    
    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      let endpoint = '';
      let method = 'POST';
      let body: any = {};

      switch (actionType) {
        case 'block':
          endpoint = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/users/${selectedUser.id}/block`;
          method = 'PATCH';
          body = { block: !selectedUser.is_blocked };
          break;
        case 'verify':
          endpoint = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/users/${selectedUser.id}/badge`;
          method = 'PATCH';
          body = { has_blue_badge: !selectedUser.has_blue_badge };
          break;
        case 'seller':
          endpoint = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/users/${selectedUser.id}/seller`;
          method = 'PATCH';
          body = { is_seller: !selectedUser.is_seller };
          break;
        case 'admin':
          endpoint = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/users/${selectedUser.id}/admin`;
          method = 'PATCH';
          body = { is_admin: !selectedUser.is_admin };
          break;
        case 'feature':
          endpoint = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/users/${selectedUser.id}/feature`;
          method = 'PATCH';
          body = { featured: !selectedUser.seller_featured };
          break;
        case 'delete':
          endpoint = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/users/${selectedUser.id}`;
          method = 'DELETE';
          break;
      }

      const res = await fetch(endpoint, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: method !== 'DELETE' ? JSON.stringify(body) : undefined,
      });

      if (res.ok) {
        setAlert({ 
          type: 'success', 
          message: `User ${actionType === 'block' ? (selectedUser.is_blocked ? 'unblocked' : 'blocked') : 
                          actionType === 'verify' ? (selectedUser.has_blue_badge ? 'blue badge removed' : 'granted blue badge') : 
                          actionType === 'seller' ? (selectedUser.is_seller ? 'seller status revoked' : 'approved as seller') :
                          actionType === 'admin' ? (selectedUser.is_admin ? 'removed from admin' : 'made admin') : 
                          actionType === 'feature' ? (selectedUser.seller_featured ? 'removed from featured' : 'added to featured sellers') :
                          'deleted'} successfully` 
        });
        fetchUsers();
      } else {
        const data = await res.json();
        setAlert({ type: 'error', message: data.error || 'Action failed' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Network error' });
    } finally {
      setActionLoading(false);
      setActionDialogOpen(false);
      setSelectedUser(null);
    }
  };

  const openActionDialog = (user: User, action: 'block' | 'verify' | 'admin' | 'delete' | 'feature' | 'seller') => {
    setSelectedUser(user);
    setActionType(action);
    setActionDialogOpen(true);
    setAnchorEl(null);
  };

  const paginatedUsers = filteredUsers.slice((page - 1) * rowsPerPage, page * rowsPerPage);
  const totalPages = Math.ceil(filteredUsers.length / rowsPerPage);

  const StatCard = ({ icon, label, value, color, bgColor }: any) => (
    <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 2 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={2}>
          <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
          </Box>
          <Box>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', fontWeight: 600 }}>{label}</Typography>
            <Typography sx={{ color: 'white', fontSize: '1.25rem', fontWeight: 800 }}>{value}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      {/* Header */}
      <Box sx={{ mb: 4, pl: { xs: 6, md: 0 } }}>
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 800, mb: 0.5 }}>
          User Management
        </Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.5)' }}>
          Manage all platform users, permissions, and verifications
        </Typography>
      </Box>

      {alert && (
        <Alert severity={alert.type} sx={{ mb: 3 }} onClose={() => setAlert(null)}>
          {alert.message}
        </Alert>
      )}

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={6} sm={4} md>
          <StatCard icon={<Users size={20} color="#3B82F6" />} label="Total" value={stats.total} bgColor="rgba(59, 130, 246, 0.15)" />
        </Grid>
        <Grid item xs={6} sm={4} md>
          <StatCard icon={<UserCheck size={20} color="#22C55E" />} label="Active" value={stats.active} bgColor="rgba(34, 197, 94, 0.15)" />
        </Grid>
        <Grid item xs={6} sm={4} md>
          <StatCard icon={<Ban size={20} color="#EF4444" />} label="Blocked" value={stats.blocked} bgColor="rgba(239, 68, 68, 0.15)" />
        </Grid>
        <Grid item xs={6} sm={4} md>
          <StatCard icon={
            <svg width="20" height="20" viewBox="0 0 22 22" fill="none">
              <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="#1D9BF0"/>
            </svg>
          } label="Blue Badge" value={stats.verified} bgColor="rgba(29, 155, 240, 0.15)" />
        </Grid>
        <Grid item xs={6} sm={4} md>
          <StatCard icon={<Store size={20} color="#10B981" />} label="Sellers" value={stats.sellers} bgColor="rgba(16, 185, 129, 0.15)" />
        </Grid>
        <Grid item xs={6} sm={4} md>
          <StatCard icon={<Crown size={20} color="#F59E0B" />} label="Admins" value={stats.admins} bgColor="rgba(245, 158, 11, 0.15)" />
        </Grid>
        <Grid item xs={6} sm={4} md>
          <StatCard icon={<CreditCard size={20} color="#8B5CF6" />} label="Subscribers" value={stats.subscribers} bgColor="rgba(139, 92, 246, 0.15)" />
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3, mb: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                placeholder="Search by email, username, or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search size={18} color="rgba(255,255,255,0.5)" />
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    bgcolor: 'rgba(255,255,255,0.03)',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.1)' },
                  },
                }}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: 'rgba(255,255,255,0.5)' }}>Status</InputLabel>
                <Select
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value)}
                  sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' } }}
                >
                  <MenuItem value="all">All Status</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="blocked">Blocked</MenuItem>
                  <MenuItem value="admin">Admins</MenuItem>
                  <MenuItem value="seller">Sellers</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: 'rgba(255,255,255,0.5)' }}>Subscription</InputLabel>
                <Select
                  value={subscriptionFilter}
                  label="Subscription"
                  onChange={(e) => setSubscriptionFilter(e.target.value)}
                  sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' } }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="expired">Expired</MenuItem>
                  <MenuItem value="none">None</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel sx={{ color: 'rgba(255,255,255,0.5)' }}>Verified</InputLabel>
                <Select
                  value={verifiedFilter}
                  label="Verified"
                  onChange={(e) => setVerifiedFilter(e.target.value)}
                  sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.1)' } }}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="verified">Verified</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="unverified">Unverified</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      <AdminBulkActions
        selectedUsers={selectedUserIds}
        onActionComplete={fetchUsers}
        onClearSelection={() => setSelectedUserIds([])}
      />

      {/* Users Table */}
      <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox" sx={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <Checkbox
                    indeterminate={selectedUserIds.length > 0 && selectedUserIds.length < paginatedUsers.length}
                    checked={paginatedUsers.length > 0 && selectedUserIds.length === paginatedUsers.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUserIds(paginatedUsers.map(u => u.id));
                      } else {
                        setSelectedUserIds([]);
                      }
                    }}
                    sx={{ color: 'rgba(255,255,255,0.5)', '&.Mui-checked': { color: '#8B5CF6' } }}
                  />
                </TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.06)' }}>User</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.06)' }}>Status</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.06)' }}>Subscription</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.06)' }}>Joined</TableCell>
                <TableCell sx={{ color: 'rgba(255,255,255,0.7)', borderColor: 'rgba(255,255,255,0.06)' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                Array.from({ length: 10 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} sx={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      <Skeleton variant="rectangular" height={50} sx={{ borderRadius: 1, bgcolor: 'rgba(255,255,255,0.05)' }} />
                    </TableCell>
                  </TableRow>
                ))
              ) : paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ borderColor: 'rgba(255,255,255,0.06)', py: 8 }}>
                    <Typography sx={{ color: 'rgba(255,255,255,0.4)' }}>No users found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user) => (
                  <TableRow 
                    key={user.id} 
                    sx={{ 
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' },
                      bgcolor: selectedUserIds.includes(user.id) ? 'rgba(139, 92, 246, 0.1)' : 'transparent',
                    }}
                  >
                    <TableCell padding="checkbox" sx={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      <Checkbox
                        checked={selectedUserIds.includes(user.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUserIds([...selectedUserIds, user.id]);
                          } else {
                            setSelectedUserIds(selectedUserIds.filter(id => id !== user.id));
                          }
                        }}
                        sx={{ color: 'rgba(255,255,255,0.5)', '&.Mui-checked': { color: '#8B5CF6' } }}
                      />
                    </TableCell>
                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Avatar sx={{ width: 40, height: 40, bgcolor: user.is_admin ? '#F59E0B' : '#3B82F6' }}>
                          {(user.full_name || user.username || user.email)?.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '0.9rem' }}>
                              {user.full_name || user.username || 'No name'}
                            </Typography>
                            {user.is_verified && <VerifiedBadge size={14} />}
                            {user.is_admin && (
                              <Chip label="Admin" size="small" sx={{ ml: 0.5, height: 20, bgcolor: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B', fontSize: '0.65rem' }} />
                            )}
                          </Box>
                          <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                            {user.email}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                        {user.is_blocked ? (
                          <Chip label="Blocked" size="small" sx={{ bgcolor: 'rgba(239, 68, 68, 0.2)', color: '#EF4444' }} />
                        ) : (
                          <Chip label="Active" size="small" sx={{ bgcolor: 'rgba(34, 197, 94, 0.2)', color: '#22C55E' }} />
                        )}
                        {user.is_seller && (
                          <Chip label="Seller" size="small" sx={{ bgcolor: 'rgba(139, 92, 246, 0.2)', color: '#8B5CF6' }} />
                        )}
                        {user.has_blue_badge && (
                          <Chip 
                            icon={<VerifiedBadge size={12} />}
                            label="Verified" 
                            size="small" 
                            sx={{ bgcolor: 'rgba(29, 155, 240, 0.2)', color: '#1D9BF0' }} 
                          />
                        )}
                        {user.verification_pending && (
                          <Chip label="Pending Verify" size="small" sx={{ bgcolor: 'rgba(245, 158, 11, 0.2)', color: '#F59E0B' }} />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      {user.subscription_status === 'active' ? (
                        <Chip
                          label={user.subscription_plan || 'Active'}
                          size="small"
                          sx={{ bgcolor: 'rgba(139, 92, 246, 0.2)', color: '#8B5CF6', textTransform: 'capitalize' }}
                        />
                      ) : (
                        <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>None</Typography>
                      )}
                    </TableCell>
                    <TableCell sx={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>
                        {new Date(user.created_at).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                      <IconButton
                        onClick={(e) => {
                          setSelectedUser(user);
                          setAnchorEl(e.currentTarget);
                        }}
                        sx={{ color: 'rgba(255,255,255,0.5)' }}
                      >
                        <MoreVertical size={18} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, p) => setPage(p)}
              sx={{
                '& .MuiPaginationItem-root': { color: 'rgba(255,255,255,0.6)' },
                '& .Mui-selected': { bgcolor: 'rgba(59, 130, 246, 0.3) !important', color: 'white' },
              }}
            />
          </Box>
        )}
      </Card>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
        PaperProps={{
          sx: { bgcolor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', minWidth: 200 },
        }}
      >
        <MenuItem onClick={() => openActionDialog(selectedUser!, 'block')} sx={{ color: 'white', '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}>
          {selectedUser?.is_blocked ? <UserCheck size={16} style={{ marginRight: 8 }} /> : <Ban size={16} style={{ marginRight: 8 }} />}
          {selectedUser?.is_blocked ? 'Unblock User' : 'Block User'}
        </MenuItem>
        
        {/* Blue Badge (Verification) */}
        <MenuItem onClick={() => openActionDialog(selectedUser!, 'verify')} sx={{ color: '#1D9BF0', '&:hover': { bgcolor: 'rgba(29, 155, 240, 0.1)' } }}>
          <svg width="16" height="16" viewBox="0 0 22 22" fill="none" style={{ marginRight: 8 }}>
            <path d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z" fill="#1D9BF0"/>
          </svg>
          {selectedUser?.has_blue_badge ? 'Remove Blue Badge' : 'Grant Blue Badge'}
        </MenuItem>
        
        {/* Seller Status */}
        <MenuItem onClick={() => openActionDialog(selectedUser!, 'seller')} sx={{ color: '#10B981', '&:hover': { bgcolor: 'rgba(16, 185, 129, 0.1)' } }}>
          <Store size={16} style={{ marginRight: 8 }} />
          {selectedUser?.is_seller ? 'Revoke Seller Status' : 'Approve as Seller'}
        </MenuItem>
        
        <MenuItem onClick={() => openActionDialog(selectedUser!, 'admin')} sx={{ color: '#F59E0B', '&:hover': { bgcolor: 'rgba(245, 158, 11, 0.1)' } }}>
          <Shield size={16} style={{ marginRight: 8 }} />
          {selectedUser?.is_admin ? 'Remove Admin' : 'Make Admin'}
        </MenuItem>
        {selectedUser?.is_seller && (
          <MenuItem onClick={() => openActionDialog(selectedUser!, 'feature')} sx={{ color: '#8B5CF6', '&:hover': { bgcolor: 'rgba(139, 92, 246, 0.1)' } }}>
            <Star size={16} style={{ marginRight: 8 }} />
            {selectedUser?.seller_featured ? 'Remove from Featured' : 'Feature on Landing Page'}
          </MenuItem>
        )}
        <MenuItem onClick={() => openActionDialog(selectedUser!, 'delete')} sx={{ color: '#EF4444', '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' } }}>
          <Trash2 size={16} style={{ marginRight: 8 }} />
          Delete User
        </MenuItem>
      </Menu>

      {/* Action Confirmation Dialog */}
      <Dialog
        open={actionDialogOpen}
        onClose={() => setActionDialogOpen(false)}
        PaperProps={{ sx: { bgcolor: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', minWidth: 400 } }}
      >
        <DialogTitle sx={{ color: 'white' }}>
          {actionType === 'block' ? (selectedUser?.is_blocked ? 'Unblock User' : 'Block User') :
           actionType === 'verify' ? (selectedUser?.has_blue_badge ? 'Remove Blue Badge' : 'Grant Blue Badge') :
           actionType === 'seller' ? (selectedUser?.is_seller ? 'Revoke Seller Status' : 'Approve as Seller') :
           actionType === 'admin' ? (selectedUser?.is_admin ? 'Remove Admin' : 'Make Admin') :
           actionType === 'feature' ? (selectedUser?.seller_featured ? 'Remove from Featured' : 'Feature Seller') :
           'Delete User'}
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
            {actionType === 'block' && (selectedUser?.is_blocked 
              ? `Are you sure you want to unblock ${selectedUser?.email}?`
              : `Are you sure you want to block ${selectedUser?.email}? They won't be able to access the platform.`)}
            {actionType === 'verify' && (selectedUser?.has_blue_badge
              ? `Remove the blue badge from ${selectedUser?.email}?`
              : `Grant a blue verification badge to ${selectedUser?.email}? This indicates they are a verified seller.`)}
            {actionType === 'seller' && (selectedUser?.is_seller
              ? `Revoke seller privileges from ${selectedUser?.email}? They will no longer be able to list products.`
              : `Approve ${selectedUser?.email} as a seller? They will be able to list products and bots on the marketplace.`)}
            {actionType === 'admin' && (selectedUser?.is_admin
              ? `Remove admin privileges from ${selectedUser?.email}?`
              : `Grant admin privileges to ${selectedUser?.email}? They will have full platform access.`)}
            {actionType === 'feature' && (selectedUser?.seller_featured
              ? `Remove ${selectedUser?.email} from featured sellers on the landing page?`
              : `Feature ${selectedUser?.email} as a seller on the landing page? They will appear in the Featured Sellers section.`)}
            {actionType === 'delete' && `Permanently delete ${selectedUser?.email}? This action cannot be undone.`}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setActionDialogOpen(false)} sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Cancel
          </Button>
          <Button
            onClick={handleAction}
            disabled={actionLoading}
            variant="contained"
            color={actionType === 'delete' ? 'error' : actionType === 'block' ? (selectedUser?.is_blocked ? 'success' : 'error') : 'primary'}
          >
            {actionLoading ? 'Processing...' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
