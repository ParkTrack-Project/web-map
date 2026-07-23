export interface DeeplinkArgs {
  from: [number, number];
  to: [number, number];
}

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
