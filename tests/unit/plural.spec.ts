import { describe, it, expect } from 'vitest';
import { pluralizeRu } from '@/shared/lib/i18n/plural';

const F = { one: 'место', few: 'места', many: 'мест' };

describe('pluralizeRu — русская плюрализация (CARD-06)', () => {
  it('n=1 → "место"', () => expect(pluralizeRu(1, F)).toBe('место'));
  it('n=2 → "места"', () => expect(pluralizeRu(2, F)).toBe('места'));
  it('n=5 → "мест"', () => expect(pluralizeRu(5, F)).toBe('мест'));
  it('n=11 → "мест" (НЕ one — критическое для русского)', () =>
    expect(pluralizeRu(11, F)).toBe('мест'));
  it('n=21 → "место" (21 mod 10 == 1, mod 100 != 11)', () =>
    expect(pluralizeRu(21, F)).toBe('место'));
  it('n=22 → "места"', () => expect(pluralizeRu(22, F)).toBe('места'));
  it('n=0 → "мест"', () => expect(pluralizeRu(0, F)).toBe('мест'));
  it('n=1.5 → "места" (decimal handling — Intl.PluralRules → "few")', () =>
    expect(pluralizeRu(1.5, F)).toBe('места'));
});
