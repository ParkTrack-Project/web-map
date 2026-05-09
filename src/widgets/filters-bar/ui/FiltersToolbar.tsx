// FILTER-01..09 / D-09: Desktop top-toolbar.
// FILTER-01/04/05/07 — простые chip-toggle через FilterChip.
// FILTER-02 (minConf), FILTER-03 (maxPay) — chip + popover-slider через FilterPopoverChip.
// FILTER-06 (locationType) — chip + popover-checkboxes через FilterPopoverChip.
// FILTER-09 — badge-count «Активно: N» (текст в правой части toolbar).
import { useFiltersHydration, useFilters } from '@/features/filter-zones';
import { ALL_LOCATION_TYPES, type LocationType } from '@/entities/filters';
import { FilterChip } from './FilterChip';
import { FilterPopoverChip } from './FilterPopoverChip';

const LOC_LABEL: Record<LocationType, string> = {
  street: 'Улица',
  yard: 'Двор',
  open_lot: 'Площадка',
  underground: 'Подземная',
  multilevel: 'Многоуровн.',
};

export function FiltersToolbar() {
  useFiltersHydration();
  const f = useFilters();

  const toggleLoc = (t: LocationType) => {
    const has = f.filters.locationType.includes(t);
    f.setLocationType(
      has ? f.filters.locationType.filter((x) => x !== t) : [...f.filters.locationType, t],
    );
  };

  return (
    <div
      className="flex items-center gap-2 overflow-x-auto bg-white/95 px-4 py-2 shadow-sm backdrop-blur"
      role="toolbar"
      aria-label="Фильтры парковок"
    >
      {/* FILTER-01: chip-toggle */}
      <FilterChip
        pressed={f.filters.hideNoFree}
        onToggle={() => f.setHideNoFree(!f.filters.hideNoFree)}
      >
        Только свободные
      </FilterChip>

      {/* FILTER-02: chip + popover-slider (D-09) */}
      <FilterPopoverChip
        label={`Уверенность ≥ ${Math.round(f.filters.minConf * 100)}%`}
        active={f.filters.minConf > 0}
        ariaLabel="Минимальная уверенность данных"
      >
        <label className="flex flex-col gap-2 text-sm">
          <span>Минимальная уверенность: {Math.round(f.filters.minConf * 100)}%</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={f.filters.minConf}
            onChange={(e) => f.setMinConf(Number(e.target.value))}
            aria-label="Минимальная уверенность данных"
            className="h-2 w-48"
          />
        </label>
      </FilterPopoverChip>

      {/* FILTER-03: chip + popover-slider (D-09) */}
      <FilterPopoverChip
        label={`Цена ≤ ${f.filters.maxPay === null ? '∞' : `${f.filters.maxPay} ₽`}`}
        active={f.filters.maxPay !== null}
        ariaLabel="Максимальная цена в час"
      >
        <label className="flex flex-col gap-2 text-sm">
          <span>
            Максимальная цена:{' '}
            {f.filters.maxPay === null ? 'без ограничения' : `${f.filters.maxPay} ₽/час`}
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
            className="h-2 w-48"
          />
        </label>
      </FilterPopoverChip>

      {/* FILTER-04, FILTER-05: chip-toggle */}
      <FilterChip
        pressed={f.filters.hidePrivate}
        onToggle={() => f.setHidePrivate(!f.filters.hidePrivate)}
      >
        Без частных
      </FilterChip>
      <FilterChip
        pressed={f.filters.hideAccessible}
        onToggle={() => f.setHideAccessible(!f.filters.hideAccessible)}
      >
        Без для инвалидов
      </FilterChip>

      {/* FILTER-06: chip + popover-checkboxes (D-09) */}
      <FilterPopoverChip
        label={
          f.filters.locationType.length === 0 ? 'Тип: все' : `Тип: ${f.filters.locationType.length}`
        }
        active={f.filters.locationType.length > 0}
        ariaLabel="Тип расположения парковки"
      >
        <fieldset className="flex flex-col gap-2 text-sm">
          <legend className="font-semibold">Тип расположения</legend>
          {ALL_LOCATION_TYPES.map((t) => (
            <label key={t} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={f.filters.locationType.includes(t)}
                onChange={() => toggleLoc(t)}
                className="h-4 w-4"
              />
              {LOC_LABEL[t]}
            </label>
          ))}
          <p className="pt-2 text-xs text-zinc-500">
            Если ничего не выбрано — показываются все типы
          </p>
        </fieldset>
      </FilterPopoverChip>

      {/* FILTER-07: chip-toggle (default ON) */}
      <FilterChip
        pressed={f.filters.hideInactive}
        onToggle={() => f.setHideInactive(!f.filters.hideInactive)}
      >
        Скрыть неактивные
      </FilterChip>

      {/* FILTER-09: badge-count активных */}
      <span className="ml-auto text-sm text-zinc-600">
        {f.activeCount > 0 ? `Активно: ${f.activeCount}` : 'Без фильтров'}
      </span>
      {f.activeCount > 0 && (
        <button
          type="button"
          onClick={f.resetAll}
          className="ml-2 rounded-md bg-zinc-200 px-3 py-1 text-sm hover:bg-zinc-300"
        >
          Сбросить
        </button>
      )}
    </div>
  );
}
