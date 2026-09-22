import { useEffect, useRef } from 'react';
import { useAuthStore } from '../stores/authStore';

export function useSocket() {
  const socketRef = useRef<any>(null);
  const { accessToken } = useAuthStore();
  
  useEffect(() => {
    if (accessToken && !socketRef.current) {
      // socketRef.current = io(process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000', {
      //   auth: { token: accessToken },
      //   transports: ['websocket'],
      // });
    }
    return () => {
      // socketRef.current?.disconnect();
    };
  }, [accessToken]);
  
  return { socket: socketRef.current };
}
