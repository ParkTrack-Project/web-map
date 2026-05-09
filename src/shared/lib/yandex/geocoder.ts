// Phase 4 / D-01 (research override) / SEARCH-03 / Pitfall 1:
// Yandex Geocoder HTTP API — резолв координат по uri из Geosuggest result.
// Path к координатам: response.GeoObjectCollection.featureMember[0].GeoObject.Point.pos
// pos format: "lon lat" (lon first per Yandex/GeoJSON convention).
// ВАЖНО: возвращаем [lat, lon] (lat first per CONTEXT D-17 и URL ?from/?dest convention).
import { env } from '@/shared/config';

export class GeocoderError extends Error {
  readonly status: number;
  readonly reason: string;
  constructor(status: number, reason: string) {
    super(`Yandex Geocoder error: status=${status}, reason=${reason}`);
    this.name = 'GeocoderError';
    this.status = status;
    this.reason = reason;
  }
}

/**
 * D-01 / SEARCH-03: резолв координат для выбранного suggestion.uri.
 * Returns [lat, lon] tuple — same convention как parseAsCoords (URL-05/06).
 */
export async function geocodeByUri(uri: string, signal: AbortSignal): Promise<[number, number]> {
  const url = new URL('https://geocode-maps.yandex.ru/1.x/');
  url.searchParams.set('apikey', env.VITE_YMAP_KEY);
  url.searchParams.set('uri', uri);
  url.searchParams.set('format', 'json');
  url.searchParams.set('lang', 'ru_RU');
  const res = await fetch(url.toString(), { signal });
  if (!res.ok) throw new GeocoderError(res.status, `non-2xx: ${res.statusText}`);
  const data = (await res.json()) as {
    response?: {
      GeoObjectCollection?: {
        featureMember?: { GeoObject?: { Point?: { pos?: string } } }[];
      };
    };
  };
  const pos = data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject?.Point?.pos;
  if (!pos) {
    throw new GeocoderError(0, 'GeoObjectCollection.featureMember[0].GeoObject.Point.pos missing');
  }
  const parts = pos.split(' ').map(Number);
  if (parts.length !== 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) {
    throw new GeocoderError(0, `pos malformed: "${pos}"`);
  }
  const [lon, lat] = parts as [number, number];
  return [lat, lon];
}
