import { describe, it, expect } from 'vitest';
import { polygonToParallelLine } from '@/shared/lib/geo/parallel';

describe('polygonToParallelLine', () => {
  it('строит полосу по длинной оси для прямоугольника 30м × 5м', () => {
    // 4-угольник растянут вдоль X на 30 единиц, по Y на 5 единиц.
    // Короткие рёбра — вертикальные (длина 5), длинная ось — горизонтальная.
    const poly = {
      type: 'Polygon' as const,
      coordinates: [
        [
          [0, 0],
          [30, 0],
          [30, 5],
          [0, 5],
          [0, 0],
        ],
      ],
    };
    const line = polygonToParallelLine(poly);
    expect(line).not.toBeNull();
    const [a, b] = line!.coordinates;
    // Линия идёт midpoint(0-3 ребро: X=0,Y=2.5) → midpoint(1-2 ребро: X=30,Y=2.5).
    const dx = Math.abs(b[0] - a[0]);
    const dy = Math.abs(b[1] - a[1]);
    expect(dx).toBeCloseTo(30, 5);
    expect(dy).toBeCloseTo(0, 5);
  });

  it('не падает на квадрате (все рёбра равной длины)', () => {
    const poly = {
      type: 'Polygon' as const,
      coordinates: [
        [
          [0, 0],
          [10, 0],
          [10, 10],
          [0, 10],
          [0, 0],
        ],
      ],
    };
    const line = polygonToParallelLine(poly);
    expect(line).not.toBeNull();
    expect(line!.coordinates).toHaveLength(2);
    expect(line!.coordinates[0]).not.toEqual(line!.coordinates[1]);
  });

  it('возвращает null для ring < 5 точек', () => {
    const poly = {
      type: 'Polygon' as const,
      coordinates: [
        [
          [0, 0],
          [1, 0],
        ],
      ],
    };
    expect(polygonToParallelLine(poly)).toBeNull();
  });
});
