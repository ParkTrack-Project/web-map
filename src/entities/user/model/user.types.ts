// Профиль пользователя из GET /users/me (раздел 2.4 docs api/users.mdx).
export interface User {
  id: string;
  display_name: string;
  email: string;
}

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
