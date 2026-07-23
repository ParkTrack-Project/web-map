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
