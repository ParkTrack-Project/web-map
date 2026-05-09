// Phase 4 / D-44 / UX-02:
// Empty state когда total_candidates === 0.
interface EmptyResultsStateProps {
  activeFiltersCount: number;
  onResetFilters: () => void;
  onCloseResults: () => void;
}

export function EmptyResultsState({
  activeFiltersCount,
  onResetFilters,
  onCloseResults,
}: EmptyResultsStateProps) {
  return (
    <div
      role="status"
      data-testid="empty-results-state"
      className="flex flex-col gap-3 p-5 text-sm"
    >
      <p className="text-zinc-700">
        Подходящих парковок не найдено в радиусе. Попробуйте сбросить фильтры или расширить область
        поиска.
      </p>
      <div className="flex flex-col gap-2">
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={onResetFilters}
            className="rounded-md border border-emerald-600 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-50"
          >
            Сбросить фильтры
          </button>
        )}
        <button
          type="button"
          onClick={onCloseResults}
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Закрыть результаты
        </button>
      </div>
    </div>
  );
}
