import { create } from 'zustand';
import api from '@/lib/api';
import useOutletStore from './outletStore';
import { secureStorage, sessionManager } from '@/lib/security';

// Helper: detect plan-gating error codes from backend
const isPlanGated = (err) => {
  const code = err.response?.data?.code;
  const status = err.response?.status;
  return status === 403 && (code === 'PENDING_APPROVAL' || code === 'NO_ACTIVE_PLAN' || code === 'USER_NOT_FOUND');
};

const useAuthStore = create((set, get) => ({
  user: secureStorage.getItem('user') || null,
  token: secureStorage.getItem('token') || null,
  isLoading: false,
  error: null,
  lastActivity: Date.now(),

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, token } = response.data;
      
      // Store encrypted
      secureStorage.setItem('token', token);
      secureStorage.setItem('user', user);
      
      // Also keep raw token for API interceptor (needed for Bearer header)
      localStorage.setItem('token', token);
      
      set({ user, token, isLoading: false, lastActivity: Date.now() });
      
      // Start session timeout
      sessionManager.start(() => get().logout('Session expired due to inactivity'));
      
      // Trigger outlet store initialization
      useOutletStore.getState().init();
      return true;
    } catch (err) {
      set({ isLoading: false });
      
      // Redirect to user-not-found page for unapproved / no-plan users
      if (isPlanGated(err)) {
        const userEmail = err.response?.data?.email || email;
        window.location.href = `/user-not-found?email=${encodeURIComponent(userEmail)}`;
        return false;
      }
      
      set({ error: err.response?.data?.message || 'Login failed' });
      return false;
    }
  },

  register: async (restaurantName, userName, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', { 
        restaurantName, userName, email, password 
      });
      const { user, token } = response.data;
      
      // Store encrypted
      secureStorage.setItem('token', token);
      secureStorage.setItem('user', user);
      localStorage.setItem('token', token);
      
      set({ user, token, isLoading: false, lastActivity: Date.now() });
      
      // Start session timeout
      sessionManager.start(() => get().logout('Session expired due to inactivity'));
      
      // Trigger outlet store initialization
      useOutletStore.getState().init();
      return true;
    } catch (err) {
      set({ isLoading: false });
      
      // New registration always gets PENDING_APPROVAL → show error page
      if (isPlanGated(err)) {
        const userEmail = err.response?.data?.email || email;
        window.location.href = `/user-not-found?email=${encodeURIComponent(userEmail)}`;
        return false;
      }
      
      set({ error: err.response?.data?.message || 'Registration failed' });
      return false;
    }
  },

  logout: (reason) => {
    // Stop session timer
    sessionManager.stop();
    
    // Clear ALL sensitive storage
    secureStorage.removeItem('token');
    secureStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('lastActiveOutletId');
    
    // Clear session-specific stores
    sessionStorage.clear();
    
    set({ user: null, token: null });
    
    // Redirect with optional reason
    if (reason) {
      window.location.href = `/auth?reason=${encodeURIComponent(reason)}`;
    } else {
      window.location.href = '/auth';
    }
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      // Automatically attaches token via interceptor
      const response = await api.get('/auth/me');
      const user = response.data.user;
      
      set({ user });
      secureStorage.setItem('user', user);
      
      // Start session timeout
      sessionManager.start(() => get().logout('Session expired due to inactivity'));
      
      // Trigger outlet store initialization
      useOutletStore.getState().init();
    } catch (err) {
      // If restaurant was suspended / approval revoked mid-session
      if (isPlanGated(err)) {
        const userEmail = err.response?.data?.email || '';
        // Clear session
        secureStorage.removeItem('token');
        secureStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({ user: null, token: null });
        window.location.href = `/user-not-found?email=${encodeURIComponent(userEmail)}`;
        return;
      }
      
      set({ user: null, token: null });
      secureStorage.removeItem('token');
      secureStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  // Update activity timestamp (called by session manager implicitly)
  updateActivity: () => {
    set({ lastActivity: Date.now() });
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
