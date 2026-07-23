import { clampToBounds, formatBoundMessage, isWithinBounds } from './bounds';

export type Preset =
  | { type: 'static'; label: string; labelEn?: string; deltaMs: number }
  | { type: 'daily'; label: string; labelEn?: string; hour: number; dayOffset: -1 | 1 };

// Объединённый список chip-presets. Порядок: сначала past по убыванию давности
// (ближайший past first), затем future по возрастанию (ближайший future first).
// Этот порядок группирует «недавнее прошлое + ближайшее будущее» в начале списка
// — самый частый use-case (быстрая проверка «как было час назад / как будет через час»).
export const PRESETS: readonly Preset[] = [
  { type: 'static', label: 'Час назад', labelEn: 'An hour ago', deltaMs: -3_600_000 },
  { type: 'static', label: '3 часа назад', labelEn: '3 hours ago', deltaMs: -10_800_000 },
  { type: 'daily', label: 'Вчера 09:00', labelEn: 'Yesterday 09:00', hour: 9, dayOffset: -1 },
  { type: 'daily', label: 'Вчера 18:00', labelEn: 'Yesterday 18:00', hour: 18, dayOffset: -1 },
  { type: 'static', label: 'Неделю назад', labelEn: 'A week ago', deltaMs: -7 * 86_400_000 },
  { type: 'static', label: 'Через час', labelEn: 'In an hour', deltaMs: 3_600_000 },
  { type: 'static', label: 'Через 3 часа', labelEn: 'In 3 hours', deltaMs: 10_800_000 },
  { type: 'daily', label: 'Завтра 09:00', labelEn: 'Tomorrow 09:00', hour: 9, dayOffset: 1 },
  { type: 'daily', label: 'Завтра 18:00', labelEn: 'Tomorrow 18:00', hour: 18, dayOffset: 1 },
  { type: 'static', label: 'Через 24 часа', labelEn: 'In 24 hours', deltaMs: 24 * 3_600_000 },
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

export function applyPreset(
  preset: Preset,
  now: number = Date.now(),
  language: 'ru' | 'en' = 'ru',
): ApplyPresetResult {
  const rawAt = computeAt(preset, now);
  const kind = rawAt <= now ? 'past' : 'future';
  const clamped = !isWithinBounds(rawAt, kind, now);
  const at = clamped ? clampToBounds(rawAt, kind, now) : rawAt;

  return {
    at: new Date(at).toISOString(),
    outOfRangeMsg: clamped ? formatBoundMessage(kind, now, language) : null,
    clamped,
  };
}
