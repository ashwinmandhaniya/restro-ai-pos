import { create } from 'zustand';
import adminApi from '@/lib/adminApi';

const useAdminPlanStore = create((set) => ({
  plans: [], subscriptions: [], pagination: null, isLoading: false,

  fetchPlans: async () => {
    set({ isLoading: true });
    try {
      const res = await adminApi.get('/plans');
      set({ plans: res.data.data, isLoading: false });
    } catch (e) { set({ isLoading: false }); }
  },

  createPlan: async (data) => {
    const res = await adminApi.post('/plans', data);
    set((s) => ({ plans: [...s.plans, res.data.data] }));
    return res.data.data;
  },

  updatePlan: async (id, data) => {
    const res = await adminApi.put(`/plans/${id}`, data);
    set((s) => ({ plans: s.plans.map(p => p._id === id ? res.data.data : p) }));
    return res.data.data;
  },

  deletePlan: async (id) => {
    await adminApi.delete(`/plans/${id}`);
    set((s) => ({ plans: s.plans.filter(p => p._id !== id) }));
  },

  fetchSubscriptions: async (params = {}) => {
    set({ isLoading: true });
    try {
      const res = await adminApi.get('/subscriptions', { params });
      set({ subscriptions: res.data.data, pagination: res.data.pagination, isLoading: false });
    } catch (e) { set({ isLoading: false }); }
  },

  assignSubscription: async (data) => {
    const res = await adminApi.post('/subscriptions/assign', data);
    set((s) => ({ subscriptions: [res.data.data, ...s.subscriptions] }));
    return res.data.data;
  },

  updateSubscription: async (id, data) => {
    const res = await adminApi.patch(`/subscriptions/${id}`, data);
    set((s) => ({ subscriptions: s.subscriptions.map(sub => sub._id === id ? res.data.data : sub) }));
    return res.data.data;
  }
}));

export default useAdminPlanStore;
