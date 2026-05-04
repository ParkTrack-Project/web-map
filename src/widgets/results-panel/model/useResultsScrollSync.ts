// Phase 4 / D-22 / RANK-05:
// Когда ?sel меняется И zone в candidates — virtualizer.scrollToIndex.
// НЕ скроллим если zone не в candidates (D-22 explicit).
// useRef-guard против infinite loop.
import { useEffect, useRef } from 'react';
import type { Virtualizer } from '@tanstack/react-virtual';
import type { RouteCandidate } from '@/entities/zone';
import { useSelectedZone } from '@/features/select-zone';

export function useResultsScrollSync(
  virtualizer: Virtualizer<HTMLDivElement, Element>,
  candidates: RouteCandidate[],
) {
  const { selectedZoneId } = useSelectedZone();
  const lastSyncedRef = useRef<number | null>(null);
  useEffect(() => {
    if (selectedZoneId == null) return;
    if (lastSyncedRef.current === selectedZoneId) return;
    const idx = candidates.findIndex((c) => c.zone_id === selectedZoneId);
    if (idx === -1) return; // not in candidates → no scroll
    virtualizer.scrollToIndex(idx, { align: 'center', behavior: 'smooth' });
    lastSyncedRef.current = selectedZoneId;
  }, [selectedZoneId, candidates, virtualizer]);
}
