// Профиль пользователя из GET /users/me (раздел 2.4 docs api/users.mdx).
// User совпадает по форме с типом из shared/auth/AuthAdapter (id/display_name/email),
// но UserProfile добавляет поля, специфичные для будущего личного кабинета.
import type { User } from '@/shared/auth';

export type { User };

export interface PartnerMembership {
  partner_id: number;
  role: string;
  is_active: boolean;
  read_scope: string;
  write_scope: string;
  delete_scope: string;
}

export interface UserProfile {
  user: User;
  partner_memberships: PartnerMembership[];
}
