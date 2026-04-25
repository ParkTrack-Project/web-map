// D-06: 5 past + 5 future preset chips.
// B-1: Preset = discriminated union 'static' | 'daily' (без Date.now() at module load).
// I-4: явный beforeEach import.
// B-2 (iter 2): out-of-range покрытие unit-уровня — единственное (UI-тест дропнут как избыточный).
import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import {
  PRESETS_PAST,
  PRESETS_FUTURE,
  applyPreset,
} from '@/widgets/time-selector/lib/presets';

describe('time presets (D-06, B-1: discriminated union)', () => {
  const NOW = new Date('2026-04-25T12:00:00.000Z').getTime();
  beforeEach(() => vi.useFakeTimers().setSystemTime(NOW));
  afterEach(() => vi.useRealTimers());

  it('PRESETS_PAST имеет 5 элементов с правильными labels', () => {
    const labels = PRESETS_PAST.map((p) => p.label);
    expect(labels).toEqual([
      'Час назад',
      '3 часа назад',
      'Вчера 09:00',
      'Вчера 18:00',
      'Неделю назад',
    ]);
  });

  it('PRESETS_FUTURE имеет 5 элементов', () => {
    expect(PRESETS_FUTURE.map((p) => p.label)).toEqual([
      'Через час',
      'Через 3 часа',
      'Завтра 09:00',
      'Завтра 18:00',
      'Через 24 часа',
    ]);
  });

  it('B-1: type discriminant — static vs daily', () => {
    expect(PRESETS_PAST[0].type).toBe('static');
    expect(PRESETS_PAST[2].type).toBe('daily');
    if (PRESETS_PAST[2].type === 'daily') {
      expect(PRESETS_PAST[2].hour).toBe(9);
      expect(PRESETS_PAST[2].dayOffset).toBe(-1);
    }
  });

  it('applyPreset «Час назад» (static) → past, at = now - 3600000', () => {
    const r = applyPreset(PRESETS_PAST[0], 'past', NOW);
    expect(r.mode).toEqual({ kind: 'past', at: new Date(NOW - 3_600_000).toISOString() });
    expect(r.outOfRangeMsg).toBeNull();
    expect(r.clamped).toBe(false);
  });

  it('applyPreset «Через час» (static) → future', () => {
    const r = applyPreset(PRESETS_FUTURE[0], 'future', NOW);
    expect(r.mode).toEqual({ kind: 'future', at: new Date(NOW + 3_600_000).toISOString() });
    expect(r.outOfRangeMsg).toBeNull();
  });

  it('applyPreset «Вчера 09:00» (daily) → at = вчера 09:00 LOCAL', () => {
    const r = applyPreset(PRESETS_PAST[2], 'past', NOW);
    // Восстанавливаем ожидаемое at: now-1d, setHours(9,0,0,0) — local
    const expected = new Date(NOW - 86_400_000);
    expected.setHours(9, 0, 0, 0);
    expect(r.mode).toEqual({ kind: 'past', at: expected.toISOString() });
  });

  it('applyPreset «Завтра 18:00» (daily) → at = завтра 18:00 LOCAL (или clamp к +24h в TZ где target вне окна)', () => {
    const r = applyPreset(PRESETS_FUTURE[3], 'future', NOW);
    // Expected raw target в LOCAL: (NOW+1d) с setHours(18,0,0,0)
    const rawTarget = new Date(NOW + 86_400_000);
    rawTarget.setHours(18, 0, 0, 0);
    const upperBound = NOW + 24 * 3_600_000;
    if (rawTarget.getTime() <= upperBound) {
      // В TZ где «завтра 18:00 LOCAL» ≤ NOW+24h — точное значение
      expect(r.mode).toEqual({ kind: 'future', at: rawTarget.toISOString() });
      expect(r.clamped).toBe(false);
    } else {
      // В TZ где target вне окна (например, UTC: 18:00 UTC > 12:00 UTC + 24h)
      // applyPreset clamp'ит к upper bound
      expect(r.mode).toEqual({ kind: 'future', at: new Date(upperBound).toISOString() });
      expect(r.clamped).toBe(true);
    }
  });

  it('«Неделю назад» именно ровно −7 дней (на границе)', () => {
    const r = applyPreset(PRESETS_PAST[4], 'past', NOW);
    expect(r.mode).toEqual({ kind: 'past', at: new Date(NOW - 7 * 86_400_000).toISOString() });
    expect(r.clamped).toBe(false);
  });

  it('«Через 24 часа» ровно 24h в future — на границе', () => {
    const r = applyPreset(PRESETS_FUTURE[4], 'future', NOW);
    expect(r.mode).toEqual({ kind: 'future', at: new Date(NOW + 24 * 3_600_000).toISOString() });
    expect(r.clamped).toBe(false);
  });

  // B-1: out-of-range clamp test
  // ВАЖНО (B-2 iter 2): этот юнит-тест — ЕДИНСТВЕННОЕ покрытие out-of-range
  // поведения applyPreset. UI-уровень out-of-range тест в
  // time-selector-content.spec.tsx был дропнут как избыточный (см. Task 2).
  it('out-of-range past preset (вне -7d) → clamp + outOfRangeMsg', () => {
    // Симулируем кастомный preset вне границы (если бы был «10 дней назад»)
    const out = applyPreset(
      { type: 'static', label: '10 дней назад', deltaMs: -10 * 86_400_000 },
      'past',
      NOW,
    );
    expect(out.clamped).toBe(true);
    expect(out.outOfRangeMsg).toMatch(/История доступна только с/);
    expect(new Date(out.mode.kind === 'past' ? out.mode.at : '').getTime()).toBe(
      NOW - 7 * 86_400_000,
    );
  });
});
