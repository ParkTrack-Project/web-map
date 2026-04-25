// Локализованные метки времени для TimeSelector pill, ARIA live region, error texts.
//
// I-7: используем Intl.DateTimeFormat({ timeZone: 'Europe/Moscow' }) чтобы
// получить именно MSK формат независимо от TZ test runner'а / browser'а.
// Раньше date-fns/format использовал local-time getters → если CI работал
// в UTC, формат не совпадал с MSK pill'ом который мы обещаем («МСК»-суффикс лгал).
//
// Pattern «d MMM HH:mm» — короткий формат («12 апр 09:00»).
// Полный формат («12 апреля 09:00 МСК») — для ARIA через opts.full=true.
import type { TimeMode } from '@/entities/zone';

const SHORT_FMT = new Intl.DateTimeFormat('ru-RU', {
  timeZone: 'Europe/Moscow',
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

const FULL_FMT = new Intl.DateTimeFormat('ru-RU', {
  timeZone: 'Europe/Moscow',
  day: 'numeric',
  month: 'long',
  hour: '2-digit',
  minute: '2-digit',
});

function fmt(date: Date, full: boolean): string {
  // Intl возвращает «12 апр., 09:00» — убираем точки/запятые для эстетики.
  const raw = (full ? FULL_FMT : SHORT_FMT).format(date);
  return raw.replace(/\.,/g, '').replace(/,\s/, ' ').replace(/\.\s/, ' ');
}

export function formatTimeLabelRu(mode: TimeMode, opts?: { full?: boolean }): string {
  if (mode.kind === 'now') return 'Сейчас';
  const date = new Date(mode.at);
  const datePart = opts?.full ? `${fmt(date, true)} МСК` : fmt(date, false);
  return mode.kind === 'past' ? `История на ${datePart}` : `Прогноз на ${datePart}`;
}
