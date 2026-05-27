// Phase 4 / ROUTE-03 / D-29:
import { memo, type ComponentType, type ReactNode } from 'react';
import { Locate, Target } from 'lucide-react';
import { YMapMarker as YMapMarkerRaw } from '@/shared/lib/ymaps';
import { useRouteByIdQuery } from '@/entities/zone';
import { zoneCentroid } from '@/shared/lib/geo';
import { useRouteId, useRouteSelSync } from '@/widgets/route-preview-summary';

type YMapMarkerProps = {
  coordinates: [number, number];
  zIndex?: number;
  source?: string;
  children?: ReactNode;
};

const YMapMarker = YMapMarkerRaw as unknown as ComponentType<YMapMarkerProps>;

function RoutePreviewLayerInner() {
  const { routeId } = useRouteId();
  const { data: route } = useRouteByIdQuery(routeId);

  useRouteSelSync();

  if (!routeId || !route) return null;

  const originLngLat: [number, number] = [route.origin.longitude, route.origin.latitude];

  const geometry = route.selected_candidate.geometry;

  if (!geometry?.coordinates?.length) {
    console.warn('[route-preview] selected candidate geometry is missing', {
      routeId,
      selectedCandidate: route.selected_candidate,
    });
    return null;
  }

  const zoneCenter = zoneCentroid(geometry);

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