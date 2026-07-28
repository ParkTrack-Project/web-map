import { createParser } from 'nuqs';
import { z } from 'zod';
import { bboxFromString, bboxToString, type Bbox } from '@/shared/lib/geo';
import { MIN_RESOLUTION_MINUTES } from '@/shared/config';
import type { TimeMode } from '@/entities/zone';

export const parseAsBbox = createParser<Bbox>({
  parse: (v) => bboxFromString(v),
  serialize: (b) => bboxToString(b),
  eq: (a, b) => a.every((v, i) => v === b[i]),
});

// ?z=N — integer zoom 8..19. Для значений вне диапазона — null
// (nuqs.withDefault подставит DEFAULT_ZOOM).
const ZoomSchema = z.number().int().min(8).max(19);
export const parseAsZoom = createParser<number>({
  parse: (v) => {
    const n = Number(v);
    const r = ZoomSchema.safeParse(n);
    if (!r.success) {
      if (typeof window !== 'undefined') {
        console.warn('[url] invalid zoom:', v);
      }
      return null;
    }
    return r.data;
  },
  serialize: (n) => String(n),
  eq: (a, b) => a === b,
});

// ?fLoc=street,yard — CSV из location_type значений. Возвращает массив строк
// (без enum-валидации на уровне парсера — applyClientFilters/buildServerQuery
// игнорируют неизвестные значения).
export const parseAsLocationTypeCsv = createParser<string[]>({
  parse: (v) =>
    v
      ? v
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [],
  serialize: (arr) => arr.join(','),
  eq: (a, b) => a.length === b.length && a.every((v, i) => v === b[i]),
});

const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{3})?)?Z$/;
const TOLERANCE_MS = (MIN_RESOLUTION_MINUTES / 2) * 60_000;

/**
 * Derive TimeMode из абсолютного ISO timestamp.
 * Tolerance буфер вокруг now устраняет flicker на границе.
 */
export function deriveMode(at: string, now: number = Date.now()): TimeMode {
  const t = Date.parse(at);
  if (Number.isNaN(t)) return { kind: 'now' };
  if (t < now - TOLERANCE_MS) return { kind: 'past', at };
  if (t > now + TOLERANCE_MS) return { kind: 'future', at };
  return { kind: 'now' };
}

export const parseAsTimeMode = createParser<TimeMode>({
  parse: (v) => {
    if (v === 'now' || v === '') return { kind: 'now' };

    const legacyMatch = v.match(/^(past|future):(.+)$/);
    const iso = legacyMatch ? (legacyMatch[2] ?? v) : v;

    if (!ISO_RE.test(iso) || Number.isNaN(Date.parse(iso))) {
      if (typeof window !== 'undefined') console.warn('[url] invalid t param:', v);
      return null;
    }
    return deriveMode(iso);
  },
  // Serialize: чистый ISO без prefix'а. 'now' → 'now' (clearOnDefault удалит param).
  serialize: (m) => (m.kind === 'now' ? 'now' : m.at),
  eq: (a, b) => {
    if (a.kind !== b.kind) return false;
    if (a.kind === 'now') return true;
    return (a as { at: string }).at === (b as { at: string }).at;
  },
});

// Re-export commonly used nuqs parsers — чтобы виджеты импортили из одного barrel
export { parseAsBoolean, parseAsFloat, parseAsInteger, parseAsString } from 'nuqs';

const COORDS_RE = /^-?\d+\.\d{1,5},-?\d+\.\d{1,5}$/;
const CoordsSchema = z.string().regex(COORDS_RE);

export const parseAsCoords = createParser<[number, number]>({
  parse: (v) => {
    const r = CoordsSchema.safeParse(v);
    if (!r.success) {
      if (typeof window !== 'undefined') console.warn('[url] invalid coords:', v);
      return null;
    }
    const [latRaw, lonRaw] = v.split(',').map(Number);
    if (latRaw === undefined || lonRaw === undefined) {
      if (typeof window !== 'undefined') console.warn('[url] invalid coords:', v);
      return null;
    }
    const lat = latRaw;
    const lon = lonRaw;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      if (typeof window !== 'undefined') console.warn('[url] invalid coords:', v);
      return null;
    }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      if (typeof window !== 'undefined') console.warn('[url] invalid coords:', v);
      return null;
    }
    return [lat, lon];
  },
  serialize: ([lat, lon]) => `${lat.toFixed(5)},${lon.toFixed(5)}`,
  eq: (a, b) => a[0] === b[0] && a[1] === b[1],
});

// Phase 4 / D-28: ?route=<int> — positive integer route_id для reload-восстановления.
// Невалидный (float / negative / zero / non-numeric) → null.
export const parseAsRouteId = createParser<number>({
  parse: (v) => {
    const n = Number(v);
    if (!Number.isInteger(n) || n <= 0) return null;
    return n;
  },
  serialize: (n) => String(n),
  eq: (a, b) => a === b,
});
