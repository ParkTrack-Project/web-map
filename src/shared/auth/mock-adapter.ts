// Mock AuthAdapter: использует TanStack Query для имитации /auth/me.
// MSW-обработчик добавляет 500ms задержку в DEV — это подсвечивает race-condition
// (Pitfall #7), который ловит <AuthReady/>.
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/api';
import type { AuthAdapter, AuthStatus, User } from './AuthAdapter';

interface AuthMeResponse {
  user_id: number | string;
  email: string;
  full_name: string | null;
}

async function fetchAuthMe(): Promise<User> {
  const { data } = await apiClient.get<AuthMeResponse>('/auth/me');
  return {
    id: String(data.user_id),
    display_name: data.full_name ?? data.email,
    email: data.email,
  };
}

const mockAdapter: AuthAdapter = {
  useAuth() {
    const query = useQuery<User>({
      queryKey: ['auth', 'me'],
      queryFn: fetchAuthMe,
      staleTime: Infinity,
      gcTime: Infinity,
      retry: false,
    });

    let status: AuthStatus;
    if (query.isPending) status = 'loading';
    else if (query.isError) status = 'unauthenticated';
    else status = 'authenticated';

    return { status, user: query.data ?? null };
  },
};

export default mockAdapter;
