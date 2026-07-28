import { render } from '@testing-library/react';
import { createRef } from 'react';
import type { Projection, YMap } from '@yandex/ymaps3-types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MapRefContext } from '@/widgets/map-canvas';
import { notifyResultsSheetResize } from '../model/results-sheet-resize';
import { MobileResultsViewportSync } from './MobileResultsViewportSync';

vi.mock('@/features/filter-zones', () => ({
  useFilteredCandidates: (candidates: unknown[]) => candidates ?? [],
}));
vi.mock('@/shared/lib/responsive', () => ({ useIsMobile: () => true }));
vi.mock('../model/useRoutingResults', () => ({
  useRoutingResults: () => ({
    body: { origin: { latitude: 60, longitude: 30 } },
    data: {
      candidates: [
        {
          zone_id: 1,
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [30, 60],
                [30.01, 60],
                [30.01, 60.01],
                [30, 60],
              ],
            ],
          },
        },
      ],
    },
  }),
}));

describe('MobileResultsViewportSync', () => {
  let sheetHeight = 300;
  const setLocation = vi.fn();
  const projection = {
    toWorldCoordinates: ([x, y]) => ({ x, y }),
    fromWorldCoordinates: ({ x, y }) => [x, y],
  } satisfies Projection;
  const map = {
    projection,
    zoomRange: { min: 0, max: 21 },
    setLocation,
  } as unknown as YMap;

  beforeEach(() => {
    vi.useFakeTimers();
    setLocation.mockClear();
    sheetHeight = 300;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('coalesces drag updates and applies the final height immediately', () => {
    const mapRef = createRef<YMap>();
    mapRef.current = map;
    render(
      <MapRefContext.Provider value={mapRef}>
        <div
          data-testid="mobile-results-sheet"
          ref={(node) => {
            if (node) {
              node.getBoundingClientRect = () => ({ height: sheetHeight }) as DOMRect;
            }
          }}
        />
        <MobileResultsViewportSync open snapPoint={0.4} />
      </MapRefContext.Provider>,
    );
    setLocation.mockClear();

    sheetHeight = 340;
    notifyResultsSheetResize(false);
    notifyResultsSheetResize(false);
    notifyResultsSheetResize(false);
    vi.advanceTimersByTime(47);
    expect(setLocation).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(setLocation).toHaveBeenCalledOnce();

    sheetHeight = 360;
    notifyResultsSheetResize(true);
    expect(setLocation).toHaveBeenCalledTimes(2);
  });
});
