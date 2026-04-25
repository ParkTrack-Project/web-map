import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseAsZoom, parseAsLocationTypeCsv } from '@/shared/lib/url';

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
