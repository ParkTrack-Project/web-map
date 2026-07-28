import { useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { X } from 'lucide-react';
import { useFromCoords } from '@/features/request-geolocation';
import { useDestination } from '@/features/address-search';
import { useSelectedZone } from '@/features/select-zone';
import { useFilters, useFilteredCandidates } from '@/features/filter-zones';
import { Spinner } from '@/shared/ui';
import { useIsMobile } from '@/shared/lib/responsive';
import { useVisualViewportHeight } from '@/shared/lib/dom';
import { useRoutingResults } from '../model/useRoutingResults';
import { ResultsList } from './ResultsList';
import { EmptyResultsState } from './EmptyResultsState';
import { useI18n } from '@/shared/lib/i18n';
import { RESULTS_SNAP_HIGH, RESULTS_SNAP_LOW, resultSnapDuringDrag } from '../model/results-snap';
import { notifyResultsSheetResize } from '../model/results-sheet-resize';

interface MobileResultsSheetProps {
  // Controlled — Layout owns mobileResultsSheetOpen state.
  // Готовый новый поиск раскрывает sheet автоматически; X очищает поиск.
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snapPoint: number | string | null;
  onSnapPointChange?: (snapPoint: number | string | null) => void;
}

export function MobileResultsSheet({
  open: openProp,
  onOpenChange,
  snapPoint,
  onSnapPointChange,
}: MobileResultsSheetProps) {
  const { t } = useI18n();
  useVisualViewportHeight();
  const { from, clearFromCoords } = useFromCoords();
  const { dest, clearDestination } = useDestination();
  const { selectedZoneId, closeCard } = useSelectedZone();
  const { activeCount, resetAll } = useFilters();
  const { data, isFetching, isError, refetch } = useRoutingResults();
  const filtered = useFilteredCandidates(data?.candidates);

  const isMobile = useIsMobile();
  const open = isMobile && openProp && !!from && selectedZoneId === null;
  const numericSnap = typeof snapPoint === 'number' ? snapPoint : RESULTS_SNAP_HIGH;
  const sheetRef = useRef<HTMLElement>(null);
  const pointerStartY = useRef<number | null>(null);
  const pointerStartSnap = useRef(numericSnap);
  const pointerViewportHeight = useRef(0);
  const latestDragSnap = useRef(numericSnap);
  const dragged = useRef(false);

  const beginDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if ((event.target as HTMLElement).closest('[data-results-sheet-action]')) return;
    pointerStartY.current = event.clientY;
    pointerStartSnap.current = numericSnap;
    latestDragSnap.current = numericSnap;
    pointerViewportHeight.current = window.visualViewport?.height ?? window.innerHeight;
    dragged.current = false;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const continueDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (pointerStartY.current === null) return;
    const deltaY = event.clientY - pointerStartY.current;
    dragged.current = Math.abs(deltaY) >= 4;
    const nextSnap = resultSnapDuringDrag(
      pointerStartSnap.current,
      deltaY,
      pointerViewportHeight.current,
    );
    latestDragSnap.current = nextSnap;
    if (sheetRef.current) {
      sheetRef.current.style.height = `min(${nextSnap * 100}dvh, calc(var(--keyboard-aware-height, 100dvh) - 80px))`;
    }
    document.documentElement.style.setProperty(
      '--bottom-sheet-offset',
      `calc(${nextSnap * 100}vh + 20px)`,
    );
    notifyResultsSheetResize(false);
  };

  const endDrag = (event: ReactPointerEvent<HTMLElement>) => {
    if (pointerStartY.current === null) return;
    pointerStartY.current = null;
    onSnapPointChange?.(latestDragSnap.current);
    notifyResultsSheetResize(true);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  // X в header — clear search + close sheet полностью.
  const handleCloseAndClear = () => {
    clearFromCoords();
    clearDestination();
    closeCard();
    onOpenChange(false);
  };

  if (!from) return null;
  if (!open) return null;

  return (
    <section
      ref={sheetRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby="mobile-results-title"
      className="surface-opaque fixed inset-x-0 bottom-0 z-50 mx-auto flex flex-col rounded-t-2xl bg-white text-zinc-950 shadow-2xl outline-none lg:hidden dark:bg-zinc-900 dark:text-zinc-50"
      data-testid="mobile-results-sheet"
      style={{
        height: `min(${numericSnap * 100}dvh, calc(var(--keyboard-aware-height, 100dvh) - 80px))`,
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') handleCloseAndClear();
      }}
    >
      <div
        className="shrink-0 cursor-grab touch-none select-none active:cursor-grabbing"
        data-testid="mobile-results-drag-region"
        onPointerDown={beginDrag}
        onPointerMove={continueDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <button
          type="button"
          aria-label={
            numericSnap === RESULTS_SNAP_HIGH ? t('results.collapse') : t('results.expand')
          }
          aria-expanded={numericSnap === RESULTS_SNAP_HIGH}
          className="flex h-7 w-full items-center justify-center"
          onClick={() => {
            if (dragged.current) {
              dragged.current = false;
              return;
            }
            onSnapPointChange?.(
              numericSnap === RESULTS_SNAP_HIGH ? RESULTS_SNAP_LOW : RESULTS_SNAP_HIGH,
            );
          }}
        >
          <span className="h-1.5 w-12 rounded-full bg-zinc-300 dark:bg-zinc-600" aria-hidden />
        </button>
        <header className="flex items-center justify-between px-4 py-2">
          <h2 id="mobile-results-title" className="text-base font-semibold">
            {dest && from ? t('results.byAddress') : t('results.near')}
            {data && (
              <span className="ml-2 text-xs font-normal text-zinc-500">
                ({data.total_candidates})
              </span>
            )}
          </h2>
          <button
            type="button"
            data-results-sheet-action
            onClick={handleCloseAndClear}
            aria-label={t('results.close')}
            className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X size={18} aria-hidden />
          </button>
        </header>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        {isFetching && !data && <Spinner label={t('results.loading')} />}
        {isError && (
          <div role="alert" className="m-4 rounded bg-red-50 p-3 text-sm text-red-700">
            {t('results.error')}{' '}
            <button onClick={() => refetch()} className="min-h-[44px] underline">
              {t('common.retry')}
            </button>
          </div>
        )}
        {data && filtered.length === 0 && (
          <EmptyResultsState
            activeFiltersCount={activeCount}
            onResetFilters={resetAll}
            onCloseResults={handleCloseAndClear}
          />
        )}
        {data && filtered.length > 0 && <ResultsList candidates={filtered} />}
      </div>
    </section>
  );
}
