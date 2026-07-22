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

/** Map margins keep the fitted route clear of the open result/card panels. */
export function routeViewportMargin(isMobile: boolean): [number, number, number, number] {
  return isMobile ? [72, 24, 380, 24] : [80, 420, 80, 420];
}
