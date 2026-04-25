// TIME-03 / D-17: formatTimeLabelRu — единая функция для меток в TimeSelector pill,
// ARIA live region, error-state messages.
import { describe, it, expect } from 'vitest';
import { formatTimeLabelRu } from '@/shared/lib/i18n';

describe('formatTimeLabelRu (TIME-03)', () => {
  it('now → "Сейчас"', () => {
    expect(formatTimeLabelRu({ kind: 'now' })).toBe('Сейчас');
  });

  it('past → "История на 12 апр HH:mm" (short)', () => {
    const out = formatTimeLabelRu({ kind: 'past', at: '2026-04-12T09:00:00.000Z' });
    // date-fns ru-locale выдаёт «апр.» (с точкой) для коротких месяцев — это норма.
    expect(out).toMatch(/^История на 12 апр\.? \d{2}:\d{2}$/);
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
});
