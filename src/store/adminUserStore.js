import { create } from 'zustand';
import adminApi from '@/lib/adminApi';

const useAdminUserStore = create((set) => ({
  users: [],
  pagination: null,
  isLoading: false,

  fetchUsers: async (params = {}) => {
    set({ isLoading: true });
    try {
      const res = await adminApi.get('/users', { params });
      set({ users: res.data.data, pagination: res.data.pagination, isLoading: false });
    } catch (e) {
      set({ isLoading: false });
      throw e;
    }
  },

  createUser: async (data) => {
    try {
      const res = await adminApi.post('/users', data);
      set((s) => ({ users: [res.data.data, ...s.users] }));
      return res.data.data;
    } catch (e) {
      throw e;
    }
  },

  updateUser: async (id, data) => {
    try {
      const res = await adminApi.patch(`/users/${id}`, data);
      set((s) => ({ 
        users: s.users.map(u => u._id === id ? res.data.data : u) 
      }));
      return res.data.data;
    } catch (e) {
      throw e;
    }
  },

  deleteUser: async (id) => {
    try {
      await adminApi.delete(`/users/${id}`);
      set((s) => ({ users: s.users.filter(u => u._id !== id) }));
    } catch (e) {
      throw e;
    }
  }
}));

export default useAdminUserStore;
