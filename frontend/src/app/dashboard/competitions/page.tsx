'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  Chip,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@mui/material';
import { Trophy, TrendingUp, Calendar, DollarSign, Users, Target } from 'lucide-react';

interface Competition {
  id: number;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  entry_fee: number;
  prize_pool: number;
  max_participants: number;
  current_participants: number;
  rules: any;
  status: string;
}

interface Leaderboard {
  username: string;
  current_balance: number;
  starting_balance: number;
  total_profit: number;
  total_pips: number;
  total_trades: number;
  winning_trades: number;
  win_rate: number;
  final_rank: number;
}

export default function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedComp, setSelectedComp] = useState<Competition | null>(null);
  const [leaderboard, setLeaderboard] = useState<Leaderboard[]>([]);

  useEffect(() => {
    fetchCompetitions();
  }, []);

  const fetchCompetitions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/competitions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCompetitions(data.competitions || []);
      }
    } catch (error) {
      console.error('Failed to fetch competitions:', error);
    }
  };

  const openCompetition = async (comp: Competition) => {
    setSelectedComp(comp);
    // Fetch leaderboard
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/competitions/${comp.id}/leaderboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  };

  const joinCompetition = async (compId: number) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/competitions/${compId}/join`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCompetitions();
      alert('Successfully joined competition!');
    } catch (error) {
      console.error('Failed to join competition:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return '#F59E0B';
      case 'active': return '#22C55E';
      case 'completed': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysRemaining = (endDate: string) => {
    const days = Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 0;
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', py: { xs: 2, md: 4 }, px: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Box sx={{ p: 1.5, bgcolor: 'rgba(245, 158, 11, 0.2)', borderRadius: 2 }}>
            <Trophy size={24} color="#F59E0B" />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
              Trading Competitions
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
              Compete with traders worldwide
            </Typography>
          </Box>
        </Stack>

        {/* Competitions Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
          {competitions.map((comp) => (
            <Card key={comp.id} sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="start" sx={{ mb: 2 }}>
                  <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '1.3rem' }}>
                    {comp.name}
                  </Typography>
                  <Chip
                    label={comp.status.toUpperCase()}
                    size="small"
                    sx={{
                      bgcolor: `${getStatusColor(comp.status)}20`,
                      color: getStatusColor(comp.status),
                      fontWeight: 600,
                      fontSize: '0.7rem',
                    }}
                  />
                </Stack>

                <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 3, fontSize: '0.9rem' }}>
                  {comp.description}
                </Typography>

                <Stack spacing={1.5} sx={{ mb: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Calendar size={18} color="#3B82F6" />
                    <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                      {formatDate(comp.start_date)} - {formatDate(comp.end_date)}
                    </Typography>
                  </Stack>

                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <DollarSign size={18} color="#22C55E" />
                    <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                      Prize Pool: <span style={{ color: '#22C55E', fontWeight: 700 }}>${comp.prize_pool}</span>
                    </Typography>
                  </Stack>

                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Target size={18} color="#F59E0B" />
                    <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                      Entry Fee: ${comp.entry_fee}
                    </Typography>
                  </Stack>

                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <Users size={18} color="#EC4899" />
                    <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.9rem' }}>
                      {comp.current_participants}/{comp.max_participants} Participants
                    </Typography>
                  </Stack>
                </Stack>

                {/* Progress Bar */}
                <Box sx={{ mb: 2 }}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                      Participation
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                      {Math.round((comp.current_participants / comp.max_participants) * 100)}%
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={(comp.current_participants / comp.max_participants) * 100}
                    sx={{
                      bgcolor: 'rgba(255,255,255,0.1)',
                      '& .MuiLinearProgress-bar': { bgcolor: '#EC4899' },
                    }}
                  />
                </Box>

                {comp.status === 'active' && (
                  <Chip
                    icon={<TrendingUp size={14} />}
                    label={`${getDaysRemaining(comp.end_date)} days remaining`}
                    size="small"
                    sx={{
                      bgcolor: 'rgba(34, 197, 94, 0.2)',
                      color: '#22C55E',
                      mb: 2,
                      fontWeight: 600,
                    }}
                  />
                )}

                <Stack direction="row" spacing={2}>
                  <Button
                    variant="outlined"
                    fullWidth
                    onClick={() => openCompetition(comp)}
                    sx={{
                      color: '#3B82F6',
                      borderColor: '#3B82F6',
                      '&:hover': { bgcolor: 'rgba(59, 130, 246, 0.1)' },
                    }}
                  >
                    View Leaderboard
                  </Button>
                  {comp.status === 'upcoming' && (
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => joinCompetition(comp.id)}
                      sx={{ bgcolor: '#F59E0B' }}
                    >
                      Join Now
                    </Button>
                  )}
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>

        {competitions.length === 0 && (
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <Trophy size={56} color="rgba(255,255,255,0.15)" />
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', mt: 2 }}>
                No competitions available
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>

      {/* Leaderboard Dialog */}
      <Dialog
        open={!!selectedComp}
        onClose={() => setSelectedComp(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#1A1F2E' } }}
      >
        {selectedComp && (
          <>
            <DialogTitle>
              <Stack direction="row" alignItems="center" spacing={2}>
                <Trophy size={24} color="#F59E0B" />
                <Typography sx={{ color: 'white', fontWeight: 700 }}>
                  {selectedComp.name} - Leaderboard
                </Typography>
              </Stack>
            </DialogTitle>
            <DialogContent>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Rank</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Trader</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Balance</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Profit</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Pips</TableCell>
                    <TableCell sx={{ color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>Win Rate</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaderboard.map((entry, idx) => (
                    <TableRow key={idx}>
                      <TableCell sx={{ color: 'white' }}>
                        {idx === 0 && '🥇'}
                        {idx === 1 && '🥈'}
                        {idx === 2 && '🥉'}
                        {idx > 2 && `#${idx + 1}`}
                      </TableCell>
                      <TableCell sx={{ color: 'white', fontWeight: 600 }}>{entry.username}</TableCell>
                      <TableCell sx={{ color: '#22C55E', fontWeight: 600 }}>
                        ${entry.current_balance.toFixed(2)}
                      </TableCell>
                      <TableCell sx={{ color: entry.total_profit >= 0 ? '#22C55E' : '#EF4444', fontWeight: 600 }}>
                        ${entry.total_profit.toFixed(2)}
                      </TableCell>
                      <TableCell sx={{ color: 'white' }}>{entry.total_pips}</TableCell>
                      <TableCell sx={{ color: 'white' }}>{entry.win_rate.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {leaderboard.length === 0 && (
                <Typography sx={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center', py: 4 }}>
                  No participants yet
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedComp(null)} sx={{ color: 'rgba(255,255,255,0.5)' }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
