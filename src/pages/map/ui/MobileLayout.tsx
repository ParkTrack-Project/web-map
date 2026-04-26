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
//
// Phase 4 Plan 02 / D-05 + D-09 + CO-04:
// - MobileSearchBar (top-2 left-2 right-20) — top-bar input
// - WTPMobileFAB (bottom-4 right-4 z-20) — скрывается при ?from || ?dest (CO-04)
// - DestPromptBanner — рендерится в top-bar когда ?dest && !?from (CO-03)
// FAB collision-prevention (D-50): WTPMobileFAB z-20 ниже FiltersFAB z-30.
import { lazy, Suspense, useState } from 'react';
import { MapErrorBoundary } from '@/app/errors';
import { MapSkeleton } from '@/widgets/map-canvas/ui/MapSkeleton';
import { FiltersFAB, MobileFiltersDrawer } from '@/widgets/filters-bar';
import { Legend } from '@/widgets/legend';
import { MobileZoneCard } from '@/widgets/zone-card';
import { TimeSelectorChip, MobileTimeSelectorSheet } from '@/widgets/time-selector';
import { MobileSearchBar, DestPromptBanner } from '@/widgets/search-bar';
import { WTPMobileFAB } from '@/widgets/wtp-cta';

const MapCanvas = lazy(() =>
  import('@/widgets/map-canvas/ui/MapCanvas').then((m) => ({ default: m.MapCanvas })),
);

export function MobileLayout() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [timeSheetOpen, setTimeSheetOpen] = useState(false);

  // D-12 «Указать вручную» → focus search-input.
  const handleManualEntry = () => {
    const input = document.querySelector<HTMLInputElement>('input[role="searchbox"]');
    input?.focus();
  };

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
        {/* Phase 4: top-bar SearchBar (left side, FABs справа не пересекаются — right-20) */}
        <MobileSearchBar />
        {/* Phase 4 / CO-03: DestPromptBanner ниже top-bar (top-14 чтобы под input) */}
        <div className="absolute top-14 right-20 left-2 z-30">
          <DestPromptBanner />
        </div>
        {/* Phase 4 / D-09 / CO-04: bottom-right FAB; auto-hide при results-active */}
        <WTPMobileFAB onManualEntry={handleManualEntry} />
      </div>
      <MobileFiltersDrawer open={filtersOpen} onOpenChange={setFiltersOpen} />
      <MobileTimeSelectorSheet open={timeSheetOpen} onOpenChange={setTimeSheetOpen} />
      {/* Plan 02 mobile vaul + CARD-07 pan */}
      <MobileZoneCard />
    </div>
  );
}
