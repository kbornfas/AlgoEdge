'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Avatar,
  Chip,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
} from '@mui/material';
import { Trophy, TrendingUp, Users, Target } from 'lucide-react';

interface Provider {
  id: number;
  user_id: number;
  username: string;
  profile_photo_url: string | null;
  total_signals: number;
  winning_signals: number;
  losing_signals: number;
  win_rate: number;
  total_pips: number;
  avg_pips_per_signal: number;
  monthly_pips: number;
  subscriber_count: number;
}

export default function LeaderboardPage() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [sortBy, setSortBy] = useState('win_rate');

  useEffect(() => {
    fetchLeaderboard();
  }, [sortBy]);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/leaderboard/signal-providers?sort=${sortBy}&limit=50`);
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers || []);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  };

  const getRankColor = (index: number) => {
    if (index === 0) return '#FFD700'; // Gold
    if (index === 1) return '#C0C0C0'; // Silver
    if (index === 2) return '#CD7F32'; // Bronze
    return 'rgba(255,255,255,0.5)';
  };

  const getRankIcon = (index: number) => {
    if (index < 3) return '🏆';
    return `#${index + 1}`;
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', py: { xs: 2, md: 4 }, px: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box sx={{ p: 1.5, bgcolor: 'rgba(255, 215, 0, 0.2)', borderRadius: 2 }}>
              <Trophy size={24} color="#FFD700" />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                Signal Provider Leaderboard
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
                Top performing signal providers ranked by performance
              </Typography>
            </Box>
          </Stack>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel sx={{ color: 'rgba(255,255,255,0.5)' }}>Sort By</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              label="Sort By"
              sx={{
                color: 'white',
                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                '& .MuiSvgIcon-root': { color: 'rgba(255,255,255,0.5)' },
              }}
            >
              <MenuItem value="win_rate">Win Rate</MenuItem>
              <MenuItem value="total_pips">Total Pips</MenuItem>
              <MenuItem value="monthly_pips">Monthly Pips</MenuItem>
              <MenuItem value="subscribers">Subscribers</MenuItem>
              <MenuItem value="signals">Total Signals</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {/* Top 3 Podium */}
        {providers.length >= 3 && (
          <Stack direction="row" spacing={2} justifyContent="center" sx={{ mb: 4 }}>
            {[1, 0, 2].map((idx) => {
              const provider = providers[idx];
              if (!provider) return null;
              const rank = idx + 1;
              return (
                <Card
                  key={provider.id}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.03)',
                    border: '2px solid',
                    borderColor: getRankColor(idx),
                    width: idx === 0 ? 240 : 200,
                    transform: idx === 0 ? 'scale(1.1)' : 'scale(1)',
                    mt: idx === 0 ? 0 : 3,
                  }}
                >
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <Typography sx={{ fontSize: '2.5rem', mb: 1 }}>{getRankIcon(idx)}</Typography>
                    <Avatar
                      src={provider.profile_photo_url || undefined}
                      sx={{ width: 64, height: 64, mx: 'auto', mb: 1, border: '3px solid', borderColor: getRankColor(idx) }}
                    >
                      {provider.username[0]?.toUpperCase()}
                    </Avatar>
                    <Typography sx={{ color: 'white', fontWeight: 600, mb: 0.5 }}>{provider.username}</Typography>
                    <Chip
                      label={`${provider.win_rate}% Win Rate`}
                      size="small"
                      sx={{ bgcolor: 'rgba(34, 197, 94, 0.2)', color: '#22C55E', fontWeight: 600, mb: 1 }}
                    />
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                      {provider.total_pips > 0 ? '+' : ''}{provider.total_pips} pips
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
                      {provider.subscriber_count} subscribers
                    </Typography>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        )}

        {/* Full Leaderboard */}
        <Stack spacing={1.5}>
          {providers.map((provider, index) => (
            <Card key={provider.id} sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
              <CardContent sx={{ py: 2 }}>
                <Stack direction="row" alignItems="center" spacing={2}>
                  <Typography
                    sx={{
                      minWidth: 40,
                      color: getRankColor(index),
                      fontWeight: 700,
                      fontSize: '1.2rem',
                      textAlign: 'center',
                    }}
                  >
                    {index < 3 ? getRankIcon(index) : `#${index + 1}`}
                  </Typography>

                  <Avatar src={provider.profile_photo_url || undefined} sx={{ width: 48, height: 48 }}>
                    {provider.username[0]?.toUpperCase()}
                  </Avatar>

                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '1.05rem' }}>
                      {provider.username}
                    </Typography>
                    <Stack direction="row" spacing={1} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Target size={14} color="#22C55E" />
                        <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>
                          {provider.win_rate}% WR
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <TrendingUp size={14} color="#3B82F6" />
                        <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>
                          {provider.total_pips > 0 ? '+' : ''}{provider.total_pips} pips
                        </Typography>
                      </Stack>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Users size={14} color="#F59E0B" />
                        <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.8rem' }}>
                          {provider.subscriber_count} subs
                        </Typography>
                      </Stack>
                    </Stack>
                  </Box>

                  <Stack alignItems="flex-end" spacing={0.5}>
                    <Chip
                      label={`${provider.total_signals} signals`}
                      size="small"
                      sx={{ bgcolor: 'rgba(139, 92, 246, 0.2)', color: '#8B5CF6', fontSize: '0.7rem' }}
                    />
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem' }}>
                      {provider.monthly_pips > 0 ? '+' : ''}{provider.monthly_pips} pips/mo
                    </Typography>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>

        {providers.length === 0 && (
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <Trophy size={56} color="rgba(255,255,255,0.15)" />
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', mt: 2 }}>
                No providers on leaderboard yet
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
}
