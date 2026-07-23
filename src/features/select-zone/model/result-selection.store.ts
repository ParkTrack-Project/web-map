import { create } from 'zustand';
import type { RouteCandidate } from '@/entities/zone';

interface ResultSelectionState {
  resultZoneIds: number[];
  resultCandidates: RouteCandidate[];
  lastViewedZoneId: number | null;
  hoveredZoneId: number | null;
  setResultZoneIds: (zoneIds: number[]) => void;
  setResultCandidates: (candidates: RouteCandidate[]) => void;
  markZoneViewed: (zoneId: number) => void;
  setHoveredZone: (zoneId: number | null) => void;
  clearHoveredZone: (zoneId: number) => void;
  clearResultSelection: () => void;
}

function sameIds(left: number[], right: number[]) {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

export const useResultSelection = create<ResultSelectionState>((set) => ({
  resultZoneIds: [],
  resultCandidates: [],
  lastViewedZoneId: null,
  hoveredZoneId: null,
  setResultZoneIds: (zoneIds) =>
    set((state) => {
      const uniqueIds = [...new Set(zoneIds)];
      if (sameIds(state.resultZoneIds, uniqueIds)) return state;
      return {
        resultZoneIds: uniqueIds,
        resultCandidates: state.resultCandidates.filter((candidate) =>
          uniqueIds.includes(candidate.zone_id),
        ),
        lastViewedZoneId:
          state.lastViewedZoneId !== null && uniqueIds.includes(state.lastViewedZoneId)
            ? state.lastViewedZoneId
            : null,
        hoveredZoneId:
          state.hoveredZoneId !== null && uniqueIds.includes(state.hoveredZoneId)
            ? state.hoveredZoneId
            : null,
      };
    }),
  setResultCandidates: (candidates) =>
    set((state) => {
      const uniqueCandidates = candidates.filter(
        (candidate, index) =>
          candidates.findIndex((item) => item.zone_id === candidate.zone_id) === index,
      );
      const zoneIds = uniqueCandidates.map((candidate) => candidate.zone_id);
      return {
        resultZoneIds: zoneIds,
        resultCandidates: uniqueCandidates,
        lastViewedZoneId:
          state.lastViewedZoneId !== null && zoneIds.includes(state.lastViewedZoneId)
            ? state.lastViewedZoneId
            : null,
        hoveredZoneId:
          state.hoveredZoneId !== null && zoneIds.includes(state.hoveredZoneId)
            ? state.hoveredZoneId
            : null,
      };
    }),
  markZoneViewed: (zoneId) =>
    set((state) => (state.resultZoneIds.includes(zoneId) ? { lastViewedZoneId: zoneId } : state)),
  setHoveredZone: (zoneId) =>
    set((state) => {
      if (zoneId === null) return state.hoveredZoneId === null ? state : { hoveredZoneId: null };
      return state.resultZoneIds.includes(zoneId) && state.hoveredZoneId !== zoneId
        ? { hoveredZoneId: zoneId }
        : state;
    }),
  clearHoveredZone: (zoneId) =>
    set((state) => (state.hoveredZoneId === zoneId ? { hoveredZoneId: null } : state)),
  clearResultSelection: () =>
    set({
      resultZoneIds: [],
      resultCandidates: [],
      lastViewedZoneId: null,
      hoveredZoneId: null,
    }),
}));

export function shouldDimZone(
  zoneId: number,
  selectedZoneId: number | null,
  resultZoneIds: readonly number[],
  hoveredZoneId: number | null = null,
) {
  if (hoveredZoneId !== null) return zoneId !== hoveredZoneId;
  if (selectedZoneId !== null) return zoneId !== selectedZoneId;
  return resultZoneIds.length > 0 && !resultZoneIds.includes(zoneId);
}

export function shouldDimCluster(
  clusterZoneIds: readonly number[],
  selectedZoneId: number | null,
  resultZoneIds: readonly number[],
  hoveredZoneId: number | null = null,
) {
  if (hoveredZoneId !== null) return !clusterZoneIds.includes(hoveredZoneId);
  if (selectedZoneId !== null) return !clusterZoneIds.includes(selectedZoneId);
  return resultZoneIds.length > 0 && !clusterZoneIds.some((id) => resultZoneIds.includes(id));
}
