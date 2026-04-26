import { create } from 'zustand';
import adminApi from '@/lib/adminApi';

const useAdminAnalyticsStore = create((set) => ({
  overview: null, revenueData: null, tenantAnalytics: null, isLoading: false,

  fetchOverview: async () => {
    set({ isLoading: true });
    try {
      const res = await adminApi.get('/analytics/overview');
      set({ overview: res.data.data, isLoading: false });
    } catch (e) { set({ isLoading: false }); }
  },

  fetchRevenue: async (period = '6months') => {
    try {
      const res = await adminApi.get('/analytics/revenue', { params: { period } });
      set({ revenueData: res.data.data });
    } catch (e) { console.error(e); }
  },

  fetchTenantAnalytics: async () => {
    try {
      const res = await adminApi.get('/analytics/tenants');
      set({ tenantAnalytics: res.data.data });
    } catch (e) { console.error(e); }
  }
}));

export default useAdminAnalyticsStore;
