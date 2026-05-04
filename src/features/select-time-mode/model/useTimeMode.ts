// TIME-04 / URL-02 / D-11 / D-12: TimeMode живёт в URL через ?t= с custom parser.
// history: 'replace' (D-12) — смена mode не плодит history-stack.
// clearOnDefault: true (D-11) — ?t=now не пишется в URL.
// FSD: features → entities (типы) + shared (parser) — никаких feature↔feature.
//
// Quick task 260426-hhb (SUPERSEDES D-11):
// URL формат упрощён до отсутствия param'а (now) либо чистого ISO UTC.
// TimeMode = derived из at внутри parser'а (см. parseAsTimeMode.deriveMode).
// Hook остаётся тонкой обёрткой: { mode, setMode, setNow } — публичный
// контракт сохранён для consumers (ZoneStateOverlay, ZoneCard, ModeTransitionOverlay,
// TimeModeLiveRegion, useFilteredZones, useViewportZones).
import { useQueryState } from 'nuqs';
import { parseAsTimeMode } from '@/shared/lib/url';
import type { TimeMode } from '@/entities/zone';

const NOW: TimeMode = { kind: 'now' };

export function useTimeMode() {
  const [mode, setMode] = useQueryState<TimeMode>(
    't',
    parseAsTimeMode.withDefault(NOW).withOptions({
      history: 'replace',
      clearOnDefault: true,
    }),
  );
  const setNow = () => setMode(NOW);
  return { mode, setMode, setNow };
}
