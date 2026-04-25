import { describe, it, expect } from 'vitest';
import { computeZoneStyle } from '@/widgets/map-canvas/model/zone-style';

describe('computeZoneStyle', () => {
  it('возвращает референсно равный объект для тех же входных данных', () => {
    const a = computeZoneStyle({
      zoneId: 'z1',
      free_count: 5,
      confidence: 0.8,
      is_active: true,
      mode: 'now',
    });
    const b = computeZoneStyle({
      zoneId: 'z1',
      free_count: 5,
      confidence: 0.8,
      is_active: true,
      mode: 'now',
    });
    expect(a).toBe(b);
  });

  it('возвращает новый стиль при смене mode (mode входит в кэш-ключ)', () => {
    const a = computeZoneStyle({
      zoneId: 'z1',
      free_count: 5,
      confidence: 0.8,
      is_active: true,
      mode: 'now',
    });
    const b = computeZoneStyle({
      zoneId: 'z1',
      free_count: 5,
      confidence: 0.8,
      is_active: true,
      mode: 'past',
    });
    expect(a).not.toBe(b);
  });
});
