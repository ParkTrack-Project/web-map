// D-21: empty-state «нет парковок в области» (опционально с кнопкой «Сбросить фильтры»).
// D-22: error-state «не удалось загрузить» с retry-abort через queryClient.cancelQueries
// + refetchQueries (UX-04).
//
// Pointer-events: контейнер pointer-events-none (карта остаётся interactive),
// внутренняя плашка pointer-events-auto (кнопки кликабельны).
import { useQueryClient } from '@tanstack/react-query';
import { useFilteredZones } from '@/features/viewport-driven-zones';
import { useFilters } from '@/features/filter-zones';

export function ZoneStateOverlay() {
  const qc = useQueryClient();
  const { data, isError, isPending, isFetching, bbox } = useFilteredZones();
  const { activeCount, resetAll } = useFilters();

  // Первый load — не показываем плашку (Suspense даёт MapSkeleton)
  if (isPending && !data) return null;

  if (isError) {
    return (
      <div
        role="alert"
        className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-black/10"
      >
        <div className="pointer-events-auto rounded-md bg-white p-4 shadow-lg">
          <p className="text-zinc-900">Не удалось загрузить парковки</p>
          <button
            type="button"
            className="mt-2 rounded bg-emerald-600 px-3 py-1 text-white"
            onClick={async () => {
              // UX-04: retry-abort — отменить in-flight + запустить заново.
              await qc.cancelQueries({ queryKey: ['zones'] });
              await qc.refetchQueries({ queryKey: ['zones'] });
            }}
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }

  if (data && data.length === 0 && !isFetching && bbox) {
    return (
      <div
        role="status"
        className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-black/5"
      >
        <div className="pointer-events-auto rounded-md bg-white p-4 text-center shadow-lg">
          {activeCount > 0 ? (
            <>
              <p className="text-zinc-900">В этой области нет парковок, удовлетворяющих фильтрам</p>
              <button
                type="button"
                onClick={resetAll}
                className="mt-2 rounded bg-zinc-200 px-3 py-1 hover:bg-zinc-300"
              >
                Сбросить фильтры
              </button>
            </>
          ) : (
            <p className="text-zinc-900">
              В этой области нет парковок. Сдвиньте карту, чтобы увидеть другие зоны.
            </p>
          )}
        </div>
      </div>
    );
  }
  return null;
}
