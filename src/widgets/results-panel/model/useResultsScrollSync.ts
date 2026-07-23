// Phase 4 / D-22 / RANK-05:
// Постоянный выбор синхронизируем сразу. Hover с карты синхронизируем через
// паузу, чтобы случайный проход курсора над парковкой не дёргал список.
// Hover самого списка никогда не запускает scrollToIndex.
import { useEffect, useRef } from 'react';
import type { Virtualizer } from '@tanstack/react-virtual';
import type { RouteCandidate } from '@/entities/zone';
import { useResultSelection, useSelectedZone } from '@/features/select-zone';
import { RESULTS_MAP_HOVER_SCROLL_DELAY_MS } from '@/shared/config';

export function useResultsScrollSync(
  virtualizer: Virtualizer<HTMLDivElement, Element>,
  candidates: RouteCandidate[],
) {
  const { selectedZoneId } = useSelectedZone();
  const lastViewedZoneId = useResultSelection((state) => state.lastViewedZoneId);
  const hoveredZoneId = useResultSelection((state) => state.hoveredZoneId);
  const hoveredZoneSource = useResultSelection((state) => state.hoveredZoneSource);
  const persistentZoneId = selectedZoneId ?? lastViewedZoneId;
  const lastPersistentRef = useRef<number | null>(null);
  useEffect(() => {
    if (persistentZoneId == null || lastPersistentRef.current === persistentZoneId) return;
    const idx = candidates.findIndex((c) => c.zone_id === persistentZoneId);
    if (idx === -1) return; // not in candidates → no scroll
    virtualizer.scrollToIndex(idx, { align: 'center', behavior: 'smooth' });
    lastPersistentRef.current = persistentZoneId;
  }, [candidates, persistentZoneId, virtualizer]);

  useEffect(() => {
    if (hoveredZoneSource !== 'map' || hoveredZoneId === null) return;
    const idx = candidates.findIndex((candidate) => candidate.zone_id === hoveredZoneId);
    if (idx === -1) return;

    const timeoutId = window.setTimeout(() => {
      virtualizer.scrollToIndex(idx, { align: 'center', behavior: 'smooth' });
    }, RESULTS_MAP_HOVER_SCROLL_DELAY_MS);
    return () => window.clearTimeout(timeoutId);
  }, [candidates, hoveredZoneId, hoveredZoneSource, virtualizer]);
}
