// D-10 / FILTER-09 mobile: FAB кнопка «Фильтры [N]» в верхнем-правом углу карты.
// Tap → открывает MobileFiltersDrawer (vaul). aria-label включает activeCount
// для скринридеров.
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
      className="absolute top-4 right-4 z-30 flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-lg lg:hidden"
    >
      <Filter size={16} aria-hidden />
      Фильтры
      {activeCount > 0 && (
        <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs text-white">
          {activeCount}
        </span>
      )}
    </button>
  );
}
