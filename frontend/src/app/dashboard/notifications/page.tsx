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

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'success':
      return <CheckCircle size={24} color="#22C55E" />;
    case 'warning':
      return <AlertTriangle size={24} color="#F59E0B" />;
    case 'payment':
      return <DollarSign size={24} color="#0066FF" />;
    case 'signal':
      return <TrendingUp size={24} color="#A855F7" />;
    case 'security':
      return <Shield size={24} color="#EF4444" />;
    default:
      return <Info size={24} color="#6B7280" />;
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
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Notifications
          </Typography>
          <Typography color="text.secondary">
            {unreadCount > 0 ? `You have ${unreadCount} unread notifications` : 'All caught up!'}
          </Typography>
        </Box>
        {notifications.length > 0 && unreadCount > 0 && (
          <Button
            variant="outlined"
            startIcon={<CheckCheck size={18} />}
            onClick={markAllAsRead}
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
        <Card sx={{ textAlign: 'center', py: 8 }}>
          <CardContent>
            <Bell size={64} color="#6B7280" style={{ opacity: 0.5, marginBottom: 16 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No notifications yet
            </Typography>
            <Typography color="text.secondary">
              When you have new notifications, they will appear here.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
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
              <CardContent sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Box sx={{ pt: 0.5 }}>
                  {getNotificationIcon(notification.type)}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography fontWeight={600}>{notification.title}</Typography>
                    {!notification.is_read && (
                      <Chip label="New" size="small" color="primary" sx={{ height: 20 }} />
                    )}
                  </Box>
                  <Typography color="text.secondary" sx={{ mb: 1 }}>
                    {notification.message}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {formatDate(notification.created_at)}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => deleteNotification(notification.id)}
                  sx={{ color: 'text.secondary' }}
                >
                  <Trash2 size={18} />
                </IconButton>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </Container>
  );
}
