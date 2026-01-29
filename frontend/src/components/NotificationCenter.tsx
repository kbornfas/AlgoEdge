'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Box,
  IconButton,
  Badge,
  Popover,
  Typography,
  Stack,
  Button,
  Divider,
  CircularProgress,
  Chip,
} from '@mui/material';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  TrendingUp,
  Shield,
  CreditCard,
  ShoppingBag,
  AlertTriangle,
  Megaphone,
  Zap,
  Wallet,
  Clock,
  X,
} from 'lucide-react';
import Link from 'next/link';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  icon: string | null;
  link: string | null;
  read: boolean;
  read_at: string | null;
  created_at: string;
}

const NOTIFICATION_ICONS: Record<string, React.ReactNode> = {
  signal: <Zap size={18} color="#3B82F6" />,
  trade: <TrendingUp size={18} color="#22C55E" />,
  security: <Shield size={18} color="#EF4444" />,
  subscription: <CreditCard size={18} color="#F59E0B" />,
  marketplace: <ShoppingBag size={18} color="#8B5CF6" />,
  alert: <AlertTriangle size={18} color="#F59E0B" />,
  promo: <Megaphone size={18} color="#EC4899" />,
  wallet: <Wallet size={18} color="#10B981" />,
  system: <Bell size={18} color="#6B7280" />,
};

export default function NotificationCenter() {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const open = Boolean(anchorEl);
  const pollInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchUnreadCount();
    
    // Poll for new notifications every 30 seconds
    pollInterval.current = setInterval(fetchUnreadCount, 30000);
    
    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/count`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notification count:', error);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/inbox`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    fetchNotifications();
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const markAsRead = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/inbox/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/inbox/read-all`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/inbox/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const notification = notifications.find(n => n.id === id);
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const formatTime = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
  };

  const getIcon = (notification: Notification) => {
    if (notification.icon && NOTIFICATION_ICONS[notification.icon]) {
      return NOTIFICATION_ICONS[notification.icon];
    }
    return NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.system;
  };

  return (
    <>
      <IconButton
        onClick={handleOpen}
        sx={{
          color: 'rgba(255,255,255,0.7)',
          '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' },
        }}
      >
        <Badge
          badgeContent={unreadCount}
          max={99}
          sx={{
            '& .MuiBadge-badge': {
              bgcolor: '#EF4444',
              color: 'white',
              fontSize: '0.65rem',
              minWidth: '18px',
              height: '18px',
            },
          }}
        >
          <Bell size={22} />
        </Badge>
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        sx={{
          '& .MuiPaper-root': {
            bgcolor: '#1A1F2E',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 2,
            width: 380,
            maxWidth: '100vw',
            maxHeight: 480,
            overflow: 'hidden',
          },
        }}
      >
        {/* Header */}
        <Box sx={{
          p: 2,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <Typography sx={{ color: 'white', fontWeight: 600, fontSize: '1rem' }}>
            Notifications
          </Typography>
          <Stack direction="row" spacing={1}>
            {unreadCount > 0 && (
              <Button
                size="small"
                onClick={markAllAsRead}
                startIcon={<CheckCheck size={14} />}
                sx={{ 
                  color: 'rgba(255,255,255,0.6)', 
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  '&:hover': { color: 'white' },
                }}
              >
                Mark all read
              </Button>
            )}
          </Stack>
        </Box>

        {/* Notification List */}
        <Box sx={{ maxHeight: 360, overflow: 'auto' }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} sx={{ color: '#8B5CF6' }} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Bell size={40} color="rgba(255,255,255,0.2)" />
              <Typography sx={{ color: 'rgba(255,255,255,0.5)', mt: 2 }}>
                No notifications yet
              </Typography>
            </Box>
          ) : (
            notifications.map((notification) => (
              <Box
                key={notification.id}
                sx={{
                  p: 2,
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  bgcolor: notification.read ? 'transparent' : 'rgba(139, 92, 246, 0.08)',
                  cursor: notification.link ? 'pointer' : 'default',
                  '&:hover': {
                    bgcolor: notification.read 
                      ? 'rgba(255,255,255,0.03)' 
                      : 'rgba(139, 92, 246, 0.12)',
                  },
                  position: 'relative',
                }}
                onClick={() => {
                  if (!notification.read) markAsRead(notification.id);
                  if (notification.link) {
                    handleClose();
                    window.location.href = notification.link;
                  }
                }}
              >
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Box sx={{
                    p: 1,
                    borderRadius: 1.5,
                    bgcolor: 'rgba(255,255,255,0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {getIcon(notification)}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Typography
                        sx={{
                          color: notification.read ? 'rgba(255,255,255,0.7)' : 'white',
                          fontWeight: notification.read ? 400 : 600,
                          fontSize: '0.875rem',
                          flex: 1,
                        }}
                      >
                        {notification.title}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        sx={{
                          color: 'rgba(255,255,255,0.3)',
                          '&:hover': { color: '#EF4444', bgcolor: 'rgba(239,68,68,0.1)' },
                          ml: 1,
                          p: 0.5,
                        }}
                      >
                        <X size={14} />
                      </IconButton>
                    </Stack>
                    <Typography
                      sx={{
                        color: 'rgba(255,255,255,0.5)',
                        fontSize: '0.8rem',
                        mt: 0.25,
                        lineHeight: 1.4,
                      }}
                    >
                      {notification.message}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75 }}>
                      <Clock size={12} color="rgba(255,255,255,0.3)" />
                      <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.7rem' }}>
                        {formatTime(notification.created_at)}
                      </Typography>
                      {!notification.read && (
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            bgcolor: '#8B5CF6',
                          }}
                        />
                      )}
                    </Stack>
                  </Box>
                </Stack>
              </Box>
            ))
          )}
        </Box>

        {/* Footer */}
        {notifications.length > 0 && (
          <Box sx={{ 
            p: 1.5, 
            borderTop: '1px solid rgba(255,255,255,0.1)',
            textAlign: 'center',
          }}>
            <Button
              component={Link}
              href="/dashboard/notifications"
              onClick={handleClose}
              sx={{
                color: '#8B5CF6',
                fontSize: '0.8rem',
                textTransform: 'none',
                '&:hover': { bgcolor: 'rgba(139, 92, 246, 0.1)' },
              }}
            >
              View all notifications
            </Button>
          </Box>
        )}
      </Popover>
    </>
  );
}
