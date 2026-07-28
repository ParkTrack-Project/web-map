import { useMemo } from 'react';
import type { RoutingSearchBody, TimeMode } from '@/entities/zone';
import type { ZoneFilters } from '@/entities/filters';
import { useFromCoords } from '@/features/request-geolocation';
import { useDestination } from '@/features/address-search';
import { useFilters } from '@/features/filter-zones';
import { useTimeMode } from '@/features/select-time-mode';

export interface BuildRoutingBodyArgs {
  from: [number, number] | null;
  dest: [number, number] | null; // [lat, lon]
  filters: ZoneFilters;
  mode: TimeMode;
}

export function buildRoutingBody({
  from,
  dest,
  filters,
  // `mode` остаётся в BuildRoutingBodyArgs (его передают вызывающие и он влияет
  // на queryKey/мемоизацию), но в самом body не используется: use_forecast
  // хардкожен true. Не деструктурируем — иначе noUnusedLocals падает на сборке.
}: BuildRoutingBodyArgs): RoutingSearchBody | null {
  if (!from) return null;
  const [latFrom, lonFrom] = from;
  const isToDest = !!dest;
  const body: RoutingSearchBody = {
    mode: isToDest ? 'route_to_destination' : 'find_parking',
    origin: { latitude: latFrom, longitude: lonFrom },
    limit: 50,
    provider: 'geoapify',
    use_forecast: true,
  };
  if (isToDest && dest) {
    body.destination = { latitude: dest[0], longitude: dest[1] };
  }
  if (filters.maxPay !== null) body.max_pay = filters.maxPay;
  const minFreeCount = Math.max(filters.hideNoFree ? 1 : 0, filters.minFreeCount);

  if (minFreeCount > 0) {
    body.min_free_count = minFreeCount;
  }
  if (filters.minConf > 0) body.min_confidence = filters.minConf;
  body.include_accessible = !filters.hideAccessible;
  return body;
}

export function useRoutingSearchBody(): RoutingSearchBody | null {
  const { from } = useFromCoords();
  const { dest } = useDestination();
  const { filters } = useFilters();
  const { mode } = useTimeMode();

  return useMemo(
    () => buildRoutingBody({ from, dest, filters, mode }),
    [from, dest, filters, mode],
  );
}
