// Phase 4 / D-22 / RANK-05:
// Когда ?sel меняется И zone в candidates — virtualizer.scrollToIndex.
// НЕ скроллим если zone не в candidates (D-22 explicit).
// useRef-guard против infinite loop.
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
  const hoveredZoneId = useResultSelection((state) => state.hoveredZoneId);
  const hoveredZoneSource = useResultSelection((state) => state.hoveredZoneSource);
  const persistentZoneId = selectedZoneId ?? lastViewedZoneId;
  const lastHoveredRef = useRef<number | null>(null);
  const lastPersistentRef = useRef<number | null>(null);
  useEffect(() => {
    const mapHoveredZoneId = hoveredZoneSource === 'map' ? hoveredZoneId : null;
    const focusedZoneId = mapHoveredZoneId ?? persistentZoneId;
    if (focusedZoneId == null) return;
    const lastSyncedRef = mapHoveredZoneId === null ? lastPersistentRef : lastHoveredRef;
    if (lastSyncedRef.current === focusedZoneId) return;
    const idx = candidates.findIndex((c) => c.zone_id === focusedZoneId);
    if (idx === -1) return; // not in candidates → no scroll
    virtualizer.scrollToIndex(idx, { align: 'center', behavior: 'smooth' });
    lastSyncedRef.current = focusedZoneId;
  }, [candidates, hoveredZoneId, hoveredZoneSource, persistentZoneId, virtualizer]);
}
