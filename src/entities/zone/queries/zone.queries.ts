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
//
// Phase 5 D-32 (NFR-04): per-endpoint staleTime tuning минимизирует requests.
//   /zones (now)        → 30s — ML cadence ~1min
//   /occupancy (past)   → 300s (5min) — history immutable
//   /forecasts (future) → 60s — forecasts decay
//   /zones/<id> (now)   → 60s — single zone, реже refetch
//   /occupancy?view=card→ 300s
//   /forecasts?view=card→ 60s
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { roundBbox5, type Bbox } from '@/shared/lib/geo';
import { LIVE_DATA_REFETCH_MS } from '@/shared/config';
import { fetchZones, fetchZoneById } from '../api/zone.api';
import type { TimeMode } from '../model/zone.types';

// D-32: staleTime per TimeMode (которому соответствует endpoint).
function staleTimeForListMode(mode: TimeMode): number {
  if (mode.kind === 'past') return 300_000; // /occupancy — history immutable
  if (mode.kind === 'future') return 60_000; // /forecasts — decay quickly
  return 30_000; // /zones (now) — ML refresh cadence
}

// 2026-06-06: интервальный авто-refetch только в режиме «Сейчас» (живой
// occupancy подтягивается с бэка раз в минуту). В past (история неизменна) и
// future (прогноз на фикс. время) поллинг бессмыслен → false. TanStack паузит
// интервал, когда вкладка вне фокуса (refetchIntervalInBackground по умолчанию
// false) — лишних запросов/квоты нет.
function liveRefetchInterval(mode: TimeMode): number | false {
  return mode.kind === 'now' ? LIVE_DATA_REFETCH_MS : false;
}

function staleTimeForCardMode(mode: TimeMode): number {
  if (mode.kind === 'past') return 300_000; // /occupancy view=card
  return 60_000; // /zones/:id (now) или /forecasts view=card
}

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
    staleTime: staleTimeForListMode(mode),
    refetchInterval: liveRefetchInterval(mode),
  });
}

// CARD-01 + Phase 3 Plan 05 / TIME-07: запрос полной Zone по id с mode-awareness.
// enabled=false при id===null (карточка закрыта). staleTime per D-32 — past 5min,
// now/future 60с (карточка чаще закрывается/открывается чем меняются мета-поля).
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
    staleTime: staleTimeForCardMode(mode),
    refetchInterval: liveRefetchInterval(mode),
  });
}
