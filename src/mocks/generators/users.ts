// Mock-пользователь для /users/me. Форма соответствует docs-website/docs/api/users.mdx §2.4.
export interface MockUserProfile {
  user: {
    user_id: number;
    email: string;
    full_name: string | null;
    phone: string | null;
    global_roles: string[];
    is_active: boolean;
    is_email_verified: boolean;
    created_at: string;
    updated_at: string;
  };
  partner_memberships: never[];
}

export function generateMockUserProfile(): MockUserProfile {
  return {
    user: {
      user_id: 1,
      email: 'test@parktrack.live',
      full_name: 'Тестовый пользователь',
      phone: null,
      global_roles: ['user'],
      is_active: true,
      is_email_verified: true,
      created_at: '2026-04-01T00:00:00Z',
      updated_at: '2026-04-01T00:00:00Z',
    },
    partner_memberships: [],
  };
}
