import { useEffect } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '@/store/authStore';
import useTokenStore from '@/store/tokenStore';
import useUIStore from '@/store/uiStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000';

export default function useTokenSocket() {
  const { token, user } = useAuthStore();
  const { handleNewToken, handleTokenUpdated } = useTokenStore();
  const { addNotification } = useUIStore();

  useEffect(() => {
    if (!token || !user?.restaurantId) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket']
    });

    socket.on('connect', () => {
      console.log('🔌 Connected to Token Admin Socket');
    });

    socket.on('token:new', (newToken) => {
      handleNewToken(newToken);
      addNotification({
        type: 'info',
        title: 'New Order Token',
        message: `Token ${newToken.tokenNumber} generated for ${newToken.type}.`
      });
    });

    socket.on('token:updated', (updatedToken) => {
      handleTokenUpdated(updatedToken);
    });

    socket.on('token:deleted', (tokenId) => {
      useTokenStore.getState().handleTokenDeleted(tokenId);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    return () => {
      socket.disconnect();
    };
  }, [token, user?.restaurantId, handleNewToken, handleTokenUpdated, addNotification]);
}
