// Phase 4 / RANK-03 / D-18:
// Desktop left-side panel 400px, full-height overlay над картой.
// CO-03 / W-1: ОТКРЫТА ТОЛЬКО когда ?from set (origin обязателен per D-15 mode dispatch).
// ?dest без ?from → inline prompt в SearchBar (widgets/search-bar/DestPromptBanner).
// НЕ ужимает карту — overlay поверх (пользователь видит и list, и map, и ZoneCard).
import { X } from 'lucide-react';
import { useFromCoords } from '@/features/request-geolocation';
import { useDestination } from '@/features/address-search';
import { useSelectedZone } from '@/features/select-zone';
import { useFilters, useFilteredCandidates } from '@/features/filter-zones';
import { useRoutingSearch } from '@/entities/zone';
import { Z_INDEX, RESULTS_PANEL_WIDTH_PX } from '@/shared/config';
import { Spinner } from '@/shared/ui';
import { useRoutingSearchBody } from '../model/useRoutingSearchBody';
import { useAutoSelectBestVariant } from '../model/useAutoSelectBestVariant';
import { ResultsList } from './ResultsList';
import { EmptyResultsState } from './EmptyResultsState';

export function DesktopResultsPanel() {
  const body = useRoutingSearchBody();
  const { from, clearFromCoords } = useFromCoords();
  const { dest, clearDestination } = useDestination();
  const { closeCard } = useSelectedZone();
  const { activeCount, resetAll } = useFilters();
  const { data, isFetching, isError, refetch } = useRoutingSearch(body);
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

  return (
    <aside
      className="absolute top-0 left-0 hidden h-full overflow-hidden bg-white shadow-2xl lg:flex lg:flex-col"
      style={{ width: RESULTS_PANEL_WIDTH_PX, zIndex: Z_INDEX.resultsPanel }}
      aria-label="Результаты поиска парковок"
      data-testid="desktop-results-panel"
    >
      <header className="flex items-center justify-between border-b border-zinc-100 px-4 py-3">
        <div>
          <h2 className="text-base font-semibold">
            {dest && from ? 'Маршрут к адресу' : 'Парковки рядом'}
          </h2>
          {data && (
            <p className="text-xs text-zinc-500">Всего вариантов: {data.total_candidates}</p>
          )}
        </div>
        <button
          type="button"
          onClick={handleCloseResults}
          aria-label="Закрыть результаты"
          className="rounded p-1 hover:bg-zinc-100"
        >
          <X size={18} aria-hidden />
        </button>
      </header>
      <div className="flex-1 overflow-hidden">
        {isFetching && !data && <Spinner label="Поиск парковок…" />}
        {isError && (
          <div role="alert" className="m-4 rounded bg-red-50 p-3 text-sm text-red-700">
            Не удалось загрузить результаты.{' '}
            <button onClick={() => refetch()} className="underline">
              Повторить
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
