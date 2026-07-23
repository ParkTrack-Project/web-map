import { act, renderHook } from '@testing-library/react';
import type { Virtualizer } from '@tanstack/react-virtual';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RouteCandidate } from '@/entities/zone';
import { useResultSelection } from '@/features/select-zone';
import { useResultsScrollSync } from './useResultsScrollSync';

function candidate(zoneId: number): RouteCandidate {
  return {
    zone_id: zoneId,
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
    distance_from_origin_meters: 100,
    duration_from_origin_seconds: 60,
    distance_to_destination_meters: null,
    duration_to_destination_seconds: null,
    score: 0.8,
    rank: zoneId,
  };
}

describe('useResultsScrollSync', () => {
  beforeEach(() => {
    useResultSelection.getState().clearResultSelection();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('scrolls to a map-hovered result only after 500 ms', () => {
    vi.useFakeTimers();
    const scrollToIndex = vi.fn();
    const virtualizer = { scrollToIndex } as unknown as Virtualizer<HTMLDivElement, Element>;
    const candidates = [candidate(10), candidate(20), candidate(30)];
    useResultSelection.getState().setResultCandidates(candidates);
    useResultSelection.getState().markZoneViewed(10);

    renderHook(() => useResultsScrollSync(virtualizer, candidates), {
      wrapper: ({ children }) => (
        <NuqsTestingAdapter searchParams="">{children}</NuqsTestingAdapter>
      ),
    });
    expect(scrollToIndex).toHaveBeenCalledWith(0, expect.any(Object));
    scrollToIndex.mockClear();

    act(() => useResultSelection.getState().setHoveredZone(30, 'map'));
    expect(scrollToIndex).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(499));
    expect(scrollToIndex).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(scrollToIndex).toHaveBeenCalledWith(2, {
      align: 'center',
      behavior: 'smooth',
    });
    scrollToIndex.mockClear();

    act(() => useResultSelection.getState().clearHoveredZone(30, 'map'));
    expect(scrollToIndex).not.toHaveBeenCalled();
  });

  it('cancels delayed scrolling when map hover was accidental', () => {
    vi.useFakeTimers();
    const scrollToIndex = vi.fn();
    const virtualizer = { scrollToIndex } as unknown as Virtualizer<HTMLDivElement, Element>;
    const candidates = [candidate(10), candidate(20), candidate(30)];
    useResultSelection.getState().setResultCandidates(candidates);

    renderHook(() => useResultsScrollSync(virtualizer, candidates), {
      wrapper: ({ children }) => (
        <NuqsTestingAdapter searchParams="">{children}</NuqsTestingAdapter>
      ),
    });

    act(() => useResultSelection.getState().setHoveredZone(30, 'map'));
    act(() => vi.advanceTimersByTime(250));
    act(() => useResultSelection.getState().clearHoveredZone(30, 'map'));
    act(() => vi.advanceTimersByTime(500));
    expect(scrollToIndex).not.toHaveBeenCalled();
  });

  it('does not scroll when the pointer moves across the list itself', () => {
    const scrollToIndex = vi.fn();
    const virtualizer = { scrollToIndex } as unknown as Virtualizer<HTMLDivElement, Element>;
    const candidates = [candidate(10), candidate(20), candidate(30)];
    useResultSelection.getState().setResultCandidates(candidates);

    renderHook(() => useResultsScrollSync(virtualizer, candidates), {
      wrapper: ({ children }) => (
        <NuqsTestingAdapter searchParams="">{children}</NuqsTestingAdapter>
      ),
    });

    act(() => useResultSelection.getState().setHoveredZone(30, 'list'));
    expect(scrollToIndex).not.toHaveBeenCalled();
  });
});
