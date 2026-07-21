import { describe, expect, it } from 'vitest';
import type { ZoneMapItem } from '@/entities/zone';
import { clusterZonesForZoom, nextClusterExpansionZoom } from './cluster-expansion';

function zone(zone_id: number, lon: number): ZoneMapItem {
  const lat = 59.95;
  const d = 0.00001;
  return {
    zone_id,
    zone_type: 'standard',
    capacity: 10,
    occupied: 0,
    free_count: 5,
    confidence: 1,
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
    occupancy_updated_at: '2026-01-01T00:00:00Z',
    is_active: true,
  };
}

function expandedAt(zones: ZoneMapItem[], ids: number[], zoom: number): boolean {
  return !clusterZonesForZoom(zones, zoom).clusters.some((cluster) =>
    ids.every((id) => cluster.zoneIds.includes(id)),
  );
}

describe('nextClusterExpansionZoom', () => {
  it('раскрывает обычный кластер на ближайшем подходящем масштабе', () => {
    const zones = [zone(1, 30.3), zone(2, 30.3004)];
    const result = nextClusterExpansionZoom({
      zones,
      zoneIds: [1, 2],
      currentZoom: 15,
      maxZoom: 21,
      buffer: 0,
    });
    expect(result).toBeGreaterThan(15);
    expect(expandedAt(zones, [1, 2], result)).toBe(true);
    expect(expandedAt(zones, [1, 2], result - 0.25)).toBe(false);
  });

  it('начинает поиск от дробного текущего zoom', () => {
    const zones = [zone(1, 30.3), zone(2, 30.3004)];
    const result = nextClusterExpansionZoom({
      zones,
      zoneIds: [1, 2],
      currentZoom: 15.35,
      maxZoom: 21,
      buffer: 0,
    });
    expect(result).toBeGreaterThan(15.35);
    expect((result - 15.35) / 0.25).toBeCloseTo(Math.round((result - 15.35) / 0.25));
  });

  it('не уменьшает zoom, когда текущий масштаб выше 18', () => {
    const result = nextClusterExpansionZoom({
      zones: [zone(1, 30.3), zone(2, 30.30000001)],
      zoneIds: [1, 2],
      currentZoom: 19.25,
      maxZoom: 21,
    });
    expect(result).toBeGreaterThan(19.25);
  });

  it('делает несколько шагов для плотного кластера', () => {
    const zones = [zone(1, 30.3), zone(2, 30.30005)];
    const result = nextClusterExpansionZoom({
      zones,
      zoneIds: [1, 2],
      currentZoom: 14,
      maxZoom: 21,
      buffer: 0,
    });
    expect(result).toBeGreaterThan(14.5);
    expect(expandedAt(zones, [1, 2], result)).toBe(true);
  });

  it('раскрывает выбранную группу в несколько кластеров или singleton-зон', () => {
    const zones = [zone(1, 30.3), zone(2, 30.30005), zone(3, 30.3005)];
    const ids = [1, 2, 3];
    const result = nextClusterExpansionZoom({
      zones,
      zoneIds: ids,
      currentZoom: 13,
      maxZoom: 21,
    });
    expect(expandedAt(zones, ids, result)).toBe(true);
  });

  it('возвращает максимум для неразделимого кластера и на максимальном zoom', () => {
    const zones = [zone(1, 30.3), zone(2, 30.3)];
    expect(
      nextClusterExpansionZoom({
        zones,
        zoneIds: [1, 2],
        currentZoom: 19,
        maxZoom: 21,
      }),
    ).toBe(21);
    expect(
      nextClusterExpansionZoom({
        zones,
        zoneIds: [1, 2],
        currentZoom: 21,
        maxZoom: 21,
      }),
    ).toBe(21);
  });
});
