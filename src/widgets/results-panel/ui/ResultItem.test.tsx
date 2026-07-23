import { beforeEach, describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { ResultItem } from './ResultItem';
import type { RouteCandidate } from '@/entities/zone';
import { useResultSelection } from '@/features/select-zone';

const c: RouteCandidate = {
  zone_id: 42,
  camera_id: null,
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [30.3, 59.95],
        [30.31, 59.95],
        [30.31, 59.96],
        [30.3, 59.96],
        [30.3, 59.95],
      ],
    ],
  },
  zone_type: 'standard',
  location_type: 'street',
  is_accessible: false,
  pay: 150,
  capacity: 12,
  current_occupied: 7,
  current_free_count: 5,
  current_confidence: 0.76,
  predicted_for_arrival: '2026-04-26T17:00:00Z',
  predicted_occupied: 9,
  predicted_free_count: 3,
  probability_free_space: 0.42,
  forecast_confidence: 0.71,
  distance_from_origin_meters: 850,
  duration_from_origin_seconds: 240,
  distance_to_destination_meters: 120,
  duration_to_destination_seconds: 90,
  score: 0.84,
  rank: 1,
};

function wrap(children: React.ReactNode) {
  // 2026-06-06: ResultItem → useZoomToZone теперь читает useFilteredZones
  // (нужны зоны для «зума разъединения»), а тот вызывает useZonesQuery →
  // требуется QueryClientProvider. Без ?bbox запрос disabled (data undefined),
  // расчёт разъединения тихо пропускается — поведение item'а не меняется.
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <NuqsTestingAdapter>{children}</NuqsTestingAdapter>
    </QueryClientProvider>
  );
}

describe('ResultItem (RANK-04 / D-20)', () => {
  beforeEach(() => {
    useResultSelection.getState().clearResultSelection();
  });

  it('rank=1 shows «Лучший вариант» badge', () => {
    render(wrap(<ResultItem candidate={c} onClick={() => {}} />));
    expect(screen.getByText('Лучший вариант')).toBeInTheDocument();
  });
  it('rank!=1 hides badge', () => {
    render(wrap(<ResultItem candidate={{ ...c, rank: 2 }} onClick={() => {}} />));
    expect(screen.queryByText('Лучший вариант')).not.toBeInTheDocument();
  });
  it('shows zone_id, free_count/capacity, pay', () => {
    render(wrap(<ResultItem candidate={c} onClick={() => {}} />));
    expect(screen.getByText(/Парковка #42/)).toBeInTheDocument();
    expect(screen.getByText(/5\/12/)).toBeInTheDocument();
    expect(screen.getByText(/150 ₽\/час/)).toBeInTheDocument();
  });
  it('pay=0 shows «Бесплатно»', () => {
    render(wrap(<ResultItem candidate={{ ...c, pay: 0 }} onClick={() => {}} />));
    expect(screen.getByText('Бесплатно')).toBeInTheDocument();
  });
  it('shows distance + duration', () => {
    render(wrap(<ResultItem candidate={c} onClick={() => {}} />));
    expect(screen.getByText(/850 м/)).toBeInTheDocument();
    expect(screen.getByText(/4 мин/)).toBeInTheDocument(); // 240 sec / 60 = 4 min
  });
  it('uses an opaque dark surface before hover', () => {
    render(wrap(<ResultItem candidate={c} onClick={() => {}} />));
    expect(screen.getByTestId('result-item-42')).toHaveClass('surface-opaque', 'dark:bg-zinc-900');
  });

  it('synchronizes hover without applying the selected green border', () => {
    useResultSelection.getState().setResultZoneIds([c.zone_id]);
    render(wrap(<ResultItem candidate={c} onClick={() => {}} />));
    const item = screen.getByTestId('result-item-42');

    fireEvent.pointerEnter(item);
    expect(useResultSelection.getState().hoveredZoneId).toBe(c.zone_id);
    expect(useResultSelection.getState().hoveredZoneSource).toBe('list');
    expect(item).toHaveClass('surface-hovered', 'border-transparent');
    expect(item).not.toHaveClass('border-emerald-500');

    fireEvent.pointerLeave(item);
    expect(useResultSelection.getState().hoveredZoneId).toBeNull();
  });

  it('keeps the last opened parking highlighted after returning to results', () => {
    useResultSelection.getState().setResultZoneIds([c.zone_id]);
    useResultSelection.getState().markZoneViewed(c.zone_id);
    render(wrap(<ResultItem candidate={c} onClick={() => {}} />));
    expect(screen.getByTestId('result-item-42')).toHaveClass(
      'surface-selected',
      'border-emerald-500',
    );
  });

  // 2026-05-26: длинные маршруты конвертируем в часы/дни вместо «4000 мин».
  it('конвертирует длинную поездку: 4000 мин (≈240000с) → «2 д 18 ч»', () => {
    render(
      wrap(
        <ResultItem
          candidate={{ ...c, duration_from_origin_seconds: 4000 * 60 }}
          onClick={() => {}}
        />,
      ),
    );
    expect(screen.getByText(/2 д 18 ч/)).toBeInTheDocument();
    expect(screen.queryByText(/4000 мин/)).toBeNull();
  });
  it('shows confidence percent', () => {
    render(wrap(<ResultItem candidate={c} onClick={() => {}} />));
    expect(screen.getByText(/76%/)).toBeInTheDocument();
  });
  it('predicted_free_count shown when use_forecast', () => {
    render(wrap(<ResultItem candidate={c} onClick={() => {}} />));
    expect(screen.getByText(/Прогноз: 3 свободных/)).toBeInTheDocument();
  });
  it('predicted_free_count=null hides forecast row', () => {
    const noFc = { ...c, predicted_free_count: null, predicted_for_arrival: null };
    render(wrap(<ResultItem candidate={noFc} onClick={() => {}} />));
    expect(screen.queryByText(/Прогноз/)).not.toBeInTheDocument();
  });
  it('onClick prop called с candidate', () => {
    const fn = vi.fn();
    useResultSelection.getState().setResultZoneIds([c.zone_id]);
    render(wrap(<ResultItem candidate={c} onClick={fn} />));
    const item = screen.getByTestId('result-item-42');
    fireEvent.pointerEnter(item);
    fireEvent.click(item);
    expect(fn).toHaveBeenCalledWith(c);
    expect(useResultSelection.getState().lastViewedZoneId).toBe(c.zone_id);
    expect(useResultSelection.getState().hoveredZoneId).toBeNull();
  });

  it('releases focus before the results drawer becomes hidden', () => {
    render(wrap(<ResultItem candidate={c} onClick={() => {}} />));
    const item = screen.getByTestId('result-item-42');
    item.focus();
    expect(item).toHaveFocus();
    fireEvent.click(item);
    expect(item).not.toHaveFocus();
  });
});
