// Композиция всех корневых провайдеров. Порядок важен:
//   RootErrorBoundary  — внешний, ловит всё ниже
//   NuqsAdapter        — для useQueryState (URL-state в map viewport)
//   QueryProvider      — для useQuery (включая useAuth внутри)
//   AuthListener       — Phase 5 D-10: listener for 'parktrack:unauthorized'
//                        CustomEvent (mock=invalidate+toast, shared=toast+redirect).
//                        Должен быть INSIDE QueryProvider (нужен queryClient context).
//   <Toaster/>         — Phase 5 D-19: Sonner mounted с zIndex 100 (Pitfall 2 —
//                        выше vaul Drawer overlay z-50). Mount BEFORE children
//                        (Layout components с vaul Drawers) — Pattern 4.
//   AuthReady          — внутри QueryProvider, чтобы useQuery работал;
//                        снаружи Routes, чтобы MapPage не рендерился до /auth/me (FOUND-09).
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';
import { Toaster } from 'sonner';
import type { PropsWithChildren } from 'react';
import { QueryProvider } from './QueryProvider';
import { AuthListener } from './AuthListener';
import { RootErrorBoundary } from '@/app/errors';
import { AuthReady } from '@/shared/auth';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <RootErrorBoundary>
      <NuqsAdapter>
        <QueryProvider>
          <AuthListener>
            {/* D-19 + Pitfall 2: explicit zIndex 100 keeps toasts above vaul Drawer
                overlay (z-50). Mount BEFORE AuthReady so DOM order places Toaster
                portal first; sonner+vaul co-author (Emil Kowalski) confirms compat,
                explicit z-index workaround for extra safety. */}
            <Toaster
              position="bottom-right"
              richColors
              closeButton
              toastOptions={{ style: { zIndex: 100 } }}
            />
            <AuthReady>{children}</AuthReady>
          </AuthListener>
        </QueryProvider>
      </NuqsAdapter>
    </RootErrorBoundary>
  );
}
