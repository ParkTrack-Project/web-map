// Phase 4 / ROUTE-03 / D-29:
// - Subscribe useRouteByIdQuery (TanStack cache hydrated мутацией)
// - Только 2 маркера: origin (начало маршрута) и зона (конец маршрута).
//   Линия маршрута убрана — без реального provider polyline прямая вводила в заблуждение.
// - Origin marker: lucide Locate (emerald-600 bg)
// - Destination marker: lucide Target (amber-500 bg)
// - НЕ изменяет viewport (ROUTE-04 Fit-to-route — отдельный user-initiated)
// - key={routeId} для clean reconciliation
// - CO-05 / W-2: useRouteSelSync для reload-recovery (?route=N без ?sel → ?sel=route.selected_zone_id)
import { memo } from 'react';
import { Locate, Target } from 'lucide-react';
import { YMapMarker } from '@/shared/lib/ymaps';
import { useRouteByIdQuery } from '@/entities/zone';
import { zoneCentroid } from '@/shared/lib/geo';
import { useRouteId, useRouteSelSync } from '@/widgets/route-preview-summary';

// Phase 5 D-31 (NFR-03): React.memo — RoutePreview перерисовка при каждом
// MapCanvas rerender лишняя; route reference из useQuery стабилен между fetches.
function RoutePreviewLayerInner() {
  const { routeId } = useRouteId();
  const { data: route } = useRouteByIdQuery(routeId);
  // CO-05 / W-2: reverse sync route → ?sel для reload-recovery (?route=N без ?sel).
  useRouteSelSync();

  if (!routeId || !route) return null;

  const originLngLat: [number, number] = [route.origin.longitude, route.origin.latitude];
  // W-4 fix: zoneCentroid из @/shared/lib/geo принимает minimal { type:'Polygon'; coordinates } — cast не нужен.
  const zoneCenter = zoneCentroid(route.selected_candidate.geometry);

  return (
    <>
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

export const RoutePreviewLayer = memo(RoutePreviewLayerInner);
