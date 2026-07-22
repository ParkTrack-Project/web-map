// Phase 4 / ROUTE-04 / D-30:
// User-initiated fit-to-route. Bottom-right map area, z-25.
// Computes bbox охватывающий [origin, zone_centroid] → map.setLocation({ bounds, duration:400 }).
// Полилиния не учитывается в bbox (MVP — server возвращает polyline:null часто; straight line
// между origin↔zone хватает для viewport-fit).
import { useContext } from 'react';
import { Maximize2 } from 'lucide-react';
import { useRouteByIdQuery } from '@/entities/zone';
import { MapRefContext } from '@/widgets/map-canvas';
import { Z_INDEX } from '@/shared/config';
import { useRouteId } from '../model/useRouteId';
import { useI18n } from '@/shared/lib/i18n';
import { fitMapToRoute } from '../model/route-bounds';

export function FitToRouteButton() {
  const { t } = useI18n();
  const { routeId } = useRouteId();
  const { data: route } = useRouteByIdQuery(routeId);
  const mapRef = useContext(MapRefContext);

  if (!routeId || !route) return null;

  const handleFit = () => {
    if (!mapRef?.current) return;
    try {
      fitMapToRoute(mapRef.current, route);
    } catch (e) {
      console.warn('[fit-to-route] setLocation failed', e);
    }
  };

  return (
    <button
      type="button"
      onClick={handleFit}
      aria-label={t('route.fit')}
      style={{ zIndex: Z_INDEX.fitToRouteButton }}
      className="absolute right-4 bottom-20 flex h-11 w-11 items-center justify-center rounded-full bg-white text-zinc-700 shadow-md hover:bg-zinc-50"
      data-testid="fit-to-route-button"
    >
      <Maximize2 size={18} aria-hidden />
    </button>
  );
}
