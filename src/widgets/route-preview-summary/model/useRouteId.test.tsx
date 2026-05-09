// Phase 4 / D-28: useRouteId URL state hook tests.
// RED → GREEN: writes/reads ?route=<int>; rejects invalid; clearRouteId removes param.
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import type { ReactNode } from 'react';
import { useRouteId } from './useRouteId';

function wrap(searchParams: string, onUrlUpdate?: (s: { queryString: string }) => void) {
  return ({ children }: { children: ReactNode }) => (
    <NuqsTestingAdapter searchParams={searchParams} {...(onUrlUpdate ? { onUrlUpdate } : {})}>
      {children}
    </NuqsTestingAdapter>
  );
}

describe('useRouteId (D-28)', () => {
  it('reads ?route=7001', () => {
    const { result } = renderHook(() => useRouteId(), { wrapper: wrap('?route=7001') });
    expect(result.current.routeId).toBe(7001);
  });

  it('rejects invalid ?route=abc → null', () => {
    const { result } = renderHook(() => useRouteId(), { wrapper: wrap('?route=abc') });
    expect(result.current.routeId).toBeNull();
  });

  it('setRouteId писать в URL', async () => {
    let url = '';
    const { result } = renderHook(() => useRouteId(), {
      wrapper: wrap('', (s) => {
        url = s.queryString;
      }),
    });
    await act(async () => {
      await result.current.setRouteId(7001);
    });
    expect(url).toContain('route=7001');
  });

  it('clearRouteId удаляет', async () => {
    let url = '';
    const { result } = renderHook(() => useRouteId(), {
      wrapper: wrap('?route=7001', (s) => {
        url = s.queryString;
      }),
    });
    await act(async () => {
      await result.current.clearRouteId();
    });
    expect(url).not.toContain('route=');
  });
});
