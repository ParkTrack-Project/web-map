import type { LngLat, Projection } from '@yandex/ymaps3-types';

/**
 * Moves the map centre below the zone so the zone itself appears in the centre
 * of the map area that remains visible above a mobile bottom sheet.
 */
export function mobileZoneMapCenter(
  zoneCenter: LngLat,
  zoom: number,
  sheetHeight: number,
  projection: Projection,
): LngLat {
  if (!Number.isFinite(zoom) || !Number.isFinite(sheetHeight) || sheetHeight <= 0) {
    return zoneCenter;
  }

  const world = projection.toWorldCoordinates(zoneCenter);
  // World coordinates span [-1, 1], while the pixel world spans
  // 2 ** (zoom + 8), hence 2 ** (zoom + 7) pixels per world unit.
  const worldOffset = sheetHeight / 2 / 2 ** (zoom + 7);
  return projection.fromWorldCoordinates({ x: world.x, y: world.y - worldOffset });
}
