import { create } from 'zustand';
import adminApi from '@/lib/adminApi';

const useAdminSupportStore = create((set) => ({
  tickets: [], stats: null, selectedTicket: null, pagination: null, isLoading: false,

  fetchTickets: async (params = {}) => {
    set({ isLoading: true });
    try {
      const res = await adminApi.get('/support', { params });
      set({ tickets: res.data.data, pagination: res.data.pagination, isLoading: false });
    } catch (e) { set({ isLoading: false }); }
  },

  fetchStats: async () => {
    try {
      const res = await adminApi.get('/support/stats');
      set({ stats: res.data.data });
    } catch (e) { console.error(e); }
  },

  getTicket: async (id) => {
    const res = await adminApi.get(`/support/${id}`);
    set({ selectedTicket: res.data.data });
    return res.data.data;
  },

  updateTicket: async (id, data) => {
    const res = await adminApi.patch(`/support/${id}`, data);
    set((s) => ({ tickets: s.tickets.map(t => t._id === id ? res.data.data : t), selectedTicket: res.data.data }));
    return res.data.data;
  },

  replyToTicket: async (id, content) => {
    const res = await adminApi.post(`/support/${id}/reply`, { content });
    set({ selectedTicket: res.data.data });
    return res.data.data;
  }
}));

export default useAdminSupportStore;
