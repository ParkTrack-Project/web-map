// Phase 4 / D-31 / ROUTE-05: RouteSummaryCard tests.
// Pre-hydrated TanStack cache with fakeRoute → ?route=7001 → expected text rendered.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import type { ReactNode } from 'react';
import { RouteSummaryCard } from './RouteSummaryCard';
import type { Route } from '@/entities/zone';

const fakeRoute: Route = {
  route_id: 7001,
  user_id: 1,
  mode: 'find_parking',
  provider: 'yandex',
  origin: { latitude: 59.93863, longitude: 30.31413 },
  destination: null,
  selected_zone_id: 42,
  selected_candidate: {
    zone_id: 42,
    camera_id: null,
    // W-5 fix: 4 distinct vertices + closing — реалистичный quad.
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [30.30943, 59.95598],
          [30.31, 59.95598],
          [30.31, 59.96],
          [30.30943, 59.96],
          [30.30943, 59.95598],
        ],
      ],
    },
    zone_type: 'standard',
    location_type: 'street',
    is_accessible: false,
    pay: 0,
    capacity: 5,
    current_occupied: 1,
    current_free_count: 4,
    current_confidence: 0.8,
    predicted_for_arrival: null,
    predicted_occupied: null,
    predicted_free_count: null,
    probability_free_space: null,
    forecast_confidence: null,
    distance_from_origin_meters: 850,
    duration_from_origin_seconds: 240,
    distance_to_destination_meters: null,
    duration_to_destination_seconds: null,
    score: 0.84,
    rank: 1,
  },
  eta_seconds: 240,
  arrival_time: '2026-04-26T17:30:00Z',
  polyline: null,
  deeplink_url: 'yandexnavi://...',
  status: 'active',
  created_at: '2026-04-26T17:26:00Z',
  updated_at: '2026-04-26T17:26:00Z',
};

function wrap(children: ReactNode) {
  const qc = new QueryClient();
  qc.setQueryData(['route', 7001], fakeRoute);
  return (
    <QueryClientProvider client={qc}>
      <NuqsTestingAdapter searchParams="?route=7001&from=59.93863,30.31413">
        {children}
      </NuqsTestingAdapter>
    </QueryClientProvider>
  );
}

describe('RouteSummaryCard (D-31 / ROUTE-05)', () => {
  it('shows «Маршрут построен» heading', () => {
    render(wrap(<RouteSummaryCard />));
    expect(screen.getByText(/Маршрут построен/)).toBeInTheDocument();
  });

  it('shows ETA 4 мин (240/60)', () => {
    render(wrap(<RouteSummaryCard />));
    expect(screen.getByText(/4 мин/)).toBeInTheDocument();
  });

  // 2026-05-26: длинные маршруты не отображаем в минутах (раньше было «4000 мин»).
  it('конвертирует длинный ETA: 4000 мин → «2 д 18 ч», без «мин»-портянки', () => {
    const qc = new QueryClient();
    qc.setQueryData(['route', 7001], { ...fakeRoute, eta_seconds: 4000 * 60 });
    render(
      <QueryClientProvider client={qc}>
        <NuqsTestingAdapter searchParams="?route=7001&from=59.93863,30.31413">
          <RouteSummaryCard />
        </NuqsTestingAdapter>
      </QueryClientProvider>,
    );
    expect(screen.getByText(/2 д 18 ч/)).toBeInTheDocument();
    expect(screen.queryByText(/4000 мин/)).toBeNull();
  });

  it('shows distance 850', () => {
    render(wrap(<RouteSummaryCard />));
    expect(screen.getByText(/850/)).toBeInTheDocument();
  });

  it('shows В путь button', () => {
    render(wrap(<RouteSummaryCard />));
    expect(screen.getAllByText(/В путь/).length).toBeGreaterThan(0);
  });
});
