/// <reference types="vitest/globals" />
// TIME-07 / Plan 05 / D-16: ZoneCard mode-awareness + «Зона неактивна» empty-state.
//
// Стратегия: мокаем useZoneByIdQuery детерминированно (как zone-card.spec.tsx) +
// мокаем useSelectedZone, чтобы ZoneCard render'ил поддерево вне зависимости от nuqs URL.
// useTimeMode НЕ мокаем — читаем реальный nuqs hook с NuqsTestingAdapter searchParams.
import type * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';

const resultSelectionState = vi.hoisted(() => ({
  resultZoneIds: [] as number[],
  resultCandidates: [],
  lastViewedZoneId: null,
  hoveredZoneId: null,
  setResultZoneIds: vi.fn(),
  setResultCandidates: vi.fn(),
  markZoneViewed: vi.fn(),
  setHoveredZone: vi.fn(),
  clearHoveredZone: vi.fn(),
  clearResultSelection: vi.fn(),
}));

vi.mock('@/entities/zone', async () => {
  const actual = await vi.importActual<typeof import('@/entities/zone')>('@/entities/zone');
  return {
    ...actual,
    useZoneByIdQuery: vi.fn(),
  };
});
vi.mock('@/features/select-zone', () => ({
  useSelectedZone: () => ({
    selectedZoneId: 42,
    setSelectedZone: vi.fn(),
    closeCard: vi.fn(),
  }),
  useResultSelection: (selector: (state: typeof resultSelectionState) => unknown) =>
    selector(resultSelectionState),
}));

import { useZoneByIdQuery } from '@/entities/zone';
import { ZoneCard } from '@/widgets/zone-card/ui/ZoneCard';

const mockUseZoneByIdQuery = vi.mocked(useZoneByIdQuery);

function wrap(initialUrl: string) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>
      <NuqsTestingAdapter searchParams={initialUrl}>{children}</NuqsTestingAdapter>
    </QueryClientProvider>
  );
}

const inactiveZone = {
  zone_id: 42,
  is_active: false,
  zone_type: 'standard' as const,
  capacity: 10,
  occupied: 0,
  free_count: 10,
  confidence: 0.9,
  confidence_level: 'high' as const,
  pay: 0,
  geometry: {
    type: 'Polygon' as const,
    coordinates: [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 1],
        [0, 0],
      ],
    ],
  },
  location_type: 'street' as const,
  is_private: false,
  is_accessible: false,
  occupancy_updated_at: '2026-04-22T09:00:00.000Z',
  camera_id: 1,
  image_polygon: [],
  partner_id: null,
  created_by_user_id: 1,
  created_at: '2026-04-01T00:00:00Z',
  updated_at: '2026-04-22T09:00:00.000Z',
};

const activeZone = { ...inactiveZone, is_active: true, occupied: 5, free_count: 5 };

describe('<ZoneCard /> mode-awareness (TIME-07, Plan 05)', () => {
  it('mode=past + is_active=false → «Зона неактивна в этот период» + «Вернуться к Сейчас»', () => {
    mockUseZoneByIdQuery.mockReturnValue({
      data: inactiveZone,
      isPending: false,
      isError: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const Wrapper = wrap('?t=past:2026-04-22T09:00:00.000Z');
    render(
      <Wrapper>
        <ZoneCard />
      </Wrapper>,
    );
    expect(screen.getByTestId('zone-card-inactive')).toBeInTheDocument();
    expect(screen.getByText('Зона неактивна в этот период')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Вернуться к Сейчас' })).toBeInTheDocument();
  });

  it('mode=now + is_active=false → «Зона неактивна» БЕЗ «Вернуться к Сейчас»', () => {
    mockUseZoneByIdQuery.mockReturnValue({
      data: inactiveZone,
      isPending: false,
      isError: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const Wrapper = wrap('');
    render(
      <Wrapper>
        <ZoneCard />
      </Wrapper>,
    );
    expect(screen.getByText('Зона неактивна в этот период')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Вернуться к Сейчас' })).toBeNull();
  });

  it('useZoneByIdQuery вызвана с (id, mode) — TIME-07 atomic switch ready', () => {
    mockUseZoneByIdQuery.mockReturnValue({
      data: activeZone,
      isPending: false,
      isError: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const Wrapper = wrap('?t=past:2026-04-22T09:00:00.000Z');
    render(
      <Wrapper>
        <ZoneCard />
      </Wrapper>,
    );
    expect(mockUseZoneByIdQuery).toHaveBeenCalledWith(
      42,
      expect.objectContaining({ kind: 'past' }),
    );
  });

  it('mode=now + is_active=true → обычный рендер карточки (не inactive empty-state)', () => {
    mockUseZoneByIdQuery.mockReturnValue({
      data: activeZone,
      isPending: false,
      isError: false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const Wrapper = wrap('');
    render(
      <Wrapper>
        <ZoneCard />
      </Wrapper>,
    );
    expect(screen.queryByTestId('zone-card-inactive')).toBeNull();
    expect(screen.queryByText('Зона неактивна в этот период')).toBeNull();
    // Реальный рендер (CARD-06 plural «5 мест») — sanity check, что карточка работает.
    expect(screen.getByText(/5 мест/)).toBeInTheDocument();
  });
});
