'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Chip,
  CircularProgress,
} from '@mui/material';
import { Sparkles, Zap, Bug, Shield, TrendingUp, Clock } from 'lucide-react';

interface ChangelogEntry {
  id: number;
  version: string;
  title: string;
  description: string;
  category: string;
  image_url: string | null;
  published_at: string;
}

const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  feature: { icon: <Sparkles size={18} />, color: '#8B5CF6', label: 'New Feature' },
  improvement: { icon: <TrendingUp size={18} />, color: '#3B82F6', label: 'Improvement' },
  bugfix: { icon: <Bug size={18} />, color: '#22C55E', label: 'Bug Fix' },
  security: { icon: <Shield size={18} />, color: '#EF4444', label: 'Security' },
};

export default function ChangelogPage() {
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchChangelog();
  }, []);

  const fetchChangelog = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers: HeadersInit = {};
      if (token) headers.Authorization = `Bearer ${token}`;
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/changelog`, { headers });
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries || []);
        setUnreadCount(data.unreadCount || 0);
        
        // Mark as viewed
        if (token && data.entries.length > 0) {
          data.entries.slice(0, 5).forEach((entry: ChangelogEntry) => {
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/changelog/${entry.id}/view`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` },
            });
          });
        }
      }
    } catch (error) {
      console.error('Failed to fetch changelog:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#0a0f1a', py: { xs: 2, md: 4 }, px: { xs: 2, md: 4 } }}>
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
          <Box sx={{ p: 1.5, bgcolor: 'rgba(139, 92, 246, 0.2)', borderRadius: 2 }}>
            <Zap size={24} color="#8B5CF6" />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
              What's New
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
              Latest updates and improvements to AlgoEdge
            </Typography>
          </Box>
        </Stack>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#8B5CF6' }} />
          </Box>
        ) : entries.length === 0 ? (
          <Card sx={{ bgcolor: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <CardContent sx={{ textAlign: 'center', py: 8 }}>
              <Zap size={56} color="rgba(255,255,255,0.15)" />
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', mt: 2 }}>
                No updates yet. Check back soon!
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Stack spacing={3}>
            {entries.map((entry, index) => {
              const config = CATEGORY_CONFIG[entry.category] || CATEGORY_CONFIG.feature;
              
              return (
                <Card
                  key={entry.id}
                  sx={{
                    bgcolor: index === 0 ? 'rgba(139, 92, 246, 0.05)' : 'rgba(255,255,255,0.02)',
                    border: index === 0 ? '1px solid rgba(139, 92, 246, 0.3)' : '1px solid rgba(255,255,255,0.1)',
                    position: 'relative',
                    overflow: 'visible',
                  }}
                >
                  {index === 0 && (
                    <Chip
                      label="NEW"
                      size="small"
                      sx={{
                        position: 'absolute',
                        top: -10,
                        right: 20,
                        bgcolor: '#8B5CF6',
                        color: 'white',
                        fontWeight: 700,
                        fontSize: '0.65rem',
                      }}
                    />
                  )}
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" spacing={2}>
                      {/* Icon */}
                      <Box
                        sx={{
                          p: 1.5,
                          bgcolor: `${config.color}20`,
                          borderRadius: 2,
                          height: 'fit-content',
                          color: config.color,
                        }}
                      >
                        {config.icon}
                      </Box>

                      {/* Content */}
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                          {entry.version && (
                            <Chip
                              label={entry.version}
                              size="small"
                              sx={{
                                bgcolor: 'rgba(255,255,255,0.1)',
                                color: 'rgba(255,255,255,0.7)',
                                fontSize: '0.75rem',
                                fontFamily: 'monospace',
                              }}
                            />
                          )}
                          <Chip
                            label={config.label}
                            size="small"
                            sx={{
                              bgcolor: `${config.color}20`,
                              color: config.color,
                              fontSize: '0.7rem',
                            }}
                          />
                          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ ml: 'auto' }}>
                            <Clock size={14} color="rgba(255,255,255,0.4)" />
                            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                              {formatDate(entry.published_at)}
                            </Typography>
                          </Stack>
                        </Stack>

                        <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '1.15rem', mb: 1 }}>
                          {entry.title}
                        </Typography>

                        <Typography
                          sx={{
                            color: 'rgba(255,255,255,0.7)',
                            fontSize: '0.95rem',
                            lineHeight: 1.6,
                            whiteSpace: 'pre-line',
                          }}
                        >
                          {entry.description}
                        </Typography>

                        {entry.image_url && (
                          <Box
                            component="img"
                            src={entry.image_url}
                            sx={{
                              mt: 2,
                              width: '100%',
                              borderRadius: 2,
                              border: '1px solid rgba(255,255,255,0.1)',
                            }}
                          />
                        )}
                      </Box>
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        )}
      </Box>
    </Box>
  );
}
