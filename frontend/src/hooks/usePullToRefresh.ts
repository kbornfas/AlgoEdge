'use client';

import { useEffect, useCallback, useState, useRef } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  disabled?: boolean;
}

export function usePullToRefresh({ 
  onRefresh, 
  threshold = 150,
  disabled = false 
}: UsePullToRefreshOptions) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullProgress, setPullProgress] = useState(0);
  const startYRef = useRef(0);
  const isPullingRef = useRef(false);

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

    const isAtTop = () => {
      // Check both window scroll and any scrollable parent
      const scrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop;
      return scrollY <= 2; // Stricter tolerance to prevent accidental triggers
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (isAtTop() && !isRefreshing) {
        startYRef.current = e.touches[0].clientY;
        isPullingRef.current = true;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isPullingRef.current || isRefreshing) return;
      
      const currentY = e.touches[0].clientY;
      const diff = currentY - startYRef.current;
      
      if (diff > 0 && isAtTop()) {
        const progress = Math.min(diff / threshold, 1);
        setPullProgress(progress);
        
        // Prevent default scroll when pulling down
        if (diff > 10) {
          e.preventDefault();
        }
      } else if (diff < 0) {
        // User is scrolling up, cancel pull
        isPullingRef.current = false;
        setPullProgress(0);
      }
    };

    const handleTouchEnd = () => {
      if (isPullingRef.current) {
        if (pullProgress >= 1 && !isRefreshing) {
          handleRefresh();
        } else {
          setPullProgress(0);
        }
      }
      isPullingRef.current = false;
    };

    // Use window level listeners for better mobile support
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [threshold, isRefreshing, pullProgress, handleRefresh, disabled]);

  return { isRefreshing, pullProgress };
}
