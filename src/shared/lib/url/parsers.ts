// URL parsers для всех Phase 2 query params.
// D-13: per-параметр naming (НЕ единый JSON-blob).
// D-15: дефолты не сериализуются (clearOnDefault: true — встроенное nuqs поведение).
// D-16: zod-валидация невалидных значений → console.warn + игнор (используем встроенные nuqs guards
//       плюс кастомные createParser для сложных кейсов).
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

// Quick task 260426-hhb (SUPERSEDES D-11):
// ?t= формат → derived TimeMode из чистого ISO UTC.
// - отсутствие param'а или 'now' → { kind: 'now' }
// - <ISO UTC> → derived past/future относительно Date.now() ± TOLERANCE_MS
// - past:<ISO> / future:<ISO> (legacy) → silently strip prefix → derive normally
// - битый ввод → null + console.warn
//
// TOLERANCE_MS ≈ MIN_RESOLUTION_MINUTES/2 минут — буфер от flicker'а на границе now.
// Если parsed time в пределах ±TOLERANCE — округляем к now (избегаем mode-jumping
// между past/future при минутном сдвиге).
//
// clearOnDefault для 'now' (D-11) — пустой URL когда mode = 'now'.
// eq обязателен — TimeMode это объект, без eq nuqs не сможет правильно
// работать с clearOnDefault и withDefault (Pitfall #3 — двунаправленный URL↔state цикл).
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

    // Legacy backward-compat: silently strip past:/future: prefix.
    // Новые ссылки используют чистый ISO; старые расшаренные URL продолжают работать.
    const legacyMatch = v.match(/^(past|future):(.+)$/);
    const iso = legacyMatch ? legacyMatch[2] : v;

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
