import { create } from 'zustand';
import api from '@/lib/api';

const useAnalyticsStore = create((set) => ({
  stats: null,
  aiInsights: [],
  isLoading: false,
  error: null,

  fetchDashboardStats: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/tenant/analytics/dashboard', { params: filters });
      set({ stats: res.data.data });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to fetch dashboard stats' });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchAIInsights: async () => {
    try {
      const res = await api.get('/tenant/ai/dashboard');
      set({ aiInsights: res.data.data.alerts });
    } catch (err) {
      console.error('Failed to fetch AI insights:', err);
    }
  }
}));

export default useAnalyticsStore;
