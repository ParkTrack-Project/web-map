// Phase 4 / ROUTE-03 / D-29:
// - Subscribe useRouteByIdQuery (TanStack cache hydrated мутацией)
// - polyline parse как GeoJSON LineString string; fallback straight line [origin, zone_centroid]
// - Origin marker: lucide Locate (emerald-600 bg)
// - Destination marker: lucide Target (amber-500 bg)
// - НЕ изменяет viewport (ROUTE-04 Fit-to-route — отдельный user-initiated)
// - key={routeId} для clean reconciliation
// - CO-05 / W-2: useRouteSelSync для reload-recovery (?route=N без ?sel → ?sel=route.selected_zone_id)
import { Locate, Target } from 'lucide-react';
import { YMapFeature, YMapMarker } from '@/shared/lib/ymaps';
import { useRouteByIdQuery } from '@/entities/zone';
import { zoneCentroid } from '@/shared/lib/geo';
import { useRouteId, useRouteSelSync } from '@/widgets/route-preview-summary';

export function RoutePreviewLayer() {
  const { routeId } = useRouteId();
  const { data: route } = useRouteByIdQuery(routeId);
  // CO-05 / W-2: reverse sync route → ?sel для reload-recovery (?route=N без ?sel).
  useRouteSelSync();

  if (!routeId || !route) return null;

  const originLngLat: [number, number] = [route.origin.longitude, route.origin.latitude];
  // W-4 fix: zoneCentroid из @/shared/lib/geo принимает minimal { type:'Polygon'; coordinates } — cast не нужен.
  const zoneCenter = zoneCentroid(route.selected_candidate.geometry);

  let lineCoordinates: [number, number][] = [originLngLat, zoneCenter];
  if (route.polyline) {
    try {
      const parsed = JSON.parse(route.polyline);
      if (Array.isArray(parsed?.coordinates)) {
        lineCoordinates = parsed.coordinates as [number, number][];
      }
    } catch {
      // fallback straight line — silent per D-29
    }
  }

  return (
    <>
      <YMapFeature
        key={`route-${routeId}`}
        geometry={{ type: 'LineString', coordinates: lineCoordinates }}
        style={{ stroke: [{ color: '#16a34a', width: 4, opacity: 0.85 }] }}
      />
      <YMapMarker coordinates={originLngLat}>
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md">
          <Locate size={14} aria-hidden />
        </div>
      </YMapMarker>
      <YMapMarker coordinates={zoneCenter}>
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-white shadow-md">
          <Target size={14} aria-hidden />
        </div>
      </YMapMarker>
    </>
  );
}
