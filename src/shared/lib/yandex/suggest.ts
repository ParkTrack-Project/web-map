import { searchGeo } from '@/shared/lib/ymaps';
import { SUGGEST_MIN_QUERY_LENGTH } from '@/shared/config';

export interface SuggestResult {
  title: { text: string; hl?: { begin: number; end: number }[] };
  subtitle?: { text: string };
  tags?: string[];
  distance?: { text: string; value: number };
  address?: { formatted_address: string };
  uri?: string; // стабильный уникальный key для list-item
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
      uri: `${h.title}|${h.subtitle}|${h.coords[0]}|${h.coords[1]}`,
      coords: h.coords,
    }));
  } catch (e) {
    console.warn('[search] ymaps3.search failed:', e);
    throw new SuggestApiError(0, e instanceof Error ? e.message : 'search failed');
  }
}
