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
// zoom трекаем локально через useState — Phase 2 Plan 03 поднимет в URL state
// (?z=N) через nuqs (URL-01). Здесь локальный state достаточен для conditional
// рендера бейджей.
import { useState } from 'react';
import {
  YMap,
  YMapDefaultSchemeLayer,
  YMapDefaultFeaturesLayer,
  YMapListener,
  YMapControls,
  YMapZoomControl,
} from '@/shared/lib/ymaps';
import { ITMO_CENTER, DEFAULT_ZOOM } from '@/shared/config';
import { useBboxTracking } from '../model/useBboxTracking';
import { ZoneLayer } from './ZoneLayer';
import { ParallelZoneLayer } from './ParallelZoneLayer';
import { ZoneBadgesLayer } from './ZoneBadgesLayer';

export function MapCanvas() {
  const { writeBbox } = useBboxTracking();
  const [zoom, setZoom] = useState<number>(DEFAULT_ZOOM);

  return (
    <div className="relative h-full w-full">
      <YMap location={{ center: ITMO_CENTER, zoom: DEFAULT_ZOOM }} mode="vector">
        <YMapDefaultSchemeLayer />
        {/* MAP-03: встроенный парковочный слой Yandex входит в default features layer */}
        <YMapDefaultFeaturesLayer />
        <YMapListener
          onUpdate={({ location }) => {
            // location.bounds: [[lonSW, latSW], [lonNE, latNE]]
            const b = location.bounds;
            writeBbox({
              southWest: b[0] as [number, number],
              northEast: b[1] as [number, number],
            });
            // Локальный zoom — для conditional рендера бейджей.
            // Phase 2 Plan 03 заменит на URL-state ?z=N через nuqs.
            setZoom(location.zoom);
          }}
        />
        <YMapControls position="right">
          <YMapZoomControl />
        </YMapControls>
        <ZoneLayer />
        <ParallelZoneLayer />
        <ZoneBadgesLayer zoom={zoom} />
      </YMap>
    </div>
  );
}
