// D-04: parallel zone — полоса между центрами двух коротких сторон 4-угольника.
// Алгоритм: посчитать длины 4 рёбер замкнутого ring'а, отсортировать, взять 2
// кратчайших ребра и построить LineString между midpoint'ами этих рёбер.
// Используем squared distance — для масштаба 30м сравнение валидно без honest
// haversine (порядок останется тем же).
export interface PolygonRing {
  type: 'Polygon';
  coordinates: number[][][];
}

export interface LineGeometry {
  type: 'LineString';
  coordinates: [number, number][];
}

function distSq(a: [number, number], b: [number, number]): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return dx * dx + dy * dy;
}

function midpoint(a: [number, number], b: [number, number]): [number, number] {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

export function polygonToParallelLine(poly: PolygonRing): LineGeometry | null {
  const ring = poly.coordinates[0];
  if (!ring || ring.length < 5) return null;
  const p0 = ring[0] as [number, number];
  const p1 = ring[1] as [number, number];
  const p2 = ring[2] as [number, number];
  const p3 = ring[3] as [number, number];
  const edges = [
    { a: p0, b: p1, len: distSq(p0, p1) },
    { a: p1, b: p2, len: distSq(p1, p2) },
    { a: p2, b: p3, len: distSq(p2, p3) },
    { a: p3, b: p0, len: distSq(p3, p0) },
  ];
  const sorted = [...edges].sort((x, y) => x.len - y.len);
  return {
    type: 'LineString',
    coordinates: [midpoint(sorted[0].a, sorted[0].b), midpoint(sorted[1].a, sorted[1].b)],
  };
}
