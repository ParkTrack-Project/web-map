// Phase 4 / ROUTE-03 / D-29:
import { memo, type ComponentType, type ReactNode } from 'react';
import { Locate, Target } from 'lucide-react';
import {
  YMapMarker as YMapMarkerRaw,
  YMapFeatureDataSource as YMapFeatureDataSourceRaw,
  YMapLayer as YMapLayerRaw,
} from '@/shared/lib/ymaps';
import { useRouteByIdQuery } from '@/entities/zone';
import { zoneCentroid } from '@/shared/lib/geo';
import { MAP_Z } from '@/shared/config';
import { useRouteId, useRouteSelSync } from '@/widgets/route-preview-summary';

type YMapMarkerProps = {
  coordinates: [number, number];
  zIndex?: number;
  source?: string;
  children?: ReactNode;
};

type YMapFeatureDataSourceProps = {
  id: string;
};

type YMapLayerProps = {
  source: string;
  type: string;
  zIndex?: number;
};

const YMapMarker = YMapMarkerRaw as unknown as ComponentType<YMapMarkerProps>;

const YMapFeatureDataSource =
  YMapFeatureDataSourceRaw as unknown as ComponentType<YMapFeatureDataSourceProps>;

const YMapLayer = YMapLayerRaw as unknown as ComponentType<YMapLayerProps>;

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
      {/* Точки маршрута — каждая в СВОЁМ marker-слое поверх дефолтного
          features-слоя Яндекса (там встроенная парковка) и поверх слоя кружков
          кластеров. Старт ниже конца (routeStart < routeEnd). Иначе (в дефолтном
          слое) их перекрывали бы и парковка Яндекса, и кружки групп. */}
      <YMapFeatureDataSource id="ptk-route-start" />
      <YMapLayer source="ptk-route-start" type="markers" zIndex={MAP_Z.routeStart} />
      <YMapFeatureDataSource id="ptk-route-end" />
      <YMapLayer source="ptk-route-end" type="markers" zIndex={MAP_Z.routeEnd} />

      {/* Старт (точка пользователя). */}
      <YMapMarker source="ptk-route-start" coordinates={originLngLat} zIndex={MAP_Z.routeStart}>
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-white shadow-md">
          <Locate size={14} aria-hidden />
        </div>
      </YMapMarker>

      {/* Конец маршрута — парковка назначения. На САМОМ верхнем слое (routeEnd)
          и отцентрирован на центроиде парковки: YMapMarker по умолчанию ставит
          в точку левый-верхний угол элемента, поэтому translate(-50%,-50%) через
          нулевой wrapper — как у кружков групп и бейджей зон. */}
      <YMapMarker source="ptk-route-end" coordinates={zoneCenter} zIndex={MAP_Z.routeEnd}>
        <div style={{ position: 'relative', width: 0, height: 0 }}>
          <div
            className="absolute flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-white shadow-md"
            style={{ left: 0, top: 0, transform: 'translate(-50%, -50%)' }}
          >
            <Target size={14} aria-hidden />
          </div>
        </div>
      </YMapMarker>
    </>
  );
}

export const RoutePreviewLayer = memo(RoutePreviewLayerInner);