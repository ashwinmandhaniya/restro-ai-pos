import { create } from 'zustand';
import api from '@/lib/api';

const useRecipeStore = create((set, get) => ({
  recipes: [],
  selectedRecipe: null,
  stats: null,
  total: 0,
  isLoading: false,
  error: null,

  // ─── List recipes ───
  fetchRecipes: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (filters.category) params.set('category', filters.category);
      if (filters.veg !== undefined) params.set('veg', filters.veg);
      if (filters.search) params.set('search', filters.search);
      if (filters.limit) params.set('limit', filters.limit);
      if (filters.page) params.set('page', filters.page);
      const query = params.toString();

      const res = await api.get(`/recipes${query ? '?' + query : ''}`);
      set({ recipes: res.data.data, total: res.data.total || 0, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // ─── Get single recipe ───
  fetchRecipe: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get(`/recipes/${id}`);
      set({ selectedRecipe: res.data.data, isLoading: false });
      return res.data.data;
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  // ─── Create recipe ───
  createRecipe: async (data) => {
    try {
      const res = await api.post('/recipes', data);
      set(state => ({ recipes: [res.data.data, ...state.recipes], total: state.total + 1 }));
      return res.data.data;
    } catch (error) {
      console.error('Failed to create recipe:', error);
      throw error;
    }
  },

  // ─── Update recipe ───
  updateRecipe: async (id, data) => {
    try {
      const res = await api.put(`/recipes/${id}`, data);
      set(state => ({
        recipes: state.recipes.map(r => r._id === id ? res.data.data : r),
        selectedRecipe: state.selectedRecipe?._id === id ? res.data.data : state.selectedRecipe,
      }));
      return res.data.data;
    } catch (error) {
      console.error('Failed to update recipe:', error);
      throw error;
    }
  },

  // ─── Delete recipe ───
  deleteRecipe: async (id) => {
    try {
      await api.delete(`/recipes/${id}`);
      set(state => ({
        recipes: state.recipes.filter(r => r._id !== id),
        total: state.total - 1,
        selectedRecipe: state.selectedRecipe?._id === id ? null : state.selectedRecipe,
      }));
      return true;
    } catch (error) {
      console.error('Failed to delete recipe:', error);
      return false;
    }
  },

  // ─── Fetch stats ───
  fetchStats: async () => {
    try {
      const res = await api.get('/recipes/stats');
      set({ stats: res.data.data });
    } catch (error) {
      console.error('Failed to fetch recipe stats:', error);
    }
  },

  // ─── Clear selection ───
  clearSelection: () => set({ selectedRecipe: null }),
}));

export default useRecipeStore;
