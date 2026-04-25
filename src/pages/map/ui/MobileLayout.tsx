// Mobile layout: full-screen map + FiltersFAB + MobileFiltersDrawer (vaul) +
// Legend + MobileZoneCard (Plan 02 vaul + CARD-07 mobile pan).
// CSS @media gate (`flex lg:hidden`); полный dvh / visualViewport polish — Phase 5.
//
// Plan 02 wiring сохранён: <MobileZoneCard/> рендерится внутри этого layout'а,
// MapRefContext доступен через MapCanvas (Provider в widgets/map-canvas).
import { lazy, Suspense, useState } from 'react';
import { MapErrorBoundary } from '@/app/errors';
import { MapSkeleton } from '@/widgets/map-canvas/ui/MapSkeleton';
import { FiltersFAB, MobileFiltersDrawer } from '@/widgets/filters-bar';
import { Legend } from '@/widgets/legend';
import { MobileZoneCard } from '@/widgets/zone-card';

const MapCanvas = lazy(() =>
  import('@/widgets/map-canvas/ui/MapCanvas').then((m) => ({ default: m.MapCanvas })),
);

export function MobileLayout() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  return (
    <div className="relative flex h-screen w-screen flex-col lg:hidden">
      <div className="relative flex-1 overflow-hidden">
        <MapErrorBoundary>
          <Suspense fallback={<MapSkeleton />}>
            <MapCanvas />
          </Suspense>
        </MapErrorBoundary>
        <FiltersFAB onClick={() => setFiltersOpen(true)} />
        <Legend />
      </div>
      <MobileFiltersDrawer open={filtersOpen} onOpenChange={setFiltersOpen} />
      {/* Plan 02 mobile vaul + CARD-07 pan */}
      <MobileZoneCard />
    </div>
  );
}
