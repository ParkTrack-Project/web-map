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

export function bboxFromBounds(bounds: MapBounds): Bbox {
  const [w, s] = bounds.southWest;
  const [e, n] = bounds.northEast;
  return [w, s, e, n];
}

export function bboxToString(bbox: Bbox): string {
  return bbox.join(',');
}

export function bboxFromString(s: string): Bbox | null {
  const parts = s.split(',').map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return null;
  return parts as Bbox;
}
