import { create } from 'zustand';

interface ResultSelectionState {
  resultZoneIds: number[];
  lastViewedZoneId: number | null;
  setResultZoneIds: (zoneIds: number[]) => void;
  markZoneViewed: (zoneId: number) => void;
  clearResultSelection: () => void;
}

function sameIds(left: number[], right: number[]) {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

export const useResultSelection = create<ResultSelectionState>((set) => ({
  resultZoneIds: [],
  lastViewedZoneId: null,
  setResultZoneIds: (zoneIds) =>
    set((state) => {
      const uniqueIds = [...new Set(zoneIds)];
      if (sameIds(state.resultZoneIds, uniqueIds)) return state;
      return {
        resultZoneIds: uniqueIds,
        lastViewedZoneId:
          state.lastViewedZoneId !== null && uniqueIds.includes(state.lastViewedZoneId)
            ? state.lastViewedZoneId
            : null,
      };
    }),
  markZoneViewed: (zoneId) =>
    set((state) => (state.resultZoneIds.includes(zoneId) ? { lastViewedZoneId: zoneId } : state)),
  clearResultSelection: () => set({ resultZoneIds: [], lastViewedZoneId: null }),
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
