import { create } from 'zustand';
import type { RouteCandidate } from '@/entities/zone';

interface ResultSelectionState {
  resultZoneIds: number[];
  resultCandidates: RouteCandidate[];
  lastViewedZoneId: number | null;
  setResultZoneIds: (zoneIds: number[]) => void;
  setResultCandidates: (candidates: RouteCandidate[]) => void;
  markZoneViewed: (zoneId: number) => void;
  clearResultSelection: () => void;
}

function sameIds(left: number[], right: number[]) {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

export const useResultSelection = create<ResultSelectionState>((set) => ({
  resultZoneIds: [],
  resultCandidates: [],
  lastViewedZoneId: null,
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
      };
    }),
  markZoneViewed: (zoneId) =>
    set((state) => (state.resultZoneIds.includes(zoneId) ? { lastViewedZoneId: zoneId } : state)),
  clearResultSelection: () =>
    set({
      resultZoneIds: [],
      resultCandidates: [],
      lastViewedZoneId: null,
    }),
}));

export function shouldDimZone(
  zoneId: number,
  selectedZoneId: number | null,
  resultZoneIds: readonly number[],
) {
  if (selectedZoneId !== null) return zoneId !== selectedZoneId;
  return resultZoneIds.length > 0 && !resultZoneIds.includes(zoneId);
}

export function shouldDimCluster(
  clusterZoneIds: readonly number[],
  selectedZoneId: number | null,
  resultZoneIds: readonly number[],
) {
  if (selectedZoneId !== null) return !clusterZoneIds.includes(selectedZoneId);
  return resultZoneIds.length > 0 && !clusterZoneIds.some((id) => resultZoneIds.includes(id));
}
