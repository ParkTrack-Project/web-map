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
// - MobileResultsButton — unified entry-point chip (bottom-center): «Найти парковки рядом» →
//   запрос геолокации → «N парковок рядом» → tap открывает sheet. Заменил отдельный WTPMobileFAB
//   круглый FAB на компактный pill chip — single CTA для всего mobile-сценария.
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import type { YMap as YMapInstance } from '@yandex/ymaps3-types';
import { MapErrorBoundary } from '@/app/errors';
import { MapSkeleton } from '@/widgets/map-canvas/ui/MapSkeleton';
import { MapRefContext } from '@/widgets/map-canvas';
import { FiltersFAB, MobileFiltersDrawer } from '@/widgets/filters-bar';
import { Legend } from '@/widgets/legend';
import { MobileZoneCard } from '@/widgets/zone-card';
import { useSelectedZone } from '@/features/select-zone';
import { TimeSelectorChip, MobileTimeSelectorSheet } from '@/widgets/time-selector';
import { MobileSearchBar, DestPromptBanner } from '@/widgets/search-bar';
// Phase 4 Plan 03: MobileResultsSheet — vaul Drawer single-snap [0.92], mutually exclusive с MobileZoneCard.
// MobileResultsButton — unified chip (Найти/Поиск/N парковок), open sheet only by explicit click.
import { MobileResultsSheet, MobileResultsButton } from '@/widgets/results-panel';
// Phase 4 Plan 04 / ROUTE-04: FitToRouteButton — bottom-right map area, gates сам себя по ?route.
import { FitToRouteButton } from '@/widgets/route-preview-summary';

const MapCanvas = lazy(() =>
  import('@/widgets/map-canvas/ui/MapCanvas').then((m) => ({ default: m.MapCanvas })),
);

export function MobileLayout() {
  const mapRef = useRef<YMapInstance | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [timeSheetOpen, setTimeSheetOpen] = useState(false);
  // ResultsSheet auto-open removed — user открывает через MobileResultsButton chip.
  const [resultsSheetOpen, setResultsSheetOpen] = useState(false);
  const { selectedZoneId } = useSelectedZone();
  // Sync: при selectedZoneId set → закрыть results sheet immediate, чтобы vaul стартовал
  // close-animation. MobileZoneCard ждёт 350ms перед opening — нет conflict двух body lock'ов.
  useEffect(() => {
    if (selectedZoneId !== null && resultsSheetOpen) {
      setResultsSheetOpen(false);
    }
  }, [selectedZoneId, resultsSheetOpen]);

  // Phase 5 D-05 (RESP-07): map controls сдвигаются выше любого открытого
  // bottom-sheet'а. Single-snap [0.92] (CO-02) → 92vh + 20px gap.
  // ZoneCard sheet mutually exclusive с ResultsSheet (Phase 4 CO-02), но
  // отдельно учитываем selectedZoneId — MobileZoneCard монтируется напрямую.
  useEffect(() => {
    const SHEET_SNAP_VH = 0.92;
    const anySheetOpen =
      filtersOpen || timeSheetOpen || resultsSheetOpen || selectedZoneId !== null;
    const offset = anySheetOpen ? `calc(${SHEET_SNAP_VH * 100}vh + 20px)` : '20px';
    document.documentElement.style.setProperty('--bottom-sheet-offset', offset);
  }, [filtersOpen, timeSheetOpen, resultsSheetOpen, selectedZoneId]);

  // D-12 «Указать вручную» → focus search-input.
  const handleManualEntry = () => {
    const input = document.querySelector<HTMLInputElement>('input[role="searchbox"]');
    input?.focus();
  };

  return (
    <MapRefContext.Provider value={mapRef}>
    <div className="relative flex h-dvh w-screen flex-col lg:hidden">
      <div className="relative flex-1 overflow-hidden">
        <MapErrorBoundary>
          <Suspense fallback={<MapSkeleton />}>
            <MapCanvas mapRef={mapRef} />
          </Suspense>
        </MapErrorBoundary>
        {/* I-1: FiltersFAB top-4 right-4 z-30; TimeSelectorChip top-16 right-4 z-30 — стек ПОД FAB */}
        <FiltersFAB onClick={() => setFiltersOpen(true)} />
        <TimeSelectorChip onClick={() => setTimeSheetOpen(true)} />
        <Legend />
        {/* Phase 4: top-bar SearchBar (left side, FABs справа не пересекаются — right-20) */}
        <MobileSearchBar />
        {/* Phase 4 / CO-03: DestPromptBanner ниже top-bar (top-14 чтобы под input).
            right-14 — синхронизировано с MobileSearchBar (44px FiltersFAB + gap). */}
        <div className="absolute top-14 right-14 left-2 z-30">
          <DestPromptBanner />
        </div>
        {/* Unified mobile entry-point: bottom-center chip «Найти парковки рядом» / «N парковок рядом».
            Сам ведёт WTP flow (permissions check + pre-flight Drawer). При sheet open — скрывается. */}
        <MobileResultsButton
          hidden={resultsSheetOpen}
          onOpenSheet={() => setResultsSheetOpen(true)}
          onManualEntry={handleManualEntry}
        />
        {/* Phase 4 Plan 04: FitToRouteButton сам gates рендер по ?route */}
        <FitToRouteButton />
      </div>
      <MobileFiltersDrawer open={filtersOpen} onOpenChange={setFiltersOpen} />
      <MobileTimeSelectorSheet open={timeSheetOpen} onOpenChange={setTimeSheetOpen} />
      {/* Phase 4 Plan 03: ResultsSheet mutually exclusive с MobileZoneCard через selectedZoneId logic (CO-02).
          Open controlled by Layout — user тапает MobileResultsButton chip чтобы открыть. */}
      <MobileResultsSheet open={resultsSheetOpen} onOpenChange={setResultsSheetOpen} />
      {/* Plan 02 mobile vaul + CARD-07 pan */}
      <MobileZoneCard />
    </div>
    </MapRefContext.Provider>
  );
}
