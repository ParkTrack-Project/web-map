// TanStack Query обёртки для /zones и /zones/:id.
// queryKey включает mode (Phase 3 forward-compat, MAP-08) и round5-bbox (MAP-06).
// keepPreviousData → нет flicker при пане.
//
// Phase 2 Plan 03: queryKey также включает serverQuery (filters). Смена фильтра →
// новый key → старый запрос cancelled через AbortSignal (race protection D-12).
//
// Phase 3 Plan 01 (D-15): hard-separation guard — past/future без `at` это
// программная ошибка. Synchronous throw ловит баг в коде, который забыл
// передать `at`. Это НЕ runtime-fallback для пользователя.
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { roundBbox5, type Bbox } from '@/shared/lib/geo';
import { fetchZones, fetchZoneById } from '../api/zone.api';
import type { TimeMode } from '../model/zone.types';

export function useZonesQuery(
  bbox: Bbox | null,
  serverQuery: Record<string, string> = {},
  mode: TimeMode = { kind: 'now' },
) {
  // D-15 hard-separation guard: программная ошибка, если past/future без at.
  // Это dev-time bug detector, НЕ runtime-fallback для пользователя.
  if ((mode.kind === 'past' || mode.kind === 'future') && !mode.at) {
    throw new Error(`[useZonesQuery] mode.kind=${mode.kind} requires .at (TimeMode invariant)`);
  }
  const rounded = bbox ? roundBbox5(bbox) : null;
  return useQuery({
    queryKey: ['zones', mode, rounded, serverQuery] as const,
    queryFn: ({ signal }) => fetchZones(rounded!, serverQuery, mode, signal),
    enabled: rounded !== null,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  });
}

// CARD-01 + Phase 3 Plan 05 / TIME-07: запрос полной Zone по id с mode-awareness.
// enabled=false при id===null (карточка закрыта). staleTime 60с — карточка чаще
// закрывается/открывается чем меняются мета-поля зоны.
//
// mode в queryKey → atomic card mode-switch: при смене ?t= TanStack автоматически
// перевычитывает карточку через новый key + abort'ит старый запрос (TIME-05 + TIME-07).
//
// D-15 hard-separation guard для card-уровня: past/future без at — программная
// ошибка, ловим в dev-time.
//
// Backward-compat: default mode={kind:'now'} → существующие Phase 1+2 callsites
// (без mode arg) продолжают работать через /zones/:id endpoint.
export function useZoneByIdQuery(id: number | null, mode: TimeMode = { kind: 'now' }) {
  if ((mode.kind === 'past' || mode.kind === 'future') && !mode.at) {
    throw new Error(`[useZoneByIdQuery] mode.kind=${mode.kind} requires .at (TimeMode invariant)`);
  }
  return useQuery({
    queryKey: ['zone', id, mode] as const,
    queryFn: ({ signal }) => fetchZoneById(id!, signal, mode),
    enabled: id !== null,
    staleTime: 60_000,
  });
}
