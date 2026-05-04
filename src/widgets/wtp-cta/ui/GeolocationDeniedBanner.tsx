// Phase 4 / WTP-05 / D-12:
// Inline banner ABOVE search-input при denied/timeout/unavailable state.
// Возвращает null когда state ok или idle (нет fallback нужен).
// НЕ toast — D-12 явно требует inline integration с input для focus-flow.
import type { GeolocationRequestState } from '@/features/request-geolocation';

interface GeolocationDeniedBannerProps {
  state: GeolocationRequestState;
}

export function GeolocationDeniedBanner({ state }: GeolocationDeniedBannerProps) {
  if (state.status !== 'denied' && state.status !== 'timeout' && state.status !== 'unavailable') {
    return null;
  }
  const message = state.error ?? 'Не удалось определить местоположение';
  return (
    <div
      role="status"
      data-testid="geolocation-denied-banner"
      className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900 ring-1 ring-amber-200"
    >
      {message}
    </div>
  );
}
