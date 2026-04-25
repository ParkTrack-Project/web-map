// TanStack Query обёртка для /zones. queryKey включает mode (Phase 3 forward-compat, MAP-08)
// и round5-bbox (MAP-06). keepPreviousData → нет flicker при пане.
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { roundBbox5, type Bbox } from '@/shared/lib/geo';
import { fetchZones } from '../api/zone.api';
import type { TimeMode } from '../model/zone.types';

export function useZonesQuery(bbox: Bbox | null, mode: TimeMode = { kind: 'now' }) {
  const rounded = bbox ? roundBbox5(bbox) : null;
  return useQuery({
    queryKey: ['zones', mode, rounded] as const,
    queryFn: ({ signal }) => fetchZones(rounded!, signal),
    enabled: rounded !== null,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}
