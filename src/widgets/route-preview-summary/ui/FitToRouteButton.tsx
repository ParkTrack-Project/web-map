// Phase 4 / ROUTE-04 / D-30:
// User-initiated fit-to-route. Bottom-right map area, z-25.
// Использует bbox дорожной геометрии Yandex Maps; пока геометрия загружается,
// безопасно подгоняет карту по двум конечным точкам.
import { useContext } from 'react';
import { Maximize2 } from 'lucide-react';
import { useRouteByIdQuery } from '@/entities/zone';
import { MapRefContext } from '@/widgets/map-canvas';
import { Z_INDEX } from '@/shared/config';
import { useRouteId } from '../model/useRouteId';
import { useI18n } from '@/shared/lib/i18n';
import { fitMapToCoordinates, fitMapToRoute } from '../model/route-bounds';
import { useRouteGeometry } from '../model/route-geometry.store';

export function FitToRouteButton() {
  const { t } = useI18n();
  const { routeId } = useRouteId();
  const { data: route } = useRouteByIdQuery(routeId);
  const mapRef = useContext(MapRefContext);
  const routeGeometry = useRouteGeometry();

  if (!routeId || !route) return null;

  const handleFit = () => {
    if (!mapRef?.current) return;
    try {
      if (routeGeometry.routeId === routeId && routeGeometry.coordinates.length > 1) {
        fitMapToCoordinates(mapRef.current, routeGeometry.coordinates);
      } else {
        fitMapToRoute(mapRef.current, route);
      }
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
      className="absolute right-4 bottom-20 flex h-11 w-11 items-center justify-center rounded-full bg-white text-zinc-700 shadow-md hover:bg-zinc-50 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
      data-testid="fit-to-route-button"
    >
      <Maximize2 size={18} aria-hidden />
    </button>
  );
}
