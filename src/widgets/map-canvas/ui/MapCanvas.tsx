// MAP-01/02/03: единственный владелец YMap-ref. Все children используют reactify-обёртки
// из @/shared/lib/ymaps. Pitfall #1: location устанавливается ТОЛЬКО при mount —
// если изменить location-проп позже, ymaps3 имеет тенденцию переписывать карту;
// для управления извне нужен ref + явный imperative-вызов или reactify.useDefault.
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

export function MapCanvas() {
  const { writeBbox } = useBboxTracking();

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
          }}
        />
        <YMapControls position="right">
          <YMapZoomControl />
        </YMapControls>
      </YMap>
      <ZoneLayer />
    </div>
  );
}
