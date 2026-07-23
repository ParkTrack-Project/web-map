import { useRef } from 'react';
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
import { RESULTS_SNAP_HIGH, RESULTS_SNAP_LOW, resultSnapAfterDrag } from '../model/results-snap';

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
  const pointerStartY = useRef<number | null>(null);
  const dragged = useRef(false);
  // Верхнее положение показывает весь список, нижнее освобождает карту.
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
      <button
        type="button"
        aria-label={numericSnap === RESULTS_SNAP_HIGH ? t('results.collapse') : t('results.expand')}
        aria-expanded={numericSnap === RESULTS_SNAP_HIGH}
        className="flex h-7 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing"
        onClick={() => {
          if (dragged.current) {
            dragged.current = false;
            return;
          }
          onSnapPointChange?.(
            numericSnap === RESULTS_SNAP_HIGH ? RESULTS_SNAP_LOW : RESULTS_SNAP_HIGH,
          );
        }}
        onPointerDown={(event) => {
          pointerStartY.current = event.clientY;
          dragged.current = false;
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (pointerStartY.current === null) return;
          dragged.current = Math.abs(event.clientY - pointerStartY.current) >= 8;
        }}
        onPointerUp={(event) => {
          if (pointerStartY.current === null) return;
          onSnapPointChange?.(
            resultSnapAfterDrag(numericSnap, event.clientY - pointerStartY.current),
          );
          pointerStartY.current = null;
          event.currentTarget.releasePointerCapture(event.pointerId);
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
          onClick={handleCloseAndClear}
          aria-label={t('results.close')}
          className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <X size={18} aria-hidden />
        </button>
      </header>
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
