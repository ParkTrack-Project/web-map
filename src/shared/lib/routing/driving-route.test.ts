import { describe, expect, it, vi } from 'vitest';
import { buildDrivingRoute, parseDrivingRouteResponse } from './driving-route';

const coordinates: [number, number][] = [
  [34.35689, 61.79006],
  [34.36, 61.788],
  [34.37018, 61.78553],
];

describe('driving route geometry', () => {
  it('parses a road-following GeoJSON line', () => {
    expect(
      parseDrivingRouteResponse({
        code: 'Ok',
        routes: [{ geometry: { type: 'LineString', coordinates } }],
      }),
    ).toEqual(coordinates);
  });

  it('requests a full driving route in longitude-latitude order', async () => {
    const fetcher = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          code: 'Ok',
          routes: [{ geometry: { type: 'LineString', coordinates } }],
        }),
      ),
    );
    await expect(
      buildDrivingRoute(
        [
          [34.35689, 61.79006],
          [34.37018, 61.78553],
        ],
        { baseUrl: 'https://routing.example/', fetcher },
      ),
    ).resolves.toEqual(coordinates);
    expect(fetcher).toHaveBeenCalledWith(
      'https://routing.example/route/v1/driving/34.35689,61.79006;34.37018,61.78553?overview=full&geometries=geojson',
      {},
    );
  });

  it('rejects an empty route response', () => {
    expect(() => parseDrivingRouteResponse({ code: 'NoRoute', routes: [] })).toThrow(
      'no driving route geometry',
    );
  });
});
