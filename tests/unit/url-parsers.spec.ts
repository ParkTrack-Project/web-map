import { describe, it, expect, vi, beforeEach } from 'vitest';
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

// TIME-04 / URL-02 / D-11: parseAsTimeMode — single ?t= param с тремя формами.
// Битый ввод → null + console.warn (silent fallback). eq object-equality для clearOnDefault.
describe('parseAsTimeMode (TIME-04, URL-02)', () => {
  beforeEach(() => vi.spyOn(console, 'warn').mockImplementation(() => {}));

  it('parse "now" → { kind: "now" }', () => {
    expect(parseAsTimeMode.parse('now')).toEqual({ kind: 'now' });
  });

  it('parse "" → { kind: "now" }', () => {
    expect(parseAsTimeMode.parse('')).toEqual({ kind: 'now' });
  });

  it('parse "past:ISO" → { kind: "past", at: ISO }', () => {
    expect(parseAsTimeMode.parse('past:2026-04-22T09:00:00.000Z')).toEqual({
      kind: 'past',
      at: '2026-04-22T09:00:00.000Z',
    });
  });

  it('parse "future:ISO" → { kind: "future", at: ISO }', () => {
    expect(parseAsTimeMode.parse('future:2026-04-25T17:00:00.000Z')).toEqual({
      kind: 'future',
      at: '2026-04-25T17:00:00.000Z',
    });
  });

  it('parse битый ISO → null', () => {
    expect(parseAsTimeMode.parse('past:not-an-iso')).toBeNull();
    expect(parseAsTimeMode.parse('past:2026-13-99T99:99:99Z')).toBeNull();
  });

  it('parse неизвестный prefix → null', () => {
    expect(parseAsTimeMode.parse('garbage')).toBeNull();
    expect(parseAsTimeMode.parse('present:abc')).toBeNull();
  });

  it('serialize "now" → "now"', () => {
    expect(parseAsTimeMode.serialize({ kind: 'now' })).toBe('now');
  });

  it('serialize past → "past:ISO"', () => {
    expect(parseAsTimeMode.serialize({ kind: 'past', at: '2026-04-22T09:00:00.000Z' })).toBe(
      'past:2026-04-22T09:00:00.000Z',
    );
  });

  it('serialize future → "future:ISO"', () => {
    expect(parseAsTimeMode.serialize({ kind: 'future', at: '2026-04-25T17:00:00.000Z' })).toBe(
      'future:2026-04-25T17:00:00.000Z',
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
