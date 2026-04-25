// Гейт, который блокирует рендер MapPage пока /auth/me не отстрелялся.
// Защита от race-condition (Pitfall #7, FOUND-09): без этого MapPage может стартовать
// с неавторизованным состоянием и сделать лишний BBox-запрос, который вернёт 401.
import type { PropsWithChildren } from 'react';
import { useAuth } from './useAuth';
import { Spinner } from '@/shared/ui';

export function AuthReady({ children }: PropsWithChildren) {
  const { status } = useAuth();
  if (status === 'loading') return <Spinner label="Проверка сессии…" />;
  return <>{children}</>;
}
