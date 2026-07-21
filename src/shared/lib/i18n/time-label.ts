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

function fmt(date: Date, full: boolean, language: 'ru' | 'en'): string {
  const formatter = new Intl.DateTimeFormat(language === 'ru' ? 'ru-RU' : 'en-US', {
    timeZone: 'Europe/Moscow',
    day: 'numeric',
    month: full ? 'long' : 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
  // Intl возвращает «12 апр., 09:00» — убираем точки/запятые для эстетики.
  const raw = formatter.format(date);
  return raw.replace(/\.,/g, '').replace(/,\s/, ' ').replace(/\.\s/, ' ');
}

export function formatTimeLabelRu(mode: TimeMode, opts?: { full?: boolean }): string {
  return formatTimeLabel(mode, 'ru', opts);
}

export function formatTimeLabel(
  mode: TimeMode,
  language: 'ru' | 'en',
  opts?: { full?: boolean },
): string {
  if (mode.kind === 'now') return language === 'ru' ? 'Сейчас' : 'Now';
  const date = new Date(mode.at);
  const datePart = opts?.full
    ? `${fmt(date, true, language)} ${language === 'ru' ? 'МСК' : 'MSK'}`
    : fmt(date, false, language);
  if (language === 'en')
    return mode.kind === 'past' ? `History at ${datePart}` : `Forecast for ${datePart}`;
  return mode.kind === 'past' ? `История на ${datePart}` : `Прогноз на ${datePart}`;
}
