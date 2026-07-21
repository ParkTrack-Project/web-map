export const SESSION_STORAGE_KEY = 'parktrack:session:v1';

export interface SessionUser {
  id: string;
  email: string;
  full_name: string | null;
}

export interface StoredSession {
  accessToken: string;
  user: SessionUser;
}

export function readSession(): StoredSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const value = JSON.parse(
      window.localStorage.getItem(SESSION_STORAGE_KEY) ?? 'null',
    ) as StoredSession | null;
    return value?.accessToken && value.user ? value : null;
  } catch {
    return null;
  }
}

export function writeSession(session: StoredSession | null) {
  if (session) window.localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  else window.localStorage.removeItem(SESSION_STORAGE_KEY);
}

export function getAccessToken(): string | null {
  return readSession()?.accessToken ?? null;
}
