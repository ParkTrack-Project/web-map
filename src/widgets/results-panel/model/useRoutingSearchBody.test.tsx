import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { useRoutingSearchBody } from './useRoutingSearchBody';

function wrap(searchParams: string) {
  return ({ children }: { children: React.ReactNode }) => (
    <NuqsTestingAdapter searchParams={searchParams}>{children}</NuqsTestingAdapter>
  );
}

describe('useRoutingSearchBody (D-14 / D-15)', () => {
  it('returns null без ?from', () => {
    const { result } = renderHook(() => useRoutingSearchBody(), { wrapper: wrap('') });
    expect(result.current).toBeNull();
  });
  it('mode=find_parking когда from && !dest', () => {
    const { result } = renderHook(() => useRoutingSearchBody(), {
      wrapper: wrap('?from=59.93863,30.31413'),
    });
    expect(result.current?.mode).toBe('find_parking');
    expect(result.current?.origin).toEqual({ latitude: 59.93863, longitude: 30.31413 });
    expect(result.current?.destination).toBeUndefined();
  });
  it('mode=route_to_destination когда from && dest', () => {
    const { result } = renderHook(() => useRoutingSearchBody(), {
      wrapper: wrap('?from=59.93863,30.31413&dest=59.95598,30.30943'),
    });
    expect(result.current?.mode).toBe('route_to_destination');
    expect(result.current?.destination).toEqual({ latitude: 59.95598, longitude: 30.30943 });
    expect(result.current?.max_distance_to_destination_meters).toBe(500);
  });
  it('limit=20 + provider=geoapify hardcoded (D-14)', () => {
    const { result } = renderHook(() => useRoutingSearchBody(), {
      wrapper: wrap('?from=59.93863,30.31413'),
    });
    expect(result.current?.limit).toBe(20);
    expect(result.current?.provider).toBe('geoapify');
  });
});
