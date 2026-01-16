'use client';

import { Box, CircularProgress, Typography } from '@mui/material';

export default function Loading() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        gap: 3,
        bgcolor: 'background.default',
      }}
    >
      <Box
        component="img"
        src="/images/logo.png"
        alt="AlgoEdge Logo"
        sx={{
          width: 100,
          height: 100,
          objectFit: 'contain',
          animation: 'pulse 2s ease-in-out infinite',
          '@keyframes pulse': {
            '0%, 100%': { opacity: 1, transform: 'scale(1)' },
            '50%': { opacity: 0.7, transform: 'scale(0.95)' },
          },
        }}
      />
      <CircularProgress size={40} sx={{ color: '#10b981' }} />
      <Typography variant="h6" color="text.secondary">
        Loading AlgoEdge...
      </Typography>
    </Box>
  );
}
