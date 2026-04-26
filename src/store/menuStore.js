import { create } from 'zustand';
import api from '@/lib/api';

const useMenuStore = create((set) => ({
  categories: [],
  menuItems: [],
  isLoading: false,
  error: null,

  fetchMenuData: async () => {
    set({ isLoading: true, error: null });
    try {
      const [categoriesRes, itemsRes] = await Promise.all([
        api.get('/menu/categories'),
        api.get('/menu')
      ]);
      
      set({ 
        categories: categoriesRes.data.data, 
        menuItems: itemsRes.data.data,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: error.response?.data?.message || 'Failed to fetch menu data',
        isLoading: false
      });
    }
  },
  
  addCategory: async (categoryData) => {
    try {
      const res = await api.post('/menu/categories', categoryData);
      set((state) => ({ categories: [...state.categories, res.data.data] }));
      return res.data.data;
    } catch (error) {
      throw error;
    }
  },

  updateCategory: async (id, updates) => {
    try {
      const res = await api.put(`/menu/categories/${id}`, updates);
      set((state) => ({
        categories: state.categories.map(cat => cat._id === id ? res.data.data : cat)
      }));
      return res.data.data;
    } catch (error) {
      throw error;
    }
  },

  deleteCategory: async (id) => {
    try {
      await api.delete(`/menu/categories/${id}`);
      set((state) => ({
        categories: state.categories.filter(cat => cat._id !== id)
      }));
      return true;
    } catch (error) {
      throw error;
    }
  },

  addMenuItem: async (itemData) => {
    try {
      const res = await api.post('/menu', itemData);
      set((state) => ({ menuItems: [...state.menuItems, res.data.data] }));
      return res.data.data;
    } catch (error) {
      throw error;
    }
  },

  updateMenuItem: async (id, updates) => {
    try {
      const res = await api.put(`/menu/${id}`, updates);
      set((state) => ({
        menuItems: state.menuItems.map(item => item._id === id ? res.data.data : item)
      }));
      return res.data.data;
    } catch (error) {
      throw error;
    }
  },

  deleteMenuItem: async (id) => {
    try {
      await api.delete(`/menu/${id}`);
      set((state) => ({
        menuItems: state.menuItems.filter(item => item._id !== id)
      }));
      return true;
    } catch (error) {
      throw error;
    }
  }
}));

export default useMenuStore;
