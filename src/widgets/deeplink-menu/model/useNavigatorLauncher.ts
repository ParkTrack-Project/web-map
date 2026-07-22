// Phase 4 / ROUTE-06..07 / D-32..D-36 / Pitfall 3:
// Side effects (window.location.href, window.open, visibilitychange listener) — здесь.
// Pure builders в shared/lib/deeplink (Plan 04-01).
//
// D-33 timer-fallback:
// 1. Bind visibilitychange listener once → если app откроется (browser hidden),
//    appOpened=true, fallback не дёргается.
// 2. Set window.location.href = yandexnavi:// → пытаемся deeplink в app.
// 3. После DEEPLINK_FALLBACK_MS (2500): если page всё ещё visible И !appOpened →
//    открываем web fallback (yandex.ru/maps) в новом окне.
//
// D-34 coordinate validation: isValidCoords ПЕРЕД сборкой URL (защита от bad-data).
// Invalid → return false + emit ptk:deeplink-invalid CustomEvent (UI может показать toast).
import {
  buildYandexNavigatorDeeplink,
  buildYandexMapsWebUrl,
  buildGoogleMapsUrl,
  isYandexNavigatorAvailable,
  isValidCoords,
} from '@/shared/lib/deeplink';
import { DEEPLINK_FALLBACK_MS } from '@/shared/config';

export function useNavigatorLauncher() {
  const yandexNavigatorAvailable = isYandexNavigatorAvailable();
  const launchYandexNavigator = (
    from: [number, number] | null,
    to: [number, number] | null,
  ): boolean => {
    if (!yandexNavigatorAvailable) return false;
    if (!isValidCoords(from) || !isValidCoords(to)) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ptk:deeplink-invalid'));
      }
      return false;
    }
    const args = { from, to };
    const start = Date.now();
    let appOpened = false;
    const onHidden = () => {
      appOpened = true;
    };
    document.addEventListener('visibilitychange', onHidden, { once: true });
    window.location.href = buildYandexNavigatorDeeplink(args);
    setTimeout(() => {
      document.removeEventListener('visibilitychange', onHidden);
      if (
        !appOpened &&
        document.visibilityState === 'visible' &&
        Date.now() - start >= DEEPLINK_FALLBACK_MS - 100
      ) {
        window.open(buildYandexMapsWebUrl(args), '_blank', 'noopener,noreferrer');
      }
    }, DEEPLINK_FALLBACK_MS);
    return true;
  };

  const launchYandexMapsWeb = (
    from: [number, number] | null,
    to: [number, number] | null,
  ): boolean => {
    if (!isValidCoords(from) || !isValidCoords(to)) return false;
    window.open(buildYandexMapsWebUrl({ from, to }), '_blank', 'noopener,noreferrer');
    return true;
  };

  const launchGoogleMaps = (
    from: [number, number] | null,
    to: [number, number] | null,
  ): boolean => {
    if (!isValidCoords(from) || !isValidCoords(to)) return false;
    window.open(buildGoogleMapsUrl({ from, to }), '_blank', 'noopener,noreferrer');
    return true;
  };

  return {
    yandexNavigatorAvailable,
    launchYandexNavigator,
    launchYandexMapsWeb,
    launchGoogleMaps,
  };
}
