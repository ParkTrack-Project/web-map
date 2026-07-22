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
// - DestPromptBanner — рендерится в top-bar когда ?dest && !?from (CO-03)
// - MobileResultsButton — unified entry-point chip (bottom-center): «Припарковаться» →
//   запрос геолокации → «N парковок рядом» → tap открывает sheet. Заменил отдельный WTPMobileFAB
//   круглый FAB на компактный pill chip — single CTA для всего mobile-сценария.
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import type { YMap as YMapInstance } from '@yandex/ymaps3-types';
import { MapErrorBoundary } from '@/app/errors';
import { MapSkeleton } from '@/widgets/map-canvas/ui/MapSkeleton';
import { MapRefContext } from '@/widgets/map-canvas';
import { FiltersFAB, MobileFiltersDrawer } from '@/widgets/filters-bar';
import { MobileZoneCard } from '@/widgets/zone-card';
import { useSelectedZone } from '@/features/select-zone';
import { TimeSelectorChip, MobileTimeSelectorSheet } from '@/widgets/time-selector';
import { MobileSearchBar, DestPromptBanner } from '@/widgets/search-bar';
// MobileResultsSheet opens in the compact map-preview position and remains
// mutually exclusive with MobileZoneCard.
import {
  MobileResultsSheet,
  MobileResultsButton,
  MobileResultsViewportSync,
  RESULTS_SNAP_LOW,
} from '@/widgets/results-panel';
// Phase 4 Plan 04 / ROUTE-04: FitToRouteButton — bottom-right map area, gates сам себя по ?route.
import { FitToRouteButton } from '@/widgets/route-preview-summary';
import { AccountMenu } from '@/widgets/account-menu';

const MapCanvas = lazy(() =>
  import('@/widgets/map-canvas/ui/MapCanvas').then((m) => ({ default: m.MapCanvas })),
);

export function MobileLayout() {
  const mapRef = useRef<YMapInstance | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [timeSheetOpen, setTimeSheetOpen] = useState(false);
  // ResultsSheet открывается по готовности нового поиска или через results chip.
  const [resultsSheetOpen, setResultsSheetOpen] = useState(false);
  const [resultsSnapPoint, setResultsSnapPoint] = useState<number | string | null>(
    RESULTS_SNAP_LOW,
  );
  const { selectedZoneId } = useSelectedZone();
  const openResults = useCallback(() => {
    setResultsSnapPoint(RESULTS_SNAP_LOW);
    setResultsSheetOpen(true);
  }, []);
  // Полноэкранные панели требуют большого отступа, а карточка парковки имеет
  // высоту по контенту: не выталкиваем контролы карты за экран при её открытии.
  useEffect(() => {
    const SHEET_SNAP_VH = 0.92;
    const resultsVisible = resultsSheetOpen && selectedZoneId === null;
    const resultsSnap = typeof resultsSnapPoint === 'number' ? resultsSnapPoint : 0.92;
    const fullSheetOpen = filtersOpen || timeSheetOpen;
    const offset = fullSheetOpen
      ? `calc(${SHEET_SNAP_VH * 100}vh + 20px)`
      : resultsVisible
        ? `calc(${resultsSnap * 100}vh + 20px)`
        : selectedZoneId !== null
          ? 'calc(min(46dvh, 420px) + 20px)'
          : '20px';
    document.documentElement.style.setProperty('--bottom-sheet-offset', offset);
  }, [filtersOpen, timeSheetOpen, resultsSheetOpen, resultsSnapPoint, selectedZoneId]);

  // 2026-05-26: handleManualEntry удалён — кнопка «Указать вручную» из
  // PreFlightDrawer убрана, фокусить инпут больше неоткуда.

  return (
    <MapRefContext.Provider value={mapRef}>
      <div className="relative flex h-dvh w-screen flex-col lg:hidden">
        <div className="relative flex-1 overflow-hidden">
          <MapErrorBoundary>
            <Suspense fallback={<MapSkeleton />}>
              <MapCanvas mapRef={mapRef} />
            </Suspense>
          </MapErrorBoundary>
          {/* Filters справа под аккаунтом; время слева под строкой поиска. */}
          <FiltersFAB onClick={() => setFiltersOpen(true)} />
          <TimeSelectorChip onClick={() => setTimeSheetOpen(true)} />
          {/* Phase 4: top-bar SearchBar (left side, FABs справа не пересекаются — right-20) */}
          <MobileSearchBar />
          {/* Phase 4 / CO-03: DestPromptBanner ниже top-bar (top-14 чтобы под input).
            right-14 — синхронизировано с MobileSearchBar (44px FiltersFAB + gap). */}
          <div className="absolute top-14 right-14 left-2 z-30">
            <DestPromptBanner />
          </div>
          {/* Unified mobile entry-point: bottom-center chip «Припарковаться» / «N парковок рядом».
            Сам ведёт WTP flow (permissions check + pre-flight Drawer). При sheet open — скрывается. */}
          <MobileResultsButton hidden={resultsSheetOpen} onOpenSheet={openResults} />
          {/* Phase 4 Plan 04: FitToRouteButton сам gates рендер по ?route */}
          <FitToRouteButton />
          <AccountMenu placement="mobile" />
        </div>
        <MobileFiltersDrawer open={filtersOpen} onOpenChange={setFiltersOpen} />
        <MobileTimeSelectorSheet open={timeSheetOpen} onOpenChange={setTimeSheetOpen} />
        {/* ResultsSheet mutually exclusive с MobileZoneCard через selectedZoneId logic. */}
        <MobileResultsSheet
          open={resultsSheetOpen}
          onOpenChange={setResultsSheetOpen}
          snapPoint={resultsSnapPoint}
          onSnapPointChange={setResultsSnapPoint}
        />
        {/* Plan 02 mobile vaul + CARD-07 pan */}
        <MobileZoneCard onBackToResults={openResults} />
        <MobileResultsViewportSync
          open={resultsSheetOpen && selectedZoneId === null}
          snapPoint={resultsSnapPoint}
        />
      </div>
    </MapRefContext.Provider>
  );
}
