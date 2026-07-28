// Phase 5 D-10 (UX-06): listener for axios 401 CustomEvent (emitted by client.ts since Phase 1).
//
// Mock mode → invalidate ['auth', 'me'] query (re-fetch fake user через MSW) + warning toast.
// Shared mode → error toast + redirect to ${VITE_SHARED_SHELL_URL}/login?return=...
//
// Component pattern: side-effect-only — listener mounted once в AppProviders дереве,
// children passed through. Должен быть INSIDE QueryProvider (нужен queryClient context).
import { useEffect, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { env } from '@/shared/config';

interface Props {
  children: ReactNode;
}

export function AuthListener({ children }: Props) {
  const queryClient = useQueryClient();

  useEffect(() => {
    function onUnauth() {
      if (env.VITE_AUTH_MODE === 'mock') {
        // Mock — silently re-fetch fake user через MSW handler
        queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
        toast.warning('Сессия истекла, повторный вход…');
        return;
      }
      // Shared — toast + redirect через 2s (даём пользователю прочитать)
      toast.error('Сессия истекла. Перенаправляю на вход…', { duration: 2000 });
      setTimeout(() => {
        const ret = encodeURIComponent(window.location.href);
        window.location.href = `${env.VITE_SHARED_SHELL_URL}/login?return=${ret}`;
      }, 2000);
    }
    window.addEventListener('parktrack:unauthorized', onUnauth);
    return () => window.removeEventListener('parktrack:unauthorized', onUnauth);
  }, [queryClient]);

  return <>{children}</>;
}
