import { create } from 'zustand';
import api from '@/lib/api';

const useTokenStore = create((set, get) => ({
  tokens: [],
  stats: {
    totalToday: 0,
    waiting: 0,
    ready: 0,
    served: 0,
    avgWaitMinutes: 0
  },
  isLoading: false,
  error: null,

  fetchQueue: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/tokens/queue');
      // Ensure local state only has unique tokens by ID
      const uniqueTokens = Array.from(new Map(res.data.data.map(t => [t._id, t])).values());
      
      set({ tokens: uniqueTokens, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch token queue', isLoading: false });
    }
  },

  fetchStats: async () => {
    try {
      const res = await api.get('/tokens/stats');
      set({ stats: res.data.data });
    } catch (error) {
      console.error('Failed to fetch token stats:', error);
    }
  },

  advanceToken: async (tokenId, status, message = null) => {
    try {
      const res = await api.patch(`/tokens/${tokenId}/advance`, { status, message });
      set((state) => ({
        tokens: state.tokens.map(t => t._id === tokenId ? res.data.data : t)
      }));
      // Re-fetch stats as they likely changed
      get().fetchStats();
      return res.data.data;
    } catch (error) {
      throw error;
    }
  },

  updatePriority: async (tokenId, priority) => {
    try {
      const res = await api.patch(`/tokens/${tokenId}/priority`, { priority });
      set((state) => ({
        tokens: state.tokens.map(t => t._id === tokenId ? res.data.data : t)
      }));
      return res.data.data;
    } catch (error) {
      throw error;
    }
  },

  recallToken: async (tokenId) => {
    try {
      const res = await api.post(`/tokens/${tokenId}/recall`);
      set((state) => ({
        tokens: state.tokens.map(t => t._id === tokenId ? res.data.data : t)
      }));
      return res.data.data;
    } catch (error) {
      throw error;
    }
  },

  cancelToken: async (tokenId) => {
    try {
      await api.delete(`/tokens/${tokenId}`);
      set((state) => ({
        tokens: state.tokens.filter(t => t._id !== tokenId)
      }));
      get().fetchStats();
    } catch (error) {
      throw error;
    }
  },

  optimizeQueue: async () => {
    set({ isLoading: true });
    try {
      const res = await api.post('/tokens/optimize');
      set({ tokens: res.data.data, isLoading: false });
      return res.data.message;
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  // Socket Handlers

  handleNewToken: (token) => {
    set((state) => {
      // Direct ID check prevents duplicates
      if (state.tokens.some(t => t._id === token._id)) return state;
      
      return { 
        tokens: [...state.tokens, token].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt)),
        stats: { ...state.stats, waiting: state.stats.waiting + 1, totalToday: state.stats.totalToday + 1 }
      };
    });
  },

  handleTokenUpdated: (updatedToken) => {
    set((state) => {
        const index = state.tokens.findIndex(t => t._id === updatedToken._id);
        if (index === -1) {
            // If it's a "fresh" token we didn't have (maybe from a different station initially)
            return { tokens: [...state.tokens, updatedToken] };
        }
        return {
            tokens: state.tokens.map(t => t._id === updatedToken._id ? updatedToken : t)
        };
    });
    get().fetchStats(); // Update stats for status movements
  },

  handleTokenDeleted: (tokenId) => {
    set((state) => ({
      tokens: state.tokens.filter(t => t._id !== tokenId)
    }));
    get().fetchStats();
  }
}));

export default useTokenStore;
