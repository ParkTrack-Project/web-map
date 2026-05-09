// Тонкая обёртка над GET /users/me. Возвращает сырой ответ API; маппинг
// в нормализованную модель делает queries/user.queries.ts.
import { apiClient } from '@/shared/api';

export interface UsersMeRawResponse {
  user: {
    user_id: number | string;
    email: string;
    full_name: string | null;
  };
  partner_memberships?: Array<{
    partner_id: number;
    role: string;
    is_active: boolean;
    read_scope: string;
    write_scope: string;
    delete_scope: string;
  }>;
}

export async function getUsersMe(): Promise<UsersMeRawResponse> {
  const { data } = await apiClient.get<UsersMeRawResponse>('/users/me');
  return data;
}
