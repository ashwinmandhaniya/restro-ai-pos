import { create } from 'zustand';
import adminApi from '@/lib/adminApi';

const useAdminConfigStore = create((set) => ({
  configs: [], activityLogs: [], logPagination: null, isLoading: false,

  fetchConfigs: async (category) => {
    set({ isLoading: true });
    try {
      const res = await adminApi.get('/config', { params: category ? { category } : {} });
      set({ configs: res.data.data, isLoading: false });
    } catch (e) { set({ isLoading: false }); }
  },

  upsertConfig: async (key, data) => {
    const res = await adminApi.put(`/config/${key}`, data);
    set((s) => {
      const exists = s.configs.find(c => c.key === key);
      if (exists) return { configs: s.configs.map(c => c.key === key ? res.data.data : c) };
      return { configs: [...s.configs, res.data.data] };
    });
    return res.data.data;
  },

  deleteConfig: async (key) => {
    await adminApi.delete(`/config/${key}`);
    set((s) => ({ configs: s.configs.filter(c => c.key !== key) }));
  },

  fetchActivityLogs: async (params = {}) => {
    set({ isLoading: true });
    try {
      const res = await adminApi.get('/config/activity-logs', { params });
      set({ activityLogs: res.data.data, logPagination: res.data.pagination, isLoading: false });
    } catch (e) { set({ isLoading: false }); }
  }
}));

export default useAdminConfigStore;
