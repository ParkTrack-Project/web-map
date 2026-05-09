// Контракт AuthAdapter: единая точка переключения mock ↔ shared-сессия Миши (Phase 5).
// Тип User фиксирован в плане Plan 02 (RESEARCH §Code Examples §5).
export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface User {
  id: string;
  display_name: string;
  email: string;
}

export interface AuthAdapter {
  useAuth(): { status: AuthStatus; user: User | null };
}
