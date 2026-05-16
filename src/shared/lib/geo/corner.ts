// Возвращает РЕАЛЬНУЮ вершину полигона зоны, ближайшую к правому-нижнему углу
// его bbox (max lon = восток → право на карте, min lat = юг → низ экрана).
//
// Почему не сам угол bbox: парковочные зоны — это ПОВЁРНУТЫЕ прямоугольники.
// Угол axis-aligned bounding box у наклонного прямоугольника лежит ВНЕ фигуры
// (сбоку от неё) — из-за этого бейдж free_count «висел сбоку», а не на углу
// парковки. Снэп к ближайшей фактической вершине сажает бейдж на настоящий
// угол полигона при любом повороте.
export function zoneBottomRight(geometry: {
  type: 'Polygon';
  coordinates: number[][][];
}): [number, number] {
  const ring = geometry.coordinates[0];
  if (!ring || ring.length === 0) return [0, 0];

  // Цель — правый-нижний угол охватывающего прямоугольника.
  let maxLon = -Infinity;
  let minLat = Infinity;
  for (const p of ring) {
    const lon = p[0] ?? 0;
    const lat = p[1] ?? 0;
    if (lon > maxLon) maxLon = lon;
    if (lat < minLat) minLat = lat;
  }

  // Ближайшая настоящая вершина к этой цели. Евклид в градусах: зоны ~десятки
  // метров, искажение проекции на таком масштабе пренебрежимо.
  // Старт = угол bbox; цикл гарантированно перепишет его реальной вершиной
  // (ring непустой, у любой вершины конечная дистанция < Infinity).
  let best: [number, number] = [maxLon, minLat];
  let bestD = Infinity;
  for (const p of ring) {
    const lon = p[0] ?? 0;
    const lat = p[1] ?? 0;
    const d = (lon - maxLon) ** 2 + (lat - minLat) ** 2;
    if (d < bestD) {
      bestD = d;
      best = [lon, lat];
    }
  }
  return best;
}
