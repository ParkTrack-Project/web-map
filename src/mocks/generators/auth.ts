export interface MockAuthUser {
  user_id: number;
  email: string;
  full_name: string | null;
}

export function generateMockAuthUser(overrides: Partial<MockAuthUser> = {}): MockAuthUser {
  return {
    user_id: 1,
    email: 'demo@parktrack.live',
    full_name: 'ParkTrack Demo',
    ...overrides,
  };
}
