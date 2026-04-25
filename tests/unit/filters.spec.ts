import { describe, it, expect, beforeEach } from 'vitest';
import { applyClientFilters, buildServerQuery } from '@/features/filter-zones';
import {
  DEFAULT_FILTERS,
  countActive,
  writeFilterToStorage,
  readFiltersFromStorage,
} from '@/entities/filters';
import { FILTER_STORAGE_PREFIX } from '@/shared/config';
import type { ZoneMapItem } from '@/entities/zone';

function mockZone(over: Partial<ZoneMapItem>): ZoneMapItem {
  return {
    zone_id: 1,
    zone_type: 'standard',
    capacity: 10,
    occupied: 0,
    free_count: 10,
    confidence: 0.9,
    confidence_level: 'high',
    pay: 0,
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [1, 0],
          [1, 1],
          [0, 1],
          [0, 0],
        ],
      ],
    },
    location_type: 'street',
    is_private: false,
    is_accessible: false,
    occupancy_updated_at: new Date().toISOString(),
    is_active: true,
    ...over,
  };
}

describe('applyClientFilters (D-12)', () => {
  it('minConf=0.5 фильтрует confidence < 0.5', () => {
    const zones = [
      mockZone({ zone_id: 1, confidence: 0.3 }),
      mockZone({ zone_id: 2, confidence: 0.6 }),
    ];
    const f = { ...DEFAULT_FILTERS, minConf: 0.5 };
    expect(applyClientFilters(zones, f).map((z) => z.zone_id)).toEqual([2]);
  });

  it('maxPay=100 фильтрует pay > 100', () => {
    const zones = [mockZone({ zone_id: 1, pay: 50 }), mockZone({ zone_id: 2, pay: 200 })];
    const f = { ...DEFAULT_FILTERS, maxPay: 100 };
    expect(applyClientFilters(zones, f).map((z) => z.zone_id)).toEqual([1]);
  });

  it('default — ничего не фильтрует', () => {
    const zones = [mockZone({ zone_id: 1 }), mockZone({ zone_id: 2, pay: 999 })];
    expect(applyClientFilters(zones, DEFAULT_FILTERS)).toHaveLength(2);
  });
});

describe('buildServerQuery (D-12)', () => {
  it('default — только is_active=true (hideInactive default ON по D-09)', () => {
    const q = buildServerQuery(DEFAULT_FILTERS);
    expect(q.is_active).toBe('true');
    expect(Object.keys(q)).toHaveLength(1);
  });

  it('hideNoFree → min_free_count=1', () => {
    const q = buildServerQuery({ ...DEFAULT_FILTERS, hideNoFree: true });
    expect(q.min_free_count).toBe('1');
  });

  it('hidePrivate → include_private=false', () => {
    const q = buildServerQuery({ ...DEFAULT_FILTERS, hidePrivate: true });
    expect(q.include_private).toBe('false');
  });

  it('hideAccessible → include_accessible=false', () => {
    const q = buildServerQuery({ ...DEFAULT_FILTERS, hideAccessible: true });
    expect(q.include_accessible).toBe('false');
  });

  it('locationType=[street,yard] → hide_location_types содержит остальные 3 (инверсия)', () => {
    const q = buildServerQuery({ ...DEFAULT_FILTERS, locationType: ['street', 'yard'] });
    expect(q.hide_location_types).toBeDefined();
    const hidden = q.hide_location_types.split(',');
    expect(hidden).toContain('open_lot');
    expect(hidden).toContain('underground');
    expect(hidden).toContain('multilevel');
    expect(hidden).not.toContain('street');
    expect(hidden).not.toContain('yard');
  });

  it('minConf=0.5 → min_confidence=0.5; maxPay=200 → max_pay=200', () => {
    const q = buildServerQuery({ ...DEFAULT_FILTERS, minConf: 0.5, maxPay: 200 });
    expect(q.min_confidence).toBe('0.5');
    expect(q.max_pay).toBe('200');
  });

  it('hideInactive=false → нет is_active в query', () => {
    const q = buildServerQuery({ ...DEFAULT_FILTERS, hideInactive: false });
    expect(q.is_active).toBeUndefined();
  });
});

describe('countActive', () => {
  it('default → 0 active', () => expect(countActive(DEFAULT_FILTERS)).toBe(0));

  it('hideNoFree=true → 1 active', () => {
    expect(countActive({ ...DEFAULT_FILTERS, hideNoFree: true })).toBe(1);
  });

  it('5 разных изменений → 5 active', () => {
    expect(
      countActive({
        ...DEFAULT_FILTERS,
        hideNoFree: true,
        minConf: 0.5,
        maxPay: 200,
        hidePrivate: true,
        hideAccessible: true,
      }),
    ).toBe(5);
  });
});

describe('filter-storage (D-11) — sessionStorage', () => {
  beforeEach(() => sessionStorage.clear());

  it('writeFilterToStorage hideNoFree=true → "1"', () => {
    writeFilterToStorage('hideNoFree', true);
    expect(sessionStorage.getItem(FILTER_STORAGE_PREFIX + 'hideNoFree')).toBe('1');
  });

  it('writeFilterToStorage default удаляет ключ', () => {
    sessionStorage.setItem(FILTER_STORAGE_PREFIX + 'hideNoFree', '1');
    writeFilterToStorage('hideNoFree', false); // false = default
    expect(sessionStorage.getItem(FILTER_STORAGE_PREFIX + 'hideNoFree')).toBeNull();
  });

  it('readFiltersFromStorage возвращает объект с известными значениями', () => {
    sessionStorage.setItem(FILTER_STORAGE_PREFIX + 'minConf', '0.7');
    sessionStorage.setItem(FILTER_STORAGE_PREFIX + 'locationType', 'street,yard');
    const r = readFiltersFromStorage();
    expect(r.minConf).toBe(0.7);
    expect(r.locationType).toEqual(['street', 'yard']);
  });

  it('readFiltersFromStorage без preset → пустой объект', () => {
    const r = readFiltersFromStorage();
    expect(r).toEqual({});
  });
});
