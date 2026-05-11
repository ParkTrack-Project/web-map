// Композиция всех корневых провайдеров. Порядок важен:
//   RootErrorBoundary  — внешний, ловит всё ниже
//   NuqsAdapter        — для useQueryState (URL-state в map viewport)
//   QueryProvider      — для useQuery
//   <Toaster/>         — Sonner mounted с zIndex 100 (выше vaul Drawer overlay z-50).
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';
import { Toaster } from 'sonner';
import type { PropsWithChildren } from 'react';
import { QueryProvider } from './QueryProvider';
import { OfflineBanner } from './OfflineBanner';
import { RootErrorBoundary } from '@/app/errors';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <RootErrorBoundary>
      <NuqsAdapter>
        <QueryProvider>
          <Toaster
            position="bottom-right"
            richColors
            closeButton
            toastOptions={{ style: { zIndex: 100 } }}
          />
          <OfflineBanner />
          {children}
        </QueryProvider>
      </NuqsAdapter>
    </RootErrorBoundary>
  );
}
