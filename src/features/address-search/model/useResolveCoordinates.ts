// Phase 4 / SEARCH-03 / Pitfall 1:
// Suggest НЕ возвращает coords inline — резолв через Geocoder по uri.
// useMutation pattern: каждый выбор suggestion = ОДИН call.
import { useMutation } from '@tanstack/react-query';
import { geocodeByUri } from '@/shared/lib/yandex';

export function useResolveCoordinates() {
  const mutation = useMutation({
    mutationFn: ({ uri, signal }: { uri: string; signal?: AbortSignal }) => {
      // signal optional т.к. mutation обычно не-cancelable, но allow для test
      const ctrl = signal ?? new AbortController().signal;
      return geocodeByUri(uri, ctrl);
    },
  });
  return {
    resolve: (uri: string) => mutation.mutateAsync({ uri }),
    isPending: mutation.isPending,
    error: mutation.error,
  };
}
