'use client';

import { useEffect, useCallback, useState } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  disabled?: boolean;
}

export function usePullToRefresh({ 
  onRefresh, 
  threshold = 80,
  disabled = false 
}: UsePullToRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing || disabled) return;
    
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
      setPullProgress(0);
    }
  }, [onRefresh, isRefreshing, disabled]);

  useEffect(() => {
    if (disabled) return;

    let startY = 0;
    let currentY = 0;
    let isPulling = false;

    const handleTouchStart = (e: TouchEvent) => {
      // Only trigger if at top of page
      if (window.scrollY === 0) {
        startY = e.touches[0].clientY;
        isPulling = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPulling || isRefreshing) return;
      
      currentY = e.touches[0].clientY;
      const diff = currentY - startY;
      
      if (diff > 0 && window.scrollY === 0) {
        const progress = Math.min(diff / threshold, 1);
        setPullProgress(progress);
        
        // Prevent default scroll when pulling
        if (diff > 10) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = () => {
      if (isPulling && pullProgress >= 1 && !isRefreshing) {
        handleRefresh();
      } else {
        setPullProgress(0);
      }
      isPulling = false;
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [threshold, isRefreshing, pullProgress, handleRefresh, disabled]);

  return { isRefreshing, pullProgress };
}
