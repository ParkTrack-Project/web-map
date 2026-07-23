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

export function roundBbox5(bbox: Bbox): Bbox {
  return bbox.map((v) => Math.round(v * FACTOR) / FACTOR) as Bbox;
}

export function bboxFromBounds(bounds: MapBounds): Bbox {
  const [aLon, aLat] = bounds.southWest;
  const [bLon, bLat] = bounds.northEast;
  return [Math.min(aLon, bLon), Math.min(aLat, bLat), Math.max(aLon, bLon), Math.max(aLat, bLat)];
}

export function centerFromBbox(bbox: Bbox): [number, number] {
  const [w, s, e, n] = bbox;
  return [(w + e) / 2, (s + n) / 2];
}

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
