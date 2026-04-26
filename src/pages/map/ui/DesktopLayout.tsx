// Desktop layout: top FiltersToolbar + map area (MapCanvas + Legend +
// floating TimeSelectorPopover в top-4 left-4 + ZoneCard overlay).
// RESP-03 partial — CSS @media gate (`hidden lg:flex`).
//
// Phase 3 Plan 04 / D-01 — UI iteration: TimeSelector переехал из top-strip
// в floating popover (releases ~120px vertical space карты). Floating pill
// в top-4 left-4 — зеркало FiltersFAB справа на mobile.
//
// Phase 4 Plan 02 / CO-01: SearchBar (top-4 left-72) и WTPCTAButton
// (top-4 left-32) образуют единую горизонтальную строку поверх карты вместе
// с TimeSelectorPopover (top-4 left-4). Mental model «когда → где → куда».
// CO-03: DestPromptBanner монтируется ниже search input, появляется только
// при ?dest && !?from (никакого UI «всегда видим»).
import { lazy, Suspense, useRef } from 'react';
import { MapErrorBoundary } from '@/app/errors';
import { MapSkeleton } from '@/widgets/map-canvas/ui/MapSkeleton';
import { FiltersToolbar } from '@/widgets/filters-bar';
import { Legend } from '@/widgets/legend';
import { ZoneCard } from '@/widgets/zone-card';
import { TimeSelectorPopover } from '@/widgets/time-selector';
import { DesktopSearchBar, DestPromptBanner } from '@/widgets/search-bar';
import { WTPCTAButton } from '@/widgets/wtp-cta';

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
    <div className="hidden h-screen w-screen flex-col lg:flex">
      <FiltersToolbar />
      <div className="relative flex-1 overflow-hidden">
        <MapErrorBoundary>
          <Suspense fallback={<MapSkeleton />}>
            <MapCanvas />
          </Suspense>
        </MapErrorBoundary>
        <TimeSelectorPopover />
        {/* Phase 4 / CO-01: WTPCTAButton (top-4 left-32 inside widget) */}
        <WTPCTAButton onManualEntry={handleManualEntry} />
        {/* Phase 4 / CO-01: SearchBar справа от WTP — top-4 left-72 (~18rem) */}
        <div ref={searchAnchorRef} className="absolute top-4 left-72 z-30">
          <DesktopSearchBar />
        </div>
        {/* Phase 4 / CO-03: DestPromptBanner — ниже search input */}
        <div className="absolute top-16 left-72 z-30 max-w-[480px]">
          <DestPromptBanner />
        </div>
        <Legend />
        <ZoneCard />
      </div>
    </div>
  );
}
