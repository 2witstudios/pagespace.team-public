'use client';

import { useEffect, useRef, useState } from 'react';
import { mutate } from 'swr';
import { useRouter } from 'next/navigation';

interface TokenRefreshOptions {
  refreshBeforeExpiryMs?: number; // How long before expiry to refresh (default: 2 minutes)
  retryAttempts?: number; // Number of retry attempts (default: 3)
  retryDelayMs?: number; // Delay between retries (default: 1000ms)
}

export function useTokenRefresh(options: TokenRefreshOptions = {}) {
  const {
    refreshBeforeExpiryMs = 2 * 60 * 1000, // 2 minutes
    retryAttempts = 3,
    retryDelayMs = 1000
  } = options;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const router = useRouter();

  const clearRefreshTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      await mutate('/api/auth/me', null, false);
      router.push('/auth/signin');
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if logout fails
      router.push('/auth/signin');
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      setIsRefreshing(true);
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        // Token refreshed successfully, update auth cache
        await mutate('/api/auth/me');
        retryCountRef.current = 0;
        return true;
      } else if (response.status === 401) {
        // Refresh token is invalid or expired
        console.log('Refresh token expired, logging out');
        await logout();
        return false;
      } else if (response.status === 429) {
        // Rate limited
        console.log('Token refresh rate limited');
        return false;
      } else {
        throw new Error(`Refresh failed with status ${response.status}`);
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  };

  const scheduleTokenRefresh = () => {
    clearRefreshTimeout();

    // Access tokens expire in 15 minutes, so refresh before that
    const refreshInMs = (15 * 60 * 1000) - refreshBeforeExpiryMs;
    
    timeoutRef.current = setTimeout(async () => {
      const success = await refreshToken();
      
      if (success) {
        // Schedule the next refresh
        scheduleTokenRefresh();
      } else {
        // Retry logic
        if (retryCountRef.current < retryAttempts) {
          retryCountRef.current++;
          console.log(`Token refresh failed, retrying in ${retryDelayMs}ms (attempt ${retryCountRef.current}/${retryAttempts})`);
          
          setTimeout(() => {
            scheduleTokenRefresh();
          }, retryDelayMs);
        } else {
          console.log('Max retry attempts reached, logging out');
          await logout();
        }
      }
    }, refreshInMs);
  };

  const startTokenRefresh = () => {
    retryCountRef.current = 0;
    scheduleTokenRefresh();
  };

  const stopTokenRefresh = () => {
    clearRefreshTimeout();
    retryCountRef.current = 0;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearRefreshTimeout();
    };
  }, []);

  return {
    startTokenRefresh,
    stopTokenRefresh,
    refreshToken,
    isRefreshing,
  };
}