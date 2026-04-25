// FILTER-08 / D-12: один query на (viewport + filters), результат прогоняется через
// applyClientFilters (minConf, maxPay safety-net). Race protection: queryKey
// включает serverQuery → смена фильтра → новый key → старый запрос cancelled
// через AbortSignal.
//
// FSD: features → entities (zone) + features (filter-zones) импорты разрешены
// если они НЕ горизонтально переплетают (filter-zones — стабильный нижний слой
// для viewport-driven-zones, не наоборот).
import { useMemo } from 'react';
import { useQueryState } from 'nuqs';
import { parseAsBbox } from '@/shared/lib/url';
import { useZonesQuery } from '@/entities/zone';
import { useFilters, buildServerQuery, applyClientFilters } from '@/features/filter-zones';
import type { Bbox } from '@/shared/lib/geo';

export function useFilteredZones() {
  const [bbox] = useQueryState<Bbox>('bbox', parseAsBbox);
  const { filters } = useFilters();
  const serverQuery = useMemo(() => buildServerQuery(filters), [filters]);
  const query = useZonesQuery(bbox, serverQuery, { kind: 'now' });
  const filtered = useMemo(
    () => (query.data ? applyClientFilters(query.data, filters) : undefined),
    [query.data, filters],
  );
  return { ...query, data: filtered, bbox, filters };
}
