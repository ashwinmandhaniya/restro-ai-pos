import { create } from 'zustand';
import adminApi from '@/lib/adminApi';

const useAdminFeatureFlagStore = create((set) => ({
  flags: [], isLoading: false,

  fetchFlags: async (category) => {
    set({ isLoading: true });
    try {
      const res = await adminApi.get('/feature-flags', { params: category ? { category } : {} });
      set({ flags: res.data.data, isLoading: false });
    } catch (e) { set({ isLoading: false }); }
  },

  createFlag: async (data) => {
    const res = await adminApi.post('/feature-flags', data);
    set((s) => ({ flags: [...s.flags, res.data.data] }));
    return res.data.data;
  },

  toggleFlag: async (id) => {
    const res = await adminApi.patch(`/feature-flags/${id}/toggle`);
    set((s) => ({ flags: s.flags.map(f => f._id === id ? res.data.data : f) }));
    return res.data.data;
  },

  updateFlag: async (id, data) => {
    const res = await adminApi.put(`/feature-flags/${id}`, data);
    set((s) => ({ flags: s.flags.map(f => f._id === id ? res.data.data : f) }));
    return res.data.data;
  },

  deleteFlag: async (id) => {
    await adminApi.delete(`/feature-flags/${id}`);
    set((s) => ({ flags: s.flags.filter(f => f._id !== id) }));
  }
}));

export default useAdminFeatureFlagStore;
