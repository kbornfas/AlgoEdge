'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  Alert,
  CircularProgress,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import {
  Monitor,
  Smartphone,
  Tablet,
  Globe,
  Clock,
  MapPin,
  Trash2,
  Shield,
  LogOut,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import Link from 'next/link';

interface Session {
  id: string;
  deviceType: string;
  deviceName: string;
  browser: string;
  os: string;
  ip: string;
  location: string | null;
  lastActive: string;
  createdAt: string;
  current: boolean;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; sessionId?: string; all?: boolean }>({ open: false });

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    setRevoking(sessionId);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSessions(sessions.filter(s => s.id !== sessionId));
        setAlert({ type: 'success', message: 'Session revoked successfully' });
      } else {
        setAlert({ type: 'error', message: 'Failed to revoke session' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Network error' });
    } finally {
      setRevoking(null);
      setConfirmDialog({ open: false });
    }
  };

  const revokeAllOtherSessions = async () => {
    setRevokingAll(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/sessions/revoke-others`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(sessions.filter(s => s.current));
        setAlert({ type: 'success', message: `Revoked ${data.revokedCount} sessions` });
      } else {
        setAlert({ type: 'error', message: 'Failed to revoke sessions' });
      }
    } catch (error) {
      setAlert({ type: 'error', message: 'Network error' });
    } finally {
      setRevokingAll(false);
      setConfirmDialog({ open: false });
    }
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile': return <Smartphone size={24} />;
      case 'tablet': return <Tablet size={24} />;
      default: return <Monitor size={24} />;
    }
  };

  const formatTimeAgo = (date: string) => {
    const now = new Date();
    const then = new Date(date);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return then.toLocaleDateString();
  };

  const currentSession = sessions.find(s => s.current);
  const otherSessions = sessions.filter(s => !s.current);

  return (
    <Box sx={{ 
      minHeight: '100vh', 
      bgcolor: '#0a0f1a', 
      py: { xs: 2, md: 4 },
      px: { xs: 2, md: 4 },
    }}>
      <Box sx={{ maxWidth: 800, mx: 'auto' }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
          <Box sx={{ p: 1.5, bgcolor: 'rgba(139, 92, 246, 0.2)', borderRadius: 2 }}>
            <Shield size={24} color="#8B5CF6" />
          </Box>
          <Box>
            <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
              Active Sessions
            </Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.875rem' }}>
              Manage your active login sessions across devices
            </Typography>
          </Box>
        </Stack>

        {/* Back link */}
        <Button
          component={Link}
          href="/dashboard/settings"
          sx={{ color: 'rgba(255,255,255,0.5)', mb: 3 }}
          startIcon={<span>←</span>}
        >
          Back to Settings
        </Button>

        {alert && (
          <Alert 
            severity={alert.type} 
            sx={{ mb: 3 }} 
            onClose={() => setAlert(null)}
          >
            {alert.message}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#8B5CF6' }} />
          </Box>
        ) : (
          <>
            {/* Current Session */}
            {currentSession && (
              <Card sx={{ 
                bgcolor: 'rgba(34, 197, 94, 0.1)', 
                border: '1px solid rgba(34, 197, 94, 0.3)',
                mb: 3,
              }}>
                <CardContent>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                    <CheckCircle size={20} color="#22C55E" />
                    <Typography sx={{ color: '#22C55E', fontWeight: 600 }}>
                      Current Session
                    </Typography>
                  </Stack>
                  <SessionCard session={currentSession} isCurrent />
                </CardContent>
              </Card>
            )}

            {/* Other Sessions */}
            <Card sx={{ 
              bgcolor: 'rgba(255,255,255,0.02)', 
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
                  <Typography sx={{ color: 'white', fontWeight: 600 }}>
                    Other Sessions ({otherSessions.length})
                  </Typography>
                  {otherSessions.length > 0 && (
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<LogOut size={16} />}
                      onClick={() => setConfirmDialog({ open: true, all: true })}
                      disabled={revokingAll}
                    >
                      Sign Out All
                    </Button>
                  )}
                </Stack>

                {otherSessions.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Shield size={40} color="rgba(255,255,255,0.2)" />
                    <Typography sx={{ color: 'rgba(255,255,255,0.5)', mt: 2 }}>
                      No other active sessions
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.875rem' }}>
                      You're only signed in on this device
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {otherSessions.map((session) => (
                      <Box key={session.id}>
                        <SessionCard
                          session={session}
                          onRevoke={() => setConfirmDialog({ open: true, sessionId: session.id })}
                          revoking={revoking === session.id}
                        />
                        <Divider sx={{ mt: 2, borderColor: 'rgba(255,255,255,0.05)' }} />
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>

            {/* Security Tips */}
            <Card sx={{ 
              bgcolor: 'rgba(59, 130, 246, 0.1)', 
              border: '1px solid rgba(59, 130, 246, 0.2)',
              mt: 3,
            }}>
              <CardContent>
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <AlertTriangle size={20} color="#3B82F6" style={{ marginTop: 2 }} />
                  <Box>
                    <Typography sx={{ color: 'white', fontWeight: 600, mb: 0.5 }}>
                      Security Tip
                    </Typography>
                    <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem' }}>
                      Don't recognize a session? Sign out of it immediately and consider changing your password.
                      Enable two-factor authentication for additional security.
                    </Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </>
        )}

        {/* Confirm Dialog */}
        <Dialog
          open={confirmDialog.open}
          onClose={() => setConfirmDialog({ open: false })}
          PaperProps={{ sx: { bgcolor: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)' } }}
        >
          <DialogTitle sx={{ color: 'white' }}>
            {confirmDialog.all ? 'Sign Out All Other Sessions?' : 'Sign Out This Session?'}
          </DialogTitle>
          <DialogContent>
            <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
              {confirmDialog.all 
                ? 'This will sign out all sessions except your current one. You will need to sign in again on those devices.'
                : 'This will sign out the selected session. You will need to sign in again on that device.'}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setConfirmDialog({ open: false })}
              sx={{ color: 'rgba(255,255,255,0.5)' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              color="error"
              onClick={() => {
                if (confirmDialog.all) {
                  revokeAllOtherSessions();
                } else if (confirmDialog.sessionId) {
                  revokeSession(confirmDialog.sessionId);
                }
              }}
              disabled={revoking !== null || revokingAll}
            >
              {(revoking || revokingAll) ? <CircularProgress size={20} /> : 'Sign Out'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
}

// Session Card Component
function SessionCard({ 
  session, 
  isCurrent = false, 
  onRevoke, 
  revoking = false 
}: { 
  session: Session; 
  isCurrent?: boolean; 
  onRevoke?: () => void;
  revoking?: boolean;
}) {
  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile': return <Smartphone size={24} color={isCurrent ? '#22C55E' : '#8B5CF6'} />;
      case 'tablet': return <Tablet size={24} color={isCurrent ? '#22C55E' : '#8B5CF6'} />;
      default: return <Monitor size={24} color={isCurrent ? '#22C55E' : '#8B5CF6'} />;
    }
  };

  const formatTimeAgo = (date: string) => {
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

  return (
    <Stack direction="row" spacing={2} alignItems="flex-start">
      <Box sx={{ 
        p: 1.5, 
        bgcolor: isCurrent ? 'rgba(34, 197, 94, 0.2)' : 'rgba(139, 92, 246, 0.2)', 
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {getDeviceIcon(session.deviceType)}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Typography sx={{ color: 'white', fontWeight: 600 }}>
            {session.deviceName}
          </Typography>
          {isCurrent && (
            <Chip 
              label="This device" 
              size="small" 
              sx={{ 
                bgcolor: 'rgba(34, 197, 94, 0.2)', 
                color: '#22C55E',
                height: 20,
                fontSize: '0.7rem',
              }} 
            />
          )}
        </Stack>
        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
          {session.browser} on {session.os}
        </Typography>
        <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Globe size={14} color="rgba(255,255,255,0.4)" />
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
              {session.ip?.replace('::ffff:', '') || 'Unknown IP'}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={0.5} alignItems="center">
            <Clock size={14} color="rgba(255,255,255,0.4)" />
            <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem' }}>
              {formatTimeAgo(session.lastActive)}
            </Typography>
          </Stack>
        </Stack>
      </Box>
      {!isCurrent && onRevoke && (
        <IconButton
          onClick={onRevoke}
          disabled={revoking}
          sx={{ 
            color: 'rgba(239, 68, 68, 0.7)',
            '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' },
          }}
        >
          {revoking ? <CircularProgress size={20} /> : <Trash2 size={20} />}
        </IconButton>
      )}
    </Stack>
  );
}
