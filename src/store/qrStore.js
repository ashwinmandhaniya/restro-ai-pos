import { create } from 'zustand';
import api from '@/lib/api';

const useQRStore = create((set) => ({
  qrCodes: [],
  analytics: null,
  isLoading: false,
  error: null,

  fetchQRCodes: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/qr');
      set({ qrCodes: res.data.data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch QR codes', isLoading: false });
    }
  },

  fetchAnalytics: async () => {
    try {
      const res = await api.get('/qr/analytics');
      set({ analytics: res.data.data });
    } catch (error) {
      console.error('Failed to fetch QR analytics:', error);
    }
  },

  generateQR: async (data) => {
    try {
      const res = await api.post('/qr', data);
      set((state) => ({ qrCodes: [res.data.data, ...state.qrCodes] }));
      return res.data.data;
    } catch (error) {
      throw error;
    }
  },

  bulkGenerate: async () => {
    try {
      const res = await api.post('/qr/bulk');
      if (res.data.data.length > 0) {
        set((state) => ({ qrCodes: [...res.data.data, ...state.qrCodes] }));
      }
      return res.data;
    } catch (error) {
      throw error;
    }
  },

  updateQR: async (id, updates) => {
    try {
      const res = await api.put(`/qr/${id}`, updates);
      set((state) => ({
        qrCodes: state.qrCodes.map(qr => qr._id === id ? { ...qr, ...res.data.data } : qr)
      }));
      return res.data.data;
    } catch (error) {
      throw error;
    }
  },

  deleteQR: async (id) => {
    try {
      await api.delete(`/qr/${id}`);
      set((state) => ({
        qrCodes: state.qrCodes.filter(qr => qr._id !== id)
      }));
      return true;
    } catch (error) {
      throw error;
    }
  }
}));

export default useQRStore;
