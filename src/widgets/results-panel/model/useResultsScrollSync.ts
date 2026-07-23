// Phase 4 / D-22 / RANK-05:
// Постоянный выбор по клику синхронизируем со списком сразу.
import { useEffect, useRef } from 'react';
import type { Virtualizer } from '@tanstack/react-virtual';
import type { RouteCandidate } from '@/entities/zone';
import { useResultSelection, useSelectedZone } from '@/features/select-zone';

export function useResultsScrollSync(
  virtualizer: Virtualizer<HTMLDivElement, Element>,
  candidates: RouteCandidate[],
) {
  const { selectedZoneId } = useSelectedZone();
  const lastViewedZoneId = useResultSelection((state) => state.lastViewedZoneId);
  const persistentZoneId = selectedZoneId ?? lastViewedZoneId;
  const lastPersistentRef = useRef<number | null>(null);
  useEffect(() => {
    if (persistentZoneId == null || lastPersistentRef.current === persistentZoneId) return;
    const idx = candidates.findIndex((c) => c.zone_id === persistentZoneId);
    if (idx === -1) return; // not in candidates → no scroll
    virtualizer.scrollToIndex(idx, { align: 'center', behavior: 'smooth' });
    lastPersistentRef.current = persistentZoneId;
  }, [candidates, persistentZoneId, virtualizer]);
}
