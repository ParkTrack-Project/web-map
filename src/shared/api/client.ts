// Axios клиент для web-map.
// adapter: 'fetch' обязателен для совместимости с MSW 2.x Service Worker.
import axios from 'axios';
import { env } from '@/shared/config';

export const apiClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  timeout: 15_000,
  adapter: 'fetch',
});
