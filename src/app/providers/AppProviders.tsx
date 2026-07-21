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
import { PreferencesProvider, usePreferences } from '@/features/preferences';
import { I18nProvider } from '@/shared/lib/i18n';
import { SessionProvider } from '@/entities/session';

function AppToaster() {
  const theme = usePreferences((state) => state.theme);
  return (
    <Toaster
      position="bottom-right"
      richColors
      closeButton
      theme={theme}
      toastOptions={{ style: { zIndex: 100 } }}
    />
  );
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <RootErrorBoundary>
      <NuqsAdapter>
        <QueryProvider>
          <PreferencesProvider>
            <I18nProvider>
              <SessionProvider>
                <AppToaster />
                <OfflineBanner />
                {children}
              </SessionProvider>
            </I18nProvider>
          </PreferencesProvider>
        </QueryProvider>
      </NuqsAdapter>
    </RootErrorBoundary>
  );
}
