import { useMemo } from 'react';
import { useQueryState } from 'nuqs';
import { parseAsBbox } from '@/shared/lib/url';
import { useZonesQuery } from '@/entities/zone';
import { useFilters, buildServerQuery, applyClientFilters } from '@/features/filter-zones';
import { useTimeMode } from '@/features/select-time-mode';
import type { Bbox } from '@/shared/lib/geo';

export function useFilteredZones() {
  const [bbox] = useQueryState<Bbox>('bbox', parseAsBbox);
  const { filters } = useFilters();
  const { mode } = useTimeMode();
  const serverQuery = useMemo(() => buildServerQuery(filters), [filters]);
  const query = useZonesQuery(bbox, serverQuery, mode);
  const filtered = useMemo(
    () => (query.data ? applyClientFilters(query.data, filters) : undefined),
    [query.data, filters],
  );
  return { ...query, data: filtered, bbox, filters, mode };
}
