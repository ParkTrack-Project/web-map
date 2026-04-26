// TIME-04 / URL-02: useTimeMode hook — URL ↔ TimeMode round-trip.
// NuqsTestingAdapter эмулирует URL state без реального DOM/router'а.
//
// Quick task 260426-hhb: новый формат URL = чистый ISO UTC; legacy past:/future:
// silently stripped. TimeMode становится derived из at через parser.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import type { ReactNode } from 'react';
import { useTimeMode } from '@/features/select-time-mode';

function wrap(initialUrl = '') {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <NuqsTestingAdapter searchParams={initialUrl}>{children}</NuqsTestingAdapter>;
  };
}

describe('useTimeMode (TIME-04, URL-02, derived — quick 260426-hhb)', () => {
  const NOW = new Date('2026-04-25T12:00:00.000Z').getTime();
  // shouldAdvanceTime: true пропускает microtasks/promises (нужно для nuqs setMode async).
  beforeEach(() =>
    vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date'] }).setSystemTime(NOW),
  );
  afterEach(() => vi.useRealTimers());

  it('default → { kind: "now" }', () => {
    const { result } = renderHook(() => useTimeMode(), { wrapper: wrap('') });
    expect(result.current.mode).toEqual({ kind: 'now' });
  });

  it('?t=<чистый ISO в прошлом> → past mode (derived)', () => {
    const at = new Date(NOW - 3 * 3_600_000).toISOString();
    const { result } = renderHook(() => useTimeMode(), {
      wrapper: wrap(`?t=${at}`),
    });
    expect(result.current.mode).toEqual({ kind: 'past', at });
  });

  it('?t=<чистый ISO в будущем> → future mode (derived)', () => {
    const at = new Date(NOW + 3 * 3_600_000).toISOString();
    const { result } = renderHook(() => useTimeMode(), {
      wrapper: wrap(`?t=${at}`),
    });
    expect(result.current.mode).toEqual({ kind: 'future', at });
  });

  it('?t=past:ISO (legacy) → past mode (silent strip)', () => {
    const { result } = renderHook(() => useTimeMode(), {
      wrapper: wrap('?t=past:2026-04-22T09:00:00.000Z'),
    });
    expect(result.current.mode).toEqual({ kind: 'past', at: '2026-04-22T09:00:00.000Z' });
  });

  it('?t=future:ISO (legacy) → future mode (silent strip)', () => {
    const { result } = renderHook(() => useTimeMode(), {
      wrapper: wrap('?t=future:2026-04-25T17:00:00.000Z'),
    });
    expect(result.current.mode).toEqual({ kind: 'future', at: '2026-04-25T17:00:00.000Z' });
  });

  it('setNow() возвращает в { kind: "now" }', async () => {
    const at = new Date(NOW + 3 * 3_600_000).toISOString();
    const { result } = renderHook(() => useTimeMode(), {
      wrapper: wrap(`?t=${at}`),
    });
    await act(async () => {
      await result.current.setNow();
    });
    expect(result.current.mode).toEqual({ kind: 'now' });
  });

  it('setMode({kind:"future", at:...}) обновляет mode', async () => {
    const at = new Date(NOW + 3 * 3_600_000).toISOString();
    const { result } = renderHook(() => useTimeMode(), { wrapper: wrap('') });
    await act(async () => {
      await result.current.setMode({ kind: 'future', at });
    });
    expect(result.current.mode).toEqual({ kind: 'future', at });
  });

  it('setMode({kind:"past", at:...}) обновляет mode', async () => {
    const at = new Date(NOW - 3 * 3_600_000).toISOString();
    const { result } = renderHook(() => useTimeMode(), { wrapper: wrap('') });
    await act(async () => {
      await result.current.setMode({ kind: 'past', at });
    });
    expect(result.current.mode).toEqual({ kind: 'past', at });
  });
});
