// Phase 5 D-08/D-09 (INTEG-01..03, UX-06): Code-ready SharedAuthAdapter.
// Real-smoke против Misha-shell — отдельный post-MVP integration ticket
// (Misha shell не готов на момент Phase 5; см. STATE.md Blockers).
//
// Flow (D-09):
//   1. App startup → AuthReady gate → SharedAuthAdapter.useAuth()
//   2. apiClient.get('/auth/me') с withCredentials=true (client.ts уже выставляет
//      withCredentials когда VITE_AUTH_MODE === 'shared')
//   3. 200 → user в context, status='authenticated'
//   4. 401 → status='unauthenticated' + axios interceptor эмитит CustomEvent
//      'parktrack:unauthorized' → AuthListener (D-10) обработает redirect
//
// Pitfall 4: cookie Domain=.parktrack.live недоступна на localhost — guard ниже
// предупреждает в console чтобы dev'ы не путались с CORS errors.
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';
import { env } from '@/shared/config';
import type { AuthAdapter, AuthStatus, User } from './AuthAdapter';

interface AuthMeResponse {
  user_id: number | string;
  email: string;
  full_name: string | null;
}

async function fetchAuthMeViaCookie(): Promise<User> {
  // withCredentials уже выставлен в client.ts при VITE_AUTH_MODE === 'shared'
  const { data } = await apiClient.get<AuthMeResponse>('/auth/me');
  return {
    id: String(data.user_id),
    display_name: data.full_name ?? data.email,
    email: data.email,
  };
}

const sharedAdapter: AuthAdapter = {
  useAuth() {
    // Pitfall 4 — explicit dev-mode guard.
    // Cookie .parktrack.live cannot be read on localhost; для local dev используй
    // VITE_AUTH_MODE=mock. Real shared-mode работает только на parktrack.live subdomains.
    if (
      typeof window !== 'undefined' &&
      window.location.hostname === 'localhost' &&
      env.VITE_AUTH_MODE === 'shared'
    ) {
      console.warn(
        '[SharedAuthAdapter] localhost detected — cookie .parktrack.live cannot be read. ' +
          'Use VITE_AUTH_MODE=mock for local dev. Real shared-mode works only on parktrack.live subdomains.',
      );
    }

    const query = useQuery<User>({
      queryKey: ['auth', 'me'],
      queryFn: fetchAuthMeViaCookie,
      staleTime: Infinity, // session не invalidates пока 401 не придёт
      gcTime: Infinity,
      retry: false, // 401 — terminal; AuthListener обработает redirect
    });

    let status: AuthStatus;
    if (query.isPending) status = 'loading';
    else if (query.isError) status = 'unauthenticated';
    else status = 'authenticated';

    return { status, user: query.data ?? null };
  },
};

export default sharedAdapter;
