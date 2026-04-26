import axios from 'axios';
import { sanitizePayload } from './security';

const adminApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api/admin',
  headers: { 'Content-Type': 'application/json' },
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  
  if (config.data) {
    config.data = sanitizePayload(config.data);
  }
  
  return config;
}, (error) => Promise.reject(error));

adminApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }
    if (error.response?.status === 403) {
      console.error('Super Admin access required');
    }
    return Promise.reject(error);
  }
);

export default adminApi;
