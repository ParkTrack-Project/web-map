// D-11: sessionStorage namespace 'parktrack:f:v1:' — version-bumped, чтобы Phase 3+
// могли вводить новые фильтры без collision'ов с старыми сессиями.
// SSR-safe: typeof window guard (RESEARCH Pitfall #14).
//
// Запись фильтра == default → удаление ключа из SS, чтобы readFiltersFromStorage
// не возвращал «пустые подсказки» и URL hydration пропускал ненужные значения.
import { FILTER_STORAGE_PREFIX } from '@/shared/config';
import { type ZoneFilters, type LocationType, DEFAULT_FILTERS } from './filter.types';

function ssAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.sessionStorage !== 'undefined';
}

function ssGet(key: string): string | null {
  if (!ssAvailable()) return null;
  try {
    return window.sessionStorage.getItem(FILTER_STORAGE_PREFIX + key);
  } catch {
    return null;
  }
}

function ssSet(key: string, value: string | null): void {
  if (!ssAvailable()) return;
  try {
    if (value === null) window.sessionStorage.removeItem(FILTER_STORAGE_PREFIX + key);
    else window.sessionStorage.setItem(FILTER_STORAGE_PREFIX + key, value);
  } catch {
    /* quota / disabled / private mode — silent */
  }
}

export function readFiltersFromStorage(): Partial<ZoneFilters> {
  const r: Partial<ZoneFilters> = {};

  const hnf = ssGet('hideNoFree');
  if (hnf !== null) r.hideNoFree = hnf === '1';

  const mc = ssGet('minConf');
  if (mc !== null) {
    const n = Number(mc);
    if (!Number.isNaN(n)) r.minConf = n;
  }

  const mp = ssGet('maxPay');
  if (mp !== null) {
    if (mp === '') r.maxPay = null;
    else {
      const n = Number(mp);
      if (!Number.isNaN(n)) r.maxPay = n;
    }
  }

  const hp = ssGet('hidePrivate');
  if (hp !== null) r.hidePrivate = hp === '1';

  const ha = ssGet('hideAccessible');
  if (ha !== null) r.hideAccessible = ha === '1';

  const lt = ssGet('locationType');
  if (lt !== null) r.locationType = lt ? (lt.split(',') as LocationType[]) : [];

  const hi = ssGet('hideInactive');
  if (hi !== null) r.hideInactive = hi === '1';

  return r;
}

// Записывает один фильтр в SS. Если значение === дефолт — удаляет ключ.
export function writeFilterToStorage<K extends keyof ZoneFilters>(
  key: K,
  value: ZoneFilters[K],
): void {
  const isDefault = (() => {
    if (key === 'locationType') return (value as LocationType[]).length === 0;
    return value === DEFAULT_FILTERS[key];
  })();

  if (isDefault) {
    ssSet(key as string, null);
    return;
  }

  let serialized: string;
  switch (key) {
    case 'hideNoFree':
    case 'hidePrivate':
    case 'hideAccessible':
    case 'hideInactive':
      serialized = (value as boolean) ? '1' : '0';
      break;
    case 'minConf':
      serialized = String(value as number);
      break;
    case 'maxPay':
      serialized = value === null ? '' : String(value as number);
      break;
    case 'locationType':
      serialized = (value as LocationType[]).join(',');
      break;
    default:
      return;
  }
  ssSet(key as string, serialized);
}
