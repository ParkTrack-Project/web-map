// Phase 4 / SEARCH-01..02 / D-01..D-03:
// Debounced TanStack Query поверх suggestAddresses (shared/lib/yandex).
// - debounce 300ms через use-debounce (Phase 1 dep)
// - min length 2 — enforce'итcя в suggestAddresses + здесь дополнительно (enabled gate)
// - на 429 / 5xx — error прокинут в caller (toast в widget)
// - AbortSignal автоматически от TanStack Query при смене queryKey (cancellation на typing)
// - retry:false — на 429 ждём пользовательского нового ввода (или 60s manual retry в widget)
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useDebounce } from 'use-debounce';
import { suggestAddresses, type SuggestResult } from '@/shared/lib/yandex';
import { ROUTING_SEARCH_DEBOUNCE_MS, SUGGEST_MIN_QUERY_LENGTH } from '@/shared/config';

export interface UseAddressSuggestResult {
  text: string;
  setText: (v: string) => void;
  results: SuggestResult[];
  isFetching: boolean;
  error: unknown;
}

export function useAddressSuggest(): UseAddressSuggestResult {
  const [text, setText] = useState('');
  const [debounced] = useDebounce(text, ROUTING_SEARCH_DEBOUNCE_MS);
  const trimmed = debounced.trim();
  const enabled = trimmed.length >= SUGGEST_MIN_QUERY_LENGTH;
  const query = useQuery({
    queryKey: ['suggest', trimmed] as const,
    queryFn: ({ signal }) => suggestAddresses(trimmed, signal),
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
