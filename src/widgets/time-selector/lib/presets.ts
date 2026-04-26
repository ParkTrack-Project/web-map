// D-06: 5 preset chips для past + 5 для future.
//
// Quick task 260426-hhb (SUPERSEDES D-03):
// Объединённый список PRESETS (10 элементов: 5 past + 5 future). Сегментированный
// контрол past/now/future удалён из UI — chip-list теперь единый.
// applyPreset больше НЕ принимает kind — kind derived из delta-знака внутри.
// Возвращаемый shape: { at: string, outOfRangeMsg, clamped } (без mode).
// Caller (TimeSelectorContent) превращает at в mode через parser.deriveMode.
//
// B-1 fix: Preset = discriminated union { type:'static' | 'daily' }.
// Раньше было `deltaMs: -((Date.now() % 86_400_000) - 9*3600000) - 86_400_000`
// на module load — это (a) UTC ms, не local; (b) freeze'ится при импорте.
// 'daily' presets динамически вычисляют at внутри applyPreset через
// setHours (LOCAL midnight + hour) — корректно для любой TZ.
//
// I-5: applyPreset принимает now (default Date.now()) и пробрасывает его
// во все bounds-helpers — atomic time consistency.
import { isWithinBounds, clampToBounds, formatBoundMessage } from './bounds';

export type Preset =
  | { type: 'static'; label: string; deltaMs: number }
  | { type: 'daily'; label: string; hour: number; dayOffset: -1 | 1 };

// Объединённый список chip-presets. Порядок: сначала past по убыванию давности
// (ближайший past first), затем future по возрастанию (ближайший future first).
// Этот порядок группирует «недавнее прошлое + ближайшее будущее» в начале списка
// — самый частый use-case (быстрая проверка «как было час назад / как будет через час»).
export const PRESETS: readonly Preset[] = [
  { type: 'static', label: 'Час назад', deltaMs: -3_600_000 },
  { type: 'static', label: '3 часа назад', deltaMs: -10_800_000 },
  { type: 'daily', label: 'Вчера 09:00', hour: 9, dayOffset: -1 },
  { type: 'daily', label: 'Вчера 18:00', hour: 18, dayOffset: -1 },
  { type: 'static', label: 'Неделю назад', deltaMs: -7 * 86_400_000 },
  { type: 'static', label: 'Через час', deltaMs: 3_600_000 },
  { type: 'static', label: 'Через 3 часа', deltaMs: 10_800_000 },
  { type: 'daily', label: 'Завтра 09:00', hour: 9, dayOffset: 1 },
  { type: 'daily', label: 'Завтра 18:00', hour: 18, dayOffset: 1 },
  { type: 'static', label: 'Через 24 часа', deltaMs: 24 * 3_600_000 },
] as const;

function computeAt(preset: Preset, now: number): number {
  if (preset.type === 'static') return now + preset.deltaMs;
  // 'daily': LOCAL midnight на (now + dayOffset*1d) + hour
  const d = new Date(now + preset.dayOffset * 86_400_000);
  d.setHours(preset.hour, 0, 0, 0);
  return d.getTime();
}

export interface ApplyPresetResult {
  at: string;
  outOfRangeMsg: string | null;
  clamped: boolean;
}

/**
 * Применить preset → получить { at, outOfRangeMsg, clamped }.
 *
 * Quick task 260426-hhb: kind больше НЕ передаётся аргументом — derived
 * из знака delta (rawAt < now → 'past', иначе 'future'). Boundary case
 * (rawAt === now) маппится на 'past' для consistency: bounds.ts trait
 * isWithinBounds(now, 'past', now) === true (lo ≤ now ≤ now).
 */
export function applyPreset(preset: Preset, now: number = Date.now()): ApplyPresetResult {
  const rawAt = computeAt(preset, now);
  // kind derived из знака delta. Если rawAt === now (граничный случай) —
  // считаем 'past' (boundary тривиально in-range для обеих сторон).
  const derivedKind: 'past' | 'future' = rawAt > now ? 'future' : 'past';
  const within = isWithinBounds(rawAt, derivedKind, now);
  const at = within ? rawAt : clampToBounds(rawAt, derivedKind, now);
  return {
    at: new Date(at).toISOString(),
    outOfRangeMsg: within ? null : formatBoundMessage(derivedKind, now),
    clamped: !within,
  };
}
