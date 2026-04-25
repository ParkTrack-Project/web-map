import { describe, it, expect } from 'vitest';
import { roundBbox5, bboxFromBounds, type Bbox } from '@/shared/lib/geo';

describe('roundBbox5', () => {
  it('округляет до 5 знаков после запятой', () => {
    const input: Bbox = [30.30859999, 59.95749991, 30.31000000001, 59.96];
    expect(roundBbox5(input)).toEqual([30.3086, 59.9575, 30.31, 59.96]);
  });

  it('стабилен относительно джиттера ниже 5-го знака', () => {
    const a: Bbox = [30.308591, 59.957499, 30.31, 59.96];
    const b: Bbox = [30.308592, 59.957498, 30.31, 59.96];
    expect(JSON.stringify(roundBbox5(a))).toBe(JSON.stringify(roundBbox5(b)));
  });

  it('bboxFromBounds возвращает [w, s, e, n]', () => {
    const bounds = {
      southWest: [10, 20] as [number, number],
      northEast: [30, 40] as [number, number],
    };
    expect(bboxFromBounds(bounds)).toEqual([10, 20, 30, 40]);
  });
});
