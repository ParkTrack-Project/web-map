// Phase 4 / D-14 / D-27 / D-28: axios calls для /routing/{search,new,<id>}.
// Auth: apiClient (Phase 1 D-05) автоматически добавляет Bearer token из AuthAdapter.
// 401 → axios interceptor делегирует AuthAdapter (Phase 5 территория; в Phase 4 — toast).
import { apiClient } from '@/shared/api';
import type {
  RoutingSearchBody,
  RoutingSearchResponse,
  RoutingNewBody,
  Route,
} from '../model/routing.types';

/** §8.6: подбор кандидатов без сохранения. Используется для list-rendering и WTP. */
export async function searchRouting(
  body: RoutingSearchBody,
  signal: AbortSignal,
): Promise<RoutingSearchResponse> {
  const res = await apiClient.post<RoutingSearchResponse>('/routing/search', body, {
    signal,
  });
  return res.data;
}

/** §8.7: создание маршрута + сохранение. Возвращает полный Route с route_id. */
export async function createRoute(body: RoutingNewBody, signal?: AbortSignal): Promise<Route> {
  const res = await apiClient.post<Route>('/routing/new', body, { signal });
  return res.data;
}

/** §8.9: чтение маршрута по id для D-28 reload-recovery (?route=<id>). */
export async function getRouteById(routeId: number, signal: AbortSignal): Promise<Route> {
  const res = await apiClient.get<Route>(`/routing/${routeId}`, { signal });
  return res.data;
}
