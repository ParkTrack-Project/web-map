// URL parsers для всех Phase 2 query params.
// D-13: per-параметр naming (НЕ единый JSON-blob).
// D-15: дефолты не сериализуются (clearOnDefault: true — встроенное nuqs поведение).
// D-16: zod-валидация невалидных значений → console.warn + игнор (используем встроенные nuqs guards
//       плюс кастомные createParser для сложных кейсов).
import { createParser } from 'nuqs';
import { z } from 'zod';
import { bboxFromString, bboxToString, type Bbox } from '@/shared/lib/geo';
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

// Phase 3 / TIME-04 / URL-02 / D-11:
// ?t=now | past:ISO | future:ISO. Single nuqs param с custom parser.
// clearOnDefault для 'now' (D-11) — пустой URL когда mode = 'now'.
// ВАЖНО: eq обязателен — TimeMode это объект, без eq nuqs не сможет правильно
// работать с clearOnDefault и withDefault (Pitfall #3 — двунаправленный URL↔state цикл).
const ISO_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{3})?)?Z$/;

export const parseAsTimeMode = createParser<TimeMode>({
  parse: (v) => {
    if (v === 'now' || v === '') return { kind: 'now' };
    const m = v.match(/^(past|future):(.+)$/);
    if (!m) {
      if (typeof window !== 'undefined') console.warn('[url] invalid t param:', v);
      return null;
    }
    const [, kind, iso] = m;
    if (!ISO_RE.test(iso) || Number.isNaN(Date.parse(iso))) {
      if (typeof window !== 'undefined') console.warn('[url] invalid t.at ISO:', iso);
      return null;
    }
    return { kind: kind as 'past' | 'future', at: iso };
  },
  serialize: (m) => (m.kind === 'now' ? 'now' : `${m.kind}:${m.at}`),
  eq: (a, b) => {
    if (a.kind !== b.kind) return false;
    if (a.kind === 'now') return true;
    return (a as { at: string }).at === (b as { at: string }).at;
  },
});

// Re-export commonly used nuqs parsers — чтобы виджеты импортили из одного barrel
export { parseAsBoolean, parseAsFloat, parseAsInteger, parseAsString } from 'nuqs';
