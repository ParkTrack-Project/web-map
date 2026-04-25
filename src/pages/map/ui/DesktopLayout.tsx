// Desktop layout: top-toolbar (FiltersToolbar) + map area (MapCanvas + Legend
// + ZoneCard от Plan 02 как overlay). RESP-03 partial — CSS @media gate
// (`hidden lg:flex`), полный dvh / visualViewport polish — Phase 5.
//
// Plan 02 wiring сохранён: <ZoneCard/> рендерится внутри этого layout'а,
// а не на уровне MapPage — карточка attached к relative-контейнеру (`flex-1
// overflow-hidden`), не к viewport.
import { lazy, Suspense } from 'react';
import { MapErrorBoundary } from '@/app/errors';
import { MapSkeleton } from '@/widgets/map-canvas/ui/MapSkeleton';
import { FiltersToolbar } from '@/widgets/filters-bar';
import { Legend } from '@/widgets/legend';
import { ZoneCard } from '@/widgets/zone-card';

const MapCanvas = lazy(() =>
  import('@/widgets/map-canvas/ui/MapCanvas').then((m) => ({ default: m.MapCanvas })),
);

export function DesktopLayout() {
  return (
    <div className="hidden h-screen w-screen flex-col lg:flex">
      <FiltersToolbar />
      <div className="relative flex-1 overflow-hidden">
        <MapErrorBoundary>
          <Suspense fallback={<MapSkeleton />}>
            <MapCanvas />
          </Suspense>
        </MapErrorBoundary>
        <Legend />
        {/* Plan 02 desktop card overlay — внутри relative-контейнера */}
        <ZoneCard />
      </div>
    </div>
  );
}
