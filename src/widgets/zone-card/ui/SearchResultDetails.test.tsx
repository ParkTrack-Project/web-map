import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { RouteCandidate } from '@/entities/zone';
import { SearchResultDetails } from './SearchResultDetails';

const candidate: RouteCandidate = {
  zone_id: 42,
  camera_id: null,
  geometry: { type: 'Polygon', coordinates: [[[30, 60]]] },
  zone_type: 'standard',
  location_type: 'street',
  is_accessible: false,
  pay: 0,
  capacity: 10,
  current_occupied: 5,
  current_free_count: 5,
  current_confidence: 0.8,
  predicted_for_arrival: null,
  predicted_occupied: null,
  predicted_free_count: null,
  probability_free_space: null,
  forecast_confidence: null,
  distance_from_origin_meters: 450,
  duration_from_origin_seconds: 180,
  distance_to_destination_meters: 120,
  duration_to_destination_seconds: 60,
  score: 0.9,
  rank: 2,
};

describe('SearchResultDetails', () => {
  it('shows routing metrics and navigates to adjacent results', () => {
    const onPrevious = vi.fn();
    const onNext = vi.fn();
    render(
      <SearchResultDetails
        candidate={candidate}
        index={1}
        total={3}
        onPrevious={onPrevious}
        onNext={onNext}
      />,
    );

    expect(screen.getByText('Вариант 2 из 3')).toBeInTheDocument();
    expect(screen.getByText(/450 м \(3 мин на машине\)/)).toBeInTheDocument();
    expect(screen.getByText(/120 м до точки назначения/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Предыдущий вариант парковки' }));
    fireEvent.click(screen.getByRole('button', { name: 'Следующий вариант парковки' }));
    expect(onPrevious).toHaveBeenCalledOnce();
    expect(onNext).toHaveBeenCalledOnce();
  });

  it('disables navigation at the result boundaries', () => {
    render(
      <SearchResultDetails
        candidate={candidate}
        index={0}
        total={1}
        onPrevious={() => {}}
        onNext={() => {}}
      />,
    );

    expect(screen.getByRole('button', { name: 'Предыдущий вариант парковки' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Следующий вариант парковки' })).toBeDisabled();
  });

  it('shows long distances in kilometers', () => {
    render(
      <SearchResultDetails
        candidate={{
          ...candidate,
          distance_from_origin_meters: 2350,
          distance_to_destination_meters: 1400,
        }}
        index={0}
        total={1}
        onPrevious={() => {}}
        onNext={() => {}}
      />,
    );

    expect(screen.getByText(/2,4 км \(3 мин на машине\)/)).toBeInTheDocument();
    expect(screen.getByText(/1,4 км до точки назначения/)).toBeInTheDocument();
  });
});
