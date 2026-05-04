// Provider для TanStack Query v5.
// Дефолты: staleTime 30s (zones обновляются ≥1 раз в минуту по ML-пайплайну),
// retry=1, refetchOnWindowFocus=false (мобильные tab-switches не должны спамить API).
// Devtools — только в DEV.
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { PropsWithChildren } from 'react';
import { queryClient } from './queryClient';

export function QueryProvider({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  );
}
