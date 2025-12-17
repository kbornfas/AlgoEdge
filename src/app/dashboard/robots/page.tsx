'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Switch,
  Chip,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { Bot, TrendingUp, Zap, Shield, Target, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Robot {
  id: string;
  name: string;
  description: string;
  strategy: string;
  timeframe: string;
  riskLevel: string;
  winRate: number;
  isEnabled: boolean;
}

export default function RobotsPage() {
  const router = useRouter();
  const [robots, setRobots] = useState<Robot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRobots();
  }, []);

  const fetchRobots = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    try {
      const response = await fetch('/api/robots', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setRobots(data.robots || []);
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to fetch robots');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleRobot = async (robotId: string, enabled: boolean) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('/api/robots/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ robotId, enabled }),
      });

      if (response.ok) {
        // Update local state
        setRobots((prev) =>
          prev.map((robot) =>
            robot.id === robotId ? { ...robot, isEnabled: enabled } : robot
          )
        );
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to toggle robot');
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel.toLowerCase()) {
      case 'low':
        return 'success';
      case 'medium':
        return 'warning';
      case 'high':
        return 'error';
      default:
        return 'default';
    }
  };

  const getTimeframeIcon = (timeframe: string) => {
    if (timeframe.includes('M')) return <Zap size={20} />;
    if (timeframe.includes('H')) return <TrendingUp size={20} />;
    return <Target size={20} />;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
          Trading Robots
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your automated trading bots across different timeframes
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {robots.map((robot) => (
          <Grid item xs={12} md={6} lg={4} key={robot.id}>
            <Card
              sx={{
                height: '100%',
                border: robot.isEnabled ? '2px solid' : '1px solid',
                borderColor: robot.isEnabled ? 'primary.main' : 'divider',
                transition: 'all 0.3s',
                '&:hover': {
                  boxShadow: 6,
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 1,
                        bgcolor: robot.isEnabled ? 'primary.main' : 'action.hover',
                        color: robot.isEnabled ? 'white' : 'text.secondary',
                        display: 'flex',
                      }}
                    >
                      {getTimeframeIcon(robot.timeframe)}
                    </Box>
                    <Chip
                      label={robot.timeframe}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </Box>
                  <Switch
                    checked={robot.isEnabled}
                    onChange={(e) => handleToggleRobot(robot.id, e.target.checked)}
                    color="primary"
                  />
                </Box>

                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  {robot.name}
                </Typography>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2, minHeight: 40 }}>
                  {robot.description}
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                  <Chip
                    label={robot.strategy}
                    size="small"
                    variant="outlined"
                    icon={<Bot size={16} />}
                  />
                  <Chip
                    label={`${robot.riskLevel} Risk`}
                    size="small"
                    color={getRiskColor(robot.riskLevel)}
                  />
                </Box>

                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    bgcolor: 'success.light',
                    borderRadius: 1,
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    Win Rate
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'success.dark' }}>
                    {robot.winRate}%
                  </Typography>
                </Box>

                {robot.isEnabled && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="caption">
                      🟢 Robot is active and trading
                    </Typography>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {robots.length === 0 && !loading && (
        <Alert severity="info" sx={{ mt: 3 }}>
          No trading robots available. Please contact support.
        </Alert>
      )}
    </Box>
  );
}
