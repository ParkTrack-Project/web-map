// I-6 / D-16 / Q4: typed error для случая когда backend (или MSW) ответил
// 200 с обёрткой { error_description, items: [] } — означает что mode='future'
// на конкретное время недоступен (например Q4 deterministic edge case 03:00 UTC).
//
// fetchZones throw'ит TimeModeUnavailableError; TanStack Query ловит → ZoneStateOverlay
// читает error.message и показывает специфичный текст (не дефолтный «Не удалось загрузить»).
//
// Note: явное field-declaration вместо parameter-properties — tsconfig
// `erasableSyntaxOnly: true` (Vite/erasable-isolated-modules) запрещает
// `constructor(public readonly x)` shorthand.
import type { TimeMode } from './zone.types';

export class TimeModeUnavailableError extends Error {
  readonly mode: TimeMode;

  constructor(message: string, mode: TimeMode) {
    super(message);
    this.name = 'TimeModeUnavailableError';
    this.mode = mode;
  }
}
