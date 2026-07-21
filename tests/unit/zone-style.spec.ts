import { describe, it, expect } from 'vitest';
import { computeZoneStyle } from '@/widgets/map-canvas/model/zone-style';

describe('computeZoneStyle — семантическая раскраска (D-01)', () => {
  const base = { mode: 'now' as const, selected: false };

  it('inactive → серый', () => {
    const s = computeZoneStyle({
      ...base,
      zoneId: 1,
      free_count: 99,
      confidence: 0.9,
      is_active: false,
    });
    expect(s.fill).toBe('#9ca3af8c');
    expect(s.stroke).toBe('#4b5563');
  });

  it('free_count=0 → красный', () => {
    const s = computeZoneStyle({
      ...base,
      zoneId: 2,
      free_count: 0,
      confidence: 0.9,
      is_active: true,
    });
    expect(s.fill).toBe('rgba(216,22,22,0.59)');
    expect(s.stroke).toBe('#cd2b2b');
  });

  it('free_count=1 → жёлто-янтарный', () => {
    const s = computeZoneStyle({
      ...base,
      zoneId: 3,
      free_count: 1,
      confidence: 0.9,
      is_active: true,
    });
    expect(s.fill).toBe('rgba(245,171,11,0.59)');
    expect(s.stroke).toBe('#b48409');
  });

  it('free>=2 && confidence<0.75 → светло-зелёный', () => {
    const s = computeZoneStyle({
      ...base,
      zoneId: 4,
      free_count: 5,
      confidence: 0.5,
      is_active: true,
    });
    expect(s.fill).toBe('#86efac96');
    expect(s.stroke).toBe('#2d8714');
  });

  it('free>=2 && confidence>=0.75 → тёмно-зелёный (brand)', () => {
    const s = computeZoneStyle({
      ...base,
      zoneId: 5,
      free_count: 5,
      confidence: 0.95,
      is_active: true,
    });
    expect(s.fill).toBe('#16a34aaa');
    expect(s.stroke).toBe('#155e2a');
  });

  it('selected=true → strokeWidth 3 (D-08)', () => {
    const s = computeZoneStyle({
      ...base,
      zoneId: 6,
      free_count: 5,
      confidence: 0.95,
      is_active: true,
      selected: true,
    });
    expect(s.strokeWidth).toBe(3);
  });

  it('memoization: тот же reference для одинаковых ключей', () => {
    const k = {
      ...base,
      zoneId: 7,
      free_count: 5,
      confidence: 0.95,
      is_active: true,
    };
    const a = computeZoneStyle(k);
    const b = computeZoneStyle(k);
    expect(Object.is(a, b)).toBe(true);
  });

  it('selected vs unselected — разные cache entries', () => {
    const k1 = {
      ...base,
      zoneId: 8,
      free_count: 5,
      confidence: 0.95,
      is_active: true,
      selected: false,
    };
    const k2 = { ...k1, selected: true };
    const s1 = computeZoneStyle(k1);
    const s2 = computeZoneStyle(k2);
    expect(s1).not.toBe(s2);
    expect(s1.strokeWidth).toBe(1);
    expect(s2.strokeWidth).toBe(3);
  });
});
