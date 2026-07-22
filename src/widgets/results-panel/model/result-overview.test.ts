import { describe, expect, it } from 'vitest';
import type { Projection } from '@yandex/ymaps3-types';
import { resultOverviewLocation } from './result-overview';

const projection = {
  toWorldCoordinates: ([x, y]) => ({ x, y }),
  fromWorldCoordinates: ({ x, y }) => [x, y],
} satisfies Projection;

describe('resultOverviewLocation', () => {
  it('centres all results in the visible part of the map', () => {
    const location = resultOverviewLocation(
      [
        [0, 0],
        [0.01, 0.02],
      ],
      projection,
      { width: 400, height: 800 },
      [64, 20, 320, 20],
      1,
      20,
    );
    expect(location?.center[0]).toBeCloseTo(0.005);
    expect(location?.center[1]).toBeLessThan(0.01);
    expect(location?.zoom).toBeGreaterThan(1);
  });

  it('does not zoom out beyond the mobile overview limit', () => {
    const location = resultOverviewLocation(
      [
        [-1, -1],
        [1, 1],
      ],
      projection,
      { width: 320, height: 640 },
      [64, 20, 260, 20],
    );
    expect(location?.zoom).toBe(10.5);
  });

  it('does not zoom too close for a single result', () => {
    const location = resultOverviewLocation(
      [[0.1, 0.2]],
      projection,
      { width: 390, height: 844 },
      [64, 20, 340, 20],
    );
    expect(location?.zoom).toBe(15.5);
    expect(location?.center[1]).toBeLessThan(0.2);
  });
});
