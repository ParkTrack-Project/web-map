export type LocationType = 'street' | 'yard' | 'open_lot' | 'underground' | 'multilevel';

export const ALL_LOCATION_TYPES: readonly LocationType[] = [
  'street',
  'yard',
  'open_lot',
  'underground',
  'multilevel',
] as const;

export interface ZoneFilters {
  hideNoFree: boolean;
  minFreeCount: number;
  minConf: number;
  maxPay: number | null;
  hidePrivate: boolean;
  hideAccessible: boolean;
  locationType: LocationType[];
  hideInactive: boolean;
}

export const DEFAULT_FILTERS: ZoneFilters = {
  hideNoFree: false,
  minFreeCount: 0,
  minConf: 0,
  maxPay: null,
  hidePrivate: false,
  hideAccessible: false,
  locationType: [],
  hideInactive: true,
};

export function countActive(f: ZoneFilters): number {
  let n = 0;
  if (f.hideNoFree !== DEFAULT_FILTERS.hideNoFree) n++;
  if (f.minFreeCount !== DEFAULT_FILTERS.minFreeCount) n++;
  if (f.minConf !== DEFAULT_FILTERS.minConf) n++;
  if (f.maxPay !== DEFAULT_FILTERS.maxPay) n++;
  if (f.hidePrivate !== DEFAULT_FILTERS.hidePrivate) n++;
  if (f.hideAccessible !== DEFAULT_FILTERS.hideAccessible) n++;
  if (f.locationType.length !== 0) n++;
  if (f.hideInactive !== DEFAULT_FILTERS.hideInactive) n++;
  return n;
}
