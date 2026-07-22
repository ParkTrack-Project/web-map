import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { apiClient } from '@/shared/api';
import { writeSession } from '@/shared/lib/session';
import { SessionProvider } from '../ui/SessionProvider';
import { useSession } from './session.store';

describe('session lifecycle', () => {
  beforeEach(() => {
    localStorage.clear();
    useSession.setState({ status: 'unauthenticated', user: null });
  });

  it('clears persisted session after a protected request returns 401', async () => {
    writeSession({
      accessToken: 'expired-token',
      user: { id: '1', email: 'a@b.c', full_name: null },
    });
    useSession.setState({ status: 'loading', user: null });
    render(
      <SessionProvider>
        <div />
      </SessionProvider>,
    );
    await apiClient.get('/users/me').catch(() => undefined);
    await waitFor(() => expect(useSession.getState().status).toBe('unauthenticated'));
    expect(localStorage.getItem('parktrack:session:v1')).toBeNull();
  });
});
