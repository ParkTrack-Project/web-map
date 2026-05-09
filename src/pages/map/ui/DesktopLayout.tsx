// Desktop layout: top FiltersToolbar + map area (MapCanvas + Legend +
// floating TimeSelectorPopover в top-4 left-4 + ZoneCard overlay).
// RESP-03 partial — CSS @media gate (`hidden lg:flex`).
//
// Phase 3 Plan 04 / D-01 — UI iteration: TimeSelector переехал из top-strip
// в floating popover (releases ~120px vertical space карты). Floating pill
// в top-4 left-4 — зеркало FiltersFAB справа на mobile.
//
// Phase 4 Plan 02 / CO-01: SearchBar, WTPCTAButton и TimeSelectorPopover
// образуют единую горизонтальную строку поверх карты — обёрнуты в один
// flex-row контейнер top-4 left-4 z-30 с gap-2. Flex auto-resolves widths
// чтобы виджеты не наезжали друг на друга при динамическом тексте
// (TimeSelector «Прогноз на 17:00 МСК», SearchBar focus → 480px).
// Mental model «когда → где → куда».
// CO-03: DestPromptBanner монтируется ниже flex-row, появляется только
// при ?dest && !?from (никакого UI «всегда видим»).
import { lazy, Suspense, useRef } from 'react';
import { MapErrorBoundary } from '@/app/errors';
import { MapSkeleton } from '@/widgets/map-canvas/ui/MapSkeleton';
import { DesktopFiltersPopover } from '@/widgets/filters-bar';
import { Legend } from '@/widgets/legend';
import { ZoneCard } from '@/widgets/zone-card';
import { TimeSelectorPopover } from '@/widgets/time-selector';
import { DesktopSearchBar, DestPromptBanner } from '@/widgets/search-bar';
import { WTPCTAButton } from '@/widgets/wtp-cta';
// Phase 4 Plan 03: ResultsPanel — overlay LEFT side, not collide с TimeSelector top-4 cluster.
import { DesktopResultsPanel } from '@/widgets/results-panel';
// Phase 4 Plan 04 / ROUTE-04: FitToRouteButton — bottom-right map area, gates сам себя по ?route.
import { FitToRouteButton } from '@/widgets/route-preview-summary';

const MapCanvas = lazy(() =>
  import('@/widgets/map-canvas/ui/MapCanvas').then((m) => ({ default: m.MapCanvas })),
);

export function DesktopLayout() {
  // D-12 «Указать вручную» → focus search-input (передаётся через WTPCTAButton.onManualEntry).
  const searchAnchorRef = useRef<HTMLDivElement>(null);
  const handleManualEntry = () => {
    const input =
      searchAnchorRef.current?.querySelector<HTMLInputElement>('input[role="searchbox"]');
    input?.focus();
  };

  return (
    <div className="hidden h-dvh w-screen flex-col lg:flex">
      <div className="relative flex-1 overflow-hidden">
        <MapErrorBoundary>
          <Suspense fallback={<MapSkeleton />}>
            <MapCanvas />
          </Suspense>
        </MapErrorBoundary>
        {/* Phase 4 / CO-01: единый flex-row для TimeSelector + WTP + Search + Filters.
            Flex gap разводит элементы по фактической ширине (нет наезда).
            DesktopFiltersPopover заменил горизонтальный FiltersToolbar — освобождает
            ~50px vertical space карты, единый pattern с mobile FiltersFAB. */}
        <div className="absolute top-4 left-4 z-30 flex items-start gap-2">
          <TimeSelectorPopover />
          <WTPCTAButton onManualEntry={handleManualEntry} />
          <div ref={searchAnchorRef}>
            <DesktopSearchBar />
          </div>
          <DesktopFiltersPopover />
        </div>
        {/* Phase 4 / CO-03: DestPromptBanner — ниже flex-row */}
        <div className="absolute top-16 left-4 z-30 max-w-[480px]">
          <DestPromptBanner />
        </div>
        <Legend />
        {/* Phase 4 Plan 03: ResultsPanel — z-20 overlay LEFT side; ZoneCard z-30 RIGHT side. */}
        <DesktopResultsPanel />
        <ZoneCard />
        {/* Phase 4 Plan 04: FitToRouteButton сам gates рендер по ?route */}
        <FitToRouteButton />
      </div>
    </div>
  );
}
