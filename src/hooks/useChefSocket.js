import { useEffect } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '@/store/authStore';
import useChefStore from '@/store/chefStore';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export default function useChefSocket() {
  const { token, user } = useAuthStore();
  const { handleAvailabilityChanged, handleLoadUpdated, handleStationUpdated } = useChefStore();

  useEffect(() => {
    if (!token || !user) return;

    // Use the kitchen namespace
    const socket = io(`${SOCKET_URL}/kitchen`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      console.log('Connected to Kitchen/Chef Display socket');
      // If the current user is a chef themselves, we can bind to their room
      if (user.role === 'chef') {
        socket.emit('set_chef_room', user._id);
      }
    });

    socket.on('chef:availability_changed', handleAvailabilityChanged);
    socket.on('chef:station_updated', handleStationUpdated);
    
    // We didn't emit this strictly from the server yet, 
    // but in a fully operational world, the load would stream in
    socket.on('chef:load_updated', handleLoadUpdated);

    return () => {
      socket.disconnect();
    };
  }, [token, user, handleAvailabilityChanged, handleLoadUpdated, handleStationUpdated]);

  return null;
}
