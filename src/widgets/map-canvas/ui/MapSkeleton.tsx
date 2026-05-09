// UX-01: лёгкий skeleton, отображается через Suspense, пока MapCanvas-чанк
// и top-level await @/shared/lib/ymaps инициализируются.
export function MapSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="relative h-full w-full animate-pulse bg-neutral-200"
    >
      <div className="absolute inset-0 flex items-center justify-center text-sm text-neutral-500">
        Загрузка карты…
      </div>
      <span className="sr-only">Загрузка карты</span>
    </div>
  );
}
