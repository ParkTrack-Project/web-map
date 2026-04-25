// Mock-пользователь для /auth/me и /users/me. Форма соответствует
// docs-website/docs/api/auth.mdx §1.7 и users.mdx §2.4.
export interface MockAuthMe {
  user_id: number;
  email: string;
  full_name: string | null;
  global_roles: string[];
  permissions: string[];
  partner_memberships: never[];
}

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

export function generateMockAuthMe(): MockAuthMe {
  return {
    user_id: 1,
    email: 'test@parktrack.live',
    full_name: 'Тестовый пользователь',
    global_roles: ['user'],
    permissions: [
      'users.me.view',
      'users.me.update',
      'map.view',
      'zones.view',
      'occupancy.view',
      'forecasts.view',
      'routing.create',
    ],
    partner_memberships: [],
  };
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
