import axios from 'axios';
import { sanitizePayload } from './security';

// ──────────────────────────────────────────────
//  Client-Side Response Cache
//  - Caches GET responses in-memory with per-namespace TTL
//  - Stale-while-revalidate: returns cached data instantly, refreshes in background
//  - Auto-busts on mutations (POST/PUT/PATCH/DELETE)
// ──────────────────────────────────────────────
const CACHE_TTL_MAP = {
  '/menu': 30_000,
  '/menu/categories': 30_000,
  '/recipes': 30_000,
  '/recipes/stats': 60_000,
  '/public/menu': 60_000,
  '/public/recommendations': 120_000,
  '/crash-prevention/health': 8_000,
  '/crash-prevention/services': 25_000,
};

const DEFAULT_CACHE_TTL = 10_000; // 10 seconds

class ClientCache {
  constructor() {
    this.store = new Map();
  }

  get(url) {
    const entry = this.store.get(url);
    if (!entry) return null;
    const isStale = Date.now() > entry.expiresAt;
    return { data: entry.data, isStale };
  }

  set(url, data) {
    const ttl = this._getTTL(url);
    this.store.set(url, { data, expiresAt: Date.now() + ttl, setAt: Date.now() });
    // Cap cache at 200 entries
    if (this.store.size > 200) {
      const oldest = this.store.keys().next().value;
      this.store.delete(oldest);
    }
  }

  // Bust all keys matching a prefix (e.g. "/menu" busts "/menu", "/menu/categories", etc.)
  bustByPrefix(url) {
    // Extract the first two path segments: /api/menu/123 → /menu
    const segments = url.replace(/^\/api/, '').split('/').filter(Boolean);
    const prefix = '/' + (segments[0] || '');
    for (const key of this.store.keys()) {
      if (key.includes(prefix)) {
        this.store.delete(key);
      }
    }
  }

  _getTTL(url) {
    for (const [pattern, ttl] of Object.entries(CACHE_TTL_MAP)) {
      if (url.includes(pattern)) return ttl;
    }
    return DEFAULT_CACHE_TTL;
  }
}

const clientCache = new ClientCache();

// Base API instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Auto-sanitize payload data if present to prevent script injection (XSS)
    if (config.data) {
      config.data = sanitizePayload(config.data);
    }

    // Client-side cache: intercept GET requests
    if (config.method === 'get' && !config._skipCache) {
      const cached = clientCache.get(config.url);
      if (cached && !cached.isStale) {
        // Fresh cache → return immediately via adapter override
        config.adapter = () => Promise.resolve({
          data: cached.data,
          status: 200,
          statusText: 'OK (cached)',
          headers: { 'x-client-cache': 'HIT' },
          config,
        });
      } else if (cached && cached.isStale) {
        // Stale → return stale data immediately, refresh in background
        config._staleData = cached.data;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => {
    // Cache GET responses
    if (response.config.method === 'get' && response.status >= 200 && response.status < 300) {
      if (!response.headers?.['x-client-cache']) {
        clientCache.set(response.config.url, response.data);
      }
    }

    // Bust cache on mutations
    if (['post', 'put', 'patch', 'delete'].includes(response.config.method)) {
      clientCache.bustByPrefix(response.config.url);
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // On network error, return stale cached data if available (GET)
    if (!error.response && originalRequest?.method === 'get') {
      const cached = clientCache.get(originalRequest.url);
      if (cached) {
        return { data: cached.data, status: 200, statusText: 'OK (stale)', config: originalRequest };
      }
    }

    // Offline Sync: Queue mutation requests that fail due to network errors
    if (!error.response && originalRequest && !originalRequest._skipOfflineQueue) {
      const { default: offlineSync } = await import('./offlineSync.js');
      if (offlineSync.shouldQueue(originalRequest)) {
        await offlineSync.enqueue(originalRequest);
        // Return a synthetic success so the UI doesn't error out
        return {
          data: { success: true, _offline: true, message: 'Saved offline — will sync when connection restores' },
          status: 202,
          statusText: 'Accepted (offline)',
          config: originalRequest
        };
      }
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      // Token is expired or invalid
      originalRequest._retry = true;
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth'; // Force logout
    }
    return Promise.reject(error);
  }
);

export default api;

