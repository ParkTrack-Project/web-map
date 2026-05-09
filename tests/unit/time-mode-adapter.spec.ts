// TIME-02 / D-13: timeModeAdapter — pure function dispatch (TimeMode → endpoint+params).
// Эта функция выражает hard-separation rule (ТЗ §15) одной строкой кода.
import { describe, it, expect } from 'vitest';
import { timeModeAdapter } from '@/entities/zone';

describe('timeModeAdapter (TIME-02, D-13)', () => {
  it('now → /zones, no extra params', () => {
    expect(timeModeAdapter({ kind: 'now' })).toEqual({
      endpoint: '/zones',
      extraParams: {},
    });
  });

  it('past → /occupancy + at + view=map', () => {
    expect(timeModeAdapter({ kind: 'past', at: '2026-04-22T09:00:00.000Z' })).toEqual({
      endpoint: '/occupancy',
      extraParams: { at: '2026-04-22T09:00:00.000Z', view: 'map' },
    });
  });

  it('future → /forecasts + at + view=map', () => {
    expect(timeModeAdapter({ kind: 'future', at: '2026-04-25T17:00:00.000Z' })).toEqual({
      endpoint: '/forecasts',
      extraParams: { at: '2026-04-25T17:00:00.000Z', view: 'map' },
    });
  });
});
