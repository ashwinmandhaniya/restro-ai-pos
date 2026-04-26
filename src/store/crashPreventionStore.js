import { create } from 'zustand';
import api from '@/lib/api';

const useCrashPreventionStore = create((set, get) => ({
  // State
  health: null,
  services: [],
  logs: [],
  totalLogs: 0,
  isLoading: false,
  healthLoading: false,
  servicesLoading: false,
  logsLoading: false,
  error: null,

  // ─── Fetch real-time machine health ───
  fetchHealth: async () => {
    set({ healthLoading: true });
    try {
      const res = await api.get('/crash-prevention/health');
      set({ health: res.data.data, healthLoading: false, error: null });
    } catch (error) {
      console.error('CrashPrevention: fetchHealth failed:', error);
      set({ healthLoading: false, error: error.message });
    }
  },

  // ─── Fetch live service/equipment status ───
  fetchServices: async () => {
    set({ servicesLoading: true });
    try {
      const res = await api.get('/crash-prevention/services');
      set({ services: res.data.data, servicesLoading: false, error: null });
    } catch (error) {
      console.error('CrashPrevention: fetchServices failed:', error);
      set({ servicesLoading: false, error: error.message });
    }
  },

  // ─── Fetch event logs from DB ───
  fetchLogs: async (filters = {}) => {
    set({ logsLoading: true });
    try {
      const params = new URLSearchParams();
      if (filters.level) params.set('level', filters.level);
      if (filters.resolved !== undefined) params.set('resolved', filters.resolved);
      if (filters.limit) params.set('limit', filters.limit);
      if (filters.page) params.set('page', filters.page);
      const query = params.toString();

      const res = await api.get(`/crash-prevention/logs${query ? '?' + query : ''}`);
      set({
        logs: res.data.data,
        totalLogs: res.data.total || 0,
        logsLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('CrashPrevention: fetchLogs failed:', error);
      set({ logsLoading: false, error: error.message });
    }
  },

  // ─── Resolve an event ───
  resolveEvent: async (id) => {
    try {
      await api.patch(`/crash-prevention/logs/${id}/resolve`);
      // Optimistic update
      set(state => ({
        logs: state.logs.map(l =>
          (l._id === id || l.id === id)
            ? { ...l, resolved: true, resolvedAt: new Date().toISOString() }
            : l
        ),
      }));
      return true;
    } catch (error) {
      console.error('CrashPrevention: resolveEvent failed:', error);
      return false;
    }
  },

  // ─── Restart/reconnect a service ───
  restartService: async (serviceId) => {
    try {
      await api.post(`/crash-prevention/services/${serviceId}/restart`);
      return true;
    } catch (error) {
      console.error('CrashPrevention: restartService failed:', error);
      return false;
    }
  },

  // ─── Trigger recovery action ───
  triggerRecovery: async (action) => {
    try {
      await api.post(`/crash-prevention/recovery/${action}`);
      return true;
    } catch (error) {
      console.error('CrashPrevention: triggerRecovery failed:', error);
      return false;
    }
  },

  // ─── Socket.IO event handlers (called from page) ───
  handleNewEvent: (event) => {
    set(state => ({ logs: [event, ...state.logs] }));
  },

  handleEventResolved: ({ id }) => {
    set(state => ({
      logs: state.logs.map(l =>
        (l._id === id || l.id === id) ? { ...l, resolved: true } : l
      ),
    }));
  },
}));

export default useCrashPreventionStore;
