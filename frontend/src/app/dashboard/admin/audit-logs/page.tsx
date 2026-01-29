'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Pagination,
} from '@mui/material';
import { FileText, User, Calendar, Filter } from 'lucide-react';

interface AuditLog {
  id: number;
  user_id: number;
  username: string;
  email: string;
  action_type: string;
  action_details: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [actionType, setActionType] = useState('');
  const [userId, setUserId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [page, actionType, userId]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((page - 1) * limit).toString(),
      });
      
      if (actionType) params.append('action_type', actionType);
      if (userId) params.append('user_id', userId);

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/audit-logs?${params}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes('login')) return '#3B82F6';
    if (action.includes('register')) return '#22C55E';
    if (action.includes('delete')) return '#EF4444';
    if (action.includes('update')) return '#F59E0B';
    return '#8B5CF6';
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', py: { xs: 2, md: 4 }, px: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Box sx={{ p: 1.5, bgcolor: 'rgba(139, 92, 246, 0.2)', borderRadius: 2 }}>
            <FileText size={24} color="#8B5CF6" />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
              Audit Log Viewer
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
              Monitor all user activities and system events
            </Typography>
          </Box>
        </Stack>

        {/* Filters */}
        <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', mb: 3 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Filter size={18} color="rgba(255,255,255,0.5)" />
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                  Filters:
                </Typography>
              </Box>

              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel sx={{ color: 'rgba(255,255,255,0.5)' }}>Action Type</InputLabel>
                <Select
                  value={actionType}
                  onChange={(e) => {
                    setActionType(e.target.value);
                    setPage(1);
                  }}
                  label="Action Type"
                  sx={{
                    color: 'white',
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                  }}
                >
                  <MenuItem value="">All Actions</MenuItem>
                  <MenuItem value="login">Login</MenuItem>
                  <MenuItem value="register">Register</MenuItem>
                  <MenuItem value="trade_open">Trade Open</MenuItem>
                  <MenuItem value="trade_close">Trade Close</MenuItem>
                  <MenuItem value="profile_update">Profile Update</MenuItem>
                  <MenuItem value="settings_change">Settings Change</MenuItem>
                </Select>
              </FormControl>

              <TextField
                placeholder="User ID"
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value);
                  setPage(1);
                }}
                size="small"
                sx={{
                  minWidth: 150,
                  '& .MuiInputBase-root': { color: 'white' },
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                }}
              />

              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', ml: 'auto' }}>
                {total} total logs
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        {/* Logs List */}
        <Stack spacing={1.5}>
          {logs.map((log) => (
            <Card key={log.id} sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <CardContent sx={{ py: 2 }}>
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <Box
                    sx={{
                      p: 1,
                      bgcolor: `${getActionColor(log.action_type)}20`,
                      borderRadius: 2,
                      mt: 0.5,
                    }}
                  >
                    <FileText size={20} color={getActionColor(log.action_type)} />
                  </Box>

                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Chip
                        label={log.action_type}
                        size="small"
                        sx={{
                          bgcolor: `${getActionColor(log.action_type)}20`,
                          color: getActionColor(log.action_type),
                          fontSize: '0.7rem',
                          fontWeight: 600,
                        }}
                      />
                      <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '0.95rem' }}>
                        {log.username || 'Unknown User'}
                      </Typography>
                      <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                        (ID: {log.user_id})
                      </Typography>
                    </Stack>

                    {log.action_details && (
                      <Typography
                        sx={{
                          color: 'rgba(255,255,255,0.7)',
                          fontSize: '0.85rem',
                          fontFamily: 'monospace',
                          bgcolor: 'rgba(0,0,0,0.3)',
                          p: 1,
                          borderRadius: 1,
                          mb: 1,
                          overflowX: 'auto',
                        }}
                      >
                        {JSON.stringify(log.action_details, null, 2)}
                      </Typography>
                    )}

                    <Stack direction="row" spacing={2} sx={{ flexWrap: 'wrap', gap: 1 }}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <User size={14} color="rgba(255,255,255,0.4)" />
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                          {log.ip_address}
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Calendar size={14} color="rgba(255,255,255,0.4)" />
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                          {new Date(log.created_at).toLocaleString()}
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>

        {logs.length === 0 && !loading && (
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <FileText size={56} color="rgba(255,255,255,0.15)" />
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', mt: 2 }}>
                No audit logs found
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Pagination */}
        {total > limit && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
            <Pagination
              count={Math.ceil(total / limit)}
              page={page}
              onChange={(_, value) => setPage(value)}
              sx={{
                '& .MuiPaginationItem-root': { color: 'white' },
                '& .Mui-selected': { bgcolor: '#3B82F6 !important' },
              }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
