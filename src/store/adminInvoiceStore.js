import { create } from 'zustand';
import adminApi from '@/lib/adminApi';

const useAdminInvoiceStore = create((set, get) => ({
  invoices: [],
  stats: null,
  pagination: null,
  isLoading: false,
  error: null,

  fetchInvoices: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      // If search is provided, backend should handle it (or we filter here if small)
      // Standard practice for admin is server-side filtering
      const response = await adminApi.get('/invoices', { 
        params: {
          page: params.page || 1,
          limit: params.limit || 20,
          status: params.status !== 'all' ? params.status : undefined,
          search: params.search || undefined,
          ...params
        } 
      });
      set({ 
        invoices: response.data.data, 
        pagination: response.data.pagination,
        isLoading: false 
      });
    } catch (err) {
      set({ 
        error: err.response?.data?.message || 'Failed to fetch invoices', 
        isLoading: false 
      });
    }
  },

  fetchStats: async () => {
    try {
      const response = await adminApi.get('/invoices/stats');
      set({ stats: response.data.data });
    } catch (err) {
      console.error('Failed to fetch invoice stats', err);
    }
  },

  updateInvoiceStatus: async (id, data) => {
    try {
      const response = await adminApi.patch(`/invoices/${id}`, data);
      set((state) => ({
        invoices: state.invoices.map(inv => inv._id === id ? response.data.data : inv)
      }));
      // Auto refresh stats to reflect changed balances
      get().fetchStats();
      return true;
    } catch (err) {
      console.error('Failed to update invoice status', err);
      return false;
    }
  }
}));

export default useAdminInvoiceStore;
