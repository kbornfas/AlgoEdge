'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  CircularProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Pagination,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import {
  History,
  CheckCircle,
  XCircle,
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Clock,
  Shield,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

interface ActivityLog {
  id: number;
  activity_type: string;
  description: string;
  ip_address: string;
  user_agent: string;
  metadata: any;
  created_at: string;
}

export default function LoginHistoryPage() {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('all');
  const limit = 15;

  useEffect(() => {
    fetchHistory();
  }, [page, filter]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const filterParam = filter !== 'all' ? `&type=${filter}` : '';
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/activity?page=${page}&limit=${limit}${filterParam}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        setActivities(data.activities || []);
        setTotalPages(data.pagination?.totalPages || 1);
      }
    } catch (error) {
      console.error('Failed to fetch login history:', error);
    } finally {
      setLoading(false);
    }
  };

  const parseUserAgent = (ua: string) => {
    let deviceType = 'desktop';
    if (/mobile|android|iphone|ipad|ipod/i.test(ua)) {
      deviceType = /ipad|tablet/i.test(ua) ? 'tablet' : 'mobile';
    }
    
    let browser = 'Unknown';
    if (/edg/i.test(ua)) browser = 'Edge';
    else if (/chrome/i.test(ua)) browser = 'Chrome';
    else if (/firefox/i.test(ua)) browser = 'Firefox';
    else if (/safari/i.test(ua)) browser = 'Safari';
    
    let os = 'Unknown';
    if (/windows/i.test(ua)) os = 'Windows';
    else if (/mac os/i.test(ua)) os = 'macOS';
    else if (/linux/i.test(ua)) os = 'Linux';
    else if (/android/i.test(ua)) os = 'Android';
    else if (/ios|iphone|ipad/i.test(ua)) os = 'iOS';
    
    return { deviceType, browser, os };
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile': return <Smartphone size={16} />;
      case 'tablet': return <Tablet size={16} />;
      default: return <Monitor size={16} />;
    }
  };

  const getActivityIcon = (type: string) => {
    if (type === 'login') return <CheckCircle size={16} color="#22C55E" />;
    if (type === 'login_failed') return <XCircle size={16} color="#EF4444" />;
    if (type === 'logout') return <Shield size={16} color="#3B82F6" />;
    if (type === 'password_change') return <Shield size={16} color="#F59E0B" />;
    return <History size={16} color="#8B5CF6" />;
  };

  const getActivityColor = (type: string) => {
    if (type === 'login') return '#22C55E';
    if (type === 'login_failed') return '#EF4444';
    if (type === 'logout') return '#3B82F6';
    if (type === 'password_change') return '#F59E0B';
    return '#8B5CF6';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Check for suspicious activity
  const suspiciousActivities = activities.filter(a => 
    a.activity_type === 'login_failed' || 
    (a.metadata?.suspicious)
  );

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: '#0a0f1a', 
      py: { xs: 2, md: 4 },
      px: { xs: 2, md: 4 },
    }}>
      <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Box sx={{ p: 1.5, bgcolor: 'rgba(139, 92, 246, 0.2)', borderRadius: 2 }}>
            <History size={24} color="#8B5CF6" />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
              Login History
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
              View your recent account activity
            </Typography>
          </Box>
        </Stack>

        {/* Back link */}
        <Button
          component={Link}
          href="/dashboard/settings"
          sx={{ color: 'rgba(255,255,255,0.5)', mb: 3 }}
          startIcon={<span>←</span>}
        >
          Back to Settings
        </Button>

        {/* Suspicious Activity Alert */}
        {suspiciousActivities.length > 0 && (
          <Card sx={{ 
            bgcolor: 'rgba(239, 68, 68, 0.1)', 
            border: '1px solid rgba(239, 68, 68, 0.3)',
            mb: 3,
          }}>
            <CardContent>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <AlertTriangle size={20} color="#EF4444" />
                <Box>
                  <Typography sx={{ color: '#EF4444', fontWeight: 600 }}>
                    {suspiciousActivities.length} Failed Login Attempt{suspiciousActivities.length > 1 ? 's' : ''}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                    If you don't recognize this activity, consider changing your password
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Filter */}
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Recent Activity
          </Typography>
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <Select
              value={filter}
              onChange={(e) => { setFilter(e.target.value); setPage(1); }}
              sx={{ 
                color: 'white', 
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.5)' },
              }}
            >
              <MenuItem value="all">All Activity</MenuItem>
              <MenuItem value="login">Successful Logins</MenuItem>
              <MenuItem value="login_failed">Failed Logins</MenuItem>
              <MenuItem value="password_change">Password Changes</MenuItem>
              <MenuItem value="logout">Logouts</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {/* Activity Table */}
        <Card sx={{ 
          bgcolor: 'rgba(255,255,255,0.02)', 
          border: '1px solid rgba(255,255,255,0.1)',
        }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress sx={{ color: '#8B5CF6' }} />
            </Box>
          ) : activities.length === 0 ? (
            <CardContent>
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <History size={48} color="rgba(255,255,255,0.2)" />
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', mt: 2 }}>
                  No activity found
                </Typography>
              </Box>
            </CardContent>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.1)' }}>Activity</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.1)' }}>Device</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.1)' }}>IP Address</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.5)', borderColor: 'rgba(255,255,255,0.1)' }}>Date & Time</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activities.map((activity) => {
                    const { deviceType, browser, os } = parseUserAgent(activity.user_agent || '');
                    const color = getActivityColor(activity.activity_type);
                    
                    return (
                      <TableRow key={activity.id} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                        <TableCell sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            {getActivityIcon(activity.activity_type)}
                            <Box>
                              <Chip
                                label={activity.activity_type.replace('_', ' ')}
                                size="small"
                                sx={{
                                  bgcolor: `${color}22`,
                                  color: color,
                                  textTransform: 'capitalize',
                                  fontSize: '0.75rem',
                                }}
                              />
                              {activity.description && (
                                <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', mt: 0.5 }}>
                                  {activity.description}
                                </Typography>
                              )}
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Box sx={{ color: 'rgba(255,255,255,0.5)' }}>
                              {getDeviceIcon(deviceType)}
                            </Box>
                            <Box>
                              <Typography sx={{ color: 'white', fontSize: '0.85rem' }}>
                                {browser}
                              </Typography>
                              <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                                {os}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Globe size={14} color="rgba(255,255,255,0.4)" />
                            <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontFamily: 'monospace' }}>
                              {activity.ip_address?.replace('::ffff:', '') || 'Unknown'}
                            </Typography>
                          </Stack>
                        </TableCell>
                        <TableCell sx={{ borderColor: 'rgba(255,255,255,0.1)' }}>
                          <Stack direction="row" spacing={0.5} alignItems="center">
                            <Clock size={14} color="rgba(255,255,255,0.4)" />
                            <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                              {formatDate(activity.created_at)}
                            </Typography>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, p) => setPage(p)}
                sx={{
                  '& .MuiPaginationItem-root': { color: 'rgba(255,255,255,0.7)' },
                  '& .Mui-selected': { bgcolor: 'rgba(139, 92, 246, 0.3) !important' },
                }}
              />
            </Box>
          )}
        </Card>
      </Box>
    </Box>
  );
}
