// D-10 / FILTER-09 mobile: компактная круглая FAB-кнопка фильтра в top-bar.
// Размещается справа от MobileSearchBar (top-2 right-2, 44×44) — раньше pill «Фильтры [N]»
// перекрывался поиском (поиск right-20 = 80px не оставлял места для широкой pill).
// Теперь icon-only круг + activeCount badge поверх.
// Tap → открывает MobileFiltersDrawer (vaul). aria-label включает activeCount для скринридеров.
import { Filter } from 'lucide-react';
import { useFilters } from '@/features/filter-zones';

interface Props {
  onClick: () => void;
}

export function FiltersFAB({ onClick }: Props) {
  const { activeCount } = useFilters();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={activeCount > 0 ? `Открыть фильтры (${activeCount} активных)` : 'Открыть фильтры'}
      className="absolute top-2 right-2 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-lg hover:bg-zinc-50 active:scale-[0.98] lg:hidden"
    >
      <Filter size={18} aria-hidden />
      {activeCount > 0 && (
        <span className="absolute -top-1 -right-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[11px] font-semibold text-white shadow-sm">
          {activeCount}
        </span>
      )}
    </button>
  );
}
