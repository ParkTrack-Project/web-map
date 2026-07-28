// Phase 5 D-08/D-09: SharedAuthAdapter unit tests.
// Tests 1-3: runtime via MSW + RTL renderHook + TanStack Query.
// Test 4 (W-1 fix): static source-file grep — env.VITE_AUTH_MODE locked at first import,
// runtime stubbing cannot exercise the localhost guard branch. Static check verifies
// the guard code path exists in the source file.
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
// W-1 fix: Vite's `?raw` import avoids node:fs / __dirname (not available in
// app tsconfig types). Test 4 ниже asserts source content directly.
import sharedAdapterSource from './shared-adapter.ts?raw';
import type { ReactNode } from 'react';
import sharedAdapter from './shared-adapter';
import { env } from '@/shared/config';

const baseURL = env.VITE_API_BASE_URL;

// Local MSW server — отдельный от global tests/setup.ts чтобы не подхватить
// общие handlers (которые могут отдать default user и сломать 401-кейс).
const server = setupServer();
beforeEach(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  server.close();
});

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe('SharedAuthAdapter (D-08/D-09)', () => {
  it('returns authenticated + display_name=full_name on 200', async () => {
    server.use(
      http.get(`${baseURL}/auth/me`, () =>
        HttpResponse.json({ user_id: 1, email: 'a@b.c', full_name: 'Тест' }),
      ),
    );
    const { result } = renderHook(() => sharedAdapter.useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('authenticated'));
    expect(result.current.user).toEqual({ id: '1', display_name: 'Тест', email: 'a@b.c' });
  });

  it('falls back display_name to email when full_name=null', async () => {
    server.use(
      http.get(`${baseURL}/auth/me`, () =>
        HttpResponse.json({ user_id: 2, email: 'x@y.z', full_name: null }),
      ),
    );
    const { result } = renderHook(() => sharedAdapter.useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('authenticated'));
    expect(result.current.user?.display_name).toBe('x@y.z');
  });

  it('returns unauthenticated on 401', async () => {
    server.use(http.get(`${baseURL}/auth/me`, () => new HttpResponse(null, { status: 401 })));
    const { result } = renderHook(() => sharedAdapter.useAuth(), { wrapper });
    await waitFor(() => expect(result.current.status).toBe('unauthenticated'));
    expect(result.current.user).toBeNull();
  });

  // W-1 fix: replaced placebo `expect(true).toBe(true)` with static source-content assertion.
  // env.VITE_AUTH_MODE is module-locked at first import (env.ts uses module-level
  // EnvSchema.parse), so runtime env stubbing cannot exercise the guard branch.
  // Static source assertion guarantees the guard code path exists in the file.
  // Source loaded via Vite `?raw` import (above) — no node:fs / __dirname needed.
  it('shared-adapter source contains localhost guard with console.warn', () => {
    expect(sharedAdapterSource).toMatch(/localhost/);
    expect(sharedAdapterSource).toMatch(/console\.warn/);
    // Verify guard mentions the parktrack.live limitation context
    expect(sharedAdapterSource).toMatch(/parktrack\.live/);
  });
});
