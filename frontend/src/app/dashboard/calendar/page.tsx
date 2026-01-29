'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  IconButton,
} from '@mui/material';
import { Calendar, AlertTriangle, TrendingUp, Bell, Clock } from 'lucide-react';

interface EconomicEvent {
  id: number;
  event_title: string;
  country: string;
  currency: string;
  event_date: string;
  impact: string;
  forecast: string | null;
  previous: string | null;
  actual: string | null;
  description: string | null;
}

export default function EconomicCalendarPage() {
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [currency, setCurrency] = useState('');
  const [impact, setImpact] = useState('');
  const [timeframe, setTimeframe] = useState('upcoming');

  useEffect(() => {
    fetchEvents();
  }, [currency, impact, timeframe]);

  const fetchEvents = async () => {
    try {
      const params = new URLSearchParams();
      if (currency) params.append('currency', currency);
      if (impact) params.append('impact', impact);

      const endpoint = timeframe === 'upcoming' ? '/upcoming' : '';
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/calendar${endpoint}?${params}`);
      
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Failed to fetch events:', error);
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high': return '#EF4444';
      case 'medium': return '#F59E0B';
      case 'low': return '#22C55E';
      default: return '#6B7280';
    }
  };

  const getImpactIcon = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high': return <AlertTriangle size={16} />;
      case 'medium': return <TrendingUp size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isToday = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', py: { xs: 2, md: 4 }, px: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box sx={{ p: 1.5, bgcolor: 'rgba(59, 130, 246, 0.2)', borderRadius: 2 }}>
              <Calendar size={24} color="#3B82F6" />
            </Box>
            <Box>
              <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                Economic Calendar
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
                Major forex news events and their impact
              </Typography>
            </Box>
          </Stack>

          {/* Filters */}
          <Stack direction="row" spacing={2}>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel sx={{ color: 'rgba(255,255,255,0.5)' }}>Timeframe</InputLabel>
              <Select
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value)}
                label="Timeframe"
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                }}
              >
                <MenuItem value="upcoming">Upcoming</MenuItem>
                <MenuItem value="all">All</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel sx={{ color: 'rgba(255,255,255,0.5)' }}>Currency</InputLabel>
              <Select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                label="Currency"
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="USD">USD</MenuItem>
                <MenuItem value="EUR">EUR</MenuItem>
                <MenuItem value="GBP">GBP</MenuItem>
                <MenuItem value="JPY">JPY</MenuItem>
                <MenuItem value="AUD">AUD</MenuItem>
              </Select>
            </FormControl>

            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel sx={{ color: 'rgba(255,255,255,0.5)' }}>Impact</InputLabel>
              <Select
                value={impact}
                onChange={(e) => setImpact(e.target.value)}
                label="Impact"
                sx={{
                  color: 'white',
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' },
                }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Stack>

        {/* Events List */}
        <Stack spacing={1.5}>
          {events.map((event) => (
            <Card 
              key={event.id} 
              sx={{ 
                bgcolor: isToday(event.event_date) ? 'rgba(59, 130, 246, 0.05)' : 'rgba(255,255,255,0.02)', 
                border: '1px solid',
                borderColor: isToday(event.event_date) ? 'rgba(59, 130, 246, 0.3)' : 'rgba(255,255,255,0.1)'
              }}
            >
              <CardContent sx={{ py: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  {/* Time */}
                  <Box sx={{ minWidth: 100 }}>
                    <Typography sx={{ color: '#3B82F6', fontWeight: 600, fontSize: '0.9rem' }}>
                      {formatDate(event.event_date)}
                    </Typography>
                    {isToday(event.event_date) && (
                      <Chip label="Today" size="small" sx={{ bgcolor: 'rgba(59, 130, 246, 0.2)', color: '#3B82F6', fontSize: '0.65rem', height: 18, mt: 0.5 }} />
                    )}
                  </Box>

                  {/* Currency Flag */}
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: 'rgba(255,255,255,0.1)',
                      borderRadius: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      color: 'white',
                      fontSize: '0.85rem',
                    }}
                  >
                    {event.currency}
                  </Box>

                  {/* Event Details */}
                  <Box sx={{ flex: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '1.05rem' }}>
                        {event.event_title}
                      </Typography>
                      <Chip
                        icon={getImpactIcon(event.impact)}
                        label={event.impact.toUpperCase()}
                        size="small"
                        sx={{
                          bgcolor: `${getImpactColor(event.impact)}20`,
                          color: getImpactColor(event.impact),
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          '& .MuiChip-icon': { color: getImpactColor(event.impact) },
                        }}
                      />
                    </Stack>

                    {event.description && (
                      <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', mb: 0.5 }}>
                        {event.description}
                      </Typography>
                    )}

                    <Stack direction="row" spacing={3}>
                      {event.forecast && (
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                          Forecast: <span style={{ color: 'white', fontWeight: 600 }}>{event.forecast}</span>
                        </Typography>
                      )}
                      {event.previous && (
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                          Previous: <span style={{ color: 'white' }}>{event.previous}</span>
                        </Typography>
                      )}
                      {event.actual && (
                        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                          Actual: <span style={{ color: '#22C55E', fontWeight: 600 }}>{event.actual}</span>
                        </Typography>
                      )}
                    </Stack>
                  </Box>

                  {/* Reminder Button */}
                  <IconButton
                    sx={{
                      color: 'rgba(255,255,255,0.5)',
                      '&:hover': { color: '#F59E0B', bgcolor: 'rgba(245, 158, 11, 0.1)' },
                    }}
                  >
                    <Bell size={20} />
                  </IconButton>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>

        {events.length === 0 && (
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <Calendar size={56} color="rgba(255,255,255,0.15)" />
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', mt: 2 }}>
                No events found for selected filters
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
}
