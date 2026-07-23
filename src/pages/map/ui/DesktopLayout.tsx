import { lazy, Suspense, useRef } from 'react';
import type { YMap as YMapInstance } from '@yandex/ymaps3-types';
import { MapErrorBoundary } from '@/app/errors';
import { MapSkeleton } from '@/widgets/map-canvas/ui/MapSkeleton';
import { MapRefContext } from '@/widgets/map-canvas';
import { DesktopFiltersPopover } from '@/widgets/filters-bar';
import { ZoneCard } from '@/widgets/zone-card';
import { TimeSelectorPopover } from '@/widgets/time-selector';
import { DesktopSearchBar, DestPromptBanner } from '@/widgets/search-bar';
import { WTPCTAButton } from '@/widgets/wtp-cta';
import { DesktopResultsPanel } from '@/widgets/results-panel';
import { FitToRouteButton } from '@/widgets/route-preview-summary';
import { AccountMenu } from '@/widgets/account-menu';

const MapCanvas = lazy(() =>
  import('@/widgets/map-canvas/ui/MapCanvas').then((m) => ({ default: m.MapCanvas })),
);

export function DesktopLayout() {
  const mapRef = useRef<YMapInstance | null>(null);

  return (
    <MapRefContext.Provider value={mapRef}>
      <div className="hidden h-dvh w-screen flex-col lg:flex">
        <div className="relative flex-1 overflow-hidden">
          <MapErrorBoundary>
            <Suspense fallback={<MapSkeleton />}>
              <MapCanvas mapRef={mapRef} />
            </Suspense>
          </MapErrorBoundary>
          <div className="absolute top-4 left-4 z-30 flex items-start gap-2">
            <TimeSelectorPopover />
            <WTPCTAButton />
            <DesktopSearchBar />
            <DesktopFiltersPopover />
          </div>
          <div className="absolute top-16 left-4 z-30 max-w-[480px]">
            <DestPromptBanner />
          </div>
          <DesktopResultsPanel />
          <ZoneCard />
          <FitToRouteButton />
          <AccountMenu placement="desktop" />
        </div>
      </div>
    </MapRefContext.Provider>
  );
}
