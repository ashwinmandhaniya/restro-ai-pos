import { create } from 'zustand';
import adminApi from '@/lib/adminApi';

const useAdminTransactionStore = create((set, get) => ({
  transactions: [],
  stats: null,
  pagination: null,
  isLoading: false,
  error: null,

  fetchTransactions: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const response = await adminApi.get('/transactions', {
        params: {
          page: params.page || 1,
          limit: params.limit || 20,
          type: params.type !== 'all' ? params.type : undefined,
          status: params.status !== 'all' ? params.status : undefined,
          search: params.search || undefined,
          startDate: params.startDate || undefined,
          endDate: params.endDate || undefined,
        }
      });
      set({
        transactions: response.data.data,
        pagination: response.data.pagination,
        isLoading: false
      });
    } catch (err) {
      set({
        error: err.response?.data?.message || 'Failed to fetch transactions',
        isLoading: false
      });
    }
  },

  fetchStats: async () => {
    try {
      const response = await adminApi.get('/transactions/stats');
      set({ stats: response.data.data });
    } catch (err) {
      console.error('Failed to fetch transaction stats', err);
    }
  },

  createTransaction: async (data) => {
    try {
      const response = await adminApi.post('/transactions', data);
      // Prepend to list
      set((state) => ({
        transactions: [response.data.data, ...state.transactions]
      }));
      get().fetchStats();
      return true;
    } catch (err) {
      console.error('Failed to create transaction', err);
      return false;
    }
  },

  updateTransaction: async (id, data) => {
    try {
      const response = await adminApi.patch(`/transactions/${id}`, data);
      set((state) => ({
        transactions: state.transactions.map(t =>
          t._id === id ? response.data.data : t
        )
      }));
      get().fetchStats();
      return true;
    } catch (err) {
      console.error('Failed to update transaction', err);
      return false;
    }
  }
}));

export default useAdminTransactionStore;
