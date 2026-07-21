import { create } from 'zustand';
import {
  currentUserRequest,
  loginRequest,
  logoutRequest,
  registerRequest,
  requestPasswordResetRequest,
  updateUserRequest,
} from '../api/session.api';
import { readSession, writeSession, type SessionUser } from '@/shared/lib/session';

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated';
const initial = readSession();

interface SessionState {
  status: SessionStatus;
  user: SessionUser | null;
  bootstrap: () => Promise<void>;
  login: (body: { login: string; password: string }) => Promise<void>;
  register: (body: { email: string; password: string; full_name?: string }) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  updateName: (fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  clear: () => void;
}

function persist(accessToken: string, user: SessionUser) {
  writeSession({ accessToken, user });
}

export const useSession = create<SessionState>((set, get) => ({
  status: initial ? 'loading' : 'unauthenticated',
  user: initial?.user ?? null,
  bootstrap: async () => {
    const session = readSession();
    if (!session) {
      set({ status: 'unauthenticated', user: null });
      return;
    }
    try {
      const user = await currentUserRequest();
      persist(session.accessToken, user);
      set({ status: 'authenticated', user });
    } catch {
      if (readSession()) set({ status: 'authenticated', user: session.user });
      else set({ status: 'unauthenticated', user: null });
    }
  },
  login: async (body) => {
    const session = await loginRequest(body);
    persist(session.accessToken, session.user);
    set({ status: 'authenticated', user: session.user });
  },
  register: async (body) => {
    const session = await registerRequest(body);
    persist(session.accessToken, session.user);
    set({ status: 'authenticated', user: session.user });
  },
  requestPasswordReset: async (email) => {
    await requestPasswordResetRequest(email);
  },
  updateName: async (fullName) => {
    const user = await updateUserRequest(fullName);
    const token = readSession()?.accessToken;
    if (token) persist(token, user);
    set({ user, status: 'authenticated' });
  },
  logout: async () => {
    try {
      await logoutRequest();
    } finally {
      get().clear();
    }
  },
  clear: () => {
    writeSession(null);
    set({ status: 'unauthenticated', user: null });
  },
}));
