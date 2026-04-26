import { create } from 'zustand';
import api from '@/lib/api';

const useKdsStore = create((set, get) => ({
  stations: [],
  tickets: [],
  batches: [],
  selectedStation: 'all',
  soundEnabled: true,
  isLoading: false,
  error: null,

  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
  setSelectedStation: (stationId) => set({ selectedStation: stationId }),

  fetchStations: async () => {
    try {
      const res = await api.get('/kds/stations');
      set({ stations: res.data.data });
    } catch (error) {
      console.error('Failed to fetch stations', error);
    }
  },

  fetchQueue: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/kds/queue');
      set({ tickets: res.data.data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchBatches: async () => {
    try {
      const { selectedStation } = get();
      const stationParam = selectedStation !== 'all' ? `?stationId=${selectedStation}` : '';
      const res = await api.get(`/kds/batches${stationParam}`);
      set({ batches: res.data.data });
    } catch (error) {
      console.error('Failed to fetch KDS batches', error);
    }
  },


  updateItemStatus: async (orderId, itemId, status) => {
    try {
      // Optimistic update
      set((state) => ({
        tickets: state.tickets.map(ticket => 
          ticket._id === orderId 
            ? { ...ticket, items: ticket.items.map(i => i._id === itemId ? { ...i, status } : i) }
            : ticket
        )
      }));
      await api.patch(`/orders/${orderId}/items/${itemId}/status`, { status });
    } catch (error) {
      // Revert optimism implicitly by re-fetching or leaving as is if minor error
      console.error(error);
    }
  },

  bumpOrder: async (orderId) => {
    try {
      set((state) => ({
        tickets: state.tickets.map(ticket => 
          ticket._id === orderId 
            ? { ...ticket, status: 'completed', items: ticket.items.map(i => ({...i, status: 'served'})) }
            : ticket
        )
      }));
      await api.post(`/kds/orders/${orderId}/bump`);
    } catch (error) {
      console.error(error);
    }
  },

  recallOrder: async (orderId) => {
    try {
      // Optimistic update
      set((state) => ({
        tickets: state.tickets.map(ticket => 
          ticket._id === orderId 
            ? { ...ticket, status: 'active', items: ticket.items.map(i => ({...i, status: 'ready'})) }
            : ticket
        )
      }));
      await api.post(`/kds/orders/${orderId}/recall`);
    } catch (error) {
      console.error(error);
    }
  },

  // Real-time handlers
  handleNewTicket: (ticket) => {
    set((state) => {
      if (state.tickets.some(t => t._id === ticket._id)) return state;
      // Play sound if enabled
      if (state.soundEnabled) {
        const audio = new Audio('/notification.mp3'); // We'll assume a file exists or use default beep
        audio.play().catch(e => console.log('Audio blocked', e));
      }
      return { tickets: [ticket, ...state.tickets] };
    });
  },

  handleItemUpdated: (data) => {
    set((state) => ({
      tickets: state.tickets.map(ticket => 
        ticket._id === data.orderId 
          ? { ...ticket, items: ticket.items.map(i => i._id === data.itemId ? { ...i, status: data.status } : i) }
          : ticket
      )
    }));
  },

  handleOrderBumped: (data) => {
    set((state) => ({
      tickets: state.tickets.map(t => t._id === data.orderId ? data.order : t)
    }));
  },
  
  handleOrderRecalled: (data) => {
    set((state) => ({
       tickets: state.tickets.map(t => t._id === data.orderId ? data.order : t)
    }));
  },

  assignChefToOrder: async (orderId, chefId) => {
    try {
      // Optimistic update
      set((state) => ({
        tickets: state.tickets.map(ticket => 
          ticket._id === orderId 
            ? { ...ticket, items: ticket.items.map(i => i.status !== 'served' ? { ...i, chefId } : i) }
            : ticket
        )
      }));
      await api.post(`/kds/orders/${orderId}/assign-chef`, { chefId });
    } catch (error) {
      console.error('Failed to assign chef to order', error);
    }
  }
}));

export default useKdsStore;
