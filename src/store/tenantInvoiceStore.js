import { create } from 'zustand';
import api from '@/lib/api';

const useTenantInvoiceStore = create((set, get) => ({
  invoices: [],
  pagination: null,
  isLoading: false,
  error: null,

  fetchInvoices: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      // Endpoint is relative to /api/tenant/restaurant (as per routes index)
      // Wait, let's check the base path for tenant restaurant routes
      const response = await api.get('/tenant/restaurant/invoices', { 
        params: {
          page: params.page || 1,
          limit: params.limit || 10,
          status: params.status !== 'all' ? params.status : undefined,
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
        error: err.response?.data?.message || 'Failed to fetch billing history', 
        isLoading: false 
      });
    }
  }
}));

export default useTenantInvoiceStore;
