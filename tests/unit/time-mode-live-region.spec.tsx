// A11Y-03 / D-17: TimeModeLiveRegion specs.
// Verify aria-live="polite", debounced 500мс, lazy initial.
//
// Pattern (Plan 03 B-1 iter-2): mock useTimeMode directly + stable Wrapper.
// `NuqsTestingAdapter` нельзя использовать с rerender'ом потому что .searchParams
// initial-only — а смена adapter'а через rerender создаёт НОВЫЙ Wrapper identity →
// React unmount+remount → isFirstRef ресет → второй render считается «первым».
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import type { ReactNode } from 'react';

vi.mock('@/features/select-time-mode', () => ({
  useTimeMode: vi.fn(),
}));

import { useTimeMode } from '@/features/select-time-mode';
import { TimeModeLiveRegion } from '@/widgets/time-selector';

const mockedUseTimeMode = vi.mocked(useTimeMode);

function Wrapper({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

describe('<TimeModeLiveRegion /> (A11Y-03, D-17)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('initial mount → пустой текст (НЕ объявляем «Режим: Сейчас» при первом рендере)', () => {
    mockedUseTimeMode.mockReturnValue({
      mode: { kind: 'now' },
      setMode: vi.fn(),
      setNow: vi.fn(),
    } as never);
    render(<TimeModeLiveRegion />, { wrapper: Wrapper });
    const region = screen.getByTestId('time-mode-live-region');
    expect(region).toHaveAttribute('aria-live', 'polite');
    expect(region).toHaveAttribute('role', 'status');
    expect(region.textContent).toBe('');
  });

  it('mode change now → past → debounce 500мс → объявление содержит «Режим: » + полную дату', () => {
    mockedUseTimeMode.mockReturnValue({
      mode: { kind: 'now' },
      setMode: vi.fn(),
      setNow: vi.fn(),
    } as never);
    const { rerender } = render(<TimeModeLiveRegion />, { wrapper: Wrapper });
    // Initial — пусто (skip first announcement)
    expect(screen.getByTestId('time-mode-live-region').textContent).toBe('');

    // Меняем mode — refs персистят (тот же Wrapper) → useEffect deps [mode] триггерится
    mockedUseTimeMode.mockReturnValue({
      mode: { kind: 'past', at: '2026-04-12T09:00:00.000Z' },
      setMode: vi.fn(),
      setNow: vi.fn(),
    } as never);
    rerender(<TimeModeLiveRegion />);

    // Через 499мс пусто
    act(() => {
      vi.advanceTimersByTime(499);
    });
    const region = screen.getByTestId('time-mode-live-region');
    expect(region.textContent).toBe('');
    // Через 500мс — есть announcement
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(region.textContent).toContain('Режим: История на');
    expect(region.textContent).toContain('апреля');
    expect(region.textContent).toContain('МСК');
  });

  it('rapid mode change — старый таймер cancelled, финальное значение озвучивается один раз', () => {
    mockedUseTimeMode.mockReturnValue({
      mode: { kind: 'now' },
      setMode: vi.fn(),
      setNow: vi.fn(),
    } as never);
    const { rerender } = render(<TimeModeLiveRegion />, { wrapper: Wrapper });

    // Первая смена mode
    mockedUseTimeMode.mockReturnValue({
      mode: { kind: 'past', at: '2026-04-12T09:00:00.000Z' },
      setMode: vi.fn(),
      setNow: vi.fn(),
    } as never);
    rerender(<TimeModeLiveRegion />);
    act(() => {
      vi.advanceTimersByTime(300); // < 500мс → ничего не объявлено
    });
    expect(screen.getByTestId('time-mode-live-region').textContent).toBe('');

    // Вторая смена mode (rapid) — старый таймер cleared
    mockedUseTimeMode.mockReturnValue({
      mode: { kind: 'future', at: '2026-04-25T17:00:00.000Z' },
      setMode: vi.fn(),
      setNow: vi.fn(),
    } as never);
    rerender(<TimeModeLiveRegion />);
    // Вторая ещё не прошла 500мс
    act(() => {
      vi.advanceTimersByTime(499);
    });
    expect(screen.getByTestId('time-mode-live-region').textContent).toBe('');
    // Полные 500мс с момента второй смены — объявляется ПОСЛЕДНЕЕ значение (Прогноз)
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(screen.getByTestId('time-mode-live-region').textContent).toContain('Режим: Прогноз на');
  });
});
