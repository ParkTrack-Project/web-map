// D-09 / D-10 / TIME-08: clamp / bound-check для past/future ввода.
// Используется в preset application (D-06) и inline-сообщении под picker'ом.
//
// I-5: optional `now` param чтобы applyPreset мог передать свой Date.now()
// — одна точка времени на cycle (иначе isWithinBounds и applyPreset
// считают разные now с расхождением в ms).
//
// Quick task 260426-hhb note: kind теперь derived caller'ом через
// `at < now ? 'past' : 'future'` — сами bound-helpers сигнатуру не меняют,
// продолжают принимать explicit kind для clarity.
import { MAX_PAST_DAYS, MAX_FUTURE_HOURS } from '@/shared/config';

export function isWithinBounds(
  at: number,
  kind: 'past' | 'future',
  now: number = Date.now(),
): boolean {
  if (kind === 'past') {
    return at >= now - MAX_PAST_DAYS * 86_400_000 && at <= now;
  }
  return at >= now && at <= now + MAX_FUTURE_HOURS * 3_600_000;
}

export function clampToBounds(
  at: number,
  kind: 'past' | 'future',
  now: number = Date.now(),
): number {
  if (kind === 'past') {
    const lo = now - MAX_PAST_DAYS * 86_400_000;
    return Math.max(lo, Math.min(now, at));
  }
  const hi = now + MAX_FUTURE_HOURS * 3_600_000;
  return Math.max(now, Math.min(hi, at));
}

export function formatBoundMessage(
  kind: 'past' | 'future',
  now: number = Date.now(),
  language: 'ru' | 'en' = 'ru',
): string {
  const locale = language === 'ru' ? 'ru-RU' : 'en-US';
  const formatBound = (date: Date) =>
    new Intl.DateTimeFormat(locale, {
      timeZone: 'Europe/Moscow',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  if (kind === 'past') {
    const lo = new Date(now - MAX_PAST_DAYS * 86_400_000);
    return language === 'ru'
      ? `История доступна только с ${formatBound(lo)}`
      : `History is only available from ${formatBound(lo)}`;
  }
  const hi = new Date(now + MAX_FUTURE_HOURS * 3_600_000);
  return language === 'ru'
    ? `Прогноз доступен только до ${formatBound(hi)}`
    : `Forecast is only available until ${formatBound(hi)}`;
}
