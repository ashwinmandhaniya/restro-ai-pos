import { create } from 'zustand';
import api from '@/lib/api';
import useOutletStore from './outletStore';
import { secureStorage, sessionManager } from '@/lib/security';

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
      set({ 
        isLoading: false, 
        error: err.response?.data?.message || 'Login failed' 
      });
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
      set({ 
        isLoading: false, 
        error: err.response?.data?.message || 'Registration failed' 
      });
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
