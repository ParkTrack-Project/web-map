// Композиция всех корневых провайдеров. Порядок важен:
//   RootErrorBoundary  — внешний, ловит всё ниже
//   NuqsAdapter        — для useQueryState (URL-state в map viewport)
//   QueryProvider      — для useQuery (включая useAuth внутри)
//   AuthReady          — внутри QueryProvider, чтобы useQuery работал;
//                        снаружи Routes, чтобы MapPage не рендерился до /auth/me (FOUND-09).
import { NuqsAdapter } from 'nuqs/adapters/react-router/v7';
import type { PropsWithChildren } from 'react';
import { QueryProvider } from './QueryProvider';
import { RootErrorBoundary } from '@/app/errors';
import { AuthReady } from '@/shared/auth';

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <RootErrorBoundary>
      <NuqsAdapter>
        <QueryProvider>
          <AuthReady>{children}</AuthReady>
        </QueryProvider>
      </NuqsAdapter>
    </RootErrorBoundary>
  );
}
