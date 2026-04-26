import { useEffect } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function useTokenDisplaySocket(restaurantSlug, outletId = null, onEvent) {
  useEffect(() => {
    if (!restaurantSlug) return;

    // Connect to /token-display namespace
    const socket = io(`${SOCKET_URL}/token-display`, {
      query: { 
        restaurantCode: restaurantSlug,
        ...(outletId && { outletId })
      },
      transports: ['websocket']
    });

    socket.on('connect', () => {
      console.log('📺 Connected to Public Token Display Socket');
    });

    socket.on('token:new', (token) => {
      onEvent?.('new', token);
    });

    socket.on('token:updated', (token) => {
      onEvent?.('updated', token);
    });

    socket.on('token:called', (token) => {
      onEvent?.('called', token);
    });

    socket.on('connect_error', (err) => {
      console.error('Display socket connection error:', err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [restaurantSlug, outletId, onEvent]);
}
