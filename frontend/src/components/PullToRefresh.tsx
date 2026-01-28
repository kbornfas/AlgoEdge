'use client';

import { Box, CircularProgress } from '@mui/material';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { ReactNode } from 'react';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
}

export default function PullToRefresh({ children, onRefresh, disabled = false }: PullToRefreshProps) {
  const { isRefreshing, pullProgress } = usePullToRefresh({ 
    onRefresh, 
    threshold: 80,
    disabled 
  });

  return (
    <Box sx={{ position: 'relative', minHeight: '100%' }}>
      {/* Pull indicator */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: `translateX(-50%) translateY(${pullProgress * 60 - 50}px)`,
          zIndex: 1000,
          opacity: pullProgress > 0.1 ? 1 : 0,
          transition: isRefreshing ? 'none' : 'opacity 0.2s',
          pointerEvents: 'none',
        }}
      >
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            bgcolor: 'background.paper',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CircularProgress
            size={24}
            variant={isRefreshing ? 'indeterminate' : 'determinate'}
            value={pullProgress * 100}
            sx={{ color: '#8B5CF6' }}
          />
        </Box>
      </Box>

      {/* Content with pull offset */}
      <Box
        sx={{
          transform: isRefreshing ? 'translateY(50px)' : `translateY(${pullProgress * 50}px)`,
          transition: isRefreshing ? 'transform 0.2s' : 'none',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
