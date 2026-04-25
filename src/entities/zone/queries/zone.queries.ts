// TanStack Query обёртки для /zones и /zones/:id.
// queryKey включает mode (Phase 3 forward-compat, MAP-08) и round5-bbox (MAP-06).
// keepPreviousData → нет flicker при пане.
//
// Phase 2 Plan 03: queryKey также включает serverQuery (filters). Смена фильтра →
// новый key → старый запрос cancelled через AbortSignal (race protection D-12).
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { roundBbox5, type Bbox } from '@/shared/lib/geo';
import { fetchZones, fetchZoneById } from '../api/zone.api';
import type { TimeMode } from '../model/zone.types';

export function useZonesQuery(
  bbox: Bbox | null,
  serverQuery: Record<string, string> = {},
  mode: TimeMode = { kind: 'now' },
) {
  const rounded = bbox ? roundBbox5(bbox) : null;
  return useQuery({
    queryKey: ['zones', mode, rounded, serverQuery] as const,
    queryFn: ({ signal }) => fetchZones(rounded!, serverQuery, signal),
    enabled: rounded !== null,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

// CARD-01: запрос полной Zone по id. enabled=false при id===null (карточка
// закрыта). staleTime 60с — карточка чаще закрывается/открывается чем меняются
// мета-поля зоны (имя/тип/etc.); занятость уже отдельно живёт через useZonesQuery.
export function useZoneByIdQuery(id: number | null) {
  return useQuery({
    queryKey: ['zone', id] as const,
    queryFn: ({ signal }) => fetchZoneById(id!, signal),
    enabled: id !== null,
    staleTime: 60_000,
  });
}
