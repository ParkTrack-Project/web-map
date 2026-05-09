// D-09 / TIME-08: bounds-helpers для past/future диапазонов.
// I-4: явный import beforeEach (без globals).
// I-5: optional now param — atomic time consistency с applyPreset.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  isWithinBounds,
  clampToBounds,
  formatBoundMessage,
} from '@/widgets/time-selector/lib/bounds';

describe('time bounds (D-09, TIME-08)', () => {
  const NOW = new Date('2026-04-25T12:00:00.000Z').getTime();
  beforeEach(() => vi.useFakeTimers().setSystemTime(NOW));
  afterEach(() => vi.useRealTimers());

  it('past: at в [now-7d, now] → true', () => {
    expect(isWithinBounds(NOW - 3 * 86_400_000, 'past')).toBe(true);
    expect(isWithinBounds(NOW, 'past')).toBe(true);
  });
  it('past: at вне → false', () => {
    expect(isWithinBounds(NOW - 8 * 86_400_000, 'past')).toBe(false);
    expect(isWithinBounds(NOW + 1, 'past')).toBe(false);
  });
  it('future: at в [now, now+24h] → true', () => {
    expect(isWithinBounds(NOW, 'future')).toBe(true);
    expect(isWithinBounds(NOW + 12 * 3_600_000, 'future')).toBe(true);
  });
  it('future: at вне → false', () => {
    expect(isWithinBounds(NOW - 1, 'future')).toBe(false);
    expect(isWithinBounds(NOW + 25 * 3_600_000, 'future')).toBe(false);
  });
  it('clampToBounds past: за нижней границей → нижняя граница', () => {
    const lo = NOW - 7 * 86_400_000;
    expect(clampToBounds(NOW - 30 * 86_400_000, 'past')).toBe(lo);
  });
  it('clampToBounds future: за верхней → верхняя', () => {
    const hi = NOW + 24 * 3_600_000;
    expect(clampToBounds(NOW + 100 * 3_600_000, 'future')).toBe(hi);
  });
  it('formatBoundMessage past — содержит «История доступна только с »', () => {
    const msg = formatBoundMessage('past');
    expect(msg).toMatch(/^История доступна только с \d{1,2} \S+ \d{2}:\d{2}$/);
  });
  it('formatBoundMessage future — содержит «Прогноз доступен только до »', () => {
    const msg = formatBoundMessage('future');
    expect(msg).toMatch(/^Прогноз доступен только до \d{1,2} \S+ \d{2}:\d{2}$/);
  });

  // I-5: now-param consistency
  it('isWithinBounds + явный now → одинаковый ответ как Date.now()', () => {
    expect(isWithinBounds(NOW - 1000, 'past', NOW)).toBe(true);
    expect(isWithinBounds(NOW + 25 * 3_600_000, 'future', NOW)).toBe(false);
  });
});
