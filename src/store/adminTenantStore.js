import { create } from 'zustand';
import adminApi from '@/lib/adminApi';

const useAdminTenantStore = create((set) => ({
  tenants: [], pagination: null, selectedTenant: null, isLoading: false, error: null,

  fetchTenants: async (params = {}) => {
    set({ isLoading: true });
    try {
      const res = await adminApi.get('/tenants', { params });
      set({ tenants: res.data.data, pagination: res.data.pagination, isLoading: false });
    } catch (e) { set({ error: e.message, isLoading: false }); }
  },

  getTenant: async (id) => {
    set({ isLoading: true });
    try {
      const res = await adminApi.get(`/tenants/${id}`);
      set({ selectedTenant: res.data.data, isLoading: false });
      return res.data.data;
    } catch (e) { set({ error: e.message, isLoading: false }); }
  },

  createTenant: async (data) => {
    const res = await adminApi.post('/tenants', data);
    set((s) => ({ tenants: [res.data.data, ...s.tenants] }));
    return res.data.data;
  },

  updateTenantStatus: async (id, status, adminNotes) => {
    const res = await adminApi.patch(`/tenants/${id}/status`, { status, adminNotes });
    set((s) => ({ tenants: s.tenants.map(t => t._id === id ? res.data.data : t) }));
    return res.data.data;
  },

  updateTenant: async (id, data) => {
    const res = await adminApi.put(`/tenants/${id}`, data);
    set((s) => ({ tenants: s.tenants.map(t => t._id === id ? res.data.data : t) }));
    return res.data.data;
  },

  deleteTenant: async (id) => {
    await adminApi.delete(`/tenants/${id}`);
    set((s) => ({ tenants: s.tenants.filter(t => t._id !== id) }));
  }
}));

export default useAdminTenantStore;
