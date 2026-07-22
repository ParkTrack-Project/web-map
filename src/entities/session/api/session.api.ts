import { apiClient } from '@/shared/api';
import type { SessionUser } from '@/shared/lib/session';

interface RawUser {
  id?: string | number;
  user_id?: string | number;
  email: string;
  full_name?: string | null;
}

interface AuthResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: RawUser;
}

function normalizeUser(raw: RawUser): SessionUser {
  return {
    id: String(raw.id ?? raw.user_id ?? raw.email),
    email: raw.email,
    full_name: raw.full_name ?? null,
  };
}

export async function loginRequest(body: { login: string; password: string }) {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', body);
  return { accessToken: data.access_token, user: normalizeUser(data.user) };
}

export async function registerRequest(body: {
  email: string;
  password: string;
  full_name?: string;
}) {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', body);
  return { accessToken: data.access_token, user: normalizeUser(data.user) };
}

export async function requestPasswordResetRequest(email: string): Promise<void> {
  await apiClient.post('/auth/password-reset/request', { email });
}

export async function currentUserRequest(): Promise<SessionUser> {
  const { data } = await apiClient.get<RawUser | { user: RawUser }>('/auth/me');
  return normalizeUser('user' in data ? data.user : data);
}

export async function updateUserRequest(full_name: string): Promise<SessionUser> {
  const { data } = await apiClient.put<RawUser | { user: RawUser }>('/users/me', {
    full_name,
  });
  return normalizeUser('user' in data ? data.user : data);
}

export async function logoutRequest(): Promise<void> {
  await apiClient.post('/auth/logout');
}
