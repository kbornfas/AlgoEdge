'use client';

import { Box, Container, Typography, Button } from '@mui/material';
import { AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center' }}>
          <Box
            sx={{
              display: 'inline-flex',
              p: 3,
              borderRadius: '50%',
              bgcolor: 'error.main',
              color: 'white',
              mb: 3,
            }}
          >
            <AlertCircle size={64} />
          </Box>
          
          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '4rem', md: '6rem' },
              fontWeight: 700,
              mb: 2,
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            404
          </Typography>
          
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Page Not Found
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              component={Link}
              href="/"
              variant="contained"
              size="large"
            >
              Go Home
            </Button>
            <Button
              component={Link}
              href="/dashboard"
              variant="outlined"
              size="large"
            >
              Go to Dashboard
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
