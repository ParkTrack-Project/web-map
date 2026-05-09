import { describe, it, expect } from 'vitest';
import {
  buildYandexNavigatorDeeplink,
  buildYandexMapsWebUrl,
  buildGoogleMapsUrl,
  isValidCoords,
} from './builders';

describe('Phase 4 deeplink builders (D-32..D-36 / ROUTE-07)', () => {
  const from: [number, number] = [59.93863, 30.31413];
  const to: [number, number] = [59.95598, 30.30943];

  it('buildYandexNavigatorDeeplink (D-33 / ROUTE-07)', () => {
    expect(buildYandexNavigatorDeeplink({ from, to })).toBe(
      'yandexnavi://build_route_on_map?lat_to=59.95598&lon_to=30.30943&lat_from=59.93863&lon_from=30.31413',
    );
  });

  it('buildYandexMapsWebUrl (D-33 fallback)', () => {
    expect(buildYandexMapsWebUrl({ from, to })).toBe(
      'https://yandex.ru/maps/?rtext=59.93863,30.31413~59.95598,30.30943&rtt=auto',
    );
  });

  it('buildGoogleMapsUrl (D-32 menu option 3)', () => {
    expect(buildGoogleMapsUrl({ from, to })).toBe(
      'https://www.google.com/maps/dir/?api=1&origin=59.93863,30.31413&destination=59.95598,30.30943&travelmode=driving',
    );
  });
});

describe('isValidCoords (D-34 — guard перед сборкой URL)', () => {
  it('valid lat/lon', () => {
    expect(isValidCoords([59.95598, 30.30943])).toBe(true);
  });
  it('lat > 90 fails', () => {
    expect(isValidCoords([91.0, 30.0])).toBe(false);
  });
  it('lat < -90 fails', () => {
    expect(isValidCoords([-91.0, 30.0])).toBe(false);
  });
  it('lon > 180 fails', () => {
    expect(isValidCoords([59.0, 181.0])).toBe(false);
  });
  it('lon < -180 fails', () => {
    expect(isValidCoords([59.0, -181.0])).toBe(false);
  });
  it('NaN fails', () => {
    expect(isValidCoords([NaN, 30.0])).toBe(false);
  });
  it('Infinity fails', () => {
    expect(isValidCoords([Infinity, 30.0])).toBe(false);
  });
  it('null fails', () => {
    expect(isValidCoords(null)).toBe(false);
  });
});
