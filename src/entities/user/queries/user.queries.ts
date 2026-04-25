// React Query hook для UserProfile. Маппит сырой ответ API в доменную модель.
import { useQuery } from '@tanstack/react-query';
import { getUsersMe } from '../api/user.api';
import type { UserProfile } from '../model/user.types';

export function useUserProfile() {
  return useQuery<UserProfile>({
    queryKey: ['users', 'me'],
    queryFn: async () => {
      const raw = await getUsersMe();
      return {
        user: {
          id: String(raw.user.user_id),
          display_name: raw.user.full_name ?? raw.user.email,
          email: raw.user.email,
        },
        partner_memberships: raw.partner_memberships ?? [],
      };
    },
  });
}
