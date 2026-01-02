'use client';

import { useEffect } from 'react';
import { Box, Container, Typography, Button } from '@mui/material';
import { AlertTriangle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log error to console (in production, send to error tracking service)
    console.error('Application error:', error);
  }, [error]);

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
              bgcolor: 'warning.main',
              color: 'white',
              mb: 3,
            }}
          >
            <AlertTriangle size={64} />
          </Box>
          
          <Typography
            variant="h2"
            sx={{
              fontWeight: 700,
              mb: 2,
              background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Something Went Wrong
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            We encountered an unexpected error. Please try again or contact support if the problem persists.
          </Typography>
          
          {process.env.NODE_ENV === 'development' && error.message && (
            <Box
              sx={{
                mb: 4,
                p: 2,
                bgcolor: 'error.light',
                borderRadius: 1,
                textAlign: 'left',
              }}
            >
              <Typography variant="caption" component="pre" sx={{ fontSize: '0.75rem', whiteSpace: 'pre-wrap' }}>
                {error.message}
              </Typography>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Button
              onClick={reset}
              variant="contained"
              size="large"
            >
              Try Again
            </Button>
            <Button
              href="/"
              variant="outlined"
              size="large"
            >
              Go Home
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
