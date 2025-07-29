import useSWR from 'swr';
import { useEffect } from 'react';
import { useTokenRefresh } from './use-token-refresh';

interface User {
  id: string;
  name: string | null;
  email: string | null;
}

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) {
    throw new Error('Not authenticated');
  }
  return res.json();
});

export function useAuth() {
  const { data: user, error, isLoading, mutate } = useSWR<User>('/api/auth/me', fetcher);
  const { startTokenRefresh, stopTokenRefresh, isRefreshing } = useTokenRefresh();

  const isAuthenticated = !error && !isLoading && !!user;

  // Start/stop token refresh based on authentication status
  useEffect(() => {
    if (isAuthenticated) {
      startTokenRefresh();
    } else {
      stopTokenRefresh();
    }

    return () => {
      stopTokenRefresh();
    };
  }, [isAuthenticated, startTokenRefresh, stopTokenRefresh]);

  return {
    user,
    isLoading: isLoading || isRefreshing,
    isError: error,
    isAuthenticated,
    mutate,
  };
}