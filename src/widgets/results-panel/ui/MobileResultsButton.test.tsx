import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MobileResultsButton } from './MobileResultsButton';

const routing = vi.hoisted(() => ({
  body: { origin: { latitude: 59.9, longitude: 30.3 } },
  data: { candidates: [] },
  isFetching: false,
}));

vi.mock('../model/useRoutingResults', () => ({ useRoutingResults: () => routing }));
vi.mock('@/features/request-geolocation', () => ({
  useFromCoords: () => ({ from: [59.9, 30.3], setFromCoords: vi.fn() }),
  useGeolocationRequest: () => ({
    request: vi.fn(),
    state: { status: 'idle', position: null, error: null },
  }),
}));
vi.mock('@/features/filter-zones', () => ({
  useFilteredCandidates: (candidates: unknown[]) => candidates ?? [],
}));
vi.mock('@/shared/lib/responsive', () => ({ useIsMobile: () => true }));
vi.mock('@/shared/lib/i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
    formatCount: (_kind: string, count: number) => String(count),
  }),
}));
vi.mock('@/shared/ui', () => ({ ClassicCarIcon: () => null }));
vi.mock('@/widgets/wtp-cta', () => ({
  GeolocationDeniedBanner: () => null,
  PreFlightDrawer: () => null,
}));

describe('MobileResultsButton', () => {
  beforeEach(() => {
    routing.body = { origin: { latitude: 59.9, longitude: 30.3 } };
    routing.data = { candidates: [] };
    routing.isFetching = false;
  });

  it('opens the result sheet as soon as a new search completes', async () => {
    const onOpenSheet = vi.fn();
    const { rerender } = render(<MobileResultsButton hidden={false} onOpenSheet={onOpenSheet} />);
    await waitFor(() => expect(onOpenSheet).toHaveBeenCalledTimes(1));

    rerender(<MobileResultsButton hidden={false} onOpenSheet={onOpenSheet} />);
    expect(onOpenSheet).toHaveBeenCalledTimes(1);

    routing.body = { origin: { latitude: 60, longitude: 30.4 } };
    rerender(<MobileResultsButton hidden={false} onOpenSheet={onOpenSheet} />);
    await waitFor(() => expect(onOpenSheet).toHaveBeenCalledTimes(2));
  });
});
