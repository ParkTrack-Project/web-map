// Детерминированный генератор парковочных зон вокруг ИТМО (D-05..D-07).
// Использует Mulberry32 PRNG, что бы при seed=42 + count=200 давать
// тот же результат на каждом запуске → стабильные снапшоты тестов и UI-демо.
//
// Геометрия: GeoJSON Polygon (lon,lat order — Yandex Maps API v3, PITFALLS #2).
// Прямоугольник 10–30 м на сторону, аппроксимация по широте 60° (1° lat ≈ 111 km,
// 1° lon ≈ 55.6 km на 60° N).
import { ITMO_CENTER } from '@/shared/config';

const LAT_PER_M = 1 / 111_000;
const LON_PER_M = 1 / (111_000 * Math.cos((59.9575 * Math.PI) / 180));

// Облегчённая ZoneMapItem (docs api/parking_zones.mdx §5.5)
export interface ZoneMapItem {
  zone_id: number;
  zone_type: 'parallel' | 'standard';
  capacity: number;
  occupied: number;
  free_count: number;
  confidence: number;
  confidence_level: 'very_low' | 'low' | 'medium' | 'high';
  pay: number;
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  location_type: 'street' | 'yard' | 'open_lot' | 'underground' | 'multilevel';
  is_private: boolean;
  is_accessible: boolean;
  occupancy_updated_at: string;
  is_active: boolean;
}

// Полная Zone (для GET /zones/:id)
export interface Zone extends ZoneMapItem {
  camera_id: number;
  image_polygon: number[][];
  partner_id: number | null;
  created_by_user_id: number | null;
  created_at: string;
  updated_at: string;
}

// Mulberry32 — компактный детерминированный PRNG.
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rnd: () => number, items: readonly T[]): T {
  return items[Math.floor(rnd() * items.length)]!;
}

function confidenceLevelFromValue(c: number): ZoneMapItem['confidence_level'] {
  if (c < 0.55) return 'very_low';
  if (c < 0.7) return 'low';
  if (c < 0.85) return 'medium';
  return 'high';
}

const LOCATION_TYPES = ['street', 'yard', 'open_lot', 'underground', 'multilevel'] as const;
const PAY_TIERS = [0, 0, 0, 40, 100, 200] as const; // weighted: ~50% бесплатных

export interface GenerateMockZonesOptions {
  seed?: number;
  count?: number;
  center?: [number, number]; // [lon, lat]
  innerRadiusMeters?: number;
  outerRadiusMeters?: number;
  now?: Date;
}

export function generateMockZones(opts: GenerateMockZonesOptions = {}): ZoneMapItem[] {
  const {
    seed = 42,
    count = 200,
    center = ITMO_CENTER,
    innerRadiusMeters = 100,
    outerRadiusMeters = 2000,
    now = new Date('2026-04-25T12:00:00Z'),
  } = opts;

  const rnd = mulberry32(seed);
  const zones: ZoneMapItem[] = [];
  const [centerLon, centerLat] = center;

  for (let i = 0; i < count; i++) {
    // Точка в кольце [innerR, outerR]
    const angle = rnd() * 2 * Math.PI;
    const r = Math.sqrt(
      rnd() * (outerRadiusMeters ** 2 - innerRadiusMeters ** 2) + innerRadiusMeters ** 2,
    );
    const dxMeters = r * Math.cos(angle);
    const dyMeters = r * Math.sin(angle);
    const cLon = centerLon + dxMeters * LON_PER_M;
    const cLat = centerLat + dyMeters * LAT_PER_M;

    // Прямоугольник 10-30м × 5-15м
    const halfW = (5 + rnd() * 10) * LON_PER_M;
    const halfH = (2.5 + rnd() * 5) * LAT_PER_M;
    const ring: number[][] = [
      [cLon - halfW, cLat - halfH],
      [cLon + halfW, cLat - halfH],
      [cLon + halfW, cLat + halfH],
      [cLon - halfW, cLat + halfH],
      [cLon - halfW, cLat - halfH], // замкнуть
    ];

    const capacity = 5 + Math.floor(rnd() * 46); // 5..50
    const free_count = Math.floor(rnd() * (capacity + 1));
    const occupied = capacity - free_count;
    const confidence = 0.5 + rnd() * 0.45;
    const zone_type: 'parallel' | 'standard' = rnd() < 0.2 ? 'parallel' : 'standard';
    const is_active = rnd() < 0.95;
    const is_private = rnd() < 0.15;
    const is_accessible = rnd() < 0.1;
    const location_type = pick(rnd, LOCATION_TYPES);
    const pay = pick(rnd, PAY_TIERS);
    const updatedSecAgo = Math.floor(rnd() * 300);
    const occupancy_updated_at = new Date(now.getTime() - updatedSecAgo * 1000).toISOString();

    zones.push({
      zone_id: i + 1,
      zone_type,
      capacity,
      occupied,
      free_count,
      confidence: Math.round(confidence * 100) / 100,
      confidence_level: confidenceLevelFromValue(confidence),
      pay,
      geometry: { type: 'Polygon', coordinates: [ring] },
      location_type,
      is_private,
      is_accessible,
      occupancy_updated_at,
      is_active,
    });
  }

  return zones;
}

export interface Bbox {
  w: number; // min lon
  s: number; // min lat
  e: number; // max lon
  n: number; // max lat
}

// Парсинг bbox из API: "<min_lon>,<min_lat>,<max_lon>,<max_lat>"
export function parseBbox(raw: string | null): Bbox | null {
  if (!raw) return null;
  const parts = raw.split(',').map(Number);
  if (parts.length !== 4 || parts.some(Number.isNaN)) return null;
  const [w, s, e, n] = parts as [number, number, number, number];
  return { w, s, e, n };
}

export function filterByBbox(zones: ZoneMapItem[], bbox: Bbox): ZoneMapItem[] {
  return zones.filter((z) => {
    // bbox теста — пересекает ли любая вершина зоны прямоугольник.
    const ring = z.geometry.coordinates[0];
    if (!ring) return false;
    return ring.some((pair) => {
      const lon = pair[0];
      const lat = pair[1];
      if (lon === undefined || lat === undefined) return false;
      return lon >= bbox.w && lon <= bbox.e && lat >= bbox.s && lat <= bbox.n;
    });
  });
}

// Phase 2 Plan 03: эмулирует серверную фильтрацию (D-12 server-side path в mock).
// Используется MSW handler'ом /zones для применения query params после filterByBbox.
export interface MockFilterParams {
  min_free_count?: number;
  min_confidence?: number;
  max_pay?: number;
  include_private?: boolean;
  include_accessible?: boolean;
  is_active?: boolean;
  hide_location_types?: string[];
}

export function applyMockFilters(zones: ZoneMapItem[], f: MockFilterParams): ZoneMapItem[] {
  return zones.filter((z) => {
    if (f.min_free_count !== undefined && z.free_count < f.min_free_count) return false;
    if (f.min_confidence !== undefined && z.confidence < f.min_confidence) return false;
    if (f.max_pay !== undefined && z.pay > f.max_pay) return false;
    if (f.include_private === false && z.is_private) return false;
    if (f.include_accessible === false && z.is_accessible) return false;
    if (f.is_active !== undefined && z.is_active !== f.is_active) return false;
    if (f.hide_location_types && f.hide_location_types.includes(z.location_type)) return false;
    return true;
  });
}

export function getZoneById(zones: ZoneMapItem[], id: number): ZoneMapItem | undefined {
  return zones.find((z) => z.zone_id === id);
}

// Расширение ZoneMapItem до Zone (для /zones/:id).
export function toFullZone(map: ZoneMapItem, idx = 0): Zone {
  return {
    ...map,
    camera_id: 1 + (idx % 15),
    image_polygon: [
      [45, 23],
      [87, 25],
      [79, 149],
      [32, 145],
    ],
    partner_id: null,
    created_by_user_id: 1,
    created_at: '2026-04-01T00:00:00Z',
    updated_at: map.occupancy_updated_at,
  };
}

// Центроид зоны (для маршрутизации).
export function zoneCentroid(z: ZoneMapItem): [number, number] {
  const ring = z.geometry.coordinates[0];
  if (!ring || ring.length === 0) return [0, 0];
  // Без последней (замыкающей) точки.
  const points = ring.slice(0, -1);
  const sum = points.reduce<[number, number]>(
    (acc, pair) => [acc[0] + (pair[0] ?? 0), acc[1] + (pair[1] ?? 0)],
    [0, 0],
  );
  return [sum[0] / points.length, sum[1] / points.length];
}
