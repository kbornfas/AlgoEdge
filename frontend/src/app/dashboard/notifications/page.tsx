'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  IconButton,
  Chip,
  Button,
  Divider,
  Stack,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Bell,
  CheckCircle,
  AlertTriangle,
  Info,
  DollarSign,
  TrendingUp,
  Shield,
  Trash2,
  CheckCheck,
} from 'lucide-react';

interface Notification {
  id: number;
  type: 'success' | 'warning' | 'info' | 'payment' | 'signal' | 'security';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

const getNotificationIcon = (type: string, size: number = 24) => {
  switch (type) {
    case 'success':
      return <CheckCircle size={size} color="#22C55E" />;
    case 'warning':
      return <AlertTriangle size={size} color="#F59E0B" />;
    case 'payment':
      return <DollarSign size={size} color="#0066FF" />;
    case 'signal':
      return <TrendingUp size={size} color="#A855F7" />;
    case 'security':
      return <Shield size={size} color="#EF4444" />;
    default:
      return <Info size={size} color="#6B7280" />;
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes} min ago`;
  if (hours < 24) return `${hours} hours ago`;
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
};

const formatDateShort = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/api/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      } else {
        // No notifications endpoint yet - show empty state
        setNotifications([]);
      }
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      await fetch(`${apiUrl}/api/notifications/read-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Error marking notifications as read:', err);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      await fetch(`${apiUrl}/api/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1.5, sm: 2, md: 3 } }}>
      <Box sx={{ 
        display: 'flex', 
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        gap: { xs: 2, sm: 0 },
        mb: { xs: 2, sm: 3, md: 4 } 
      }}>
        <Box>
          <Typography 
            variant="h4" 
            fontWeight={700} 
            gutterBottom
            sx={{ fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' } }}
          >
            Notifications
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : 'All caught up!'}
          </Typography>
        </Box>
        {notifications.length > 0 && unreadCount > 0 && (
          <Button
            variant="outlined"
            startIcon={<CheckCheck size={18} />}
            onClick={markAllAsRead}
            sx={{ 
              width: { xs: '100%', sm: 'auto' },
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              py: { xs: 1, sm: 0.75 },
              '& .MuiButton-startIcon': {
                display: { xs: 'none', sm: 'inherit' }
              }
            }}
          >
            Mark all as read
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : notifications.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: { xs: 4, sm: 6, md: 8 } }}>
          <CardContent sx={{ px: { xs: 2, sm: 3 } }}>
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
              <Bell size={64} color="#6B7280" style={{ opacity: 0.5, marginBottom: 16 }} />
            </Box>
            <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
              <Bell size={48} color="#6B7280" style={{ opacity: 0.5, marginBottom: 12 }} />
            </Box>
            <Typography 
              variant="h6" 
              color="text.secondary" 
              gutterBottom
              sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
            >
              No notifications yet
            </Typography>
            <Typography color="text.secondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
              When you have new notifications, they will appear here.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={{ xs: 1.5, sm: 2 }}>
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              sx={{
                bgcolor: notification.is_read ? 'background.paper' : 'rgba(0, 102, 255, 0.05)',
                border: notification.is_read ? '1px solid' : '1px solid rgba(0, 102, 255, 0.2)',
                borderColor: notification.is_read ? 'divider' : undefined,
                transition: 'all 0.2s',
              }}
            >
              <CardContent sx={{ 
                display: 'flex', 
                alignItems: 'flex-start', 
                gap: { xs: 1.5, sm: 2 },
                p: { xs: 1.5, sm: 2 },
                '&:last-child': { pb: { xs: 1.5, sm: 2 } }
              }}>
                <Box sx={{ pt: 0.5, display: { xs: 'none', sm: 'block' } }}>
                  {getNotificationIcon(notification.type, 24)}
                </Box>
                <Box sx={{ pt: 0.5, display: { xs: 'block', sm: 'none' } }}>
                  {getNotificationIcon(notification.type, 20)}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: { xs: 0.5, sm: 1 }, 
                    mb: 0.5,
                    flexWrap: 'wrap'
                  }}>
                    <Typography 
                      fontWeight={600}
                      sx={{ 
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        wordBreak: 'break-word'
                      }}
                    >
                      {notification.title}
                    </Typography>
                    {!notification.is_read && (
                      <Chip 
                        label="New" 
                        size="small" 
                        color="primary" 
                        sx={{ 
                          height: { xs: 18, sm: 20 },
                          fontSize: { xs: '0.65rem', sm: '0.75rem' },
                          '& .MuiChip-label': { px: { xs: 0.75, sm: 1 } }
                        }} 
                      />
                    )}
                  </Box>
                  <Typography 
                    color="text.secondary" 
                    sx={{ 
                      mb: { xs: 0.5, sm: 1 },
                      fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' },
                      lineHeight: { xs: 1.4, sm: 1.5 }
                    }}
                  >
                    {notification.message}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color="text.secondary"
                    sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                  >
                    <Box sx={{ display: { xs: 'none', sm: 'inline' } }}>
                      {formatDate(notification.created_at)}
                    </Box>
                    <Box sx={{ display: { xs: 'inline', sm: 'none' } }}>
                      {formatDateShort(notification.created_at)}
                    </Box>
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => deleteNotification(notification.id)}
                  sx={{ 
                    color: 'text.secondary',
                    p: { xs: 0.5, sm: 1 },
                    ml: { xs: -0.5, sm: 0 }
                  }}
                >
                  <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                    <Trash2 size={18} />
                  </Box>
                  <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                    <Trash2 size={16} />
                  </Box>
                </IconButton>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Container>
  );
}
