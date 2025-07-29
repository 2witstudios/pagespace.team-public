import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './use-auth';

export function useSocket() {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      const newSocket = io('http://localhost:3001', {
        withCredentials: true, // Send cookies with the connection request
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [isAuthenticated]);

  return socket;
}