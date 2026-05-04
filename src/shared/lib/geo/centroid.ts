// Простой центроид полигона по среднему вершин (без замыкающей точки).
// Для маленьких зон (~10–30 м) точности «среднего» достаточно для бейджей и
// центрирования карты — площадной центроид (signed area) тут overkill.
export function zoneCentroid(geometry: {
  type: 'Polygon';
  coordinates: number[][][];
}): [number, number] {
  const ring = geometry.coordinates[0];
  if (!ring || ring.length === 0) return [0, 0];
  // Отбрасываем замыкающую вершину (она дублирует первую).
  const points = ring.slice(0, -1);
  const sum = points.reduce<[number, number]>(
    (acc, p) => [acc[0] + (p[0] ?? 0), acc[1] + (p[1] ?? 0)],
    [0, 0],
  );
  return [sum[0] / points.length, sum[1] / points.length];
}
