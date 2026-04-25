// TIME-03 / D-17: formatTimeLabelRu — единая функция для меток в TimeSelector pill,
// ARIA live region, error-state messages.
// I-7: tests asserting что вывод — MSK независимо от TZ test runner'а.
import { describe, it, expect } from 'vitest';
import { formatTimeLabelRu } from '@/shared/lib/i18n';

describe('formatTimeLabelRu (TIME-03, I-7: Intl + Europe/Moscow)', () => {
  it('now → "Сейчас"', () => {
    expect(formatTimeLabelRu({ kind: 'now' })).toBe('Сейчас');
  });

  it('past → "История на " + ru-formatted MSK time', () => {
    // 2026-04-12T09:00:00.000Z UTC = 12:00 MSK (UTC+3)
    const out = formatTimeLabelRu({ kind: 'past', at: '2026-04-12T09:00:00.000Z' });
    expect(out).toMatch(/^История на 12 апр\.? 12:00$/);
  });

  it('future → "Прогноз на ..."', () => {
    const out = formatTimeLabelRu({ kind: 'future', at: '2026-04-25T17:00:00.000Z' });
    expect(out.startsWith('Прогноз на ')).toBe(true);
  });

  it('opts.full=true → полный месяц + МСК-суффикс', () => {
    const out = formatTimeLabelRu(
      { kind: 'past', at: '2026-04-12T09:00:00.000Z' },
      { full: true },
    );
    expect(out).toContain('апреля');
    expect(out).toContain('МСК');
    // I-7: фиксированный UTC instant → assertion не зависит от runner TZ.
    // 09:00 UTC = 12:00 MSK
    expect(out).toContain('12:00');
  });

  it('opts.full=true для now → всё ещё "Сейчас" (нет даты)', () => {
    expect(formatTimeLabelRu({ kind: 'now' }, { full: true })).toBe('Сейчас');
  });

  it('future с opts.full=true → "Прогноз на ... МСК"', () => {
    const out = formatTimeLabelRu(
      { kind: 'future', at: '2026-04-25T17:00:00.000Z' },
      { full: true },
    );
    expect(out.startsWith('Прогноз на ')).toBe(true);
    expect(out).toContain('МСК');
  });

  it('I-7: TZ-independent — два эквивалентных UTC instants дают одинаковый MSK output', () => {
    // 09:00 UTC (тот же абсолютный момент)
    const a = formatTimeLabelRu({ kind: 'past', at: '2026-04-12T09:00:00.000Z' }, { full: true });
    // То же самое в +3 формате не имеет смысла — ISO с Z всегда UTC.
    // Но проверяем что вывод стабильный для одного instant.
    const b = formatTimeLabelRu({ kind: 'past', at: '2026-04-12T09:00:00Z' }, { full: true });
    expect(a).toBe(b);
  });
});
