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
    <Box sx={{ position: 'relative', minHeight: '100%', width: '100%' }}>
      {/* Pull indicator */}
      {(pullProgress > 0 || isRefreshing) && (
        <Box
          sx={{
            position: 'fixed',
            top: 70,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            transition: 'opacity 0.2s',
            pointerEvents: 'none',
          }}
        >
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              bgcolor: 'background.paper',
              boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid rgba(139, 92, 246, 0.3)',
            }}
          >
            <CircularProgress
              size={26}
              variant={isRefreshing ? 'indeterminate' : 'determinate'}
              value={pullProgress * 100}
              sx={{ color: '#8B5CF6' }}
            />
          </Box>
        </Box>
      )}

      {/* Content */}
      <Box
        sx={{
          transform: isRefreshing ? 'translateY(60px)' : `translateY(${pullProgress * 60}px)`,
          transition: isRefreshing ? 'transform 0.3s ease' : 'none',
          width: '100%',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
