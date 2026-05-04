// Desktop: круглая icon-only кнопка фильтра в top-4 flex row (рядом с TimeSelector / WTP / Search)
// + radix Popover с теми же фильтрами в вертикальной раскладке.
// Заменяет горизонтальный FiltersToolbar (раньше strip над картой) — освобождает ~50px vertical
// space карты, единый pattern с mobile FiltersFAB (icon-only круг + counter badge).
import * as Popover from '@radix-ui/react-popover';
import { Filter } from 'lucide-react';
import { useFiltersHydration, useFilters } from '@/features/filter-zones';
import { ALL_LOCATION_TYPES, type LocationType } from '@/entities/filters';

const LOC_LABEL: Record<LocationType, string> = {
  street: 'Улица',
  yard: 'Двор',
  open_lot: 'Площадка',
  underground: 'Подземная',
  multilevel: 'Многоуровневая',
};

export function DesktopFiltersPopover() {
  useFiltersHydration();
  const f = useFilters();

  const toggleLoc = (t: LocationType) => {
    const has = f.filters.locationType.includes(t);
    f.setLocationType(
      has ? f.filters.locationType.filter((x) => x !== t) : [...f.filters.locationType, t],
    );
  };

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={
            f.activeCount > 0 ? `Открыть фильтры (${f.activeCount} активных)` : 'Открыть фильтры'
          }
          className="relative hidden h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-zinc-200 hover:bg-zinc-50 active:scale-[0.98] lg:inline-flex"
        >
          <Filter size={16} aria-hidden />
          {f.activeCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[11px] font-semibold text-white shadow-sm">
              {f.activeCount}
            </span>
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50 max-h-[80vh] w-[360px] overflow-y-auto rounded-xl border border-zinc-200 bg-white p-5 shadow-md outline-none"
        >
          <h3 className="mb-3 text-base font-semibold">Фильтры парковок</h3>
          <div className="flex flex-col gap-4 text-sm">
            <label className="flex items-center justify-between">
              Только свободные
              <input
                type="checkbox"
                checked={f.filters.hideNoFree}
                onChange={(e) => f.setHideNoFree(e.target.checked)}
                className="h-5 w-5"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span>Уверенность ≥ {Math.round(f.filters.minConf * 100)}%</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={f.filters.minConf}
                onChange={(e) => f.setMinConf(Number(e.target.value))}
                aria-label="Минимальная уверенность данных"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span>
                Цена ≤ {f.filters.maxPay === null ? 'без ограничения' : `${f.filters.maxPay} ₽`}
              </span>
              <input
                type="range"
                min={0}
                max={500}
                step={50}
                value={f.filters.maxPay ?? 500}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  f.setMaxPay(v >= 500 ? null : v);
                }}
                aria-label="Максимальная цена в час"
              />
            </label>
            <label className="flex items-center justify-between">
              Скрыть частные
              <input
                type="checkbox"
                checked={f.filters.hidePrivate}
                onChange={(e) => f.setHidePrivate(e.target.checked)}
                className="h-5 w-5"
              />
            </label>
            <label className="flex items-center justify-between">
              Скрыть для инвалидов
              <input
                type="checkbox"
                checked={f.filters.hideAccessible}
                onChange={(e) => f.setHideAccessible(e.target.checked)}
                className="h-5 w-5"
              />
            </label>
            <fieldset className="flex flex-col gap-2">
              <legend className="font-semibold">Тип расположения</legend>
              {ALL_LOCATION_TYPES.map((t) => (
                <label key={t} className="flex items-center justify-between">
                  {LOC_LABEL[t]}
                  <input
                    type="checkbox"
                    checked={f.filters.locationType.includes(t)}
                    onChange={() => toggleLoc(t)}
                    className="h-5 w-5"
                  />
                </label>
              ))}
              <p className="text-xs text-zinc-500">
                Если ничего не выбрано — показываются все типы
              </p>
            </fieldset>
            <label className="flex items-center justify-between">
              Скрыть неактивные
              <input
                type="checkbox"
                checked={f.filters.hideInactive}
                onChange={(e) => f.setHideInactive(e.target.checked)}
                className="h-5 w-5"
              />
            </label>
            {f.activeCount > 0 && (
              <button
                type="button"
                onClick={f.resetAll}
                className="mt-2 rounded-md bg-zinc-200 px-4 py-2 text-sm hover:bg-zinc-300"
              >
                Сбросить все
              </button>
            )}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
