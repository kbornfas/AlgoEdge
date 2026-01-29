'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Lock, Mail, Eye, EyeOff, Shield } from 'lucide-react';

export default function AdminLogin() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

    try {
      // Use backend login API directly
      // Backend expects 'username' field but accepts email values
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: formData.email, password: formData.password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Check if user is admin
      if (!data.user?.is_admin) {
        throw new Error('Admin access required');
      }

      // Store admin token (set both for compatibility)
      localStorage.setItem('adminToken', data.token);
      localStorage.setItem('token', data.token);
      localStorage.setItem('adminUser', JSON.stringify(data.user));

      // Redirect to admin dashboard
      router.push('/admin/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        backgroundImage: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)',
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={4}
          sx={{
            p: 4,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              component="img"
              src="/images/logo.png"
              alt="AlgoEdge Logo"
              sx={{ width: 80, height: 80, objectFit: 'contain', mx: 'auto', mb: 2 }}
            />
            <Typography variant="h4" gutterBottom fontWeight={600}>
              Admin Login
            </Typography>
            <Typography variant="body2" color="text.secondary">
              AlgoEdge Administration Portal
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} autoComplete="on">
            <TextField
              fullWidth
              label="Admin Email"
              name="email"
              id="admin-email"
              type="email"
              autoComplete="username"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Mail size={20} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Admin Password"
              name="password"
              id="admin-password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock size={20} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? 'Logging in...' : 'Login as Admin'}
            </Button>
          </form>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Button
              variant="text"
              size="small"
              onClick={() => router.push('/')}
              sx={{ color: 'text.secondary' }}
            >
              Back to Home
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
