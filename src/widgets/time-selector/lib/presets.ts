// D-06: 5 preset chips для past + 5 для future.
//
// B-1 fix: Preset = discriminated union { type:'static' | 'daily' }.
// Раньше было `deltaMs: -((Date.now() % 86_400_000) - 9*3600000) - 86_400_000`
// на module load — это (a) UTC ms, не local; (b) freeze'ится при импорте.
// Теперь 'daily' presets динамически вычисляют at внутри applyPreset через
// setHours (LOCAL midnight + hour) — корректно для любой TZ.
//
// I-5: applyPreset принимает now (default Date.now()) и пробрасывает его
// во все bounds-helpers — atomic time consistency.
import type { TimeMode } from '@/entities/zone';
import { isWithinBounds, clampToBounds, formatBoundMessage } from './bounds';

export type Preset =
  | { type: 'static'; label: string; deltaMs: number }
  | { type: 'daily'; label: string; hour: number; dayOffset: -1 | 1 };

export const PRESETS_PAST: readonly Preset[] = [
  { type: 'static', label: 'Час назад', deltaMs: -3_600_000 },
  { type: 'static', label: '3 часа назад', deltaMs: -10_800_000 },
  { type: 'daily', label: 'Вчера 09:00', hour: 9, dayOffset: -1 },
  { type: 'daily', label: 'Вчера 18:00', hour: 18, dayOffset: -1 },
  { type: 'static', label: 'Неделю назад', deltaMs: -7 * 86_400_000 },
] as const;

export const PRESETS_FUTURE: readonly Preset[] = [
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
  mode: TimeMode;
  outOfRangeMsg: string | null;
  clamped: boolean;
}

export function applyPreset(
  preset: Preset,
  kind: 'past' | 'future',
  now: number = Date.now(),
): ApplyPresetResult {
  const rawAt = computeAt(preset, now);
  const within = isWithinBounds(rawAt, kind, now);
  const at = within ? rawAt : clampToBounds(rawAt, kind, now);
  return {
    mode: { kind, at: new Date(at).toISOString() },
    outOfRangeMsg: within ? null : formatBoundMessage(kind, now),
    clamped: !within,
  };
}
