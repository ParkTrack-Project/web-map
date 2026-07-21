// UX-01: лёгкий skeleton, отображается через Suspense, пока MapCanvas-чанк
// и top-level await @/shared/lib/ymaps инициализируются.
import { useI18n } from '@/shared/lib/i18n';

export function MapSkeleton() {
  const { t } = useI18n();
  return (
    <div
      role="status"
      aria-live="polite"
      className="relative h-full w-full animate-pulse bg-neutral-200"
    >
      <div className="absolute inset-0 flex items-center justify-center text-sm text-neutral-500">
        {t('map.loading')}
      </div>
      <span className="sr-only">{t('map.loading')}</span>
    </div>
  );
}
