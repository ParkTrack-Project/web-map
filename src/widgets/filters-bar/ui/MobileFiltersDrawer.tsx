// D-06 / D-10: vaul snap [0.95] — full-screen workflow для фильтров.
// На мобильном popover'ы не используются (всё уже на 95% экрана) — slider'ы и
// чек-боксы как form-list. Reset-кнопка внизу. Apply-кнопки нет —
// изменения применяются live (FILTER-08 «без перезагрузки»).
import { Drawer } from 'vaul';
import { useFiltersHydration, useFilters } from '@/features/filter-zones';
import { ALL_LOCATION_TYPES, type LocationType } from '@/entities/filters';
import { useVisualViewportHeight } from '@/shared/lib/dom';
import { useI18n, type MessageKey } from '@/shared/lib/i18n';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MobileFiltersDrawer({ open, onOpenChange }: Props) {
  const { t } = useI18n();
  useFiltersHydration();
  // Phase 5 D-03: side-effect — sets --keyboard-aware-height на :root, чтобы
  // sheet content не уходил под on-screen keyboard на iOS Safari.
  useVisualViewportHeight();
  const f = useFilters();

  const toggleLoc = (t: LocationType) => {
    const has = f.filters.locationType.includes(t);
    f.setLocationType(
      has ? f.filters.locationType.filter((x) => x !== t) : [...f.filters.locationType, t],
    );
  };

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} snapPoints={[0.95]} dismissible>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/40 lg:hidden" />
        <Drawer.Content
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[95dvh] flex-col rounded-t-2xl bg-white outline-none lg:hidden"
          style={{ maxHeight: 'calc(var(--keyboard-aware-height, 100dvh) - 80px)' }}
        >
          <Drawer.Title className="px-5 pt-4 text-lg font-semibold">
            {t('filters.title')}
          </Drawer.Title>
          <div className="mx-auto my-2 h-1.5 w-12 rounded-full bg-zinc-300" aria-hidden />
          <div className="flex flex-col gap-4 overflow-y-auto p-5 [&_input]:accent-emerald-800">
            <label className="flex items-center justify-between">
              {t('filters.onlyFree')}
              <input
                type="checkbox"
                checked={f.filters.hideNoFree}
                onChange={(e) => f.setHideNoFree(e.target.checked)}
                className="h-5 w-5"
              />
            </label>
            <label className="flex flex-col gap-1">
              {t('filters.minFree', { count: f.filters.minFreeCount })}
              <input
                type="number"
                min={0}
                step={1}
                value={f.filters.minFreeCount}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  f.setMinFreeCount(Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0);
                }}
                className="rounded-md border border-zinc-200 px-2 py-1"
              />
            </label>
            <label className="flex flex-col gap-1">
              {t('filters.confidence', { percent: Math.round(f.filters.minConf * 100) })}
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={f.filters.minConf}
                onChange={(e) => f.setMinConf(Number(e.target.value))}
              />
            </label>
            <label className="flex flex-col gap-1">
              {t('filters.price', {
                price: f.filters.maxPay === null ? t('filters.unlimited') : `${f.filters.maxPay} ₽`,
              })}
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
              />
            </label>
            <label className="flex items-center justify-between">
              {t('filters.hidePrivate')}
              <input
                type="checkbox"
                checked={f.filters.hidePrivate}
                onChange={(e) => f.setHidePrivate(e.target.checked)}
                className="h-5 w-5"
              />
            </label>
            <label className="flex items-center justify-between">
              {t('filters.hideAccessible')}
              <input
                type="checkbox"
                checked={f.filters.hideAccessible}
                onChange={(e) => f.setHideAccessible(e.target.checked)}
                className="h-5 w-5"
              />
            </label>
            <fieldset className="flex flex-col gap-2">
              <legend>{t('filters.locationType')}</legend>
              {ALL_LOCATION_TYPES.map((locationType) => (
                <label key={locationType} className="flex items-center justify-between">
                  {t(`location.${locationType}` as MessageKey)}
                  <input
                    type="checkbox"
                    checked={f.filters.locationType.includes(locationType)}
                    onChange={() => toggleLoc(locationType)}
                    className="h-5 w-5"
                  />
                </label>
              ))}
            </fieldset>
            <label className="flex items-center justify-between">
              {t('filters.hideInactive')}
              <input
                type="checkbox"
                checked={f.filters.hideInactive}
                onChange={(e) => f.setHideInactive(e.target.checked)}
                className="h-5 w-5"
              />
            </label>
            <button
              type="button"
              onClick={f.resetAll}
              className="mt-4 rounded-md bg-zinc-200 px-4 py-2 hover:bg-zinc-300"
            >
              {t('filters.reset')}
            </button>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
