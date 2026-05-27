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
import { useEffect, useRef, useState, type ComponentType, type RefObject } from 'react';
import type { YMap as YMapInstance } from '@yandex/ymaps3-types';
import {
  YMap as YMapRaw,
  YMapDefaultSchemeLayer,
  YMapDefaultFeaturesLayer,
  YMapListener,
  YMapControls,
  YMapZoomControl,
  YMapGeolocationControl,
  YMapRotateTiltControl,
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
import { ITMO_CENTER, DEFAULT_ZOOM, CLUSTER_ZOOM_STEP } from '@/shared/config';
import { centerFromBbox, bboxFromCenterZoom, roundBbox5 } from '@/shared/lib/geo';
import { useBboxTracking } from '../model/useBboxTracking';
import { ZoneLayer } from './ZoneLayer';
import { ParallelZoneLayer } from './ParallelZoneLayer';
import { ZoneBadgesLayer } from './ZoneBadgesLayer';
import { ZoneClusterLayer } from './ZoneClusterLayer';
import { ZoneStateOverlay } from './ZoneStateOverlay';
import { RoutePreviewLayer } from './RoutePreviewLayer';
import { DestinationMarkerLayer } from './DestinationMarkerLayer';
import { ModeTransitionOverlay } from '@/widgets/mode-transition-overlay';

interface MapCanvasProps {
  mapRef: RefObject<YMapInstance | null>;
}

export function MapCanvas({ mapRef }: MapCanvasProps) {
  const { bbox, zoom: urlZoom, writeViewport, setBbox } = useBboxTracking();
  const zoom = urlZoom ?? DEFAULT_ZOOM;

  // Quick-fix 2026-05-17 (iter.2): кластеризация ведётся по ЖИВОМУ дробному
  // зуму карты, квантованному CLUSTER_ZOOM_STEP, а не по округлённому URL ?z —
  // иначе между целыми зумами нет промежуточного состояния (14→13 схлопывает
  // всё в одну ноду). setState только при смене кванта (Object.is bail-out в
  // ф-обновлении) → пересчёт на границах шага, а не каждый кадр зум-анимации.
  const [clusterZoom, setClusterZoom] = useState(zoom);

  // Fix 2026-05-16: MapPage монтирует ДВА MapCanvas (Desktop + Mobile, CSS-gated
  // hidden/flex). Скрытый инстанс (display:none) НЕ должен трогать viewport-URL —
  // иначе два инстанса пинг-понгуют ?bbox/?z и зоны мигают. offsetParent === null
  // ⇔ элемент (или предок) display:none → это надёжный признак «я невидимый».
  const rootRef = useRef<HTMLDivElement>(null);
  const isHidden = () => !rootRef.current || rootRef.current.offsetParent === null;

  // Regression-fix 2026-05-16 (Pitfall #1): initial location вычисляется РОВНО
  // ОДИН раз (lazy useState) из URL на mount и больше НИКОГДА не меняется.
  // Баг п.2-версии: center/zoom деривились из реактивного bbox, который сам
  // переписывается из YMapListener.onUpdate → объект location менялся каждый
  // кадр → reactify пушил setLocation по кругу: карту «дёргало», bbox прыгал,
  // зоны мигали, выпадашка поиска схлопывалась. Стабильная ссылка разрывает
  // цикл (как было с константой ITMO/DEFAULT_ZOOM в оригинале), но при этом
  // ?bbox/?z всё ещё применяются — читаются один раз при инициализации.
  //   ?bbox → центр = середина bbox; зум = ?z (или DEFAULT_ZOOM)
  //   только ?z → ITMO + этот зум; ничего → ITMO + DEFAULT_ZOOM
  const [initialLocationValue] = useState(() => ({
    center: bbox ? centerFromBbox(bbox) : ITMO_CENTER,
    zoom,
  }));
  const initialLocation = useDefault(initialLocationValue);

  // Quick-fix п.0: если ?bbox нет — один раз засеваем его из initial view,
  // чтобы зоны грузились без сдвига карты. setBbox только пишет URL-параметр,
  // карту НЕ двигает (location стабилен) → цикла нет.
  useEffect(() => {
    if (isHidden()) return; // только видимый инстанс сеет ?bbox
    if (bbox != null) return;
    const w = typeof window !== 'undefined' ? window.innerWidth : 1280;
    const h = typeof window !== 'undefined' ? window.innerHeight : 800;
    setBbox(
      roundBbox5(
        bboxFromCenterZoom(initialLocationValue.center, initialLocationValue.zoom, w, h),
      ),
    );
    // mount-only seed; initialLocationValue стабилен (lazy-useState snapshot).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={rootRef} className="map-controls-shifted-container relative h-full w-full">
      <YMap ref={mapRef} location={initialLocation} mode="vector">
        <YMapDefaultSchemeLayer />
        {/* MAP-03: встроенный парковочный слой Yandex входит в default features layer */}
        <YMapDefaultFeaturesLayer />
        <YMapListener
          onUpdate={({ location }) => {
            // Только видимый инстанс пишет viewport-URL (см. isHidden выше) —
            // иначе скрытый 0-размерный MapCanvas пинг-понгует ?bbox/?z.
            if (isHidden()) return;
            // Живой дробный зум → квант CLUSTER_ZOOM_STEP для кластер-слоёв.
            // Функц. setState: тот же квант → возвращаем prev → React бейлит
            // ре-рендер (не каждый кадр анимации, только на границах шага).
            const qz =
              Math.round(location.zoom / CLUSTER_ZOOM_STEP) * CLUSTER_ZOOM_STEP;
            setClusterZoom((prev) => (prev === qz ? prev : qz));
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
          {/* 2026-05-26: «Моё местоположение» как в Яндекс.Картах. Built-in
              control — запрашивает navigator.geolocation, центрирует карту,
              рисует синюю точку. ?from не трогает (это отдельный WTP-флоу). */}
          <YMapGeolocationControl />
          {/* 2026-05-26: встроенный компас Яндекса. Сам прячется при
              azimuth=0 + tilt=0; клик возвращает «север сверху, top-down»
              с плавной анимацией. Свой CompassButton больше не нужен. */}
          <YMapRotateTiltControl />
        </YMapControls>
        {/* Quick-fix 2026-05-17: бинарный порог зума убран. Все 4 слоя активны
            на ЛЮБОМ зуме и делят членство через useZoneClusters(clusterZoom):
            ZoneClusterLayer рисует кружки (zoneCount>1), а полигон/бейдж-слои —
            только зоны-одиночки. clusterZoom = живой дробный зум (квант
            CLUSTER_ZOOM_STEP) → точки сливаются постепенно, без скачка 14→13. */}
        <ZoneLayer zoom={clusterZoom} />
        <ParallelZoneLayer zoom={clusterZoom} />
        <ZoneBadgesLayer zoom={clusterZoom} />
        <ZoneClusterLayer zoom={clusterZoom} />
        {/* Phase 4 / ROUTE-03: route preview как изолированный children — не сбрасывает viewport */}
        <RoutePreviewLayer />
        {/* Quick-fix 2026-05-16: маркер выбранного адреса (?dest) */}
        <DestinationMarkerLayer />
      </YMap>
      {/* Z_INDEX.zoneStateOverlay=20 — empty/error overlay (Phase 2: D-21/D-22/UX-02/UX-04) */}
      <ZoneStateOverlay />
      {/* Z_INDEX.modeTransitionOverlay=30 — mode-switch skeleton (Phase 3 TIME-06) */}
      <ModeTransitionOverlay />
    </div>
  );
}
