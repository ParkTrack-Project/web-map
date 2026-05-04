import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseAsZoom, parseAsLocationTypeCsv, parseAsTimeMode } from '@/shared/lib/url';

// URL-01 / D-13: parseAsZoom — integer 8..19 с zod-валидацией.
// Невалидное значение → null + console.warn (D-16). nuqs.withDefault подставит дефолт.
describe('parseAsZoom (URL-01, D-13)', () => {
  beforeEach(() => vi.spyOn(console, 'warn').mockImplementation(() => {}));

  it('valid integer in 8..19 → number', () => {
    expect(parseAsZoom.parse('15')).toBe(15);
    expect(parseAsZoom.parse('8')).toBe(8);
    expect(parseAsZoom.parse('19')).toBe(19);
  });

  it('out of range → null', () => {
    expect(parseAsZoom.parse('25')).toBeNull();
    expect(parseAsZoom.parse('5')).toBeNull();
  });

  it('non-numeric → null', () => {
    expect(parseAsZoom.parse('abc')).toBeNull();
  });

  it('serialize → строка', () => {
    expect(parseAsZoom.serialize(15)).toBe('15');
  });
});

// FILTER-06: parseAsLocationTypeCsv — CSV строки в массив.
// Валидация против enum НЕ на уровне парсера (applyClientFilters/buildServerQuery
// игнорируют неизвестные значения).
describe('parseAsLocationTypeCsv (FILTER-06)', () => {
  it('CSV → массив', () => {
    expect(parseAsLocationTypeCsv.parse('street,yard')).toEqual(['street', 'yard']);
  });

  it('один элемент', () => {
    expect(parseAsLocationTypeCsv.parse('underground')).toEqual(['underground']);
  });

  it('пусто → []', () => {
    expect(parseAsLocationTypeCsv.parse('')).toEqual([]);
  });

  it('serialize → CSV', () => {
    expect(parseAsLocationTypeCsv.serialize(['street', 'yard'])).toBe('street,yard');
  });
});

// Quick task 260426-hhb: parseAsTimeMode — derived mode из чистого ISO.
// SUPERSEDES D-11 формат ?t=now|past:ISO|future:ISO. Новый формат:
//   - отсутствие param'а или 'now' → { kind: 'now' }
//   - чистый ISO UTC → derived past/future в зависимости от Date.now() ± TOLERANCE
//   - legacy past:ISO/future:ISO → silently strip prefix, derive normally (backward-compat)
// Битый ввод → null + console.warn.
describe('parseAsTimeMode (TIME-04, URL-02, derived mode — quick 260426-hhb)', () => {
  // Fixed system time чтобы derive был детерминированный.
  // Tolerance ≈ 7.5 минут (MIN_RESOLUTION_MINUTES / 2).
  const NOW = new Date('2026-04-25T12:00:00.000Z').getTime();

  beforeEach(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.useFakeTimers().setSystemTime(NOW);
  });
  afterEach(() => vi.useRealTimers());

  it('parse "now" → { kind: "now" } (legacy backward-compat)', () => {
    expect(parseAsTimeMode.parse('now')).toEqual({ kind: 'now' });
  });

  it('parse "" → { kind: "now" }', () => {
    expect(parseAsTimeMode.parse('')).toEqual({ kind: 'now' });
  });

  it('parse чистый ISO в прошлом → { kind: "past", at: ISO }', () => {
    // 3 часа назад — далеко за пределами tolerance
    const at = new Date(NOW - 3 * 3_600_000).toISOString();
    expect(parseAsTimeMode.parse(at)).toEqual({ kind: 'past', at });
  });

  it('parse чистый ISO в будущем → { kind: "future", at: ISO }', () => {
    const at = new Date(NOW + 3 * 3_600_000).toISOString();
    expect(parseAsTimeMode.parse(at)).toEqual({ kind: 'future', at });
  });

  it('parse чистый ISO в пределах ±tolerance от now → { kind: "now" }', () => {
    // 1 минута назад — внутри tolerance (~7.5 мин)
    const at = new Date(NOW - 60_000).toISOString();
    expect(parseAsTimeMode.parse(at)).toEqual({ kind: 'now' });
  });

  it('parse legacy "past:ISO" → silently strip prefix → derived past', () => {
    expect(parseAsTimeMode.parse('past:2026-04-22T09:00:00.000Z')).toEqual({
      kind: 'past',
      at: '2026-04-22T09:00:00.000Z',
    });
  });

  it('parse legacy "future:ISO" → silently strip prefix → derived future', () => {
    expect(parseAsTimeMode.parse('future:2026-04-25T17:00:00.000Z')).toEqual({
      kind: 'future',
      at: '2026-04-25T17:00:00.000Z',
    });
  });

  it('parse legacy "past:ISO" внутри tolerance от now → derived now', () => {
    const at = new Date(NOW + 60_000).toISOString();
    expect(parseAsTimeMode.parse(`past:${at}`)).toEqual({ kind: 'now' });
  });

  it('parse битый ISO → null', () => {
    expect(parseAsTimeMode.parse('not-an-iso')).toBeNull();
    expect(parseAsTimeMode.parse('past:not-an-iso')).toBeNull();
    expect(parseAsTimeMode.parse('past:2026-13-99T99:99:99Z')).toBeNull();
  });

  it('parse мусор без ISO → null', () => {
    expect(parseAsTimeMode.parse('garbage')).toBeNull();
    expect(parseAsTimeMode.parse('present:abc')).toBeNull();
  });

  it('serialize "now" → "now"', () => {
    expect(parseAsTimeMode.serialize({ kind: 'now' })).toBe('now');
  });

  it('serialize past → чистый ISO без prefix', () => {
    expect(parseAsTimeMode.serialize({ kind: 'past', at: '2026-04-22T09:00:00.000Z' })).toBe(
      '2026-04-22T09:00:00.000Z',
    );
  });

  it('serialize future → чистый ISO без prefix', () => {
    expect(parseAsTimeMode.serialize({ kind: 'future', at: '2026-04-25T17:00:00.000Z' })).toBe(
      '2026-04-25T17:00:00.000Z',
    );
  });

  it('eq object-equality для clearOnDefault (Pitfall #3)', () => {
    expect(parseAsTimeMode.eq({ kind: 'now' }, { kind: 'now' })).toBe(true);
    expect(
      parseAsTimeMode.eq(
        { kind: 'past', at: '2026-04-22T09:00:00.000Z' },
        { kind: 'past', at: '2026-04-22T09:00:00.000Z' },
      ),
    ).toBe(true);
    expect(
      parseAsTimeMode.eq(
        { kind: 'past', at: '2026-04-22T09:00:00.000Z' },
        { kind: 'past', at: '2026-04-22T10:00:00.000Z' },
      ),
    ).toBe(false);
    expect(
      parseAsTimeMode.eq({ kind: 'now' }, { kind: 'past', at: '2026-04-22T09:00:00.000Z' }),
    ).toBe(false);
    expect(
      parseAsTimeMode.eq(
        { kind: 'past', at: '2026-04-22T09:00:00.000Z' },
        { kind: 'future', at: '2026-04-22T09:00:00.000Z' },
      ),
    ).toBe(false);
  });
});
