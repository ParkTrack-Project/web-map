// Phase 4 / WTP-05 / D-12:
// Inline banner ABOVE search-input при denied/timeout/unavailable state.
// Возвращает null когда state ok или idle (нет fallback нужен).
// НЕ toast — D-12 явно требует inline integration с input для focus-flow.
import type { GeolocationRequestState } from '@/features/request-geolocation';
import { useI18n } from '@/shared/lib/i18n';

interface GeolocationDeniedBannerProps {
  state: GeolocationRequestState;
  className?: string;
}

export function GeolocationDeniedBanner({ state, className = '' }: GeolocationDeniedBannerProps) {
  const { t } = useI18n();
  if (
    !state.error ||
    (state.status !== 'requesting' &&
      state.status !== 'denied' &&
      state.status !== 'timeout' &&
      state.status !== 'unavailable')
  ) {
    return null;
  }
  const message = state.error ?? t('wtp.failed');
  return (
    <div
      role="alert"
      data-testid="geolocation-denied-banner"
      className={`rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900 shadow-md ring-1 ring-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:ring-amber-800 ${className}`}
    >
      {message}
    </div>
  );
}
