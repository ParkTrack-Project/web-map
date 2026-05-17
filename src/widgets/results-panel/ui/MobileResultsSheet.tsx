// Phase 4 / RANK-03 / D-19 / CO-02 (B-3 fix):
// Mobile vaul Drawer mutually exclusive with MobileZoneCard.
// Open condition (CO-03 / W-1): ?from set (origin обязателен; ?dest без ?from → prompt в SearchBar).
//
// CO-02 supersedes D-19 snap-points partial: используем SINGLE-SNAP [0.92]
// (как Phase 3 MobileTimeSelectorSheet — verified pattern). Two-snap [0.4, 0.85]
// требует UAT-verification на реальных устройствах + design pass для co-existence
// двух открытых Drawer'ов (focus trap conflict, Pitfall 11). Deferred to Phase 5.
//
// Mutual-exclusion с MobileZoneCard реализуется через `open` precondition
// (`open = !!from && selectedZoneId === null`), а НЕ через snap-cooperation:
// - ?from появляется → MobileResultsSheet open=true, snap=0.92
// - User clicks item → setSelectedZone → selectedZoneId !== null → open=false (close)
// - MobileZoneCard mounts (Phase 2 single-snap логика)
// - User закрывает ZoneCard → selectedZoneId=null → MobileResultsSheet вновь open=true
// Sequential focus, без двух одновременно открытых Drawer'ов.
import { useState } from 'react';
import { Drawer } from 'vaul';
import { X } from 'lucide-react';
import { useFromCoords } from '@/features/request-geolocation';
import { useDestination } from '@/features/address-search';
import { useSelectedZone } from '@/features/select-zone';
import { useFilters, useFilteredCandidates } from '@/features/filter-zones';
import { Spinner } from '@/shared/ui';
import { useIsMobile } from '@/shared/lib/responsive';
import { useVisualViewportHeight } from '@/shared/lib/dom';
import { useRoutingResults } from '../model/useRoutingResults';
import { useAutoSelectBestVariant } from '../model/useAutoSelectBestVariant';
import { ResultsList } from './ResultsList';
import { EmptyResultsState } from './EmptyResultsState';

interface MobileResultsSheetProps {
  // Controlled — Layout owns mobileResultsSheetOpen state.
  // Sheet auto-open removed по UX feedback («открывать только по нажатию»).
  // User тапает MobileResultsButton чтобы открыть; X в header — sheet close + clear search.
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileResultsSheet({ open: openProp, onOpenChange }: MobileResultsSheetProps) {
  // Phase 5 D-03: keyboard-aware. ResultsList не имеет input'ов, но ResultItem'ы
  // с длинным title могут переехать под keyboard если pop'ится из soft-keyboard
  // event (например, user открыл sheet поверх focused MobileSearchBar).
  useVisualViewportHeight();
  const { from, clearFromCoords } = useFromCoords();
  const { dest, clearDestination } = useDestination();
  const { selectedZoneId, closeCard } = useSelectedZone();
  const { activeCount, resetAll } = useFilters();
  const { data, isFetching, isError, refetch } = useRoutingResults();
  const filtered = useFilteredCandidates(data?.candidates);
  useAutoSelectBestVariant(data?.selected_zone_id ?? null);

  // КРИТИЧНО: vaul Drawer.Root рендерит Portal в body и применяет body lock
  // (`pointer-events: none` + `aria-hidden=true`) даже когда `lg:hidden` скрывает
  // Drawer.Content. isMobile-гейт защищает desktop.
  // CO-02 mutual-exclusion: closed когда selectedZoneId !== null (ZoneCard takes focus).
  // openProp от Layout: user должен явно тапнуть «N парковок рядом» (MobileResultsButton).
  const isMobile = useIsMobile();
  const open = isMobile && openProp && !!from && selectedZoneId === null;
  // CO-02: single-snap [0.92] — массив с одним элементом per vaul API.
  const [snap, setSnap] = useState<number | string | null>(0.92);

  // X в header — clear search + close sheet полностью.
  const handleCloseAndClear = () => {
    clearFromCoords();
    clearDestination();
    closeCard();
    onOpenChange(false);
  };

  // CO-03: panel вообще не монтируется без ?from (даже если ?dest есть).
  if (!from) return null;

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(o) => onOpenChange(o)}
      snapPoints={[0.92]}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
      dismissible
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40 lg:hidden" />
        <Drawer.Content
          className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[95dvh] flex-col rounded-t-2xl bg-white outline-none lg:hidden"
          aria-describedby={undefined}
          data-testid="mobile-results-sheet"
          style={{ maxHeight: 'calc(var(--keyboard-aware-height, 100dvh) - 80px)' }}
        >
          <Drawer.Title className="sr-only">Результаты поиска парковок</Drawer.Title>
          <div className="mx-auto my-2 h-1.5 w-12 rounded-full bg-zinc-300" aria-hidden />
          <header className="flex items-center justify-between px-4 py-2">
            <h2 className="text-base font-semibold">
              {dest && from ? 'Маршрут к адресу' : 'Парковки рядом'}
              {data && (
                <span className="ml-2 text-xs font-normal text-zinc-500">
                  ({data.total_candidates})
                </span>
              )}
            </h2>
            <button
              type="button"
              onClick={handleCloseAndClear}
              aria-label="Закрыть результаты"
              className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-zinc-100"
            >
              <X size={18} aria-hidden />
            </button>
          </header>
          {/* min-h-0 нужно для flex-child overflow scroll (overflow-hidden ломал ResultsList scroll).
              ResultsList parent получит data-vaul-no-drag через prop, чтобы vaul не перехватывал touchmove. */}
          <div className="flex min-h-0 flex-1 flex-col">
            {isFetching && !data && <Spinner label="Поиск парковок…" />}
            {isError && (
              <div role="alert" className="m-4 rounded bg-red-50 p-3 text-sm text-red-700">
                Не удалось загрузить результаты.{' '}
                <button onClick={() => refetch()} className="min-h-[44px] underline">
                  Повторить
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
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
