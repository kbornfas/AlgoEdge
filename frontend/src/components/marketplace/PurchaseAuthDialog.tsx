'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Stack,
  Box,
  TextField,
  Divider,
  Alert,
  IconButton,
} from '@mui/material';
import { X, Lock, UserPlus, LogIn } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface PurchaseAuthDialogProps {
  open: boolean;
  onClose: () => void;
  productName: string;
  productType: 'bot' | 'product' | 'signal' | 'api';
  returnUrl: string;
}

export default function PurchaseAuthDialog({
  open,
  onClose,
  productName,
  productType,
  returnUrl,
}: PurchaseAuthDialogProps) {
  const router = useRouter();
  const [mode, setMode] = useState<'choice' | 'login' | 'register'>('choice');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Close dialog and reload to complete purchase
      onClose();
      window.location.reload();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name: fullName }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Auto-login after registration
      const loginResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const loginData = await loginResponse.json();

      if (loginResponse.ok) {
        localStorage.setItem('token', loginData.token);
        localStorage.setItem('user', JSON.stringify(loginData.user));
        onClose();
        window.location.reload();
      } else {
        // Registration successful, redirect to login
        router.push(`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`);
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const renderChoice = () => (
    <>
      <DialogContent sx={{ pt: 3 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              bgcolor: 'rgba(34, 197, 94, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
            }}
          >
            <Lock size={32} color="#22C55E" />
          </Box>
          <Typography variant="h6" sx={{ color: '#FFFFFF', fontWeight: 700, mb: 1 }}>
            Sign In Required
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
            To purchase <strong>{productName}</strong>, please sign in or create an account.
          </Typography>
        </Box>

        <Stack spacing={2}>
          <Button
            fullWidth
            variant="contained"
            size="large"
            startIcon={<LogIn size={20} />}
            onClick={() => setMode('login')}
            sx={{
              bgcolor: '#22C55E',
              color: '#000',
              fontWeight: 700,
              py: 1.5,
              '&:hover': { bgcolor: '#16A34A' },
            }}
          >
            Sign In
          </Button>
          <Button
            fullWidth
            variant="outlined"
            size="large"
            startIcon={<UserPlus size={20} />}
            onClick={() => setMode('register')}
            sx={{
              borderColor: '#22C55E',
              color: '#22C55E',
              fontWeight: 700,
              py: 1.5,
              '&:hover': { bgcolor: 'rgba(34, 197, 94, 0.1)', borderColor: '#22C55E' },
            }}
          >
            Create Account
          </Button>
        </Stack>

        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', textAlign: 'center', mt: 3 }}>
          Creating an account is free and takes less than a minute
        </Typography>
      </DialogContent>
    </>
  );

  const renderLogin = () => (
    <>
      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={2.5}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(30, 41, 59, 0.8)',
                '& fieldset': { borderColor: 'rgba(34, 197, 94, 0.3)' },
                '&:hover fieldset': { borderColor: '#22C55E' },
                '&.Mui-focused fieldset': { borderColor: '#22C55E' },
              },
              '& .MuiInputBase-input': { color: '#FFFFFF' },
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
            }}
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(30, 41, 59, 0.8)',
                '& fieldset': { borderColor: 'rgba(34, 197, 94, 0.3)' },
                '&:hover fieldset': { borderColor: '#22C55E' },
                '&.Mui-focused fieldset': { borderColor: '#22C55E' },
              },
              '& .MuiInputBase-input': { color: '#FFFFFF' },
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
            }}
          />
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleLogin}
            disabled={loading || !email || !password}
            sx={{
              bgcolor: '#22C55E',
              color: '#000',
              fontWeight: 700,
              py: 1.5,
              '&:hover': { bgcolor: '#16A34A' },
            }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </Stack>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Button
            size="small"
            onClick={() => setMode('register')}
            sx={{ color: '#22C55E' }}
          >
            Don't have an account? Sign up
          </Button>
        </Box>
      </DialogContent>
    </>
  );

  const renderRegister = () => (
    <>
      <DialogContent sx={{ pt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Stack spacing={2.5}>
          <TextField
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(30, 41, 59, 0.8)',
                '& fieldset': { borderColor: 'rgba(34, 197, 94, 0.3)' },
                '&:hover fieldset': { borderColor: '#22C55E' },
                '&.Mui-focused fieldset': { borderColor: '#22C55E' },
              },
              '& .MuiInputBase-input': { color: '#FFFFFF' },
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
            }}
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(30, 41, 59, 0.8)',
                '& fieldset': { borderColor: 'rgba(34, 197, 94, 0.3)' },
                '&:hover fieldset': { borderColor: '#22C55E' },
                '&.Mui-focused fieldset': { borderColor: '#22C55E' },
              },
              '& .MuiInputBase-input': { color: '#FFFFFF' },
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
            }}
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            helperText="At least 8 characters"
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(30, 41, 59, 0.8)',
                '& fieldset': { borderColor: 'rgba(34, 197, 94, 0.3)' },
                '&:hover fieldset': { borderColor: '#22C55E' },
                '&.Mui-focused fieldset': { borderColor: '#22C55E' },
              },
              '& .MuiInputBase-input': { color: '#FFFFFF' },
              '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
              '& .MuiFormHelperText-root': { color: 'rgba(255,255,255,0.5)' },
            }}
          />
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleRegister}
            disabled={loading || !email || !password || !fullName || password.length < 8}
            sx={{
              bgcolor: '#22C55E',
              color: '#000',
              fontWeight: 700,
              py: 1.5,
              '&:hover': { bgcolor: '#16A34A' },
            }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </Stack>

        <Typography sx={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textAlign: 'center', mt: 2 }}>
          By creating an account, you agree to our Terms of Service and Privacy Policy
        </Typography>

        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Button
            size="small"
            onClick={() => setMode('login')}
            sx={{ color: '#22C55E' }}
          >
            Already have an account? Sign in
          </Button>
        </Box>
      </DialogContent>
    </>
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: 'rgba(30, 41, 59, 0.95)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          borderRadius: 3,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          color: '#FFFFFF',
          pb: 1,
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>
          {mode === 'choice' && 'Continue to Purchase'}
          {mode === 'login' && 'Sign In'}
          {mode === 'register' && 'Create Account'}
        </Typography>
        <IconButton onClick={onClose} sx={{ color: 'rgba(255,255,255,0.6)' }}>
          <X size={20} />
        </IconButton>
      </DialogTitle>

      {mode === 'choice' && renderChoice()}
      {mode === 'login' && renderLogin()}
      {mode === 'register' && renderRegister()}
    </Dialog>
  );
}
