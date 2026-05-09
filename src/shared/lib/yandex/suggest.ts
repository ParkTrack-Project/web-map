// Phase 4 / D-01 (research override) / SEARCH-01 / Pitfall 1 + 5:
// Yandex Geosuggest HTTP API wrapper. NPM package @yandex/ymaps3-suggest НЕ существует
// (research §"Yandex Suggest API"); используем direct HTTP API.
// Координаты suggest НЕ возвращает — для резолва вызывать geocodeByUri (geocoder.ts) с suggestion.uri.
import { env, SUGGEST_MIN_QUERY_LENGTH } from '@/shared/config';

export interface SuggestResult {
  title: { text: string; hl?: { begin: number; end: number }[] };
  subtitle?: { text: string };
  tags?: string[];
  distance?: { text: string; value: number };
  address?: { formatted_address: string };
  uri?: string; // CRITICAL: для follow-up Geocoder call
}

interface SuggestApiResponse {
  results: SuggestResult[];
}

export class SuggestApiError extends Error {
  readonly status: number;
  readonly statusText: string;
  constructor(status: number, statusText: string) {
    super(`Yandex Suggest API ${status}: ${statusText}`);
    this.name = 'SuggestApiError';
    this.status = status;
    this.statusText = statusText;
  }
}

export class SuggestRateLimitedError extends Error {
  constructor() {
    super('Yandex Suggest API rate-limited (HTTP 429)');
    this.name = 'SuggestRateLimitedError';
  }
}

/**
 * D-01 / SEARCH-01: HTTP Geosuggest API call с AbortSignal.
 * - debounce 300ms — caller responsibility (use-debounce в feature/address-search)
 * - min length 2 — Pitfall 5 (avoid quota burn на single-letter)
 * - на 429 throw'им specific error для toast/auto-retry в feature layer
 */
export async function suggestAddresses(
  text: string,
  signal: AbortSignal,
): Promise<SuggestResult[]> {
  if (text.trim().length < SUGGEST_MIN_QUERY_LENGTH) return [];
  const url = new URL('https://suggest-maps.yandex.ru/v1/suggest');
  url.searchParams.set('apikey', env.VITE_YMAP_KEY);
  url.searchParams.set('text', text);
  url.searchParams.set('lang', 'ru_RU');
  url.searchParams.set('print_address', '1');
  url.searchParams.set('types', 'geo,biz');
  url.searchParams.set('results', '7');
  const res = await fetch(url.toString(), { signal });
  if (res.status === 429) throw new SuggestRateLimitedError();
  if (!res.ok) throw new SuggestApiError(res.status, res.statusText);
  const data = (await res.json()) as SuggestApiResponse;
  return data.results ?? [];
}
