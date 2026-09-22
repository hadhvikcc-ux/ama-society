import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

let socket: Socket | null = null;

export const connectSocket = () => {
  if (socket) return socket;
  
  const token = useAuthStore.getState().accessToken;
  const defaultSocketUrl = typeof window !== 'undefined' && window.location ? window.location.origin : 'http://localhost:3000';
  socket = io(process.env.EXPO_PUBLIC_API_URL || defaultSocketUrl, {
    auth: { token },
    reconnection: true,
  });

  socket.on('connect', () => console.log('Socket connected'));
  socket.on('disconnect', () => console.log('Socket disconnected'));

  return socket;
};

export const getSocket = () => socket;
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
