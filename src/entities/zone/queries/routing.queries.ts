import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LIVE_DATA_REFETCH_MS } from '@/shared/config';
import { searchRouting, createRoute, getRouteById } from '../api/routing.api';
import type { RoutingSearchBody, RoutingNewBody } from '../model/routing.types';

/**
 * Совпадает ли «локация поиска» (origin + destination) у двух тел запроса.
 * Используется, чтобы держать прошлые результаты только при смене
 * фильтров/времени/радиуса, но НЕ при смене адреса.
 */
function sameSearchLocation(a: RoutingSearchBody | null, b: RoutingSearchBody | null): boolean {
  if (!a || !b) return false;
  return (
    a.origin?.latitude === b.origin?.latitude &&
    a.origin?.longitude === b.origin?.longitude &&
    a.destination?.latitude === b.destination?.latitude &&
    a.destination?.longitude === b.destination?.longitude
  );
}

export function useRoutingSearch(body: RoutingSearchBody | null, live = false) {
  return useQuery({
    queryKey: ['routing-search', body] as const,
    queryFn: ({ signal }) => searchRouting(body!, signal),
    enabled: body !== null && Boolean(body?.origin),
    placeholderData: (previousData, previousQuery) => {
      const prevBody = (previousQuery?.queryKey?.[1] as RoutingSearchBody | null) ?? null;
      return sameSearchLocation(prevBody, body) ? previousData : undefined;
    },
    staleTime: 30_000,
    refetchInterval: live ? LIVE_DATA_REFETCH_MS : false,
  });
}

export function useRouteByIdQuery(routeId: number | null) {
  return useQuery({
    queryKey: ['route', routeId] as const,
    queryFn: ({ signal }) => getRouteById(routeId!, signal),
    enabled: routeId !== null,
    staleTime: 5 * 60_000,
  });
}

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
