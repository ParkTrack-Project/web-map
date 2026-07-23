import type { TimeMode } from './zone.types';

export class TimeModeUnavailableError extends Error {
  readonly mode: TimeMode;

  constructor(message: string, mode: TimeMode) {
    super(message);
    this.name = 'TimeModeUnavailableError';
    this.mode = mode;
  }
}
