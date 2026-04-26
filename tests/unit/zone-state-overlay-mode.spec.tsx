// TIME-09 / UX-03 / D-16 / I-6: ZoneStateOverlay mode-aware empty/error states.
// Mock useFilteredZones для детерминированной симуляции data-states.
//
// Quick task 260426-hhb: TimeMode стал derived из at + Date.now() через parser.
// Fake timers нужны для детерминированной derivation legacy-URL фикстур
// (?t=past:2026-04-22T... должен derive past, ?t=future:2026-04-25T17:00...
// должен derive future относительно freezed system time).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { ZoneStateOverlay } from '@/widgets/map-canvas/ui/ZoneStateOverlay';
import { TimeModeUnavailableError } from '@/entities/zone';

vi.mock('@/features/viewport-driven-zones', () => ({
  useFilteredZones: vi.fn(),
}));
vi.mock('@/features/filter-zones', () => ({
  useFilters: () => ({ activeCount: 0, resetAll: vi.fn() }),
}));

import { useFilteredZones } from '@/features/viewport-driven-zones';

function wrap(initialUrl: string) {
  const qc = new QueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>
      <NuqsTestingAdapter searchParams={initialUrl}>{children}</NuqsTestingAdapter>
    </QueryClientProvider>
  );
}

describe('<ZoneStateOverlay /> mode-aware (TIME-09, UX-03, D-16)', () => {
  // Freeze system time посередине между past-фикстурой (2026-04-22T09:00:00)
  // и future-фикстурой (2026-04-25T17:00:00) → стабильная derivation.
  const NOW = new Date('2026-04-24T12:00:00.000Z').getTime();
  beforeEach(() =>
    vi.useFakeTimers({ shouldAdvanceTime: true, toFake: ['Date'] }).setSystemTime(NOW),
  );
  afterEach(() => vi.useRealTimers());

  it('mode=past + empty → «Нет данных за это время» + «Вернуться к Сейчас»', () => {
    vi.mocked(useFilteredZones).mockReturnValue({
      data: [],
      isError: false,
      isPending: false,
      isFetching: false,
      bbox: [0, 0, 1, 1],
    } as unknown as ReturnType<typeof useFilteredZones>);
    const Wrapper = wrap('?t=past:2026-04-22T09:00:00.000Z');
    render(
      <Wrapper>
        <ZoneStateOverlay />
      </Wrapper>,
    );
    expect(screen.getByText('Нет данных за это время')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Вернуться к Сейчас' })).toBeInTheDocument();
  });

  it('mode=future + empty → «Прогноз на это время недоступен»', () => {
    vi.mocked(useFilteredZones).mockReturnValue({
      data: [],
      isError: false,
      isPending: false,
      isFetching: false,
      bbox: [0, 0, 1, 1],
    } as unknown as ReturnType<typeof useFilteredZones>);
    const Wrapper = wrap('?t=future:2026-04-25T17:00:00.000Z');
    render(
      <Wrapper>
        <ZoneStateOverlay />
      </Wrapper>,
    );
    expect(screen.getByText('Прогноз на это время недоступен')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Вернуться к Сейчас' })).toBeInTheDocument();
  });

  it('mode=past + error → «Не удалось загрузить данные» + «Повторить» + «Вернуться к Сейчас»', () => {
    vi.mocked(useFilteredZones).mockReturnValue({
      data: undefined,
      isError: true,
      isPending: false,
      isFetching: false,
      bbox: [0, 0, 1, 1],
      error: new Error('network'),
    } as unknown as ReturnType<typeof useFilteredZones>);
    const Wrapper = wrap('?t=past:2026-04-22T09:00:00.000Z');
    render(
      <Wrapper>
        <ZoneStateOverlay />
      </Wrapper>,
    );
    expect(screen.getByText('Не удалось загрузить данные')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Повторить' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Вернуться к Сейчас' })).toBeInTheDocument();
  });

  it('mode=now + error → «Повторить» БЕЗ «Вернуться к Сейчас»', () => {
    vi.mocked(useFilteredZones).mockReturnValue({
      data: undefined,
      isError: true,
      isPending: false,
      isFetching: false,
      bbox: [0, 0, 1, 1],
      error: new Error('network'),
    } as unknown as ReturnType<typeof useFilteredZones>);
    const Wrapper = wrap('');
    render(
      <Wrapper>
        <ZoneStateOverlay />
      </Wrapper>,
    );
    expect(screen.getByText('Не удалось загрузить данные')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Вернуться к Сейчас' })).toBeNull();
  });

  // I-6: typed error → ZoneStateOverlay использует error.message
  it('I-6: error instanceof TimeModeUnavailableError → отображает error.message (не дефолт)', () => {
    const customMsg = 'Прогноз на это время недоступен';
    vi.mocked(useFilteredZones).mockReturnValue({
      data: undefined,
      isError: true,
      isPending: false,
      isFetching: false,
      bbox: [0, 0, 1, 1],
      error: new TimeModeUnavailableError(customMsg, {
        kind: 'future',
        at: '2026-04-26T03:00:00.000Z',
      }),
    } as unknown as ReturnType<typeof useFilteredZones>);
    const Wrapper = wrap('?t=future:2026-04-26T03:00:00.000Z');
    render(
      <Wrapper>
        <ZoneStateOverlay />
      </Wrapper>,
    );
    expect(screen.getByText(customMsg)).toBeInTheDocument();
    expect(screen.queryByText('Не удалось загрузить данные')).toBeNull();
  });
});
