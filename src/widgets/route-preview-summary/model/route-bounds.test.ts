import { describe, expect, it, vi } from 'vitest';
import type { YMap } from '@yandex/ymaps3-types';
import type { Route } from '@/entities/zone';
import { fitMapToRoute, routeBounds, routeViewportMargin } from './route-bounds';

const route = {
  origin: { latitude: 59.95, longitude: 30.1 },
  selected_candidate: {
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [30.3, 60.1],
          [30.5, 60.1],
          [30.5, 60.3],
          [30.3, 60.3],
          [30.3, 60.1],
        ],
      ],
    },
  },
} as Route;

describe('route bounds', () => {
  it('contains both the user origin and parking centroid', () => {
    expect(routeBounds(route)).toEqual([
      [30.1, 59.95],
      [30.4, 60.2],
    ]);
  });

  it('fits the map to the entire route', () => {
    const setLocation = vi.fn();
    fitMapToRoute({ setLocation } as unknown as YMap, route);
    expect(setLocation).toHaveBeenCalledWith({ bounds: routeBounds(route), duration: 400 });
  });

  it('reserves panel space when fitting the route', () => {
    expect(routeViewportMargin(true)).toEqual([72, 24, 380, 24]);
    expect(routeViewportMargin(false)).toEqual([80, 420, 80, 420]);
  });
});
