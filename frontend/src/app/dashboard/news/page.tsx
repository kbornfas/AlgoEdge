'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Button,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

interface NewsItem {
  id: number;
  title: string;
  summary: string;
  impact: 'high' | 'medium' | 'low';
  currency: string;
  published_at: string;
  source: string;
}

interface EconomicEvent {
  id: number;
  title: string;
  currency: string;
  impact: 'high' | 'medium' | 'low';
  actual?: string;
  forecast?: string;
  previous?: string;
  time: string;
}

const getImpactColor = (impact: string) => {
  switch (impact) {
    case 'high': return '#EF4444';
    case 'medium': return '#F59E0B';
    case 'low': return '#22C55E';
    default: return '#6B7280';
  }
};

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const [newsRes, eventsRes] = await Promise.all([
        fetch(`${apiUrl}/api/users/news`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
        fetch(`${apiUrl}/api/users/economic-calendar`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
      ]);

      if (newsRes.ok) {
        const data = await newsRes.json();
        setNews(data.news || []);
      }
      if (eventsRes.ok) {
        const data = await eventsRes.json();
        setEvents(data.events || []);
      }
    } catch (err) {
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Market News & Calendar
          </Typography>
          <Typography color="text.secondary">
            {today}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshCw size={18} />}
          onClick={fetchNews}
          disabled={loading}
        >
          Refresh
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={4}>
          {/* Economic Calendar */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Calendar size={20} />
              Economic Calendar
            </Typography>
            {events.length === 0 ? (
              <Card sx={{ p: 4, textAlign: 'center' }}>
                <Calendar size={48} color="#6B7280" style={{ opacity: 0.5, marginBottom: 16 }} />
                <Typography color="text.secondary">No economic events scheduled for today</Typography>
              </Card>
            ) : (
              events.map((event) => (
                <Card key={event.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          label={event.currency} 
                          size="small" 
                          sx={{ fontWeight: 600 }}
                        />
                        <Chip 
                          label={event.impact} 
                          size="small"
                          sx={{ 
                            bgcolor: `${getImpactColor(event.impact)}20`,
                            color: getImpactColor(event.impact),
                            fontWeight: 600,
                          }}
                        />
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        <Clock size={14} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                        {event.time}
                      </Typography>
                    </Box>
                    <Typography fontWeight={600}>{event.title}</Typography>
                    {(event.forecast || event.previous) && (
                      <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
                        {event.actual && (
                          <Typography variant="body2">
                            <strong>Actual:</strong> {event.actual}
                          </Typography>
                        )}
                        {event.forecast && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Forecast:</strong> {event.forecast}
                          </Typography>
                        )}
                        {event.previous && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Previous:</strong> {event.previous}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </Grid>

          {/* Market News */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" fontWeight={600} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingUp size={20} />
              Latest Market News
            </Typography>
            {news.length === 0 ? (
              <Card sx={{ p: 4, textAlign: 'center' }}>
                <AlertTriangle size={48} color="#6B7280" style={{ opacity: 0.5, marginBottom: 16 }} />
                <Typography color="text.secondary">No news available at the moment</Typography>
                <Typography variant="body2" color="text.secondary">Check back later for updates</Typography>
              </Card>
            ) : (
              news.map((item) => (
                <Card key={item.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Chip 
                        label={item.currency} 
                        size="small" 
                        sx={{ fontWeight: 600 }}
                      />
                      <Chip 
                        label={item.impact} 
                        size="small"
                        sx={{ 
                          bgcolor: `${getImpactColor(item.impact)}20`,
                          color: getImpactColor(item.impact),
                          fontWeight: 600,
                        }}
                      />
                    </Box>
                    <Typography fontWeight={600} gutterBottom>{item.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {item.summary}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {item.source} • {new Date(item.published_at).toLocaleString()}
                    </Typography>
                  </CardContent>
                </Card>
              ))
            )}
          </Grid>
        </Grid>
      )}
    </Container>
  );
}
