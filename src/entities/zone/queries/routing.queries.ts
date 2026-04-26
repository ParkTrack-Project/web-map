// Phase 4 / D-16 / D-27 / D-28: TanStack Query hooks для routing.
// - useRoutingSearch: queryKey ['routing-search', body] — args сериализуется через JSON для cache key.
//   keepPreviousData → нет flicker при изменении filter (Pitfall 6 staleTime 30s acceptable).
// - useRouteByIdQuery: queryKey ['route', routeId] — staleTime 5min (route immutable после create).
// - useCreateRouteMutation: после success → qc.setQueryData(['route', id], route) →
//   useRouteByIdQuery instant-hit при reload без re-fetch.
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { searchRouting, createRoute, getRouteById } from '../api/routing.api';
import type { RoutingSearchBody, RoutingNewBody } from '../model/routing.types';

/**
 * D-16: queryKey включает full body — atomic refetch при изменении filters/timeMode/from/dest.
 * enabled: body !== null && body.origin valid — D-15 mode dispatch.
 */
export function useRoutingSearch(body: RoutingSearchBody | null) {
  return useQuery({
    queryKey: ['routing-search', body] as const,
    queryFn: ({ signal }) => searchRouting(body!, signal),
    enabled: body !== null && Boolean(body?.origin),
    placeholderData: keepPreviousData,
    staleTime: 30_000, // Pitfall 6: short stale window
  });
}

/**
 * D-28: route-by-id для reload-recovery. enabled только при не-null routeId.
 * staleTime 5min — route неизменен после create (если не PUT'нули status).
 */
export function useRouteByIdQuery(routeId: number | null) {
  return useQuery({
    queryKey: ['route', routeId] as const,
    queryFn: ({ signal }) => getRouteById(routeId!, signal),
    enabled: routeId !== null,
    staleTime: 5 * 60_000,
  });
}

/**
 * D-27 / ROUTE-01: создание маршрута. После success — hydrate ['route', id] cache,
 * чтобы reload через ?route=<id> не делал второй fetch.
 */
export function useCreateRouteMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ body, signal }: { body: RoutingNewBody; signal?: AbortSignal }) =>
      createRoute(body, signal),
    onSuccess: (route) => {
      qc.setQueryData(['route', route.route_id], route);
    },
  });
}
