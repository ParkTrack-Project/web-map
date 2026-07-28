import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import type { Projection, YMap } from '@yandex/ymaps3-types';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MapRefContext } from '@/widgets/map-canvas';
import { mobileZoneMapCenter } from '../model/mobile-zone-center';
import { MobileZoneCard } from './MobileZoneCard';

const zone = {
  zone_id: 7,
  is_active: true,
  geometry: {
    type: 'Polygon' as const,
    coordinates: [
      [
        [30, 60],
        [30, 60],
        [30, 60],
        [30, 60],
      ],
    ],
  },
};

vi.mock('@/features/select-zone', () => ({
  useSelectedZone: () => ({ selectedZoneId: 7, closeCard: vi.fn() }),
  useResultSelection: (selector: (state: { resultZoneIds: number[] }) => number[]) =>
    selector({ resultZoneIds: [7] }),
}));
vi.mock('@/features/select-time-mode', () => ({
  useTimeMode: () => ({ mode: { kind: 'now' } }),
}));
vi.mock('@/entities/zone', () => ({
  useZoneByIdQuery: () => ({ data: zone }),
}));
vi.mock('@/shared/lib/responsive', () => ({ useIsMobile: () => true }));
vi.mock('@/shared/lib/dom', () => ({ useVisualViewportHeight: () => 800 }));
vi.mock('@/shared/lib/i18n', () => ({
  useI18n: () => ({ t: (key: string) => key }),
}));
vi.mock('@/widgets/route-preview-summary', () => ({
  useRouteId: () => ({ clearRouteId: vi.fn() }),
}));
vi.mock('./ZoneCard', () => ({
  ZoneCardContent: () => <div>zone content</div>,
}));

describe('MobileZoneCard', () => {
  const setLocation = vi.fn();
  const projection = {
    toWorldCoordinates: ([x, y]) => ({ x, y }),
    fromWorldCoordinates: ({ x, y }) => [x, y],
  } satisfies Projection;
  const map = {
    projection,
    zoom: 0,
    setLocation,
  } as unknown as YMap;

  beforeEach(() => {
    vi.useFakeTimers();
    setLocation.mockClear();
    HTMLElement.prototype.setPointerCapture = vi.fn();
    HTMLElement.prototype.hasPointerCapture = vi.fn(() => true);
    HTMLElement.prototype.releasePointerCapture = vi.fn();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('lowers the card by its handle and keeps the selected zone centered above it', () => {
    const mapRef = createRef<YMap>();
    mapRef.current = map;
    render(
      <MapRefContext.Provider value={mapRef}>
        <MobileZoneCard onBackToResults={vi.fn()} />
      </MapRefContext.Provider>,
    );

    const card = screen.getByTestId('mobile-zone-card');
    card.getBoundingClientRect = () => ({ height: 400 }) as DOMRect;
    vi.advanceTimersByTime(320);
    setLocation.mockClear();

    const handle = screen.getByTestId('mobile-zone-card-drag-region');
    fireEvent.pointerDown(handle, { clientY: 100, pointerId: 1 });
    fireEvent.pointerMove(handle, { clientY: 200, pointerId: 1 });

    expect(card).toHaveStyle({ height: '300px' });
    expect(setLocation).toHaveBeenLastCalledWith({
      center: mobileZoneMapCenter([30, 60], 0, 300, projection),
      duration: 0,
    });
  });
});
