'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface User {
  id: string;
  name: string | null;
  email: string | null;
}

interface AuthState {
  // Auth state
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  lastAuthCheck: number | null;
  
  // Token refresh state
  isRefreshing: boolean;
  refreshTimeoutId: NodeJS.Timeout | null;
  
  // Session state
  sessionStartTime: number | null;
  lastActivity: number | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setRefreshing: (refreshing: boolean) => void;
  setRefreshTimeout: (timeoutId: NodeJS.Timeout | null) => void;
  updateActivity: () => void;
  startSession: () => void;
  endSession: () => void;
  reset: () => void;
}

const ACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const AUTH_CHECK_INTERVAL = 60 * 1000; // 1 minute

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isLoading: false,
      isAuthenticated: false,
      lastAuthCheck: null,
      isRefreshing: false,
      refreshTimeoutId: null,
      sessionStartTime: null,
      lastActivity: null,

      // Actions
      setUser: (user) => set((state) => ({
        user,
        isAuthenticated: !!user,
        lastAuthCheck: Date.now(),
        // Start session if user is set and session not already started
        sessionStartTime: user && !state.sessionStartTime ? Date.now() : state.sessionStartTime,
        lastActivity: user ? Date.now() : state.lastActivity,
      })),

      setLoading: (isLoading) => set({ isLoading }),

      setRefreshing: (isRefreshing) => set({ isRefreshing }),

      setRefreshTimeout: (refreshTimeoutId) => set({ refreshTimeoutId }),

      updateActivity: () => {
        const now = Date.now();
        const state = get();
        
        // Only update if user is authenticated
        if (state.isAuthenticated) {
          set({ lastActivity: now });
        }
      },

      startSession: () => set({
        sessionStartTime: Date.now(),
        lastActivity: Date.now(),
      }),

      endSession: () => {
        const state = get();
        
        // Clear any pending refresh timeout
        if (state.refreshTimeoutId) {
          clearTimeout(state.refreshTimeoutId);
        }
        
        set({
          user: null,
          isAuthenticated: false,
          sessionStartTime: null,
          lastActivity: null,
          refreshTimeoutId: null,
          isRefreshing: false,
        });
      },

      reset: () => {
        const state = get();
        
        // Clear any pending refresh timeout
        if (state.refreshTimeoutId) {
          clearTimeout(state.refreshTimeoutId);
        }
        
        set({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          lastAuthCheck: null,
          isRefreshing: false,
          refreshTimeoutId: null,
          sessionStartTime: null,
          lastActivity: null,
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage), // Use sessionStorage for security
      partialize: (state) => ({
        // Only persist non-sensitive state
        sessionStartTime: state.sessionStartTime,
        lastActivity: state.lastActivity,
        lastAuthCheck: state.lastAuthCheck,
      }),
    }
  )
);

// Helper functions for auth store
export const authStoreHelpers = {
  // Check if session is expired due to inactivity
  isSessionExpired: (): boolean => {
    const state = useAuthStore.getState();
    if (!state.lastActivity || !state.isAuthenticated) return false;
    
    return Date.now() - state.lastActivity > ACTIVITY_TIMEOUT;
  },

  // Check if auth data is stale and needs refresh
  needsAuthCheck: (): boolean => {
    const state = useAuthStore.getState();
    if (!state.lastAuthCheck) return true;
    
    return Date.now() - state.lastAuthCheck > AUTH_CHECK_INTERVAL;
  },

  // Get session duration in milliseconds
  getSessionDuration: (): number => {
    const state = useAuthStore.getState();
    if (!state.sessionStartTime) return 0;
    
    return Date.now() - state.sessionStartTime;
  },

  // Update activity timestamp (call on user interactions)
  trackActivity: (): void => {
    useAuthStore.getState().updateActivity();
  },
};