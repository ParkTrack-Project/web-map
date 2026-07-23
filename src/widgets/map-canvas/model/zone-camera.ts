import type { LngLat, LngLatBounds, ReadonlyLngLat } from '@yandex/ymaps3-types';

export type ZoneCenterMode = 'always' | 'if-outside';

export function isPointInsideMapBounds(point: LngLat, bounds: LngLatBounds): boolean {
  const [[firstLon, firstLat], [secondLon, secondLat]] = bounds;
  const [lon, lat] = point;
  return (
    lon >= Math.min(firstLon, secondLon) &&
    lon <= Math.max(firstLon, secondLon) &&
    lat >= Math.min(firstLat, secondLat) &&
    lat <= Math.max(firstLat, secondLat)
  );
}

export function resolveZoneCameraCenter(
  zoneCenter: LngLat,
  currentCenter: ReadonlyLngLat,
  bounds: LngLatBounds,
  mode: ZoneCenterMode,
): LngLat {
  if (mode === 'if-outside' && isPointInsideMapBounds(zoneCenter, bounds)) {
    return [currentCenter[0], currentCenter[1]];
  }
  return zoneCenter;
}

export function shouldUpdateHoverCamera(
  isVisible: boolean,
  isSingleton: boolean,
  currentZoom: number,
  badgeMinZoom: number,
): boolean {
  return !isVisible || !isSingleton || currentZoom < badgeMinZoom;
}
