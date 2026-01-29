'use client';

import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Typography,
  Stack,
  Chip,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import {
  Users,
  Mail,
  Clock,
  Ban,
  AlertTriangle,
} from 'lucide-react';

interface BulkActionsProps {
  selectedUsers: number[];
  onActionComplete: () => void;
  onClearSelection: () => void;
}

export default function AdminBulkActions({ selectedUsers, onActionComplete, onClearSelection }: BulkActionsProps) {
  const [dialogType, setDialogType] = useState<'extend' | 'revoke' | 'block' | 'email' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Extend subscription form
  const [extendDays, setExtendDays] = useState('30');
  const [extendReason, setExtendReason] = useState('');
  
  // Block form
  const [blockAction, setBlockAction] = useState(true);
  const [blockReason, setBlockReason] = useState('');
  
  // Email form
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  
  // Revoke reason
  const [revokeReason, setRevokeReason] = useState('');

  const handleAction = async () => {
    if (selectedUsers.length === 0) {
      setError('No users selected');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
      let endpoint = '';
      let body: any = {};

      switch (dialogType) {
        case 'extend':
          endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/bulk/extend-subscription`;
          body = { userIds: selectedUsers, days: parseInt(extendDays), reason: extendReason };
          break;
        case 'revoke':
          endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/bulk/revoke-subscription`;
          body = { userIds: selectedUsers, reason: revokeReason };
          break;
        case 'block':
          endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/bulk/block`;
          body = { userIds: selectedUsers, block: blockAction, reason: blockReason };
          break;
        case 'email':
          endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/bulk/email`;
          body = { userIds: selectedUsers, subject: emailSubject, htmlContent: emailContent };
          break;
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(data.message || 'Action completed successfully');
        setTimeout(() => {
          setDialogType(null);
          onActionComplete();
          onClearSelection();
          resetForms();
        }, 1500);
      } else {
        setError(data.error || 'Action failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForms = () => {
    setExtendDays('30');
    setExtendReason('');
    setBlockAction(true);
    setBlockReason('');
    setEmailSubject('');
    setEmailContent('');
    setRevokeReason('');
    setError('');
    setSuccess('');
  };

  if (selectedUsers.length === 0) {
    return null;
  }

  return (
    <>
      {/* Bulk Actions Bar */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          bgcolor: 'rgba(139, 92, 246, 0.15)',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          borderRadius: 2,
          p: 2,
          mb: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Stack direction="row" spacing={1} alignItems="center">
          <Chip
            label={`${selectedUsers.length} selected`}
            color="primary"
            sx={{ bgcolor: '#8B5CF6' }}
          />
          <Button size="small" onClick={onClearSelection} sx={{ color: 'rgba(255,255,255,0.7)' }}>
            Clear
          </Button>
        </Stack>
        
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Button
            size="small"
            variant="outlined"
            startIcon={<Clock size={16} />}
            onClick={() => setDialogType('extend')}
            sx={{ borderColor: '#22C55E', color: '#22C55E' }}
          >
            Extend Subscription
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<AlertTriangle size={16} />}
            onClick={() => setDialogType('revoke')}
            sx={{ borderColor: '#F59E0B', color: '#F59E0B' }}
          >
            Revoke Subscription
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Ban size={16} />}
            onClick={() => setDialogType('block')}
            sx={{ borderColor: '#EF4444', color: '#EF4444' }}
          >
            Block/Unblock
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<Mail size={16} />}
            onClick={() => setDialogType('email')}
            sx={{ borderColor: '#3B82F6', color: '#3B82F6' }}
          >
            Send Email
          </Button>
        </Stack>
      </Box>

      {/* Extend Subscription Dialog */}
      <Dialog
        open={dialogType === 'extend'}
        onClose={() => !loading && setDialogType(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)' } }}
      >
        <DialogTitle sx={{ color: 'white' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Clock size={20} color="#22C55E" />
            <span>Extend Subscription for {selectedUsers.length} Users</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: 'rgba(255,255,255,0.5)' }}>Days to Add</InputLabel>
              <Select
                value={extendDays}
                label="Days to Add"
                onChange={(e) => setExtendDays(e.target.value)}
                sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.2)' } }}
              >
                <MenuItem value="7">7 days</MenuItem>
                <MenuItem value="14">14 days</MenuItem>
                <MenuItem value="30">30 days (1 month)</MenuItem>
                <MenuItem value="90">90 days (3 months)</MenuItem>
                <MenuItem value="180">180 days (6 months)</MenuItem>
                <MenuItem value="365">365 days (1 year)</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Reason (optional)"
              value={extendReason}
              onChange={(e) => setExtendReason(e.target.value)}
              multiline
              rows={2}
              sx={{
                '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogType(null)} disabled={loading} sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAction}
            disabled={loading}
            sx={{ bgcolor: '#22C55E', '&:hover': { bgcolor: '#16A34A' } }}
          >
            {loading ? <CircularProgress size={20} /> : 'Extend'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Revoke Subscription Dialog */}
      <Dialog
        open={dialogType === 'revoke'}
        onClose={() => !loading && setDialogType(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)' } }}
      >
        <DialogTitle sx={{ color: 'white' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <AlertTriangle size={20} color="#F59E0B" />
            <span>Revoke Subscription for {selectedUsers.length} Users</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          <Alert severity="warning" sx={{ mb: 2 }}>
            This will immediately expire the subscription for all selected users.
          </Alert>
          <TextField
            label="Reason"
            value={revokeReason}
            onChange={(e) => setRevokeReason(e.target.value)}
            multiline
            rows={2}
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } },
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogType(null)} disabled={loading} sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAction}
            disabled={loading}
            sx={{ bgcolor: '#F59E0B', '&:hover': { bgcolor: '#D97706' } }}
          >
            {loading ? <CircularProgress size={20} /> : 'Revoke'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Block/Unblock Dialog */}
      <Dialog
        open={dialogType === 'block'}
        onClose={() => !loading && setDialogType(null)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)' } }}
      >
        <DialogTitle sx={{ color: 'white' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Ban size={20} color="#EF4444" />
            <span>Block/Unblock {selectedUsers.length} Users</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={blockAction}
                  onChange={(e) => setBlockAction(e.target.checked)}
                  sx={{ color: 'rgba(255,255,255,0.5)', '&.Mui-checked': { color: '#EF4444' } }}
                />
              }
              label={<Typography sx={{ color: 'white' }}>Block users (uncheck to unblock)</Typography>}
            />
            <TextField
              label="Reason"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              multiline
              rows={2}
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogType(null)} disabled={loading} sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAction}
            disabled={loading}
            sx={{ bgcolor: '#EF4444', '&:hover': { bgcolor: '#DC2626' } }}
          >
            {loading ? <CircularProgress size={20} /> : (blockAction ? 'Block' : 'Unblock')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Send Email Dialog */}
      <Dialog
        open={dialogType === 'email'}
        onClose={() => !loading && setDialogType(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)' } }}
      >
        <DialogTitle sx={{ color: 'white' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Mail size={20} color="#3B82F6" />
            <span>Send Email to {selectedUsers.length} Users</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              You can use {'{{username}}'}, {'{{full_name}}'}, and {'{{email}}'} as placeholders.
            </Alert>
            <TextField
              label="Subject"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              fullWidth
              required
              sx={{
                '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
              }}
            />
            <TextField
              label="Email Content (HTML)"
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              multiline
              rows={8}
              fullWidth
              required
              placeholder="<h1>Hello {{full_name}}</h1><p>Your message here...</p>"
              sx={{
                '& .MuiOutlinedInput-root': { color: 'white', '& fieldset': { borderColor: 'rgba(255,255,255,0.2)' } },
                '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.5)' },
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogType(null)} disabled={loading} sx={{ color: 'rgba(255,255,255,0.5)' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleAction}
            disabled={loading || !emailSubject || !emailContent}
            sx={{ bgcolor: '#3B82F6', '&:hover': { bgcolor: '#2563EB' } }}
          >
            {loading ? <CircularProgress size={20} /> : 'Send Emails'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
