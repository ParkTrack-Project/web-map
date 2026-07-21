import { describe, it, expect } from 'vitest';
import type { ZoneMapItem } from '@/entities/zone';
import { minZoomToDecluster } from './cluster-zones';

// Мини-зона: крошечный квадрат вокруг (lon, lat) → zoneCentroid вернёт ровно
// (lon, lat) (среднее 4 углов). Остальные поля не влияют на расчёт зума.
function mk(zone_id: number, lon: number, lat: number): ZoneMapItem {
  const d = 0.0001;
  return {
    zone_id,
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
          [lon - d, lat - d],
          [lon + d, lat - d],
          [lon + d, lat + d],
          [lon - d, lat + d],
          [lon - d, lat - d],
        ],
      ],
    },
    location_type: 'street',
    is_private: false,
    is_accessible: false,
    occupancy_updated_at: '2026-06-06T00:00:00Z',
    is_active: true,
  };
}

const target: [number, number] = [30.3, 59.95];
const MERGE_PX = 22;

describe('minZoomToDecluster', () => {
  it('нет соседей (только сама зона) → null (зум поднимать не нужно)', () => {
    const zones = [mk(1, 30.3, 59.95)];
    expect(minZoomToDecluster(target, zones, MERGE_PX, 1)).toBeNull();
  });

  it('пустой список зон → null', () => {
    expect(minZoomToDecluster(target, [], MERGE_PX, 1)).toBeNull();
  });

  it('ближний сосед требует БОЛЬШЕГО зума, чем дальний', () => {
    const near = minZoomToDecluster(
      target,
      [mk(1, 30.3, 59.95), mk(2, 30.3005, 59.95)],
      MERGE_PX,
      1,
    );
    const far = minZoomToDecluster(target, [mk(1, 30.3, 59.95), mk(2, 30.32, 59.95)], MERGE_PX, 1);
    expect(near).not.toBeNull();
    expect(far).not.toBeNull();
    expect(near!).toBeGreaterThan(far!);
  });

  it('зум разъединения определяется БЛИЖАЙШИМ соседом (не дальними)', () => {
    const onlyNear = minZoomToDecluster(
      target,
      [mk(1, 30.3, 59.95), mk(2, 30.3005, 59.95)],
      MERGE_PX,
      1,
    );
    const nearPlusFar = minZoomToDecluster(
      target,
      [mk(1, 30.3, 59.95), mk(2, 30.3005, 59.95), mk(3, 30.5, 59.95)],
      MERGE_PX,
      1,
    );
    expect(nearPlusFar).toBeCloseTo(onlyNear!, 6);
  });

  it('excludeZoneId исключает саму зону (иначе «сосед» = она же на dist 0)', () => {
    // Зона 1 совпадает с target. Без исключения был бы +Infinity (не развести).
    const zones = [mk(1, 30.3, 59.95), mk(2, 30.3005, 59.95)];
    const excluded = minZoomToDecluster(target, zones, MERGE_PX, 1);
    expect(Number.isFinite(excluded!)).toBe(true);
  });

  it('другая зона с совпадающим центроидом → Infinity (развести нельзя)', () => {
    const zones = [mk(1, 30.3, 59.95), mk(2, 30.3, 59.95)];
    expect(minZoomToDecluster(target, zones, MERGE_PX, 1)).toBe(Infinity);
  });

  it('больший mergePx (плотнее группировка) → больший зум разъединения', () => {
    const zones = [mk(1, 30.3, 59.95), mk(2, 30.3005, 59.95)];
    const small = minZoomToDecluster(target, zones, 22, 1)!;
    const large = minZoomToDecluster(target, zones, 44, 1)!;
    // d0·2^z = mergePx ⇒ z = log2(mergePx/d0); удвоение mergePx даёт +1 к зуму.
    expect(large - small).toBeCloseTo(1, 6);
  });
});
