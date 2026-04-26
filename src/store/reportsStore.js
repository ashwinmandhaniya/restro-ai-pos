import { create } from 'zustand';
import api from '../lib/api';

const useReportsStore = create((set) => ({
  reportData: null,
  loading: false,
  error: null,
  period: 'month',

  fetchReports: async (period = 'month') => {
    set({ loading: true, error: null, period });
    try {
      const { data } = await api.get(`/tenant/analytics/reports?period=${period}`);
      set({ reportData: data.data, loading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || error.message, loading: false });
    }
  }
}));

export default useReportsStore;
