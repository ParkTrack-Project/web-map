// D-11: на первом mount читаем sessionStorage и, если URL пуст для фильтра,
// записываем сохранённое значение в URL через nuqs `history: 'replace'`.
// Запускается ОДИН раз — после AuthReady-mount.
//
// URL имеет приоритет: если в URL есть хоть один f*-параметр — пропускаем hydration
// (deeplink приоритетнее, чем последняя сессия пользователя).
import { useEffect, useRef } from 'react';
import { readFiltersFromStorage } from '@/entities/filters';
import { useFilters } from './useFilters';

export function useFiltersHydration(): void {
  const ran = useRef(false);
  const {
    filters,
    setHideNoFree,
    setMinConf,
    setMaxPay,
    setHidePrivate,
    setHideAccessible,
    setLocationType,
    setHideInactive,
  } = useFilters();

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    if (typeof window === 'undefined') return;

    // Если в URL есть хоть один f*-параметр — URL приоритетнее, не трогаем.
    const hasUrlFilter = window.location.search.includes('f');
    if (hasUrlFilter) return;

    const stored = readFiltersFromStorage();
    if (stored.hideNoFree !== undefined && stored.hideNoFree !== filters.hideNoFree) {
      setHideNoFree(stored.hideNoFree);
    }
    if (stored.minConf !== undefined && stored.minConf !== filters.minConf) {
      setMinConf(stored.minConf);
    }
    if (stored.maxPay !== undefined && stored.maxPay !== filters.maxPay) {
      setMaxPay(stored.maxPay);
    }
    if (stored.hidePrivate !== undefined && stored.hidePrivate !== filters.hidePrivate) {
      setHidePrivate(stored.hidePrivate);
    }
    if (stored.hideAccessible !== undefined && stored.hideAccessible !== filters.hideAccessible) {
      setHideAccessible(stored.hideAccessible);
    }
    if (stored.locationType !== undefined && stored.locationType.length > 0) {
      setLocationType(stored.locationType);
    }
    if (stored.hideInactive !== undefined && stored.hideInactive !== filters.hideInactive) {
      setHideInactive(stored.hideInactive);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
