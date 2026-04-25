// Phase 2 Plan 03 — types для всех 7 фильтров (FILTER-01..07).
// Дефолты согласованы с D-09: hideInactive default ON, всё остальное OFF.
// minConf=0 (без ограничения), maxPay=null (без ограничения), locationType=[] (все типы).

export type LocationType = 'street' | 'yard' | 'open_lot' | 'underground' | 'multilevel';

export const ALL_LOCATION_TYPES: readonly LocationType[] = [
  'street',
  'yard',
  'open_lot',
  'underground',
  'multilevel',
] as const;

export interface ZoneFilters {
  hideNoFree: boolean; // FILTER-01 default false
  minConf: number; // FILTER-02 default 0 (no min)
  maxPay: number | null; // FILTER-03 default null (no max)
  hidePrivate: boolean; // FILTER-04 default false
  hideAccessible: boolean; // FILTER-05 default false
  locationType: LocationType[]; // FILTER-06 default [] (все видимы)
  hideInactive: boolean; // FILTER-07 default true (D-09 default ON)
}

export const DEFAULT_FILTERS: ZoneFilters = {
  hideNoFree: false,
  minConf: 0,
  maxPay: null,
  hidePrivate: false,
  hideAccessible: false,
  locationType: [],
  hideInactive: true,
};

// FILTER-09: сколько фильтров не в дефолте (для badge-count «Активно: N»).
export function countActive(f: ZoneFilters): number {
  let n = 0;
  if (f.hideNoFree !== DEFAULT_FILTERS.hideNoFree) n++;
  if (f.minConf !== DEFAULT_FILTERS.minConf) n++;
  if (f.maxPay !== DEFAULT_FILTERS.maxPay) n++;
  if (f.hidePrivate !== DEFAULT_FILTERS.hidePrivate) n++;
  if (f.hideAccessible !== DEFAULT_FILTERS.hideAccessible) n++;
  if (f.locationType.length !== 0) n++;
  if (f.hideInactive !== DEFAULT_FILTERS.hideInactive) n++;
  return n;
}
