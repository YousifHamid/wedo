import axios from 'axios';
import useAuthStore from '../store/useAuthStore';
import { API_BASE_URL, API_TIMEOUT } from '../config/env';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid — auto logout
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  }
);

export default api;
