import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import type { ReactNode } from 'react';

// B-1 fix: мокаем оба хука НАПРЯМУЮ — так refs внутри ModeTransitionOverlay
// персистят между rerender'ами (компонент один и тот же; нет remount).
// Старый паттерн с `makeWrapper(url)` + `TestHost` создавал НОВЫЙ Wrapper
// identity на каждый rerender → React unmount+remount поддерева →
// prevModeRef ресет → modeChanged() всегда false → overlay не появлялся.
// Кроме того, NuqsTestingAdapter.searchParams — initial-only, не реактивен.
vi.mock('@/features/select-time-mode', () => ({
  useTimeMode: vi.fn(),
}));
vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return { ...actual, useIsFetching: vi.fn() };
});

import { useTimeMode } from '@/features/select-time-mode';
import { useIsFetching } from '@tanstack/react-query';
import { ModeTransitionOverlay } from '@/widgets/mode-transition-overlay';

const mockedUseTimeMode = vi.mocked(useTimeMode);
const mockedUseIsFetching = vi.mocked(useIsFetching);

// Стабильный wrapper — mount один раз per test, никаких ремаунтов поддерева
function Wrapper({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

describe('<ModeTransitionOverlay /> (TIME-06, D-08)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // case 1 — viewport pan: fetching > 0, mode unchanged → overlay НЕ появляется
  // (Pitfall #7 / prevModeRef guard)
  it('viewport pan (fetching > 0, mode unchanged) → overlay НЕ появляется', () => {
    mockedUseTimeMode.mockReturnValue({
      mode: { kind: 'now' },
      setMode: vi.fn(),
      setNow: vi.fn(),
      modeKey: 'now',
    } as never);
    mockedUseIsFetching.mockReturnValue(1);
    render(<ModeTransitionOverlay />, { wrapper: Wrapper });
    // Симулируем pan tick — fetching флуктуирует, mode стоит
    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.queryByTestId('mode-transition-overlay')).toBeNull();
  });

  // case 2 — overlay появляется при смене mode (now → past) с fetching=1
  it('смена mode now → past + fetching=1 → overlay появляется', () => {
    mockedUseTimeMode.mockReturnValue({
      mode: { kind: 'now' },
      setMode: vi.fn(),
      setNow: vi.fn(),
      modeKey: 'now',
    } as never);
    mockedUseIsFetching.mockReturnValue(0);
    const { rerender } = render(<ModeTransitionOverlay />, { wrapper: Wrapper });
    expect(screen.queryByTestId('mode-transition-overlay')).toBeNull();

    // Меняем mode + fetching > 0 одновременно (real-world: setMode triggers refetch)
    mockedUseTimeMode.mockReturnValue({
      mode: { kind: 'past', at: '2026-04-22T09:00:00.000Z' },
      setMode: vi.fn(),
      setNow: vi.fn(),
      modeKey: 'past:2026-04-22T09:00:00.000Z',
    } as never);
    mockedUseIsFetching.mockReturnValue(1);
    rerender(<ModeTransitionOverlay />);

    // Тот же компонент — refs персистят — modeChanged() === true → setShouldShow(true)
    expect(screen.getByTestId('mode-transition-overlay')).toBeInTheDocument();
    expect(screen.getByTestId('mode-transition-overlay')).toHaveAttribute('aria-busy', 'true');
  });

  // case 3 — soft exit: fetching → 0 + 200мс → overlay скрывается
  it('fetching=1 → fetching=0 + 200мс → overlay скрывается (soft exit)', () => {
    mockedUseTimeMode.mockReturnValue({
      mode: { kind: 'now' },
      setMode: vi.fn(),
      setNow: vi.fn(),
      modeKey: 'now',
    } as never);
    mockedUseIsFetching.mockReturnValue(0);
    const { rerender } = render(<ModeTransitionOverlay />, { wrapper: Wrapper });

    // Mode change + fetching=1 → overlay появляется
    mockedUseTimeMode.mockReturnValue({
      mode: { kind: 'past', at: '2026-04-22T09:00:00.000Z' },
      setMode: vi.fn(),
      setNow: vi.fn(),
      modeKey: 'past:2026-04-22T09:00:00.000Z',
    } as never);
    mockedUseIsFetching.mockReturnValue(1);
    rerender(<ModeTransitionOverlay />);
    expect(screen.getByTestId('mode-transition-overlay')).toBeInTheDocument();

    // Ждём min-show window (200мс), затем drop fetching → overlay должен спрятаться
    act(() => {
      vi.advanceTimersByTime(250);
    });
    mockedUseIsFetching.mockReturnValue(0);
    rerender(<ModeTransitionOverlay />);
    // soft-exit useEffect ставит setTimeout(0) (Math.max(0, 200-elapsed))
    act(() => {
      vi.advanceTimersByTime(50);
    });
    expect(screen.queryByTestId('mode-transition-overlay')).toBeNull();
  });

  // case 4 — N-5 hard-timeout: fetching залип на 1, overlay уходит через 5с детерминированно
  it('N-5: hard timeout 5с — fetching не падает в 0, overlay уходит через 5с', () => {
    mockedUseTimeMode.mockReturnValue({
      mode: { kind: 'now' },
      setMode: vi.fn(),
      setNow: vi.fn(),
      modeKey: 'now',
    } as never);
    mockedUseIsFetching.mockReturnValue(0);
    const { rerender } = render(<ModeTransitionOverlay />, { wrapper: Wrapper });

    // Mode change + fetching=1
    mockedUseTimeMode.mockReturnValue({
      mode: { kind: 'past', at: '2026-04-22T09:00:00.000Z' },
      setMode: vi.fn(),
      setNow: vi.fn(),
      modeKey: 'past:2026-04-22T09:00:00.000Z',
    } as never);
    mockedUseIsFetching.mockReturnValue(1);
    rerender(<ModeTransitionOverlay />);
    expect(screen.getByTestId('mode-transition-overlay')).toBeInTheDocument();

    // 5с hard timeout — fetching никогда не падает
    act(() => {
      vi.advanceTimersByTime(5_100);
    });
    rerender(<ModeTransitionOverlay />);
    expect(screen.queryByTestId('mode-transition-overlay')).toBeNull();
  });
});
