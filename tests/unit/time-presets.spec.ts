// D-06: 5 past + 5 future preset chips.
// B-1: Preset = discriminated union 'static' | 'daily' (без Date.now() at module load).
// I-4: явный beforeEach import.
// B-2 (iter 2): out-of-range покрытие unit-уровня — единственное (UI-тест дропнут как избыточный).
//
// Quick task 260426-hhb: PRESETS объединены (5 past + 5 future = 10 элементов).
// applyPreset больше НЕ принимает kind — kind derived из delta-знака внутри.
// Возвращаемый shape упрощён: { at: string, outOfRangeMsg, clamped } (без mode).
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { PRESETS, applyPreset } from '@/widgets/time-selector/lib/presets';

describe('time presets (D-06, B-1: discriminated union, quick 260426-hhb merged list)', () => {
  const NOW = new Date('2026-04-25T12:00:00.000Z').getTime();
  beforeEach(() => vi.useFakeTimers().setSystemTime(NOW));
  afterEach(() => vi.useRealTimers());

  it('PRESETS объединённый список содержит 10 элементов (5 past + 5 future)', () => {
    expect(PRESETS).toHaveLength(10);
    const labels = PRESETS.map((p) => p.label);
    // Порядок: сначала past по убыванию давности (ближайший past first),
    // затем future по возрастанию (ближайший future first).
    expect(labels).toEqual([
      'Час назад',
      '3 часа назад',
      'Вчера 09:00',
      'Вчера 18:00',
      'Неделю назад',
      'Через час',
      'Через 3 часа',
      'Завтра 09:00',
      'Завтра 18:00',
      'Через 24 часа',
    ]);
  });

  it('B-1: type discriminant — static vs daily', () => {
    // index 0 = «Час назад» — static
    const p0 = PRESETS[0]!;
    const p2 = PRESETS[2]!;
    expect(p0.type).toBe('static');
    // index 2 = «Вчера 09:00» — daily
    expect(p2.type).toBe('daily');
    if (p2.type === 'daily') {
      expect(p2.hour).toBe(9);
      expect(p2.dayOffset).toBe(-1);
    }
  });

  it('applyPreset «Час назад» (static past) → at = now - 3600000', () => {
    const r = applyPreset(PRESETS[0]!, NOW);
    expect(r.at).toBe(new Date(NOW - 3_600_000).toISOString());
    expect(r.outOfRangeMsg).toBeNull();
    expect(r.clamped).toBe(false);
  });

  it('applyPreset «Через час» (static future) → at = now + 3600000', () => {
    // index 5 = «Через час» (первый future после 5 past'ов)
    const r = applyPreset(PRESETS[5]!, NOW);
    expect(r.at).toBe(new Date(NOW + 3_600_000).toISOString());
    expect(r.outOfRangeMsg).toBeNull();
  });

  it('applyPreset «Вчера 09:00» (daily past) → at = вчера 09:00 LOCAL', () => {
    const r = applyPreset(PRESETS[2]!, NOW);
    const expected = new Date(NOW - 86_400_000);
    expected.setHours(9, 0, 0, 0);
    expect(r.at).toBe(expected.toISOString());
  });

  it('applyPreset «Завтра 18:00» (daily future) → at = завтра 18:00 LOCAL (или clamp в UTC TZ)', () => {
    // index 8 = «Завтра 18:00»
    const r = applyPreset(PRESETS[8]!, NOW);
    const rawTarget = new Date(NOW + 86_400_000);
    rawTarget.setHours(18, 0, 0, 0);
    const upperBound = NOW + 24 * 3_600_000;
    if (rawTarget.getTime() <= upperBound) {
      expect(r.at).toBe(rawTarget.toISOString());
      expect(r.clamped).toBe(false);
    } else {
      expect(r.at).toBe(new Date(upperBound).toISOString());
      expect(r.clamped).toBe(true);
    }
  });

  it('«Неделю назад» именно ровно −7 дней (на границе)', () => {
    // index 4 = «Неделю назад»
    const r = applyPreset(PRESETS[4]!, NOW);
    expect(r.at).toBe(new Date(NOW - 7 * 86_400_000).toISOString());
    expect(r.clamped).toBe(false);
  });

  it('«Через 24 часа» ровно 24h в future — на границе', () => {
    // index 9 = «Через 24 часа»
    const r = applyPreset(PRESETS[9]!, NOW);
    expect(r.at).toBe(new Date(NOW + 24 * 3_600_000).toISOString());
    expect(r.clamped).toBe(false);
  });

  // B-1: out-of-range clamp test
  // ВАЖНО (B-2 iter 2): этот юнит-тест — ЕДИНСТВЕННОЕ покрытие out-of-range
  // поведения applyPreset.
  it('out-of-range past preset (вне -7d) → clamp + outOfRangeMsg', () => {
    const out = applyPreset(
      { type: 'static', label: '10 дней назад', deltaMs: -10 * 86_400_000 },
      NOW,
    );
    expect(out.clamped).toBe(true);
    expect(out.outOfRangeMsg).toMatch(/История доступна только с/);
    expect(new Date(out.at).getTime()).toBe(NOW - 7 * 86_400_000);
  });

  it('out-of-range future preset (>24h) → clamp + outOfRangeMsg', () => {
    const out = applyPreset(
      { type: 'static', label: '48 часов вперёд', deltaMs: 48 * 3_600_000 },
      NOW,
    );
    expect(out.clamped).toBe(true);
    expect(out.outOfRangeMsg).toMatch(/Прогноз доступен только до/);
    expect(new Date(out.at).getTime()).toBe(NOW + 24 * 3_600_000);
  });
});
