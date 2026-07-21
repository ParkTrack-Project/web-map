// Phase 4 / SEARCH-01..02 / D-01..D-03:
// Debounced TanStack Query поверх suggestAddresses (shared/lib/yandex).
// - debounce 300ms через use-debounce (Phase 1 dep)
// - min length 2 — enforce'итcя в suggestAddresses + здесь дополнительно (enabled gate)
// - на 429 / 5xx — error прокинут в caller (toast в widget)
// - AbortSignal автоматически от TanStack Query при смене queryKey (cancellation на typing)
// - retry:false — на 429 ждём пользовательского нового ввода (или 60s manual retry в widget)
//
// Bbox даёт nearby-first выдачу, но suggestAddresses также делает глобальный
// поиск и добавляет дальние уникальные результаты после локальных.
// bbox в queryKey округлён до 1 знака (~11км) — чтобы микропан не инвалидил
// кэш на каждом дрейфе карты, при этом смена района перезагружает подсказки.
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import { useQueryState } from 'nuqs';
import { suggestAddresses, type SuggestResult } from '@/shared/lib/yandex';
import { ROUTING_SEARCH_DEBOUNCE_MS, SUGGEST_MIN_QUERY_LENGTH } from '@/shared/config';
import { parseAsBbox } from '@/shared/lib/url';
import type { Bbox } from '@/shared/lib/geo';

export interface UseAddressSuggestResult {
  text: string;
  setText: (v: string) => void;
  results: SuggestResult[];
  isFetching: boolean;
  error: unknown;
}

// Округляем bbox до ~0.1° (~11 км по широте) для queryKey — viewport bias не
// требует точности, а кэш не должен инвалидироваться на каждом мелком пане.
function coarseBbox(b: Bbox | null): Bbox | null {
  if (!b) return null;
  return b.map((v) => Math.round(v * 10) / 10) as Bbox;
}

export function useAddressSuggest(): UseAddressSuggestResult {
  const [text, setText] = useState('');
  const [bbox] = useQueryState<Bbox>('bbox', parseAsBbox);
  const [debounced] = useDebounce(text, ROUTING_SEARCH_DEBOUNCE_MS);
  const trimmed = debounced.trim();
  const enabled = trimmed.length >= SUGGEST_MIN_QUERY_LENGTH;
  const coarse = coarseBbox(bbox);
  const query = useQuery({
    queryKey: ['suggest', trimmed, coarse] as const,
    queryFn: ({ signal }) => suggestAddresses(trimmed, signal, bbox ?? undefined),
    enabled,
    retry: false,
    staleTime: 60_000,
  });
  return {
    text,
    setText,
    results: enabled ? (query.data ?? []) : [],
    isFetching: query.isFetching,
    error: query.error,
  };
}
