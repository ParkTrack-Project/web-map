import { describe, it, expect } from 'vitest';
import { zoneCentroid } from '@/shared/lib/geo/centroid';

describe('zoneCentroid', () => {
  it('возвращает [5,5] для квадрата 0..10', () => {
    const c = zoneCentroid({
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 10],
          [0, 0],
        ],
      ],
    });
    expect(c[0]).toBeCloseTo(5, 9);
    expect(c[1]).toBeCloseTo(5, 9);
  });

  it('возвращает среднее вершин для треугольника', () => {
    const c = zoneCentroid({
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [6, 0],
          [3, 9],
          [0, 0],
        ],
      ],
    });
    expect(c[0]).toBeCloseTo(3, 9);
    expect(c[1]).toBeCloseTo(3, 9);
  });
});
