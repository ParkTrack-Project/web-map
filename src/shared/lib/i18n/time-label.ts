// Локализованные метки времени для TimeSelector pill, ARIA live region, error texts.
// Pattern «d MMM HH:mm» — короткий формат («12 апр 09:00»).
// Полный формат («12 апреля 09:00 МСК») — для ARIA через opts.full=true.
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import type { TimeMode } from '@/entities/zone';

export function formatTimeLabelRu(mode: TimeMode, opts?: { full?: boolean }): string {
  if (mode.kind === 'now') return 'Сейчас';
  const date = new Date(mode.at);
  const datePart = opts?.full
    ? format(date, "d MMMM HH:mm 'МСК'", { locale: ru })
    : format(date, 'd MMM HH:mm', { locale: ru });
  return mode.kind === 'past' ? `История на ${datePart}` : `Прогноз на ${datePart}`;
}
