// FILTER-01..07 + URL-03: один hook для 7 фильтров через nuqs.
// На каждое изменение — пишем в sessionStorage (D-11). URL hydration делает useFiltersHydration.
// clearOnDefault: true — поведение nuqs по умолчанию (D-15: дефолтные значения
// не сериализуются → toggle ON-then-OFF удаляет ?f-param из URL).
import { useCallback } from 'react';
import { useQueryState } from 'nuqs';
import {
  parseAsBoolean,
  parseAsFloat,
  parseAsInteger,
  parseAsLocationTypeCsv,
} from '@/shared/lib/url';
import {
  type ZoneFilters,
  type LocationType,
  DEFAULT_FILTERS,
  countActive,
  writeFilterToStorage,
} from '@/entities/filters';

export function useFilters() {
  const [hideNoFree, _setHideNoFree] = useQueryState(
    'fNoFree',
    parseAsBoolean.withDefault(DEFAULT_FILTERS.hideNoFree),
  );
  const [minFreeCount, _setMinFreeCount] = useQueryState(
    'fMinFree',
    parseAsInteger.withDefault(DEFAULT_FILTERS.minFreeCount),
  );
  const [minConf, _setMinConf] = useQueryState(
    'fMinConf',
    parseAsFloat.withDefault(DEFAULT_FILTERS.minConf),
  );
  const [maxPay, _setMaxPay] = useQueryState('fMaxPay', parseAsInteger);
  const [hidePrivate, _setHidePrivate] = useQueryState(
    'fNoPriv',
    parseAsBoolean.withDefault(DEFAULT_FILTERS.hidePrivate),
  );
  const [hideAccessible, _setHideAccessible] = useQueryState(
    'fNoAcc',
    parseAsBoolean.withDefault(DEFAULT_FILTERS.hideAccessible),
  );
  const [locationTypeArr, _setLocationType] = useQueryState(
    'fLoc',
    parseAsLocationTypeCsv.withDefault([]),
  );
  const [hideInactive, _setHideInactive] = useQueryState(
    'fInactive',
    parseAsBoolean.withDefault(DEFAULT_FILTERS.hideInactive),
  );

  const filters: ZoneFilters = {
    hideNoFree,
    minFreeCount,
    minConf,
    maxPay,
    hidePrivate,
    hideAccessible,
    locationType: locationTypeArr as LocationType[],
    hideInactive,
  };

  const setHideNoFree = useCallback(
    (v: boolean) => {
      _setHideNoFree(v);
      writeFilterToStorage('hideNoFree', v);
    },
    [_setHideNoFree],
  );
  const setMinFreeCount = useCallback(
    (v: number) => {
      const safeValue = Number.isFinite(v) ? Math.max(0, Math.floor(v)) : 0;
      _setMinFreeCount(safeValue);
      writeFilterToStorage('minFreeCount', safeValue);
    },
    [_setMinFreeCount],
  );
  const setMinConf = useCallback(
    (v: number) => {
      _setMinConf(v);
      writeFilterToStorage('minConf', v);
    },
    [_setMinConf],
  );
  const setMaxPay = useCallback(
    (v: number | null) => {
      _setMaxPay(v);
      writeFilterToStorage('maxPay', v);
    },
    [_setMaxPay],
  );
  const setHidePrivate = useCallback(
    (v: boolean) => {
      _setHidePrivate(v);
      writeFilterToStorage('hidePrivate', v);
    },
    [_setHidePrivate],
  );
  const setHideAccessible = useCallback(
    (v: boolean) => {
      _setHideAccessible(v);
      writeFilterToStorage('hideAccessible', v);
    },
    [_setHideAccessible],
  );
  const setLocationType = useCallback(
    (v: LocationType[]) => {
      _setLocationType(v);
      writeFilterToStorage('locationType', v);
    },
    [_setLocationType],
  );
  const setHideInactive = useCallback(
    (v: boolean) => {
      _setHideInactive(v);
      writeFilterToStorage('hideInactive', v);
    },
    [_setHideInactive],
  );

  const resetAll = useCallback(() => {
    setHideNoFree(DEFAULT_FILTERS.hideNoFree);
    setMinFreeCount(DEFAULT_FILTERS.minFreeCount);
    setMinConf(DEFAULT_FILTERS.minConf);
    setMaxPay(DEFAULT_FILTERS.maxPay);
    setHidePrivate(DEFAULT_FILTERS.hidePrivate);
    setHideAccessible(DEFAULT_FILTERS.hideAccessible);
    setLocationType(DEFAULT_FILTERS.locationType as LocationType[]);
    setHideInactive(DEFAULT_FILTERS.hideInactive);
  }, [
    setHideNoFree,
    setMinFreeCount,
    setMinConf,
    setMaxPay,
    setHidePrivate,
    setHideAccessible,
    setLocationType,
    setHideInactive,
  ]);

  return {
    filters,
    activeCount: countActive(filters),
    setHideNoFree,
    setMinFreeCount,
    setMinConf,
    setMaxPay,
    setHidePrivate,
    setHideAccessible,
    setLocationType,
    setHideInactive,
    resetAll,
  };
}
