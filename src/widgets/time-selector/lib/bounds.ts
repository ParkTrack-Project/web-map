// D-09 / D-10 / TIME-08: clamp / bound-check для past/future ввода.
// Используется в preset application (D-06) и inline-сообщении под picker'ом.
//
// I-5: optional `now` param чтобы applyPreset мог передать свой Date.now()
// — одна точка времени на cycle (иначе isWithinBounds и applyPreset
// считают разные now с расхождением в ms).
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
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
): string {
  if (kind === 'past') {
    const lo = new Date(now - MAX_PAST_DAYS * 86_400_000);
    return `История доступна только с ${format(lo, 'd MMM HH:mm', { locale: ru })}`;
  }
  const hi = new Date(now + MAX_FUTURE_HOURS * 3_600_000);
  return `Прогноз доступен только до ${format(hi, 'd MMM HH:mm', { locale: ru })}`;
}
