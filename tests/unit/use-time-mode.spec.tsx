// TIME-04 / URL-02: useTimeMode hook — URL ↔ TimeMode round-trip.
// NuqsTestingAdapter эмулирует URL state без реального DOM/router'а.
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import type { ReactNode } from 'react';
import { useTimeMode } from '@/features/select-time-mode';

function wrap(initialUrl = '') {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <NuqsTestingAdapter searchParams={initialUrl}>{children}</NuqsTestingAdapter>;
  };
}

describe('useTimeMode (TIME-04, URL-02)', () => {
  it('default → { kind: "now" }', () => {
    const { result } = renderHook(() => useTimeMode(), { wrapper: wrap('') });
    expect(result.current.mode).toEqual({ kind: 'now' });
  });

  it('?t=past:ISO → past mode', () => {
    const { result } = renderHook(() => useTimeMode(), {
      wrapper: wrap('?t=past:2026-04-22T09:00:00.000Z'),
    });
    expect(result.current.mode).toEqual({ kind: 'past', at: '2026-04-22T09:00:00.000Z' });
  });

  it('?t=future:ISO → future mode', () => {
    const { result } = renderHook(() => useTimeMode(), {
      wrapper: wrap('?t=future:2026-04-25T17:00:00.000Z'),
    });
    expect(result.current.mode).toEqual({ kind: 'future', at: '2026-04-25T17:00:00.000Z' });
  });

  it('setNow() возвращает в { kind: "now" }', async () => {
    const { result } = renderHook(() => useTimeMode(), {
      wrapper: wrap('?t=future:2026-04-25T17:00:00.000Z'),
    });
    await act(async () => {
      await result.current.setNow();
    });
    expect(result.current.mode).toEqual({ kind: 'now' });
  });

  it('setMode({kind:"future", at:...}) обновляет mode', async () => {
    const { result } = renderHook(() => useTimeMode(), { wrapper: wrap('') });
    await act(async () => {
      await result.current.setMode({ kind: 'future', at: '2026-04-25T17:00:00.000Z' });
    });
    expect(result.current.mode).toEqual({ kind: 'future', at: '2026-04-25T17:00:00.000Z' });
  });

  it('setMode({kind:"past", at:...}) обновляет mode', async () => {
    const { result } = renderHook(() => useTimeMode(), { wrapper: wrap('') });
    await act(async () => {
      await result.current.setMode({ kind: 'past', at: '2026-04-22T09:00:00.000Z' });
    });
    expect(result.current.mode).toEqual({ kind: 'past', at: '2026-04-22T09:00:00.000Z' });
  });
});
