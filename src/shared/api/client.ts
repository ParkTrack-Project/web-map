import axios from 'axios';
import { env } from '@/shared/config';
import { tokenStore } from '@/shared/auth';

export const apiClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  timeout: 15_000,
  adapter: 'fetch',
});

apiClient.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      tokenStore.clear();
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);
