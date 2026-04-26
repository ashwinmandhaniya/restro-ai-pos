import { create } from 'zustand';
import api from '@/lib/api';

const useTenantSettingsStore = create((set) => ({
  users: [],
  roles: [],
  restaurantSettings: null,
  isLoading: false,
  error: null,

  // Restaurant Settings management
  fetchSettings: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/tenant/restaurant/settings');
      set({ restaurantSettings: res.data.data, isLoading: false });
      return res.data.data;
    } catch (e) {
      set({ isLoading: false, error: e.response?.data?.message || 'Failed to fetch restaurant settings' });
      throw e;
    }
  },

  updateSettings: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.patch('/tenant/restaurant/settings', data);
      set({ restaurantSettings: res.data.data, isLoading: false });
      return res.data.data;
    } catch (e) {
      set({ isLoading: false, error: e.response?.data?.message || 'Failed to update restaurant settings' });
      throw e;
    }
  },

  // Users management
  fetchUsers: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/tenant/users', { params });
      set({ users: res.data.data, isLoading: false });
    } catch (e) {
      set({ isLoading: false, error: e.response?.data?.message || 'Failed to fetch users' });
      throw e;
    }
  },

  createUser: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/tenant/users', data);
      set((state) => ({ 
        users: [res.data.data, ...state.users], 
        isLoading: false 
      }));
      return res.data.data;
    } catch (e) {
      set({ isLoading: false, error: e.response?.data?.message || 'Failed to create user' });
      throw e;
    }
  },

  updateUser: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.patch(`/tenant/users/${id}`, data);
      set((state) => ({ 
        users: state.users.map(u => u._id === id ? res.data.data : u), 
        isLoading: false 
      }));
      return res.data.data;
    } catch (e) {
      set({ isLoading: false, error: e.response?.data?.message || 'Failed to update user' });
      throw e;
    }
  },

  deleteUser: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/tenant/users/${id}`);
      set((state) => ({ 
        users: state.users.filter(u => u._id !== id), 
        isLoading: false 
      }));
    } catch (e) {
      set({ isLoading: false, error: e.response?.data?.message || 'Failed to delete user' });
      throw e;
    }
  },

  // Roles management
  fetchRoles: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/tenant/roles');
      set({ roles: res.data.data, isLoading: false });
    } catch (e) {
      set({ isLoading: false, error: e.response?.data?.message || 'Failed to fetch roles' });
      throw e;
    }
  },

  createRole: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/tenant/roles', data);
      set((state) => ({ 
        roles: [...state.roles, res.data.data], 
        isLoading: false 
      }));
      return res.data.data;
    } catch (e) {
      set({ isLoading: false, error: e.response?.data?.message || 'Failed to create role' });
      throw e;
    }
  },

  updateRole: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.patch(`/tenant/roles/${id}`, data);
      set((state) => ({ 
        roles: state.roles.map(r => r._id === id ? res.data.data : r), 
        isLoading: false 
      }));
      return res.data.data;
    } catch (e) {
      set({ isLoading: false, error: e.response?.data?.message || 'Failed to update role' });
      throw e;
    }
  },

  deleteRole: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.delete(`/tenant/roles/${id}`);
      set((state) => ({ 
        roles: state.roles.filter(r => r._id !== id), 
        isLoading: false 
      }));
    } catch (e) {
      set({ isLoading: false, error: e.response?.data?.message || 'Failed to delete role' });
      throw e;
    }
  }
}));

export default useTenantSettingsStore;
