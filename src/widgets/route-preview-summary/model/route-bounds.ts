import type { YMap } from '@yandex/ymaps3-types';
import type { Route } from '@/entities/zone';
import { zoneCentroid } from '@/shared/lib/geo';

export function routeBounds(route: Route): [[number, number], [number, number]] {
  const [zoneLongitude, zoneLatitude] = zoneCentroid(route.selected_candidate.geometry);
  const originLongitude = route.origin.longitude;
  const originLatitude = route.origin.latitude;
  return [
    [Math.min(originLongitude, zoneLongitude), Math.min(originLatitude, zoneLatitude)],
    [Math.max(originLongitude, zoneLongitude), Math.max(originLatitude, zoneLatitude)],
  ];
}

export function fitMapToRoute(map: YMap, route: Route, duration = 400) {
  map.setLocation({ bounds: routeBounds(route), duration });
}

export function coordinateBounds(
  coordinates: readonly [number, number][],
): [[number, number], [number, number]] {
  const first = coordinates[0];
  if (!first) throw new Error('Cannot fit an empty route');

  let minLongitude = first[0];
  let maxLongitude = minLongitude;
  let minLatitude = first[1];
  let maxLatitude = minLatitude;
  for (const [longitude, latitude] of coordinates.slice(1)) {
    minLongitude = Math.min(minLongitude, longitude);
    maxLongitude = Math.max(maxLongitude, longitude);
    minLatitude = Math.min(minLatitude, latitude);
    maxLatitude = Math.max(maxLatitude, latitude);
  }
  return [
    [minLongitude, minLatitude],
    [maxLongitude, maxLatitude],
  ];
}

export function fitMapToCoordinates(
  map: YMap,
  coordinates: readonly [number, number][],
  duration = 400,
) {
  map.setLocation({ bounds: coordinateBounds(coordinates), duration });
}

/** Map margins keep the fitted route clear of the open result/card panels. */
export function routeViewportMargin(isMobile: boolean): [number, number, number, number] {
  return isMobile ? [72, 24, 380, 24] : [80, 420, 80, 420];
}
