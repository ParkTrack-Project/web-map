// Singleton QueryClient. Вынесен из QueryProvider.tsx, чтобы не нарушать
// react-refresh/only-export-components (компонент-файлы должны экспортировать
// только компоненты).
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});
