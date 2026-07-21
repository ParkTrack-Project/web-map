import axios from 'axios';
import { env } from '@/shared/config';
import { getAccessToken, writeSession } from '@/shared/lib/session';

export const apiClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  timeout: 15_000,
  adapter: 'fetch',
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error) && error.response?.status === 401 && getAccessToken()) {
      writeSession(null);
      window.dispatchEvent(new CustomEvent('parktrack:unauthorized'));
    }
    return Promise.reject(error);
  },
);
