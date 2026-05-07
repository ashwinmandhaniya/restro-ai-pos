import { create } from 'zustand';
import api from '@/lib/api';

const useTableCategoryStore = create((set) => ({
  categories: [],
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/tables/categories');
      set({ categories: res.data.data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch categories', isLoading: false });
    }
  },

  createCategory: async (data) => {
    try {
      const res = await api.post('/tables/categories', data);
      set((state) => ({ categories: [...state.categories, res.data.data] }));
      return res.data.data;
    } catch (error) {
      throw error;
    }
  },

  updateCategory: async (id, data) => {
    try {
      const res = await api.put(`/tables/categories/${id}`, data);
      set((state) => ({
        categories: state.categories.map(c => c._id === id ? res.data.data : c)
      }));
      return res.data.data;
    } catch (error) {
      throw error;
    }
  },

  deleteCategory: async (id) => {
    try {
      await api.delete(`/tables/categories/${id}`);
      set((state) => ({
        categories: state.categories.filter(c => c._id !== id)
      }));
    } catch (error) {
      throw error;
    }
  }
}));

export default useTableCategoryStore;
