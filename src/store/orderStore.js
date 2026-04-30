import { create } from 'zustand';
import api from '@/lib/api';

const useOrderStore = create((set, get) => ({
  orders: [],
  isLoading: false,
  error: null,

  fetchOrders: async (status = 'all') => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get(`/orders?status=${status}`);
      set({ orders: res.data.data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch orders', isLoading: false });
    }
  },

  createOrder: async (orderData) => {
    try {
      const res = await api.post('/orders', orderData);
      set((state) => ({ orders: [res.data.data, ...state.orders] }));
      return res.data.data;
    } catch (error) {
      throw error;
    }
  },

  updateOrder: async (id, orderData) => {
    try {
      const res = await api.put(`/orders/${id}`, orderData);
      set((state) => ({
        orders: state.orders.map(order => order._id === id ? res.data.data : order)
      }));
      return res.data.data;
    } catch (error) {
      throw error;
    }
  },

  deleteOrder: async (id) => {
    try {
      await api.delete(`/orders/${id}`);
      set((state) => ({
        orders: state.orders.filter(order => order._id !== id)
      }));
      return { success: true };
    } catch (error) {
      throw error;
    }
  },

  updateOrderStatus: async (orderId, itemId, status) => {
    try {
      const res = await api.patch(`/orders/${orderId}/items/${itemId}/status`, { status });
      // Optimistic update
      set((state) => ({
        orders: state.orders.map(order => 
          order._id === orderId 
            ? { ...order, items: order.items.map(i => i._id === itemId ? { ...i, status } : i) }
            : order
        )
      }));
      return res.data.data;
    } catch (error) {
      throw error;
    }
  },

  // Called from Socket.js to merge new events
  handleRealtimeKOT: (data) => {
    set((state) => ({
      orders: state.orders.map(order => 
        order._id === data.orderId 
          ? { ...order, items: order.items.map(i => i._id === data.itemId ? { ...i, status: data.status } : i) }
          : order
      )
    }));
  },

  handleRealtimeNewOrder: (newOrder) => {
    set((state) => {
      // Check if order already exists in state
      if (state.orders.some(o => o._id === newOrder._id)) return state;
      return { orders: [newOrder, ...state.orders] };
    });
  }
}));

export default useOrderStore;
