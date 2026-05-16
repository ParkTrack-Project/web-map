import axios from 'axios';
import { env } from '@/shared/config';

// 2026-05-16: авторизация удалена полностью. Раньше здесь был request-интерсептор
// (Bearer из tokenStore) и response-интерсептор (401 → tokenStore.clear() +
// window.location.href='/login'). Теперь это чистый axios-клиент без auth:
// токен не подставляется, на 401 редиректа нет — ошибка просто проброшена
// в TanStack Query и показывается в error-state соответствующего виджета.
export const apiClient = axios.create({
  baseURL: env.VITE_API_BASE_URL,
  timeout: 15_000,
  adapter: 'fetch',
});
