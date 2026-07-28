import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
  type Ref,
  type RefObject,
} from 'react';
import type { YMap as YMapInstance } from '@yandex/ymaps3-types';
import { ITMO_CENTER, DEFAULT_ZOOM, CLUSTER_ZOOM_STEP } from '@/shared/config';
import { centerFromBbox, bboxFromCenterZoom, roundBbox5 } from '@/shared/lib/geo';
import {
  YMap as YMapRaw,
  YMapDefaultSchemeLayer as YMapDefaultSchemeLayerRaw,
  YMapDefaultFeaturesLayer as YMapDefaultFeaturesLayerRaw,
  YMapListener as YMapListenerRaw,
  YMapControls as YMapControlsRaw,
  YMapZoomControl as YMapZoomControlRaw,
  YMapGeolocationControl as YMapGeolocationControlRaw,
  YMapRotateTiltControl as YMapRotateTiltControlRaw,
  useDefault,
} from '@/shared/lib/ymaps';
import { useBboxTracking } from '../model/useBboxTracking';
import { useZoneClusters } from '../model/useZoneClusters';
import { ZoneLayer } from './ZoneLayer';
import { ParallelZoneLayer } from './ParallelZoneLayer';
import { ZoneBadgesLayer } from './ZoneBadgesLayer';
import { ZoneClusterLayer } from './ZoneClusterLayer';
import { ZoneStateOverlay } from './ZoneStateOverlay';
import { RoutePreviewLayer } from './RoutePreviewLayer';
import { DestinationMarkerLayer } from './DestinationMarkerLayer';
import { MapGestureLayer } from './MapGestureLayer';
import { ModeTransitionOverlay } from '@/widgets/mode-transition-overlay';
import { usePreferences } from '@/features/preferences';

type Point = [number, number];

interface MapLocation {
  center: Point;
  zoom: number;
}

interface MapCamera {
  tilt?: number;
  azimuth?: number;
  duration?: number;
}

interface YMapUpdateEvent {
  location: {
    zoom: number;
    bounds: [Point, Point];
  };
}

// reactify-обёртки из shared/lib/ymaps после динамической загрузки часто теряют
// нормальный JSX-тип. Поэтому приводим к ComponentType локально, в одном месте.
const YMap = YMapRaw as unknown as ComponentType<{
  ref?: Ref<YMapInstance | null>;
  location: MapLocation;
  camera?: MapCamera;
  behaviors?: string[];
  distribution?: boolean;
  mode?: string;
  theme?: 'light' | 'dark';
  children?: ReactNode;
}>;

const YMapDefaultSchemeLayer = YMapDefaultSchemeLayerRaw as unknown as ComponentType;
const YMapDefaultFeaturesLayer = YMapDefaultFeaturesLayerRaw as unknown as ComponentType;

const YMapListener = YMapListenerRaw as unknown as ComponentType<{
  onUpdate?: (event: YMapUpdateEvent) => void;
}>;

const YMapControls = YMapControlsRaw as unknown as ComponentType<{
  position?: string;
  children?: ReactNode;
}>;

const YMapZoomControl = YMapZoomControlRaw as unknown as ComponentType;
const YMapGeolocationControl = YMapGeolocationControlRaw as unknown as ComponentType;
const YMapRotateTiltControl = YMapRotateTiltControlRaw as unknown as ComponentType;

interface MapCanvasProps {
  mapRef: RefObject<YMapInstance | null>;
}

const MAP_BEHAVIORS = [
  'drag',
  'pinchZoom',
  'pinchRotate',
  'panTilt',
  'scrollZoom',
  'dblClick',
  'mouseRotate',
  'mouseTilt',
];

export function MapCanvas({ mapRef }: MapCanvasProps) {
  const { bbox, zoom: urlZoom, writeViewport, setBbox } = useBboxTracking();
  const zoom = urlZoom ?? DEFAULT_ZOOM;
  const theme = usePreferences((state) => state.theme);

  const [clusterZoom, setClusterZoom] = useState(zoom);
  const zoneClusters = useZoneClusters(clusterZoom);

  const rootRef = useRef<HTMLDivElement>(null);
  const isHidden = () => !rootRef.current || rootRef.current.offsetParent === null;

  const [initialLocationValue] = useState<MapLocation>(() => ({
    center: bbox ? centerFromBbox(bbox) : ITMO_CENTER,
    zoom,
  }));
  const initialLocation = useDefault(initialLocationValue);

  const initialCamera = useDefault<MapCamera>(
    {
      tilt: 0,
      azimuth: 0,
    },
    [],
  );

  useEffect(() => {
    if (isHidden()) return; // не сеем viewport до завершения responsive-layout
    if (bbox != null) return;

    const w = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;

    setBbox(
      roundBbox5(bboxFromCenterZoom(initialLocationValue.center, initialLocationValue.zoom, w, h)),
    );
    // mount-only seed; initialLocationValue стабилен (lazy-useState snapshot).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (
      mapRef.current as unknown as { update?: (value: { theme: 'light' | 'dark' }) => void }
    )?.update?.({
      theme,
    });
  }, [mapRef, theme]);

  return (
    <div ref={rootRef} className="map-controls-shifted-container relative h-full w-full">
      <YMap
        ref={mapRef}
        location={initialLocation}
        camera={initialCamera}
        behaviors={MAP_BEHAVIORS}
        mode="vector"
        distribution={false}
        theme={theme}
      >
        <YMapDefaultSchemeLayer />
        <YMapDefaultFeaturesLayer />

        <YMapListener
          onUpdate={({ location }) => {
            // Не записываем вырожденный viewport во время смены layout.
            if (isHidden()) return;

            // Живой дробный зум → квант CLUSTER_ZOOM_STEP для кластер-слоёв.
            // Функц. setState: тот же квант → возвращаем prev → React бейлит
            // ре-рендер (не каждый кадр анимации, только на границах шага).
            const qz = Math.round(location.zoom / CLUSTER_ZOOM_STEP) * CLUSTER_ZOOM_STEP;
            setClusterZoom((prev) => (prev === qz ? prev : qz));

            // location.bounds: [[lonSW, latSW], [lonNE, latNE]]
            const b = location.bounds;
            writeViewport(
              {
                southWest: b[0],
                northEast: b[1],
              },
              location.zoom,
            );
          }}
        />

        <YMapControls position="right">
          <YMapZoomControl />
          <YMapGeolocationControl />
          <YMapRotateTiltControl />
        </YMapControls>

        <MapGestureLayer />
        <ZoneLayer />
        <ParallelZoneLayer />
        <ZoneBadgesLayer zoom={clusterZoom} singletonIds={zoneClusters.singletonIds} />
        <ZoneClusterLayer zoom={clusterZoom} clusters={zoneClusters.clusters} />

        <RoutePreviewLayer />
        <DestinationMarkerLayer />
      </YMap>

      {/* Z_INDEX.zoneStateOverlay=20 — empty/error overlay / time drift overlay */}
      <ZoneStateOverlay />
      <ModeTransitionOverlay />
    </div>
  );
}
