// Axios клиент для web-map.
// adapter: 'fetch' обязателен для совместимости с MSW 2.x Service Worker.
// 401-перехватчик эмитит CustomEvent 'parktrack:unauthorized' — общий каркас (Phase 5)
// слушает его, чтобы редиректить на shared-логин.
import axios from 'axios';
import { env } from '@/shared/config';

export const apiClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  timeout: 15_000,
  adapter: 'fetch',
  withCredentials: env.VITE_AUTH_MODE === 'shared',
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('parktrack:unauthorized'));
    }
    return Promise.reject(error);
  },
);
