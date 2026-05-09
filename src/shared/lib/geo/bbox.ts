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

export function bboxToString(bbox: Bbox): string {
  return bbox.join(',');
}

export function bboxFromString(s: string): Bbox | null {
  const parts = s.split(',').map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return null;
  return parts as Bbox;
}
