import { searchGeo } from '@/shared/lib/ymaps';

type LngLat = [number, number];

/** Resolves a parking centroid through the already loaded Yandex Maps Search API. */
export async function lookupAddressAt(
  [longitude, latitude]: LngLat,
  signal?: AbortSignal,
): Promise<string | null> {
  if (!Number.isFinite(longitude) || !Number.isFinite(latitude)) return null;
  if (signal?.aborted) return null;
  const delta = 0.002;
  const hits = await searchGeo(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`, [
    [longitude - delta, latitude - delta],
    [longitude + delta, latitude + delta],
  ]);
  if (signal?.aborted) return null;
  const hit = hits[0];
  if (!hit) return null;

  const title = hit.title.trim();
  const subtitle = hit.subtitle.trim();
  if (!title) return subtitle || null;
  if (!subtitle || subtitle.toLocaleLowerCase().includes(title.toLocaleLowerCase())) return title;
  return `${title}, ${subtitle}`;
}
