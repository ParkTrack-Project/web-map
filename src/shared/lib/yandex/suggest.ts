// Phase 4 / SEARCH-01 + Quick-fix 2026-05-16 (п.4):
// Раньше — прямой HTTP-вызов suggest-maps.yandex.ru (отдельный платный продукт
// Yandex; прод-ключ к нему НЕ подключён → 403/пустой ответ → «поиск ничего не
// находит»). Теперь — через встроенный `ymaps3.search` (JS-API, авторизуется
// тем же ключом, что грузит карту). Он сразу отдаёт координаты, поэтому
// отдельный Geocoder-резолв больше не нужен — coords едут в SuggestResult
// и потребитель (Desktop/MobileSearchBar) использует их напрямую.
//
// Fix 2026-05-26: useResolveCoordinates/geocodeByUri удалены — повторный
// поиск по `sug.uri` (там был только title, без региона из subtitle) уводил
// адрес в чужой город (напр. «Ломоносова 9 СПб» → В. Новгород).
//
// Публичный контракт (SuggestResult / классы ошибок) сохранён.
import { searchGeo } from '@/shared/lib/ymaps';
import { SUGGEST_MIN_QUERY_LENGTH } from '@/shared/config';

export interface SuggestResult {
  title: { text: string; hl?: { begin: number; end: number }[] };
  subtitle?: { text: string };
  tags?: string[];
  distance?: { text: string; value: number };
  address?: { formatted_address: string };
  uri?: string; // стабильный key для list-item (raw title от ymaps3.search)
  coords?: [number, number]; // [lat, lon] — ymaps3.search отдаёт сразу, потребитель использует напрямую
}

export class SuggestApiError extends Error {
  readonly status: number;
  readonly statusText: string;
  constructor(status: number, statusText: string) {
    super(`Yandex Search API ${status}: ${statusText}`);
    this.name = 'SuggestApiError';
    this.status = status;
    this.statusText = statusText;
  }
}

// Сохранён для обратной совместимости barrel-экспорта (HTTP 429 больше не
// возникает — JS-API сам троттлит). Не выбрасывается, но тип остаётся public.
export class SuggestRateLimitedError extends Error {
  constructor() {
    super('Yandex Search API rate-limited');
    this.name = 'SuggestRateLimitedError';
  }
}

/**
 * SEARCH-01: подсказки адресов. debounce 300ms — на стороне caller'а
 * (use-debounce в feature/address-search). min length 2 — Pitfall 5.
 * Ошибку НЕ глотаем: пробрасываем SuggestApiError → SuggestionsList покажет
 * «Яндекс Search недоступен», в консоль уходит реальная причина (диагностика).
 */
export async function suggestAddresses(
  text: string,
  signal: AbortSignal,
  bbox?: [number, number, number, number],
): Promise<SuggestResult[]> {
  if (text.trim().length < SUGGEST_MIN_QUERY_LENGTH) return [];
  try {
    // bbox = [west, south, east, north] (наш канонический формат) → bounds
    // [[swLon, swLat], [neLon, neLat]] для ymaps3.search. Передаём viewport
    // как bias: улицы рядом с тем, что юзер видит на карте, идут первыми.
    const bounds: [[number, number], [number, number]] | undefined = bbox
      ? [
          [bbox[0], bbox[1]],
          [bbox[2], bbox[3]],
        ]
      : undefined;
    const nearbyHits = bounds ? await searchGeo(text, bounds) : [];
    const globalHits = await searchGeo(text);
    if (signal.aborted) return [];
    const seen = new Set<string>();
    const hits = [...nearbyHits, ...globalHits].filter((hit) => {
      const key = `${hit.title}|${hit.coords[0]}|${hit.coords[1]}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
    return hits.map((h) => ({
      title: { text: h.title },
      ...(h.subtitle ? { subtitle: { text: h.subtitle } } : {}),
      uri: h.title, // только как list-key; для центрирования карты потребитель берёт coords
      coords: h.coords,
    }));
  } catch (e) {
    console.warn('[search] ymaps3.search failed:', e);
    throw new SuggestApiError(0, e instanceof Error ? e.message : 'search failed');
  }
}
