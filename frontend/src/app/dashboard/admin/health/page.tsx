'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Grid,
  Chip,
  LinearProgress,
} from '@mui/material';
import { Activity, Users, TrendingUp, Package, AlertTriangle, CheckCircle, Server, Database } from 'lucide-react';

interface HealthData {
  database: {
    total_users: number;
    users_today: number;
    total_trades: number;
    trades_today: number;
    total_products: number;
    total_providers: number;
  };
  system: {
    uptime: number;
    memory_usage: string;
    cpu_count: number;
    load_average: number[];
    platform: string;
    node_version: string;
  };
  recent_metrics: Array<{
    metric_name: string;
    metric_value: number;
    metric_unit: string;
    status: string;
    recorded_at: string;
  }>;
}

export default function AdminHealthPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchHealth = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/health`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
      }
    } catch (error) {
      console.error('Failed to fetch health:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return '#22C55E';
      case 'warning': return '#F59E0B';
      case 'critical': return '#EF4444';
      default: return '#6B7280';
    }
  };

  if (loading || !health) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', p: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <LinearProgress sx={{ width: 300 }} />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', py: { xs: 2, md: 4 }, px: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Box sx={{ p: 1.5, bgcolor: 'rgba(34, 197, 94, 0.2)', borderRadius: 2 }}>
            <Activity size={24} color="#22C55E" />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
              System Health Dashboard
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
              Real-time system monitoring and metrics
            </Typography>
          </Box>
        </Stack>

        {/* Database Stats */}
        <Typography sx={{ color: 'white', fontWeight: 600, mb: 2, fontSize: '1.1rem' }}>
          Database Statistics
        </Typography>
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Users size={32} color="#3B82F6" />
                  <Box>
                    <Typography sx={{ color: 'white', fontSize: '1.8rem', fontWeight: 700 }}>
                      {health.database.total_users}
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                      Total Users
                    </Typography>
                    <Typography sx={{ color: '#22C55E', fontSize: '0.75rem' }}>
                      +{health.database.users_today} today
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <TrendingUp size={32} color="#22C55E" />
                  <Box>
                    <Typography sx={{ color: 'white', fontSize: '1.8rem', fontWeight: 700 }}>
                      {health.database.total_trades}
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                      Total Trades
                    </Typography>
                    <Typography sx={{ color: '#22C55E', fontSize: '0.75rem' }}>
                      +{health.database.trades_today} today
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Package size={32} color="#8B5CF6" />
                  <Box>
                    <Typography sx={{ color: 'white', fontSize: '1.8rem', fontWeight: 700 }}>
                      {health.database.total_products}
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                      Products
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ bgcolor: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Activity size={32} color="#F59E0B" />
                  <Box>
                    <Typography sx={{ color: 'white', fontSize: '1.8rem', fontWeight: 700 }}>
                      {health.database.total_providers}
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                      Signal Providers
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* System Stats */}
        <Typography sx={{ color: 'white', fontWeight: 600, mb: 2, fontSize: '1.1rem' }}>
          System Resources
        </Typography>
        <Grid container spacing={2} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Server size={24} color="#3B82F6" />
                  <Typography sx={{ color: 'white', fontWeight: 600 }}>Server Info</Typography>
                </Stack>
                <Stack spacing={1.5}>
                  <Box>
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', mb: 0.5 }}>
                      Uptime
                    </Typography>
                    <Typography sx={{ color: 'white', fontWeight: 600 }}>
                      {formatUptime(health.system.uptime)}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', mb: 0.5 }}>
                      Platform
                    </Typography>
                    <Typography sx={{ color: 'white', fontWeight: 600 }}>
                      {health.system.platform} • Node {health.system.node_version}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', mb: 0.5 }}>
                      CPUs
                    </Typography>
                    <Typography sx={{ color: 'white', fontWeight: 600 }}>
                      {health.system.cpu_count} cores
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <CardContent>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                  <Database size={24} color="#8B5CF6" />
                  <Typography sx={{ color: 'white', fontWeight: 600 }}>Resource Usage</Typography>
                </Stack>
                <Stack spacing={2}>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                        Memory Usage
                      </Typography>
                      <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '0.85rem' }}>
                        {health.system.memory_usage}%
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={parseFloat(health.system.memory_usage.replace('%', ''))}
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.1)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: parseFloat(health.system.memory_usage) > 85 ? '#EF4444' : 
                                   parseFloat(health.system.memory_usage) > 70 ? '#F59E0B' : '#22C55E',
                        },
                      }}
                    />
                  </Box>
                  <Box>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>
                        CPU Load (1m avg)
                      </Typography>
                      <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '0.85rem' }}>
                        {health.system.load_average[0].toFixed(2)}
                      </Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={Math.min((health.system.load_average[0] / health.system.cpu_count) * 100, 100)}
                      sx={{
                        bgcolor: 'rgba(255,255,255,0.1)',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: health.system.load_average[0] > 0.8 * health.system.cpu_count ? '#EF4444' : 
                                   health.system.load_average[0] > 0.6 * health.system.cpu_count ? '#F59E0B' : '#22C55E',
                        },
                      }}
                    />
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Recent Metrics */}
        <Typography sx={{ color: 'white', fontWeight: 600, mb: 2, fontSize: '1.1rem' }}>
          Recent Metrics (Last Hour)
        </Typography>
        <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
          <CardContent>
            <Stack spacing={1.5}>
              {health.recent_metrics.slice(0, 10).map((metric, index) => (
                <Stack key={index} direction="row" justifyContent="space-between" alignItems="center">
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    {metric.status === 'normal' && <CheckCircle size={18} color="#22C55E" />}
                    {metric.status === 'warning' && <AlertTriangle size={18} color="#F59E0B" />}
                    {metric.status === 'critical' && <AlertTriangle size={18} color="#EF4444" />}
                    <Typography sx={{ color: 'white', fontSize: '0.9rem' }}>
                      {metric.metric_name.replace(/_/g, ' ').toUpperCase()}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                      {metric.metric_value} {metric.metric_unit}
                    </Typography>
                    <Chip
                      label={metric.status}
                      size="small"
                      sx={{
                        bgcolor: `${getStatusColor(metric.status)}20`,
                        color: getStatusColor(metric.status),
                        fontSize: '0.7rem',
                        textTransform: 'uppercase',
                      }}
                    />
                    <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', minWidth: 100 }}>
                      {new Date(metric.recorded_at).toLocaleTimeString()}
                    </Typography>
                  </Stack>
                </Stack>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
