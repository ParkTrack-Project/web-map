// Phase 4 / ROUTE-03 / D-29:
import {
  memo,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import { Locate, Target } from 'lucide-react';
import { toast } from 'sonner';
import {
  buildDrivingRoute,
  YMapFeature as YMapFeatureRaw,
  YMapMarker as YMapMarkerRaw,
  YMapFeatureDataSource as YMapFeatureDataSourceRaw,
  YMapLayer as YMapLayerRaw,
} from '@/shared/lib/ymaps';
import { useRouteByIdQuery } from '@/entities/zone';
import { zoneCentroid } from '@/shared/lib/geo';
import { MAP_Z } from '@/shared/config';
import {
  fitMapToCoordinates,
  routeViewportMargin,
  useRouteGeometry,
  useRouteId,
  useRouteSelSync,
} from '@/widgets/route-preview-summary';
import { useI18n } from '@/shared/lib/i18n';
import { MapRefContext } from '../model/map-ref-context';

type YMapFeatureProps = {
  id: string;
  geometry: { type: 'LineString'; coordinates: [number, number][] };
  style: { stroke: Array<{ color: string; width: number }> };
  source: string;
};

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
const YMapFeature = YMapFeatureRaw as unknown as ComponentType<YMapFeatureProps>;

const YMapFeatureDataSource =
  YMapFeatureDataSourceRaw as unknown as ComponentType<YMapFeatureDataSourceProps>;

const YMapLayer = YMapLayerRaw as unknown as ComponentType<YMapLayerProps>;

function RoutePreviewLayerInner() {
  const { t } = useI18n();
  const { routeId } = useRouteId();
  const { data: route } = useRouteByIdQuery(routeId);
  const mapRef = useContext(MapRefContext);
  const lastFittedRouteId = useRef<number | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const setRouteGeometry = useRouteGeometry((state) => state.setRouteGeometry);
  const clearRouteGeometry = useRouteGeometry((state) => state.clearRouteGeometry);

  useRouteSelSync();

  const endpoints = useMemo<[number, number][] | null>(() => {
    if (!route) return null;
    const geometry = route.selected_candidate.geometry;
    if (!geometry?.coordinates?.length) return null;
    return [[route.origin.longitude, route.origin.latitude], zoneCentroid(geometry)];
  }, [route]);

  useEffect(() => {
    if (!routeId || !endpoints) {
      setRouteCoordinates([]);
      clearRouteGeometry();
      return;
    }

    let cancelled = false;
    setRouteCoordinates([]);
    clearRouteGeometry();
    void buildDrivingRoute(endpoints)
      .then((coordinates) => {
        if (cancelled) return;
        setRouteCoordinates(coordinates);
        setRouteGeometry(routeId, coordinates);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.warn('[route-preview] driving route failed', error);
        toast.error(t('route.geometryError'));
      });

    return () => {
      cancelled = true;
      clearRouteGeometry(routeId);
    };
  }, [clearRouteGeometry, endpoints, routeId, setRouteGeometry, t]);

  useEffect(() => {
    if (
      !routeId ||
      routeCoordinates.length < 2 ||
      !mapRef?.current ||
      lastFittedRouteId.current === routeId
    )
      return;
    const map = mapRef.current;
    try {
      const isMobile = window.matchMedia('(max-width: 1023px)').matches;
      map.setMargin(routeViewportMargin(isMobile));
      fitMapToCoordinates(map, routeCoordinates);
      lastFittedRouteId.current = routeId;
    } catch (error) {
      console.warn('[route-preview] automatic fit failed', error);
    }

    return () => {
      map.setMargin([0, 0, 0, 0]);
    };
  }, [mapRef, routeCoordinates, routeId]);

  if (!routeId || !route) return null;

  const originLngLat = endpoints?.[0];

  const geometry = route.selected_candidate.geometry;

  if (!geometry?.coordinates?.length || !originLngLat) {
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
      <YMapFeatureDataSource id="ptk-route-line" />
      <YMapLayer source="ptk-route-line" type="features" zIndex={MAP_Z.routeLine} />
      <YMapFeatureDataSource id="ptk-route-end" />
      <YMapLayer source="ptk-route-end" type="markers" zIndex={MAP_Z.routeEnd} />

      {routeCoordinates.length > 1 && (
        <YMapFeature
          id={`route-line-${routeId}`}
          source="ptk-route-line"
          geometry={{ type: 'LineString', coordinates: routeCoordinates }}
          style={{ stroke: [{ color: '#16a34a', width: 5 }] }}
        />
      )}

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
