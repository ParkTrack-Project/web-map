import { describe, expect, it } from 'vitest';
import type { Projection } from '@yandex/ymaps3-types';
import { mobileZoneMapCenter } from './mobile-zone-center';

const projection = {
  toWorldCoordinates: ([x, y]) => ({ x, y }),
  fromWorldCoordinates: ({ x, y }) => [x, y],
} satisfies Projection;

describe('mobileZoneMapCenter', () => {
  it('places the zone in the centre of the map visible above the sheet', () => {
    // At zoom 0 there are 128 pixels per world-coordinate unit. A 256px
    // bottom sheet hides half the viewport, so the map centre moves 1 unit.
    expect(mobileZoneMapCenter([30, 60], 0, 256, projection)).toEqual([30, 59]);
  });

  it('keeps the zone centre when sheet height is not available', () => {
    expect(mobileZoneMapCenter([30, 60], 16, 0, projection)).toEqual([30, 60]);
  });
});
