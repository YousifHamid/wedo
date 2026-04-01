import { io, Socket } from 'socket.io-client';
import { SOCKET_URL, SOCKET_TIMEOUT } from '../config/env';
import useAuthStore from '../store/useAuthStore';

let socket: Socket | null = null;

/**
 * Connect to Socket.io server with the current auth token
 */
export const connectSocket = (): Socket | null => {
  const token = useAuthStore.getState().token;
  if (!token) return null;

  // Disconnect existing connection
  if (socket?.connected) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    timeout: SOCKET_TIMEOUT,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('[Wedo Socket] Connected:', socket?.id);
  });

  socket.on('connect_error', (err) => {
    console.log('[Wedo Socket] Connection error:', err.message);
  });

  socket.on('disconnect', (reason) => {
    console.log('[Wedo Socket] Disconnected:', reason);
  });

  return socket;
};

/**
 * Get the current socket instance
 */
export const getSocket = (): Socket | null => socket;

/**
 * Disconnect the socket
 */
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export default { connectSocket, getSocket, disconnectSocket };
