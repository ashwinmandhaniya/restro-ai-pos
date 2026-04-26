import { create } from 'zustand';
import api from '@/lib/api';

const useChefStore = create((set, get) => ({
  chefs: [],
  stations: [],
  leaderboard: [],
  dashboard: null,
  aiInsights: null,
  isLoading: false,
  error: null,

  fetchChefs: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/chef');
      set({ chefs: res.data.data, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchStations: async () => {
    try {
      const res = await api.get('/kds/stations');
      set({ stations: res.data.data });
    } catch (error) {
      console.error('Failed to fetch kitchen stations:', error);
    }
  },

  fetchLeaderboard: async () => {
    try {
      const res = await api.get('/chef/leaderboard');
      set({ leaderboard: res.data.data });
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  },

  fetchDashboard: async () => {
    try {
      const res = await api.get('/chef/dashboard');
      set({ dashboard: res.data.data });
    } catch (error) {
      console.error('Failed to fetch chef dashboard:', error);
    }
  },

  fetchAIInsights: async () => {
    set({ isLoading: true });
    try {
      const res = await api.get('/chef/ai/insights');
      set({ aiInsights: res.data.data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch AI insights:', error);
      set({ isLoading: false });
    }
  },

  toggleAvailability: async (chefId, isAvailable) => {
    try {
      // Optimistic update
      set(state => ({
        chefs: state.chefs.map(chef => 
          chef._id === chefId 
            ? { ...chef, chefProfile: { ...chef.chefProfile, isAvailable } } 
            : chef
        )
      }));
      await api.post(`/chef/${chefId}/toggle-availability`, { isAvailable });
    } catch (error) {
      console.error('Failed to toggle availability:', error);
      // Rollback could go here
    }
  },

  updateChefStation: async (chefId, stationId) => {
    try {
      const currentStationId = get().chefs.find(c => c._id === chefId)?.chefProfile?.primaryStationId?._id || null;
      if (currentStationId === stationId) return;

      // Optimistic update
      set(state => ({
        chefs: state.chefs.map(chef => 
          chef._id === chefId 
            ? { ...chef, chefProfile: { ...chef.chefProfile, primaryStationId: stationId ? { _id: stationId, name: 'Updating...' } : null } } 
            : chef
        )
      }));

      await api.patch(`/chef/${chefId}/station`, { stationId });
    } catch (error) {
      console.error('Failed to update chef station:', error);
      // Rollback
      get().fetchChefs();
    }
  },

  triggerRebalance: async () => {
    try {
      await api.post('/chef/rebalance');
    } catch (error) {
      console.error('Failed to trigger rebalance:', error);
    }
  },

  // Socket Handlers
  handleAvailabilityChanged: ({ chefId, isAvailable }) => {
    set(state => ({
      chefs: state.chefs.map(chef => 
        chef._id === chefId 
          ? { ...chef, chefProfile: { ...chef.chefProfile, isAvailable } } 
          : chef
      )
    }));
  },

  handleLoadUpdated: ({ chefId, currentLoad }) => {
    set(state => ({
      chefs: state.chefs.map(chef =>
        chef._id === chefId
          ? { ...chef, chefProfile: { ...chef.chefProfile, currentLoad } }
          : chef
      )
    }));
  },

  handleStationUpdated: ({ chefId, stationId, stationName }) => {
    set(state => ({
      chefs: state.chefs.map(chef => 
        chef._id === chefId 
          ? { ...chef, chefProfile: { ...chef.chefProfile, primaryStationId: stationId ? { _id: stationId, name: stationName } : null } } 
          : chef
      )
    }));
  }
}));

export default useChefStore;
