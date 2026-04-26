import { create } from 'zustand';
import api from '@/lib/api';

const useMenuScannerStore = create((set) => ({
  file: null,
  isScanning: false,
  scanProgress: 0,
  scanStatus: '',
  parsedData: null,
  isImporting: false,
  error: null,

  setFile: (file) => set({ file, error: null }),
  
  clearSession: () => set({ 
    file: null, 
    isScanning: false, 
    scanProgress: 0, 
    scanStatus: '', 
    parsedData: null, 
    error: null 
  }),

  // Optional: Used mainly by frontend since we skip BullMQ for MVP and get response immediately
  setScanStatus: (status, progress) => set({ scanStatus: status, scanProgress: progress }),

  scanMenu: async (file) => {
    set({ isScanning: true, error: null, scanStatus: 'Uploading image...', scanProgress: 20 });
    
    try {
      const formData = new FormData();
      formData.append('menuImage', file);

      set({ scanStatus: 'AI is reading the menu...', scanProgress: 40 });

      // Assuming long request timeouts since LLM can take 10-15s
      // Set to 120 seconds to allow Gemini enough time for heavy menus
      const response = await api.post('/menu/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000 
      });

      set({ scanStatus: 'Finalizing structure...', scanProgress: 90 });

      if (response.data.success) {
        set({ 
          parsedData: response.data.data, 
          isScanning: false, 
          scanProgress: 100,
          scanStatus: 'Complete!' 
        });
        return true;
      } else {
        throw new Error(response.data.message || 'Verification failed');
      }
    } catch (err) {
      set({ 
        isScanning: false, 
        error: err.response?.data?.message || err.message || 'Failed to scan menu. Ensure image is clear.',
        scanStatus: 'Failed'
      });
      return false;
    }
  },

  updateParsedItem: (categoryIndex, itemIndex, field, value) => {
    set((state) => {
      const newData = { ...state.parsedData };
      newData.categories[categoryIndex].items[itemIndex][field] = value;
      return { parsedData: newData };
    });
  },

  importMenu: async () => {
    set({ isImporting: true, error: null });
    try {
      const state = useMenuScannerStore.getState();
      if (!state.parsedData || !state.parsedData.categories) throw new Error("No data to import");

      const response = await api.post('/menu/scan/import', { categories: state.parsedData.categories });
      
      set({ isImporting: false, parsedData: null, file: null });
      return response.data;
    } catch (err) {
      set({ isImporting: false, error: err.response?.data?.message || 'Failed to import menu.' });
      throw err;
    }
  }
}));

export default useMenuScannerStore;
