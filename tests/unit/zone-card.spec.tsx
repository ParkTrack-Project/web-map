/// <reference types="vitest/globals" />
import type * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { ZoneCardContent } from '@/widgets/zone-card/ui/ZoneCard';

// Мокируем useZoneByIdQuery — позволяет инжектить любую форму ответа.
// Дёргаем actual через importActual, чтобы остальные ре-экспорты (типы, fetchZones)
// продолжали работать в других тестах.
vi.mock('@/entities/zone', async () => {
  const actual = await vi.importActual<typeof import('@/entities/zone')>('@/entities/zone');
  return {
    ...actual,
    useZoneByIdQuery: vi.fn(),
  };
});

import { useZoneByIdQuery } from '@/entities/zone';
const mockUseZoneByIdQuery = vi.mocked(useZoneByIdQuery);

function withProviders(ui: React.ReactElement) {
  // Plan 05 / TIME-07: ZoneCardContent теперь читает useTimeMode → требует
  // NuqsTestingAdapter в дереве (default '?' → mode={kind:'now'} backward-compat).
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <NuqsTestingAdapter searchParams="">{ui}</NuqsTestingAdapter>
    </QueryClientProvider>
  );
}

const baseZone = {
  zone_id: 42,
  zone_type: 'standard' as const,
  capacity: 10,
  occupied: 5,
  free_count: 5,
  confidence: 0.95,
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
  occupancy_updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  is_active: true,
  camera_id: 1,
  image_polygon: [],
  partner_id: null,
  created_by_user_id: 1,
  created_at: '2026-04-01T00:00:00Z',
  updated_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
};

describe('ZoneCardContent (CARD-01..07)', () => {
  it('показывает Spinner при loading', () => {
    mockUseZoneByIdQuery.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
      refetch: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    render(withProviders(<ZoneCardContent zoneId={42} onClose={vi.fn()} />));
    expect(screen.getByText(/Загрузка/i)).toBeInTheDocument();
  });

  it('рендерит «5 мест» при free_count=5', () => {
    mockUseZoneByIdQuery.mockReturnValue({
      data: baseZone,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    render(withProviders(<ZoneCardContent zoneId={42} onClose={vi.fn()} />));
    expect(screen.getByText(/5 мест/)).toBeInTheDocument();
  });

  it('рендерит «1 место» при free_count=1', () => {
    mockUseZoneByIdQuery.mockReturnValue({
      data: { ...baseZone, free_count: 1 },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    render(withProviders(<ZoneCardContent zoneId={42} onClose={vi.fn()} />));
    expect(screen.getByText(/1 место/)).toBeInTheDocument();
  });

  it('показывает «Бесплатно» при pay=0 (CARD-04)', () => {
    mockUseZoneByIdQuery.mockReturnValue({
      data: baseZone,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    render(withProviders(<ZoneCardContent zoneId={42} onClose={vi.fn()} />));
    expect(screen.getByText('Бесплатно')).toBeInTheDocument();
  });

  it('показывает «200 ₽/час» при pay=200', () => {
    mockUseZoneByIdQuery.mockReturnValue({
      data: { ...baseZone, pay: 200 },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    render(withProviders(<ZoneCardContent zoneId={42} onClose={vi.fn()} />));
    expect(screen.getByText(/200/)).toBeInTheDocument();
    expect(screen.getByText(/₽\/час/)).toBeInTheDocument();
  });

  it('показывает «Частная» при is_private=true (CARD-03)', () => {
    mockUseZoneByIdQuery.mockReturnValue({
      data: { ...baseZone, is_private: true },
      isPending: false,
      isError: false,
      refetch: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    render(withProviders(<ZoneCardContent zoneId={42} onClose={vi.fn()} />));
    expect(screen.getByText(/Частная/)).toBeInTheDocument();
  });

  it('закрытие через aria-label="Закрыть карточку" вызывает onClose (A11Y-02)', () => {
    const onClose = vi.fn();
    mockUseZoneByIdQuery.mockReturnValue({
      data: baseZone,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    render(withProviders(<ZoneCardContent zoneId={42} onClose={onClose} />));
    const btn = screen.getByLabelText('Закрыть карточку');
    fireEvent.click(btn);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('кнопка «Построить маршрут» присутствует (CARD-05)', () => {
    mockUseZoneByIdQuery.mockReturnValue({
      data: baseZone,
      isPending: false,
      isError: false,
      refetch: vi.fn(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    render(withProviders(<ZoneCardContent zoneId={42} onClose={vi.fn()} />));
    expect(screen.getByRole('button', { name: 'Построить маршрут' })).toBeInTheDocument();
  });
});
