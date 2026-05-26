// D-21: empty-state «нет парковок в области» (опционально с кнопкой «Сбросить фильтры»).
// D-22: error-state «не удалось загрузить» с retry-abort через queryClient.cancelQueries
// + refetchQueries (UX-04).
//
// Phase 3 D-16 / TIME-09 / UX-03: mode-aware texts + CTA «Вернуться к Сейчас»:
//   - now empty без фильтров: НИЧЕГО не показываем (Fix 2026-05-26 — раньше был
//     «В этой области нет парковок. Сдвиньте карту…», блокировал карту оверлеем
//     и шумел; пустой viewport — нормальное состояние, юзер видит чистую карту).
//   - now empty с фильтрами: «нет парковок, удовлетворяющих фильтрам» + reset
//   - past empty: «Нет данных за это время» + setNow CTA
//   - future empty: «Прогноз на это время недоступен» + setNow CTA
//   - error любой mode: «Не удалось загрузить данные» (I-3: было «парковки»)
//     + retry; mode!=now → +setNow CTA
//   - error instanceof TimeModeUnavailableError → используем error.message (I-6)
//
// I-3 audit: 2026-04-25 grep showed только этот файл содержал «парковки» строку.
// Дополнительные тесты на эту строку отсутствовали → обновляем только этот файл.
//
// Pointer-events: контейнер pointer-events-none (карта остаётся interactive),
// внутренняя плашка pointer-events-auto (кнопки кликабельны).
import { useQueryClient } from '@tanstack/react-query';
import { useFilteredZones } from '@/features/viewport-driven-zones';
import { useFilters } from '@/features/filter-zones';
import { useTimeMode } from '@/features/select-time-mode';
import { TimeModeUnavailableError } from '@/entities/zone';

export function ZoneStateOverlay() {
  const qc = useQueryClient();
  const { data, isError, isPending, isFetching, bbox, error } = useFilteredZones();
  const { activeCount, resetAll } = useFilters();
  const { mode, setNow } = useTimeMode();

  // Первый load — не показываем плашку (Suspense даёт MapSkeleton)
  if (isPending && !data) return null;

  if (isError) {
    // I-6: typed error → используем backend-message; иначе дефолт
    const errorText =
      error instanceof TimeModeUnavailableError
        ? error.message
        : 'Не удалось загрузить данные';
    return (
      <div
        role="alert"
        className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-black/10"
      >
        <div className="pointer-events-auto rounded-md bg-white p-4 shadow-lg">
          <p className="text-zinc-900">{errorText}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded bg-emerald-600 px-3 py-1 text-white"
              onClick={async () => {
                // UX-04: retry-abort — отменить in-flight + запустить заново.
                await qc.cancelQueries({ queryKey: ['zones'] });
                await qc.refetchQueries({ queryKey: ['zones'] });
              }}
            >
              Повторить
            </button>
            {mode.kind !== 'now' && (
              <button
                type="button"
                onClick={setNow}
                className="rounded border border-emerald-600 px-3 py-1 text-emerald-700 hover:bg-emerald-50"
              >
                Вернуться к Сейчас
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (data && data.length === 0 && !isFetching && bbox) {
    // 2026-05-26: убрали generic «нет парковок в области, сдвиньте карту» —
    // пустой viewport больше не блокирует карту полноэкранным оверлеем. Если
    // активны фильтры или mode!=now — показываем релевантный CTA (это
    // объяснимый «почему пусто», без него юзер недоумевает).
    let emptyText: string;
    let extraCta: 'reset-filters' | 'back-to-now' | null = null;
    if (mode.kind === 'now') {
      if (activeCount > 0) {
        emptyText = 'В этой области нет парковок, удовлетворяющих фильтрам';
        extraCta = 'reset-filters';
      } else {
        // mode=now без фильтров: пусто — это нормальное состояние, не сообщаем.
        return null;
      }
    } else if (mode.kind === 'past') {
      emptyText = 'Нет данных за это время';
      extraCta = 'back-to-now';
    } else {
      emptyText = 'Прогноз на это время недоступен';
      extraCta = 'back-to-now';
    }
    return (
      <div
        role="status"
        className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-black/5"
      >
        <div className="pointer-events-auto rounded-md bg-white p-4 text-center shadow-lg">
          <p className="text-zinc-900">{emptyText}</p>
          {extraCta === 'reset-filters' && (
            <button
              type="button"
              onClick={resetAll}
              className="mt-2 rounded bg-zinc-200 px-3 py-1 hover:bg-zinc-300"
            >
              Сбросить фильтры
            </button>
          )}
          {extraCta === 'back-to-now' && (
            <button
              type="button"
              onClick={setNow}
              className="mt-2 rounded border border-emerald-600 px-3 py-1 text-emerald-700 hover:bg-emerald-50"
            >
              Вернуться к Сейчас
            </button>
          )}
        </div>
      </div>
    );
  }
  return null;
}
