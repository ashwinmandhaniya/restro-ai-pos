import { create } from 'zustand';
import api from '@/lib/api';

/**
 * Platform Order Alert Store
 * Manages incoming orders from Swiggy, Zomato, and other platforms.
 */
const usePlatformOrderStore = create((set, get) => ({
  orders: [],
  stats: null,
  newCount: 0,
  isLoading: false,
  error: null,

  // ── Fetch all orders ──
  fetchOrders: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams(filters).toString();
      const res = await api.get(`/platform-orders${params ? `?${params}` : ''}`);
      set({
        orders: res.data.data || [],
        newCount: res.data.newCount || 0,
        isLoading: false,
      });
    } catch (err) {
      set({ error: err.response?.data?.message || err.message, isLoading: false });
    }
  },

  // ── Fetch stats ──
  fetchStats: async () => {
    try {
      const res = await api.get('/platform-orders/stats');
      set({ stats: res.data.data });
    } catch (err) {
      console.error('Platform order stats error:', err);
    }
  },

  // ── Accept an order ──
  acceptOrder: async (id, estimatedPrepTime) => {
    try {
      const res = await api.patch(`/platform-orders/${id}/accept`, { estimatedPrepTime });
      const updated = res.data.data;
      set((state) => ({
        orders: state.orders.map((o) => (o._id === id ? updated : o)),
        newCount: Math.max(0, state.newCount - 1),
      }));
      return updated;
    } catch (err) {
      throw err;
    }
  },

  // ── Reject an order ──
  rejectOrder: async (id, reason) => {
    try {
      const res = await api.patch(`/platform-orders/${id}/reject`, { reason });
      const updated = res.data.data;
      set((state) => ({
        orders: state.orders.map((o) => (o._id === id ? updated : o)),
        newCount: Math.max(0, state.newCount - 1),
      }));
      return updated;
    } catch (err) {
      throw err;
    }
  },

  // ── Update status (preparing → ready → picked_up → delivered) ──
  updateStatus: async (id, status) => {
    try {
      const res = await api.patch(`/platform-orders/${id}/status`, { status });
      const updated = res.data.data;
      set((state) => ({
        orders: state.orders.map((o) => (o._id === id ? updated : o)),
      }));
      return updated;
    } catch (err) {
      throw err;
    }
  },

  // ── Dismiss alert ──
  dismissAlert: async (id) => {
    try {
      await api.patch(`/platform-orders/${id}/dismiss`);
      set((state) => ({
        orders: state.orders.map((o) =>
          o._id === id ? { ...o, alertDismissed: true, alertSeen: true } : o
        ),
      }));
    } catch (err) {
      console.error('Dismiss error:', err);
    }
  },

  // ── Socket.IO handler for real-time new orders ──
  handleNewOrder: (order) => {
    set((state) => ({
      orders: [order, ...state.orders],
      newCount: state.newCount + 1,
    }));
  },

  // ── Socket.IO handler for order updates ──
  handleOrderUpdated: (order) => {
    set((state) => ({
      orders: state.orders.map((o) => (o._id === order._id ? order : o)),
    }));
  },
}));

export default usePlatformOrderStore;
