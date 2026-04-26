// Phase 4 / D-32..D-36 / ROUTE-06/07:
// Pure URL builders для deeplink menu (Yandex Navigator app, Yandex Maps web, Google Maps).
// - НЕ выполняют side-effects (window.location.href, window.open) — это caller responsibility.
// - НЕ валидируют coords — caller обязан вызвать isValidCoords ПЕРЕД использованием (D-34).
// - Tests pure: input → output, без DOM/network mocks.
//
// Pattern для caller (widgets/deeplink-menu):
//   if (!isValidCoords(from) || !isValidCoords(to)) { toast.error(...); return; }
//   window.location.href = buildYandexNavigatorDeeplink({ from, to });
//   setTimeout(() => { ... if not visibility-hidden, window.open(buildYandexMapsWebUrl(...))}, DEEPLINK_FALLBACK_MS);

export interface DeeplinkArgs {
  from: [number, number]; // [lat, lon] convention (URL-05/06)
  to: [number, number];
}

/** D-33 / ROUTE-07: yandexnavi:// scheme. Параметры lat_to/lon_to/lat_from/lon_from per spec из webmap.mdx §22. */
export function buildYandexNavigatorDeeplink({ from, to }: DeeplinkArgs): string {
  const [latFrom, lonFrom] = from;
  const [latTo, lonTo] = to;
  return `yandexnavi://build_route_on_map?lat_to=${latTo}&lon_to=${lonTo}&lat_from=${latFrom}&lon_from=${lonFrom}`;
}

/** D-33 fallback: web версия Yandex Maps. rtext=lat,lon~lat,lon, rtt=auto (driving). */
export function buildYandexMapsWebUrl({ from, to }: DeeplinkArgs): string {
  const [latFrom, lonFrom] = from;
  const [latTo, lonTo] = to;
  return `https://yandex.ru/maps/?rtext=${latFrom},${lonFrom}~${latTo},${lonTo}&rtt=auto`;
}

/** D-32 menu option 3: Google Maps directions URL — стабильный API. */
export function buildGoogleMapsUrl({ from, to }: DeeplinkArgs): string {
  const [latFrom, lonFrom] = from;
  const [latTo, lonTo] = to;
  return `https://www.google.com/maps/dir/?api=1&origin=${latFrom},${lonFrom}&destination=${latTo},${lonTo}&travelmode=driving`;
}

/** D-34: guard перед сборкой URL — защита от bad-data в URL params (?from / ?dest). */
export function isValidCoords(c: [number, number] | null): c is [number, number] {
  if (!c || c.length !== 2) return false;
  const [lat, lon] = c;
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}
