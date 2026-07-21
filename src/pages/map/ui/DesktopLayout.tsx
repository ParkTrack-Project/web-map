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
import type { YMap as YMapInstance } from '@yandex/ymaps3-types';
import { MapErrorBoundary } from '@/app/errors';
import { MapSkeleton } from '@/widgets/map-canvas/ui/MapSkeleton';
import { MapRefContext } from '@/widgets/map-canvas';
import { DesktopFiltersPopover } from '@/widgets/filters-bar';
import { ZoneCard } from '@/widgets/zone-card';
import { TimeSelectorPopover } from '@/widgets/time-selector';
import { DesktopSearchBar, DestPromptBanner } from '@/widgets/search-bar';
import { WTPCTAButton } from '@/widgets/wtp-cta';
// Phase 4 Plan 03: ResultsPanel — overlay LEFT side, not collide с TimeSelector top-4 cluster.
import { DesktopResultsPanel } from '@/widgets/results-panel';
// Phase 4 Plan 04 / ROUTE-04: FitToRouteButton — bottom-right map area, gates сам себя по ?route.
import { FitToRouteButton } from '@/widgets/route-preview-summary';
import { AccountMenu } from '@/widgets/account-menu';

const MapCanvas = lazy(() =>
  import('@/widgets/map-canvas/ui/MapCanvas').then((m) => ({ default: m.MapCanvas })),
);

export function DesktopLayout() {
  const mapRef = useRef<YMapInstance | null>(null);
  // 2026-05-26: searchAnchorRef + handleManualEntry удалены — кнопку «Указать
  // вручную» из PreFlightDialog убрали, фокусить инпут больше неоткуда.

  return (
    <MapRefContext.Provider value={mapRef}>
      <div className="hidden h-dvh w-screen flex-col lg:flex">
        <div className="relative flex-1 overflow-hidden">
          <MapErrorBoundary>
            <Suspense fallback={<MapSkeleton />}>
              <MapCanvas mapRef={mapRef} />
            </Suspense>
          </MapErrorBoundary>
          {/* Phase 4 / CO-01: единый flex-row для TimeSelector + WTP + Search + Filters.
            Flex gap разводит элементы по фактической ширине (нет наезда).
            DesktopFiltersPopover заменил горизонтальный FiltersToolbar — освобождает
            ~50px vertical space карты, единый pattern с mobile FiltersFAB. */}
          <div className="absolute top-4 left-4 z-30 flex items-start gap-2">
            <TimeSelectorPopover />
            <WTPCTAButton />
            <DesktopSearchBar />
            <DesktopFiltersPopover />
          </div>
          {/* Phase 4 / CO-03: DestPromptBanner — ниже flex-row */}
          <div className="absolute top-16 left-4 z-30 max-w-[480px]">
            <DestPromptBanner />
          </div>
          {/* Phase 4 Plan 03: ResultsPanel — z-20 overlay LEFT side; ZoneCard z-30 RIGHT side. */}
          <DesktopResultsPanel />
          <ZoneCard />
          {/* Phase 4 Plan 04: FitToRouteButton сам gates рендер по ?route */}
          <FitToRouteButton />
          <AccountMenu placement="desktop" />
        </div>
      </div>
    </MapRefContext.Provider>
  );
}
