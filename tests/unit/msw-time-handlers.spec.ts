// Q1 Schema Fix: /occupancy и /forecasts MSW generators возвращают ZoneMapItem[]
// для view=map (не узкие OccupancyItem/ForecastItem). Это фундамент Phase 3 —
// без полной формы ZoneLayer показывает пустую карту в past/future режимах.
//
// Тестируем generators напрямую (без поднятия MSW node) — проще и надёжнее
// в jsdom-окружении. MSW handler logic покрывается через E2E (Plan 04).
import { describe, it, expect } from 'vitest';
import { generateOccupancyZoneSnapshot } from '@/mocks/generators/occupancy';
import { generateForecastZoneSnapshot } from '@/mocks/generators/forecasts';
import { generateMockZones } from '@/mocks/generators/zones';

describe('Q1 Schema Fix: /occupancy и /forecasts → ZoneMapItem[]', () => {
  const zones = generateMockZones({ seed: 1, count: 5 });

  it('generateOccupancyZoneSnapshot возвращает полный ZoneMapItem (с geometry, zone_type, pay)', () => {
    const out = generateOccupancyZoneSnapshot(zones, new Date('2026-04-22T09:00:00.000Z'));
    expect(out).toHaveLength(5);
    const z = out[0];
    expect(z).toHaveProperty('zone_id');
    expect(z).toHaveProperty('geometry'); // ← Q1 fix: NOT lost
    expect(z).toHaveProperty('zone_type');
    expect(z).toHaveProperty('pay');
    expect(z).toHaveProperty('location_type');
    expect(z).toHaveProperty('is_private');
    expect(z).toHaveProperty('is_accessible');
    expect(z).toHaveProperty('is_active');
    expect(z).toHaveProperty('free_count');
    expect(z).toHaveProperty('occupied');
    expect(z).toHaveProperty('confidence');
    expect(z).toHaveProperty('confidence_level');
    expect(z).toHaveProperty('occupancy_updated_at');
  });

  it('generateOccupancyZoneSnapshot mutates ТОЛЬКО occupied/free/confidence/updated_at', () => {
    const at = new Date('2026-04-22T09:00:00.000Z');
    const out = generateOccupancyZoneSnapshot(zones, at);
    const z0in = zones[0];
    const z0out = out[0];
    // Preserved fields:
    expect(z0out.zone_id).toBe(z0in.zone_id);
    expect(z0out.geometry).toEqual(z0in.geometry);
    expect(z0out.pay).toBe(z0in.pay);
    expect(z0out.zone_type).toBe(z0in.zone_type);
    expect(z0out.is_private).toBe(z0in.is_private);
    expect(z0out.is_accessible).toBe(z0in.is_accessible);
    expect(z0out.is_active).toBe(z0in.is_active);
    expect(z0out.location_type).toBe(z0in.location_type);
    expect(z0out.capacity).toBe(z0in.capacity);
    // Mutated fields:
    expect(z0out.occupied + z0out.free_count).toBe(z0out.capacity);
    expect(z0out.occupancy_updated_at).toBe(at.toISOString());
  });

  it('generateOccupancyZoneSnapshot — confidence в [0, 1]', () => {
    const out = generateOccupancyZoneSnapshot(zones, new Date('2026-04-22T09:00:00.000Z'));
    for (const z of out) {
      expect(z.confidence).toBeGreaterThanOrEqual(0);
      expect(z.confidence).toBeLessThanOrEqual(1);
    }
  });

  it('generateForecastZoneSnapshot возвращает полный ZoneMapItem', () => {
    const out = generateForecastZoneSnapshot(zones, new Date(Date.now() + 3_600_000));
    expect(out).toHaveLength(5);
    expect(out[0]).toHaveProperty('geometry');
    expect(out[0]).toHaveProperty('zone_type');
    expect(out[0]).toHaveProperty('pay');
    expect(out[0]).toHaveProperty('location_type');
    expect(out[0]).toHaveProperty('confidence_level');
  });

  it('generateForecastZoneSnapshot mutates ТОЛЬКО occupied/free/confidence/updated_at', () => {
    const at = new Date(Date.now() + 3_600_000);
    const out = generateForecastZoneSnapshot(zones, at);
    const z0in = zones[0];
    const z0out = out[0];
    expect(z0out.zone_id).toBe(z0in.zone_id);
    expect(z0out.geometry).toEqual(z0in.geometry);
    expect(z0out.pay).toBe(z0in.pay);
    expect(z0out.zone_type).toBe(z0in.zone_type);
    expect(z0out.capacity).toBe(z0in.capacity);
    expect(z0out.occupied + z0out.free_count).toBe(z0out.capacity);
    expect(z0out.occupancy_updated_at).toBe(at.toISOString());
  });

  it('generateForecastZoneSnapshot — confidence в [0.3, 0.95] (D-19 forecast уверенность ниже occupancy)', () => {
    const out = generateForecastZoneSnapshot(zones, new Date(Date.now() + 3_600_000));
    for (const z of out) {
      expect(z.confidence).toBeGreaterThanOrEqual(0.3);
      expect(z.confidence).toBeLessThanOrEqual(0.95);
    }
  });
});
