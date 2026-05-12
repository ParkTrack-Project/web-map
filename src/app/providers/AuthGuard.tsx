import { Navigate } from 'react-router';
import type { PropsWithChildren } from 'react';
import { tokenStore } from '@/shared/auth';

const isMockMode =
  import.meta.env.VITE_API_MODE === 'mock' ||
  (import.meta.env.DEV && !import.meta.env.VITE_API_MODE);

export function AuthGuard({ children }: PropsWithChildren) {
  // В mock-режиме auth не нужна — MSW обрабатывает все запросы без токена.
  if (isMockMode) return <>{children}</>;
  if (!tokenStore.get()) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
