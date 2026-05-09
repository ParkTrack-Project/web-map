// Phase 4 / SEARCH-01..02 / D-01..D-03 (TDD RED):
// Tests for useAddressSuggest hook — debounce 300ms, min length 2, retry false,
// queryKey on debounced text. mocks suggestAddresses.
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useAddressSuggest } from './useAddressSuggest';

vi.mock('@/shared/lib/yandex', async () => {
  const actual = await vi.importActual<typeof import('@/shared/lib/yandex')>('@/shared/lib/yandex');
  return { ...actual, suggestAddresses: vi.fn() };
});
import { suggestAddresses } from '@/shared/lib/yandex';

function makeWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 0 } } });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('useAddressSuggest', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    (suggestAddresses as ReturnType<typeof vi.fn>).mockReset();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('initial state: results=[], text=""', () => {
    const { result } = renderHook(() => useAddressSuggest(), { wrapper: makeWrapper() });
    expect(result.current.results).toEqual([]);
    expect(result.current.text).toBe('');
  });

  it('text < 2 chars не triggers fetch', async () => {
    const { result } = renderHook(() => useAddressSuggest(), { wrapper: makeWrapper() });
    act(() => {
      result.current.setText('К');
    });
    await act(async () => {
      vi.advanceTimersByTime(400);
    });
    expect(suggestAddresses).not.toHaveBeenCalled();
  });

  it('text >= 2 chars debounced 300ms перед fetch', async () => {
    (suggestAddresses as ReturnType<typeof vi.fn>).mockResolvedValue([
      { title: { text: 'Кронверкский пр.' }, uri: 'ymapsbm1://geo?id=1' },
    ]);
    // Use real timers — fake timers mix poorly with TanStack Query internal scheduling.
    vi.useRealTimers();
    const { result } = renderHook(() => useAddressSuggest(), { wrapper: makeWrapper() });
    act(() => {
      result.current.setText('Кр');
    });
    // Сразу после setText: НЕ должен fetch — debounce 300ms не истёк.
    expect(suggestAddresses).not.toHaveBeenCalled();
    // Ждём > 300ms debounce → fetch должен произойти.
    await waitFor(() => expect(suggestAddresses).toHaveBeenCalledTimes(1), { timeout: 1000 });
  });
});
