// Phase 4 / URL-05 / D-17 (TDD RED):
// Tests for useDestination — initial null, set/clear через nuqs adapter.
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import type { ReactNode } from 'react';
import { useDestination } from './useDestination';

describe('useDestination (URL-05)', () => {
  it('initial dest=null', () => {
    const { result } = renderHook(() => useDestination(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <NuqsTestingAdapter>{children}</NuqsTestingAdapter>
      ),
    });
    expect(result.current.dest).toBeNull();
  });

  it('setDestination → updates URL', async () => {
    let urlSearchParams = '';
    const { result } = renderHook(() => useDestination(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <NuqsTestingAdapter
          onUrlUpdate={(s) => {
            urlSearchParams = s.queryString;
          }}
        >
          {children}
        </NuqsTestingAdapter>
      ),
    });
    await act(async () => {
      await result.current.setDestination([59.95598, 30.30943]);
    });
    // queryString может быть URL-encoded или нет в зависимости от adapter; проверяем любой формат.
    expect(urlSearchParams).toMatch(/dest=59\.95598(%2C|,)30\.30943/);
  });

  it('clearDestination → removes URL param', async () => {
    let urlSearchParams = 'dest=59.95598%2C30.30943';
    const { result } = renderHook(() => useDestination(), {
      wrapper: ({ children }: { children: ReactNode }) => (
        <NuqsTestingAdapter
          searchParams="?dest=59.95598,30.30943"
          onUrlUpdate={(s) => {
            urlSearchParams = s.queryString;
          }}
        >
          {children}
        </NuqsTestingAdapter>
      ),
    });
    await act(async () => {
      await result.current.clearDestination();
    });
    expect(urlSearchParams).not.toContain('dest=');
  });
});
