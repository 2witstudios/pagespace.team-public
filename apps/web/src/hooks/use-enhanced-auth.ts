'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, authStoreHelpers } from '@/stores/auth-store';
import { useTokenRefresh } from './use-token-refresh';

interface User {
  id: string;
  name: string | null;
  email: string | null;
}

interface AuthActions {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export function useEnhancedAuth(): {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isRefreshing: boolean;
  sessionDuration: number;
  actions: AuthActions;
} {
  const {
    user,
    isLoading,
    isAuthenticated,
    isRefreshing,
    setUser,
    setLoading,
    startSession,
    endSession,
    updateActivity,
  } = useAuthStore();

  const { refreshToken } = useTokenRefresh();
  const router = useRouter();

  // Check authentication status
  const checkAuth = useCallback(async () => {
    if (isLoading) return;

    setLoading(true);
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        updateActivity();
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [isLoading, setUser, setLoading, updateActivity]);

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        startSession();
        return { success: true };
      } else {
        const errorData = await response.json();
        return { 
          success: false, 
          error: errorData.error || 'Login failed' 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: 'Network error. Please try again.' 
      };
    } finally {
      setLoading(false);
    }
  }, [setUser, setLoading, startSession]);

  // Logout function
  const logout = useCallback(async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      endSession();
      router.push('/auth/signin');
    }
  }, [endSession, router]);

  // Refresh authentication
  const refreshAuth = useCallback(async () => {
    const success = await refreshToken();
    if (success) {
      await checkAuth();
    } else {
      await logout();
    }
  }, [refreshToken, checkAuth, logout]);

  // Auto-refresh and session management
  useEffect(() => {
    let refreshInterval: NodeJS.Timeout;
    let activityCheckInterval: NodeJS.Timeout;

    if (isAuthenticated) {
      // Check for token refresh every 13 minutes (tokens expire in 15 minutes)
      refreshInterval = setInterval(async () => {
        await refreshAuth();
      }, 13 * 60 * 1000);

      // Check for session expiry every minute
      activityCheckInterval = setInterval(() => {
        if (authStoreHelpers.isSessionExpired()) {
          console.log('Session expired due to inactivity');
          logout();
        }
      }, 60 * 1000);
    }

    return () => {
      if (refreshInterval) clearInterval(refreshInterval);
      if (activityCheckInterval) clearInterval(activityCheckInterval);
    };
  }, [isAuthenticated, refreshAuth, logout]);

  // Initial auth check
  useEffect(() => {
    if (!isAuthenticated && authStoreHelpers.needsAuthCheck()) {
      checkAuth();
    }
  }, [isAuthenticated, checkAuth]);

  // Track user activity
  useEffect(() => {
    if (!isAuthenticated) return;

    const trackActivity = () => {
      updateActivity();
    };

    // Track various user activities
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
    
    events.forEach(event => {
      document.addEventListener(event, trackActivity, true);
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, trackActivity, true);
      });
    };
  }, [isAuthenticated, updateActivity]);

  return {
    user,
    isLoading,
    isAuthenticated,
    isRefreshing,
    sessionDuration: authStoreHelpers.getSessionDuration(),
    actions: {
      login,
      logout,
      refreshAuth,
      checkAuth,
    },
  };
}