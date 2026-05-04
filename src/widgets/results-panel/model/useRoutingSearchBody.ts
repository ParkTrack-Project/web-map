// Phase 4 / D-14 / D-15 / D-41:
// Composes URL state (?from, ?dest), filters, timeMode → RoutingSearchBody | null.
// null когда нет ?from (D-15: no origin → no body → useRoutingSearch disabled).
import { useMemo } from 'react';
import type { RoutingSearchBody } from '@/entities/zone';
import { useFromCoords } from '@/features/request-geolocation';
import { useDestination } from '@/features/address-search';
import { useFilters } from '@/features/filter-zones';
import { useTimeMode } from '@/features/select-time-mode';

export function useRoutingSearchBody(): RoutingSearchBody | null {
  const { from } = useFromCoords();
  const { dest } = useDestination();
  const { filters } = useFilters();
  const { mode } = useTimeMode();

  return useMemo(() => {
    if (!from) return null;
    const [latFrom, lonFrom] = from;
    const isToDest = !!dest;
    const body: RoutingSearchBody = {
      mode: isToDest ? 'route_to_destination' : 'find_parking',
      origin: { latitude: latFrom, longitude: lonFrom },
      // D-14 hardcoded
      limit: 20,
      provider: 'yandex',
      // D-41: use_forecast = true в past/future modes
      use_forecast: mode.kind !== 'now',
    };
    if (isToDest && dest) {
      body.destination = { latitude: dest[0], longitude: dest[1] };
      body.max_distance_to_destination_meters = 500; // D-14 hardcoded
    }
    // Map filters → body params (D-25)
    if (filters.maxPay !== null) body.max_pay = filters.maxPay;
    if (filters.hideNoFree) body.min_free_count = 1;
    if (filters.minConf > 0) body.min_confidence = filters.minConf;
    body.include_accessible = !filters.hideAccessible;
    return body;
  }, [from, dest, filters, mode]);
}
