import { create } from 'zustand';
import api from '@/lib/api';
import useAuthStore from './authStore';

const useOutletStore = create((set, get) => ({
  outlets: [],
  currentOutlet: null,        // Set during init/switch
  isMultiOutletEnabled: false,
  isLoading: false,
  error: null,
  analytics: [], // For outlet analytics
  platformOverview: null, // For admin
  transfers: [], // for inventory
  menuOverrides: [], // for menu sync

  // Init - called once after login or component mount
  init: async () => {
    // If not logged in, ignore
    const user = useAuthStore.getState().user;
    if (!user) return;
    
    // Check multi-outlet flag from tenant settings or just attempt fetch
    // Actually, usually user.role or the API will tell us if it's enabled.
    set({ isLoading: true });
    try {
      const response = await api.get('/tenant/outlets');
      const outlets = response.data.data || [];
      
      let currentOutlet = null;
      const lastSavedId = localStorage.getItem('lastActiveOutletId');

      if (outlets.length > 0) {
        if (lastSavedId) {
          currentOutlet = outlets.find(o => o._id === lastSavedId);
        }
        if (!currentOutlet) {
          currentOutlet = outlets.find(o => o._id === user.outletId) || outlets.find(o => o.isHQ) || outlets[0];
        }
      }

      set({ 
        outlets, 
        currentOutlet,
        isMultiOutletEnabled: true, // we assume true if API succeeds without 403
        isLoading: false 
      });
    } catch (err) {
      // 403 means multi-outlet feature is disabled for this tenant
      if (err.response?.status === 403) {
        set({ isMultiOutletEnabled: false, isLoading: false });
      } else {
        set({ error: err.response?.data?.message || 'Failed to fetch outlets', isLoading: false });
      }
    }
  },

  switchOutlet: (outletId) => {
    const { outlets } = get();
    const outlet = outlets.find(o => o._id === outletId);
    if (outlet) {
      localStorage.setItem('lastActiveOutletId', outlet._id);
      set({ currentOutlet: outlet });
    }
  },

  createOutlet: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/tenant/outlets', data);
      const newOutlet = response.data.data;
      set(state => ({
        outlets: [...state.outlets, newOutlet],
        isLoading: false
      }));
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Creation failed', isLoading: false });
      return false;
    }
  },

  updateOutlet: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.put(`/tenant/outlets/${id}`, data);
      set(state => ({
        outlets: state.outlets.map(o => o._id === id ? response.data.data : o),
        isLoading: false
      }));
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Update failed', isLoading: false });
      return false;
    }
  },

  updateOutletStatus: async (id, status) => {
    try {
      const response = await api.patch(`/tenant/outlets/${id}/status`, { status });
      set(state => ({
        outlets: state.outlets.map(o => o._id === id ? response.data.data : o)
      }));
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Status update failed' });
      return false;
    }
  },

  setHqOutlet: async (id) => {
    try {
      await api.post(`/tenant/outlets/${id}/set-hq`);
      set(state => ({
        outlets: state.outlets.map(o => ({
          ...o,
          isHQ: o._id === id
        }))
      }));
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Set HQ failed' });
      return false;
    }
  },

  fetchAnalytics: async () => {
    try {
      const response = await api.get('/tenant/outlets/analytics/summary');
      // The endpoint returns enriched outlets in data
      set({ analytics: response.data.data || [] });
      return response.data.data;
    } catch (err) {
      console.error('Failed to fetch outlet analytics:', err);
      return [];
    }
  },

  // Transfers
  fetchTransfers: async () => {
    const { currentOutlet } = get();
    if (!currentOutlet) return;
    set({ isLoading: true });
    try {
      const response = await api.get(`/tenant/outlets/${currentOutlet._id}/transfers`);
      set({ transfers: response.data.data || [], isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false });
    }
  },

  requestTransfer: async (data) => {
    const { currentOutlet } = get();
    try {
      await api.post(`/tenant/outlets/${currentOutlet._id}/transfers`, data);
      await get().fetchTransfers();
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Transfer request failed' });
      return false;
    }
  },

  approveTransfer: async (id) => {
    const { currentOutlet } = get();
    try {
      await api.patch(`/tenant/outlets/${currentOutlet._id}/transfers/${id}/approve`);
      await get().fetchTransfers();
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to approve' });
      return false;
    }
  },

  receiveTransfer: async (id) => {
    const { currentOutlet } = get();
    try {
      await api.patch(`/tenant/outlets/${currentOutlet._id}/transfers/${id}/receive`);
      await get().fetchTransfers();
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to receive' });
      return false;
    }
  },

  cancelTransfer: async (id) => {
    const { currentOutlet } = get();
    try {
      await api.patch(`/tenant/outlets/${currentOutlet._id}/transfers/${id}/cancel`);
      await get().fetchTransfers();
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to cancel' });
      return false;
    }
  },

  // Menu Overrides
  fetchMenuOverrides: async (outletId) => {
    set({ isLoading: true, error: null });
    try {
      const targetId = outletId || get().currentOutlet?._id;
      if (!targetId) throw new Error("No outlet selected");
      const response = await api.get(`/tenant/outlets/${targetId}/menu`);
      set({ menuOverrides: response.data.data.overrides || [], isLoading: false });
    } catch (err) {
      set({ error: err.message, isLoading: false, menuOverrides: [] });
    }
  },

  updateMenuOverrides: async (outletId, overridesMap) => {
    const targetId = outletId || get().currentOutlet?._id;
    try {
      await api.put(`/tenant/outlets/${targetId}/menu`, { overrides: overridesMap });
      await get().fetchMenuOverrides(targetId);
      return true;
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to sync menu overrides' });
      return false;
    }
  }
}));

export default useOutletStore;
