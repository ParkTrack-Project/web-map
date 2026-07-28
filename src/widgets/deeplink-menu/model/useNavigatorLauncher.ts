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
