// Desktop: круглая icon-only кнопка фильтра в top-4 flex row (рядом с TimeSelector / WTP / Search)
// + radix Popover с теми же фильтрами в вертикальной раскладке.
// Заменяет горизонтальный FiltersToolbar (раньше strip над картой) — освобождает ~50px vertical
// space карты, единый pattern с mobile FiltersFAB (icon-only круг + counter badge).
import * as Popover from '@radix-ui/react-popover';
import { Filter } from 'lucide-react';
import { useFiltersHydration, useFilters } from '@/features/filter-zones';
import { ALL_LOCATION_TYPES, type LocationType } from '@/entities/filters';
import { useI18n, type MessageKey } from '@/shared/lib/i18n';

export function DesktopFiltersPopover() {
  const { t } = useI18n();
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
            f.activeCount > 0
              ? t('filters.openActive', { count: f.activeCount })
              : t('filters.open')
          }
          className="surface-opaque relative hidden h-11 w-11 cursor-pointer items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-800 shadow-lg transition-colors hover:bg-zinc-50 active:scale-[0.98] lg:inline-flex dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
        >
          <Filter size={20} aria-hidden />
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
          className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50 max-h-[80vh] w-[360px] overflow-y-auto rounded-xl border border-zinc-200 bg-white p-5 text-zinc-950 shadow-md outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        >
          <div className="mb-3 flex min-h-10 items-center justify-between gap-3">
            <h3 className="text-base font-semibold">{t('filters.title')}</h3>
            <button
              type="button"
              onClick={f.resetAll}
              disabled={f.activeCount === 0}
              className="min-h-10 cursor-pointer rounded-lg px-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:text-zinc-400 disabled:hover:bg-transparent dark:text-emerald-400 dark:hover:bg-emerald-950/60 dark:disabled:text-zinc-600 dark:disabled:hover:bg-transparent"
            >
              {t('filters.resetShort')}
            </button>
          </div>
          <div className="flex flex-col gap-4 text-sm [&_input]:accent-emerald-600">
            <label className="flex cursor-pointer items-center justify-between">
              {t('filters.onlyFree')}
              <input
                type="checkbox"
                checked={f.filters.hideNoFree}
                onChange={(e) => f.setHideNoFree(e.target.checked)}
                className="h-5 w-5 cursor-pointer"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span>{t('filters.minFree', { count: f.filters.minFreeCount })}</span>
              <input
                type="number"
                min={0}
                step={1}
                value={f.filters.minFreeCount}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  f.setMinFreeCount(Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0);
                }}
                aria-label={t('filters.minFreeAria')}
                className="rounded-md border border-zinc-200 px-2 py-1 dark:border-zinc-700 dark:bg-zinc-800"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span>
                {t('filters.confidence', { percent: Math.round(f.filters.minConf * 100) })}
              </span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={f.filters.minConf}
                onChange={(e) => f.setMinConf(Number(e.target.value))}
                aria-label={t('filters.confidenceAria')}
                className="cursor-grab active:cursor-grabbing"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span>
                {t('filters.price', {
                  price:
                    f.filters.maxPay === null ? t('filters.unlimited') : `${f.filters.maxPay} ₽`,
                })}
              </span>
              <input
                type="range"
                min={0}
                max={500}
                step={10}
                value={f.filters.maxPay ?? 500}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  f.setMaxPay(v >= 500 ? null : v);
                }}
                aria-label={t('filters.priceAria')}
                className="cursor-grab active:cursor-grabbing"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between">
              {t('filters.hidePrivate')}
              <input
                type="checkbox"
                checked={f.filters.hidePrivate}
                onChange={(e) => f.setHidePrivate(e.target.checked)}
                className="h-5 w-5 cursor-pointer"
              />
            </label>
            <label className="flex cursor-pointer items-center justify-between">
              {t('filters.hideAccessible')}
              <input
                type="checkbox"
                checked={f.filters.hideAccessible}
                onChange={(e) => f.setHideAccessible(e.target.checked)}
                className="h-5 w-5 cursor-pointer"
              />
            </label>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-2 font-semibold">{t('filters.locationType')}</legend>
              {ALL_LOCATION_TYPES.map((locationType) => (
                <label
                  key={locationType}
                  className="flex cursor-pointer items-center justify-between"
                >
                  {t(`location.${locationType}` as MessageKey)}
                  <input
                    type="checkbox"
                    checked={f.filters.locationType.includes(locationType)}
                    onChange={() => toggleLoc(locationType)}
                    className="h-5 w-5 cursor-pointer"
                  />
                </label>
              ))}
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {t('filters.allTypesHint')}
              </p>
            </fieldset>
            <label className="flex cursor-pointer items-center justify-between">
              {t('filters.hideInactive')}
              <input
                type="checkbox"
                checked={f.filters.hideInactive}
                onChange={(e) => f.setHideInactive(e.target.checked)}
                className="h-5 w-5 cursor-pointer"
              />
            </label>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
