import { describe, it, expect } from 'vitest';
import { zoneBottomRight } from '@/shared/lib/geo/corner';

describe('zoneBottomRight', () => {
  it('возвращает [maxLon, minLat] угол bbox для квадрата 0..10', () => {
    const c = zoneBottomRight({
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
    expect(c[0]).toBeCloseTo(10, 9); // восток → право
    expect(c[1]).toBeCloseTo(0, 9); // юг → низ
  });

  it('для повёрнутого прямоугольника берёт ближайшую РЕАЛЬНУЮ вершину, а не угол bbox', () => {
    // Наклонный прямоугольник. bbox-угол = (maxLon=10, minLat=0) — этой точки
    // среди вершин НЕТ (она сбоку от фигуры). Ближайшая вершина — (10,3).
    const c = zoneBottomRight({
      type: 'Polygon',
      coordinates: [
        [
          [4, 0],
          [10, 3],
          [6, 9],
          [0, 6],
          [4, 0],
        ],
      ],
    });
    expect(c[0]).toBeCloseTo(10, 9);
    expect(c[1]).toBeCloseTo(3, 9);
  });

  it('возвращает [0,0] для пустого кольца', () => {
    expect(zoneBottomRight({ type: 'Polygon', coordinates: [[]] })).toEqual([0, 0]);
  });
});
