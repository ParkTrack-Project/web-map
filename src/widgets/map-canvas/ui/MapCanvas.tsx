// MAP-01/02/03: единственный владелец YMap-ref. Все children используют reactify-обёртки
// из @/shared/lib/ymaps. Pitfall #1: location устанавливается ТОЛЬКО при mount —
// если изменить location-проп позже, ymaps3 имеет тенденцию переписывать карту;
// для управления извне нужен ref + явный imperative-вызов или reactify.useDefault.
//
// Phase 2 Plan 01 Task 3: добавлены 3 zone-layer'а:
//   - ZoneLayer (standard-полигоны)
//   - ParallelZoneLayer (LineString для parallel — D-04)
//   - ZoneBadgesLayer (free_count pills, скрыты при zoom < ZONE_BADGE_MIN_ZOOM=14)
//
// Phase 2 Plan 02 Task 3: экспонируем ref на YMap через MapRefContext
// (вынесен в model/map-ref-context.ts из-за react-refresh/only-export-components).
// MobileZoneCard использует map.setLocation({center, duration:300}) для CARD-07
// mobile pan -20% viewport (D-07 mobile half).
//
// Phase 2 Plan 03 (URL-01): zoom поднят в URL-state ?z=N через nuqs внутри
// useBboxTracking. Локальный useState удалён; ZoneBadgesLayer читает зум из
// единого источника (URL или DEFAULT_ZOOM как fallback при пустом URL).
import { useRef, type ComponentType } from 'react';
import type { YMap as YMapInstance } from '@yandex/ymaps3-types';
import {
  YMap as YMapRaw,
  YMapDefaultSchemeLayer,
  YMapDefaultFeaturesLayer,
  YMapListener,
  YMapControls,
  YMapZoomControl,
  useDefault,
} from '@/shared/lib/ymaps';

// reactify-обёртка YMap теряет тип props после union с ProviderProps<unknown>
// при exactOptionalPropertyTypes — runtime shape совпадает с reactify.module(ymaps3).
// Cast через unknown чтобы TS принял ref+location+mode props.
const YMap = YMapRaw as unknown as ComponentType<{
  ref?: React.Ref<YMapInstance | null>;
  location: { center: [number, number]; zoom: number };
  mode?: string;
  children?: React.ReactNode;
}>;
import { ITMO_CENTER, DEFAULT_ZOOM } from '@/shared/config';
import { useBboxTracking } from '../model/useBboxTracking';
import { MapRefContext } from '../model/map-ref-context';
import { ZoneLayer } from './ZoneLayer';
import { ParallelZoneLayer } from './ParallelZoneLayer';
import { ZoneBadgesLayer } from './ZoneBadgesLayer';
import { ZoneStateOverlay } from './ZoneStateOverlay';
import { RoutePreviewLayer } from './RoutePreviewLayer';
import { ModeTransitionOverlay } from '@/widgets/mode-transition-overlay';

export function MapCanvas() {
  const { zoom: urlZoom, writeViewport } = useBboxTracking();
  const zoom = urlZoom ?? DEFAULT_ZOOM;
  const mapRef = useRef<YMapInstance | null>(null);
  // Pitfall #1 fix: location обёрнут в reactify.useDefault — делает prop uncontrolled
  // (initial-value-only). Без этого React при каждом ре-рендере MapCanvas пересоздаёт
  // объектный литерал, reactify считает prop изменённым и pushes setLocation(ITMO),
  // выбрасывая пользователя обратно в исходную точку при первом же пане.
  const initialLocation = useDefault({ center: ITMO_CENTER, zoom: DEFAULT_ZOOM });

  return (
    <MapRefContext.Provider value={mapRef}>
      {/* Phase 5 D-05 (RESP-07): класс `map-controls-shifted-container` берёт
          ymaps3 controls (рендерятся внутри Yandex DOM подграфа с
          class*=ymaps3-controls) и сдвигает их вверх через CSS-переменную
          --bottom-sheet-offset, выставляемую MobileLayout useEffect'ом.
          YMapControls не принимает className prop (typed reactify обёртка),
          поэтому селектор-fallback выбран явно. */}
      <div className="map-controls-shifted-container relative h-full w-full">
        <YMap ref={mapRef} location={initialLocation} mode="vector">
          <YMapDefaultSchemeLayer />
          {/* MAP-03: встроенный парковочный слой Yandex входит в default features layer */}
          <YMapDefaultFeaturesLayer />
          <YMapListener
            onUpdate={({ location }) => {
              // location.bounds: [[lonSW, latSW], [lonNE, latNE]]
              const b = location.bounds;
              writeViewport(
                {
                  southWest: b[0] as [number, number],
                  northEast: b[1] as [number, number],
                },
                location.zoom,
              );
            }}
          />
          <YMapControls position="right">
            <YMapZoomControl />
          </YMapControls>
          <ZoneLayer />
          <ParallelZoneLayer />
          <ZoneBadgesLayer zoom={zoom} />
          {/* Phase 4 / ROUTE-03: route preview как изолированный children — не сбрасывает viewport */}
          <RoutePreviewLayer />
        </YMap>
        {/* Z_INDEX.zoneStateOverlay=20 — empty/error overlay (Phase 2: D-21/D-22/UX-02/UX-04) */}
        <ZoneStateOverlay />
        {/* Z_INDEX.modeTransitionOverlay=30 — mode-switch skeleton (Phase 3 TIME-06) */}
        <ModeTransitionOverlay />
      </div>
    </MapRefContext.Provider>
  );
}
