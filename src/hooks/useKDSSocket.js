import { useEffect } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '@/store/authStore';
import useKdsStore from '@/store/kdsStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_API_URL?.replace(/\/api$/, '') || 'http://localhost:5000';

export default function useKDSSocket() {
  const { token, user } = useAuthStore();
  const { 
    handleNewTicket, 
    handleItemUpdated, 
    handleOrderBumped, 
    handleOrderRecalled,
    fetchQueue 
  } = useKdsStore();

  useEffect(() => {
    if (!token || !user) return;

    // Connect specifically to the /kitchen namespace
    const socket = io(`${SOCKET_URL}/kitchen`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      console.log('Connected to Kitchen Display socket');
      // Always fetch latest queue on connect/reconnect to ensure no missed events
      fetchQueue();
    });

    socket.on('kds:new_ticket', (ticket) => {
      handleNewTicket(ticket);
    });

    socket.on('kds:item_updated', (data) => {
      handleItemUpdated(data);
    });

    socket.on('kds:order_bumped', (data) => {
      handleOrderBumped(data);
    });
    
    socket.on('kds:order_recalled', (data) => {
       handleOrderRecalled(data);
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from Kitchen Display socket');
    });

    return () => {
      socket.disconnect();
    };
  }, [token, user, handleNewTicket, handleItemUpdated, handleOrderBumped, handleOrderRecalled, fetchQueue]);

  return null;
}
