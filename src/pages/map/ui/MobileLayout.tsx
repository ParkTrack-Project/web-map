// Mobile layout: full-screen map + FiltersFAB + MobileFiltersDrawer (vaul) +
// Legend + MobileZoneCard (Plan 02 vaul + CARD-07 mobile pan).
// CSS @media gate (`flex lg:hidden`); полный dvh / visualViewport polish — Phase 5.
//
// Plan 02 wiring сохранён: <MobileZoneCard/> рендерится внутри этого layout'а,
// MapRefContext доступен через MapCanvas (Provider в widgets/map-canvas).
//
// Phase 3 Plan 04 / D-02 / I-1: TimeSelectorChip (top-16 right-4 z-30) +
// MobileTimeSelectorSheet. State lifted (как для FiltersFAB + MobileFiltersDrawer).
// FiltersFAB остаётся в top-4 right-4 z-30; chip — вертикально под ним.
import { lazy, Suspense, useState } from 'react';
import { MapErrorBoundary } from '@/app/errors';
import { MapSkeleton } from '@/widgets/map-canvas/ui/MapSkeleton';
import { FiltersFAB, MobileFiltersDrawer } from '@/widgets/filters-bar';
import { Legend } from '@/widgets/legend';
import { MobileZoneCard } from '@/widgets/zone-card';
import { TimeSelectorChip, MobileTimeSelectorSheet } from '@/widgets/time-selector';

const MapCanvas = lazy(() =>
  import('@/widgets/map-canvas/ui/MapCanvas').then((m) => ({ default: m.MapCanvas })),
);

export function MobileLayout() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [timeSheetOpen, setTimeSheetOpen] = useState(false);
  return (
    <div className="relative flex h-screen w-screen flex-col lg:hidden">
      <div className="relative flex-1 overflow-hidden">
        <MapErrorBoundary>
          <Suspense fallback={<MapSkeleton />}>
            <MapCanvas />
          </Suspense>
        </MapErrorBoundary>
        {/* I-1: FiltersFAB top-4 right-4 z-30; TimeSelectorChip top-16 right-4 z-30 — стек ПОД FAB */}
        <FiltersFAB onClick={() => setFiltersOpen(true)} />
        <TimeSelectorChip onClick={() => setTimeSheetOpen(true)} />
        <Legend />
      </div>
      <MobileFiltersDrawer open={filtersOpen} onOpenChange={setFiltersOpen} />
      <MobileTimeSelectorSheet open={timeSheetOpen} onOpenChange={setTimeSheetOpen} />
      {/* Plan 02 mobile vaul + CARD-07 pan */}
      <MobileZoneCard />
    </div>
  );
}
