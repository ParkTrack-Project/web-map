import { apiClient } from '@/shared/api';
import type {
  RoutingSearchBody,
  RoutingSearchResponse,
  RoutingNewBody,
  Route,
} from '../model/routing.types';

export async function searchRouting(
  body: RoutingSearchBody,
  signal: AbortSignal,
): Promise<RoutingSearchResponse> {
  const res = await apiClient.post<RoutingSearchResponse>('/routing/search', body, {
    signal,
  });
  return res.data;
}

export async function createRoute(body: RoutingNewBody, signal?: AbortSignal): Promise<Route> {
  // exactOptionalPropertyTypes: AxiosRequestConfig.signal не принимает undefined,
  // поэтому conditionally-spread.
  const res = await apiClient.post<Route>('/routing/new', body, signal ? { signal } : {});
  return res.data;
}

export async function getRouteById(routeId: number, signal: AbortSignal): Promise<Route> {
  const res = await apiClient.get<Route>(`/routing/${routeId}`, { signal });
  return res.data;
}
