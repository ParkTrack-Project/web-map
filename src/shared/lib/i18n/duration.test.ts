// 2026-05-26: контракт formatDurationFromSeconds — естественные единицы
// «мин / ч мин / д ч», как Яндекс.Карты.
import { describe, it, expect } from 'vitest';
import { formatDurationFromSeconds } from './duration';

describe('formatDurationFromSeconds', () => {
  it('≤ 0 / NaN → клемп к «1 мин»', () => {
    expect(formatDurationFromSeconds(0)).toBe('1 мин');
    expect(formatDurationFromSeconds(-5)).toBe('1 мин');
    expect(formatDurationFromSeconds(NaN)).toBe('1 мин');
  });

  it('< 60 c → «1 мин» (ceil, не показываем «0 мин»)', () => {
    expect(formatDurationFromSeconds(30)).toBe('1 мин');
    expect(formatDurationFromSeconds(59)).toBe('1 мин');
  });

  it('целые минуты < часа', () => {
    expect(formatDurationFromSeconds(240)).toBe('4 мин'); // legacy assert ResultItem
    expect(formatDurationFromSeconds(60 * 59)).toBe('59 мин');
  });

  it('ровно час → «1 ч»', () => {
    expect(formatDurationFromSeconds(3600)).toBe('1 ч');
  });

  it('часы с минутами', () => {
    expect(formatDurationFromSeconds(3600 + 30 * 60)).toBe('1 ч 30 мин');
    expect(formatDurationFromSeconds(2 * 3600 + 5 * 60)).toBe('2 ч 5 мин');
  });

  it('ровно сутки → «1 д»', () => {
    expect(formatDurationFromSeconds(86_400)).toBe('1 д');
  });

  it('дни с часами (4000 мин → «2 д 18 ч», без минутного хвоста)', () => {
    // 4000 мин = 240000 c = 2 д 18 ч 40 мин. Показываем только две единицы.
    expect(formatDurationFromSeconds(4000 * 60)).toBe('2 д 18 ч');
  });

  it('сутки ровно без остатка часов', () => {
    expect(formatDurationFromSeconds(3 * 86_400)).toBe('3 д');
  });
});
