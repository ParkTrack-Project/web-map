// Phase 4 / D-14 / D-15 / D-41:
// Composes URL state (?from, ?dest), filters, timeMode → RoutingSearchBody | null.
// null когда нет ?from (D-15: no origin → no body → useRoutingSearch disabled).
//
// Quick-fix 2026-05-16 (п.6): чистый builder вынесен наружу (buildRoutingBody),
// чтобы BuildRouteSection мог собрать body с только что полученной геолокацией —
// ДО того как ?from запишется в URL и hook пересчитается (внутри click-handler
// синхронно прочитать обновлённый hook нельзя).
import { useMemo } from 'react';
import type { RoutingSearchBody, TimeMode } from '@/entities/zone';
import type { ZoneFilters } from '@/entities/filters';
import { useFromCoords } from '@/features/request-geolocation';
import { useDestination } from '@/features/address-search';
import { useFilters } from '@/features/filter-zones';
import { useTimeMode } from '@/features/select-time-mode';

export interface BuildRoutingBodyArgs {
  from: [number, number] | null; // [lat, lon] (URL-05/06 convention)
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
    // D-14 hardcoded
    limit: 100,
    provider: 'geoapify',
    // D-41: use_forecast = true в past/future modes
    use_forecast: true,
  };
  if (isToDest && dest) {
    body.destination = { latitude: dest[0], longitude: dest[1] };
  }
  // Map filters → body params (D-25)
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
