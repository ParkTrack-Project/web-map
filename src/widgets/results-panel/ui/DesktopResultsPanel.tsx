// Phase 4 / RANK-03 / D-18:
// Desktop left-side panel 400px, full-height overlay над картой.
// CO-03 / W-1: ОТКРЫТА ТОЛЬКО когда ?from set (origin обязателен per D-15 mode dispatch).
// ?dest без ?from → inline prompt в SearchBar (widgets/search-bar/DestPromptBanner).
// НЕ ужимает карту — overlay поверх (пользователь видит и list, и map, и ZoneCard).
import { memo } from 'react';
import { X } from 'lucide-react';
import { useFromCoords } from '@/features/request-geolocation';
import { useDestination } from '@/features/address-search';
import { useSelectedZone } from '@/features/select-zone';
import { useFilters, useFilteredCandidates } from '@/features/filter-zones';
import { Z_INDEX, RESULTS_PANEL_WIDTH_PX } from '@/shared/config';
import { Spinner } from '@/shared/ui';
import { useRoutingResults } from '../model/useRoutingResults';
import { useAutoSelectBestVariant } from '../model/useAutoSelectBestVariant';
import { ResultsList } from './ResultsList';
import { EmptyResultsState } from './EmptyResultsState';
import { useI18n } from '@/shared/lib/i18n';

// Phase 5 D-31 (NFR-03): React.memo — react-virtual handles internal virtualization,
// но wrapper memo предотвращает rerender DesktopResultsPanel при unrelated parent state changes.
function DesktopResultsPanelInner() {
  const { t } = useI18n();
  const { from, clearFromCoords } = useFromCoords();
  const { dest, clearDestination } = useDestination();
  const { closeCard } = useSelectedZone();
  const { activeCount, resetAll } = useFilters();
  const { data, isFetching, isError, refetch } = useRoutingResults();
  const filtered = useFilteredCandidates(data?.candidates);
  // D-21 / WTP-06: auto-select best
  useAutoSelectBestVariant(data?.selected_zone_id ?? null);

  // CO-03 / W-1: open ТОЛЬКО когда ?from set (origin обязателен per D-15 mode dispatch).
  // ?dest без ?from → inline prompt в SearchBar (widgets/search-bar), а не пустая panel.
  if (!from) return null;

  const handleCloseResults = () => {
    clearFromCoords();
    clearDestination();
    closeCard();
  };

  // top-16 bottom-0 оставляет место для top-row (TimeSelector / WTP / Search / Filters
  // в top-4 left-4 z-30) выше — раньше results-panel начиналась с top-0 и её header
  // прятался под top-row кнопками (z-30 поверх z-20).
  return (
    <aside
      className="surface-opaque absolute top-16 bottom-0 left-0 hidden overflow-hidden bg-white shadow-2xl lg:flex lg:flex-col dark:bg-zinc-900"
      style={{ width: RESULTS_PANEL_WIDTH_PX, zIndex: Z_INDEX.resultsPanel }}
      aria-label={t('results.title')}
      data-testid="desktop-results-panel"
    >
      <header className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
        <div>
          <h2 className="text-base font-semibold">
            {dest && from ? t('results.byAddress') : t('results.near')}
          </h2>
          {data && (
            <p className="text-xs text-zinc-500">
              {t('results.total', { count: data.total_candidates })}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleCloseResults}
          aria-label={t('results.close')}
          className="rounded p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <X size={18} aria-hidden />
        </button>
      </header>
      {/* min-h-0 нужно для flex-child overflow-scroll (overflow-hidden ломал ResultsList scroll
          точно так же, как на mobile MobileResultsSheet — единый fix). */}
      <div className="flex min-h-0 flex-1 flex-col">
        {isFetching && !data && <Spinner label={t('results.loading')} />}
        {isError && (
          <div role="alert" className="m-4 rounded bg-red-50 p-3 text-sm text-red-700">
            {t('results.error')}{' '}
            <button onClick={() => refetch()} className="underline">
              {t('common.retry')}
            </button>
          </div>
        )}
        {data && filtered.length === 0 && (
          <EmptyResultsState
            activeFiltersCount={activeCount}
            onResetFilters={resetAll}
            onCloseResults={handleCloseResults}
          />
        )}
        {data && filtered.length > 0 && <ResultsList candidates={filtered} />}
      </div>
    </aside>
  );
}

export const DesktopResultsPanel = memo(DesktopResultsPanelInner);
