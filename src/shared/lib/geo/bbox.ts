// Геометрические утилиты для viewport bbox.
// Yandex Maps API v3 отдаёт bounds в формате [[lonSW, latSW], [lonNE, latNE]].
// Наш канонический Bbox-кортеж — [west, south, east, north].
import { BBOX_ROUND_DECIMALS } from '@/shared/config';

export type Bbox = [west: number, south: number, east: number, north: number];

export interface MapBounds {
  southWest: [number, number];
  northEast: [number, number];
}

const FACTOR = 10 ** BBOX_ROUND_DECIMALS;

// MAP-06 / Pitfall #2: округляем перед использованием в queryKey + nuqs URL,
// чтобы микро-джиттер от onUpdate (60Гц) не порождал перезапросы.
export function roundBbox5(bbox: Bbox): Bbox {
  return bbox.map((v) => Math.round(v * FACTOR) / FACTOR) as Bbox;
}

// FIX 2026-04-25: ymaps3 v3 onUpdate `location.bounds` иногда возвращает пары как
// `[topLeft, bottomRight]` (по экрану — северо-запад / юго-восток), а не как
// документированные `[southWest, northEast]` (по географии). Это приводило к
// инвертированному bbox (south > north) и пустому ответу /zones из MSW. Решение —
// не доверять имени точки, а брать min/max по каждой координате.
export function bboxFromBounds(bounds: MapBounds): Bbox {
  const [aLon, aLat] = bounds.southWest;
  const [bLon, bLat] = bounds.northEast;
  return [Math.min(aLon, bLon), Math.min(aLat, bLat), Math.max(aLon, bLon), Math.max(aLat, bLat)];
}

// Quick-fix 2026-05-16 (п.2): центр viewport'а из bbox для initial-location.
// Bbox = [west, south, east, north]; Yandex location.center = [lon, lat].
export function centerFromBbox(bbox: Bbox): [number, number] {
  const [w, s, e, n] = bbox;
  return [(w + e) / 2, (s + n) / 2];
}

// Quick-fix 2026-05-16 (п.0): детерминированный bbox из center+zoom+размера
// контейнера (Web Mercator). Нужен чтобы засеять ?bbox на mount — иначе
// useZonesQuery (enabled: bbox!==null) не стартует, и парковки появляются
// только после первого пана (YMapListener.onUpdate не стреляет на init).
// Чуть «щедрый» bbox допустим: /zones фильтрует по пересечению — лишний запас
// только гарантирует, что зоны в видимой области придут.
const EARTH_M_PER_PX_Z0 = 156543.03392; // 2πR / 256 на zoom 0
const M_PER_DEG_LAT = 111320;
export function bboxFromCenterZoom(
  center: [number, number],
  zoom: number,
  widthPx: number,
  heightPx: number,
): Bbox {
  const [lon, lat] = center;
  const latRad = (lat * Math.PI) / 180;
  const cosLat = Math.max(Math.cos(latRad), 1e-6);
  const res = (EARTH_M_PER_PX_Z0 * cosLat) / 2 ** zoom; // м/px
  const dLat = (res * heightPx) / 2 / M_PER_DEG_LAT;
  const dLon = (res * widthPx) / 2 / (M_PER_DEG_LAT * cosLat);
  return [lon - dLon, lat - dLat, lon + dLon, lat + dLat];
}

export function bboxToString(bbox: Bbox): string {
  return bbox.join(',');
}

export function bboxFromString(s: string): Bbox | null {
  const parts = s.split(',').map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return null;
  return parts as Bbox;
}
