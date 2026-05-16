// Phase 4 / SEARCH-03 + Quick-fix 2026-05-16 (п.4):
// Резолв координат через встроенный `ymaps3.search` (JS-API, тот же ключ, что
// грузит карту) вместо HTTP geocode-maps.yandex.ru (отдельный продукт → 403).
// `uri` здесь — искомый текст адреса: suggestAddresses кладёт title в .uri,
// useResolveCoordinates передаёт его сюда. Возвращаем [lat, lon] (URL-05/06).
import { searchGeo } from '@/shared/lib/ymaps';

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
 * SEARCH-03: резолв координат для выбранной подсказки.
 * Returns [lat, lon] tuple — та же конвенция, что parseAsCoords (URL-05/06).
 */
export async function geocodeByUri(uri: string, signal: AbortSignal): Promise<[number, number]> {
  try {
    const hits = await searchGeo(uri);
    if (signal.aborted) throw new GeocoderError(0, 'aborted');
    const first = hits[0];
    if (!first) throw new GeocoderError(0, `no result for "${uri}"`);
    return first.coords;
  } catch (e) {
    if (e instanceof GeocoderError) throw e;
    console.warn('[search] ymaps3.search (resolve) failed:', e);
    throw new GeocoderError(0, e instanceof Error ? e.message : 'resolve failed');
  }
}
