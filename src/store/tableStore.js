import { create } from 'zustand';
import api from '@/lib/api';

const useTableStore = create((set) => ({
  tables: [],
  isLoading: false,
  error: null,

  fetchTables: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/tables');
      set({ tables: res.data.data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.message || 'Failed to fetch tables', isLoading: false });
    }
  },

  createTable: async (tableData) => {
    try {
      const res = await api.post('/tables', tableData);
      set((state) => ({ tables: [...state.tables, res.data.data] }));
      return res.data.data;
    } catch (error) {
      throw error;
    }
  },

  updateTable: async (id, tableData) => {
    try {
      const res = await api.put(`/tables/${id}`, tableData);
      set((state) => ({
        tables: state.tables.map(table => table._id === id ? res.data.data : table)
      }));
      return res.data.data;
    } catch (error) {
      throw error;
    }
  },
  
  handleRealtimeTableUpdate: (updatedTable) => {
    set((state) => ({
      tables: state.tables.map(table => table._id === updatedTable._id ? updatedTable : table)
    }));
  },
  
  deleteTable: async (id) => {
    try {
      await api.delete(`/tables/${id}`);
      set((state) => ({
        tables: state.tables.filter(table => table._id !== id)
      }));
      return true;
    } catch (error) {
      throw error;
    }
  }
}));

export default useTableStore;
