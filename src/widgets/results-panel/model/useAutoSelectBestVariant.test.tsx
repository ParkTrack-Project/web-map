import { describe, it, expect } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { useAutoSelectBestVariant } from './useAutoSelectBestVariant';

function wrap(searchParams: string, onUrlUpdate?: (s: { queryString: string }) => void) {
  return ({ children }: { children: React.ReactNode }) => (
    <NuqsTestingAdapter searchParams={searchParams} {...(onUrlUpdate ? { onUrlUpdate } : {})}>
      {children}
    </NuqsTestingAdapter>
  );
}

describe('useAutoSelectBestVariant (D-21 / WTP-06 + research Q3)', () => {
  it('пишет ?sel когда selected_zone_id заполнен и ?sel===null', async () => {
    let url = '';
    renderHook(() => useAutoSelectBestVariant(42), {
      wrapper: wrap('?from=59.93863,30.31413', (s) => {
        url = s.queryString;
      }),
    });
    // nuqs setQueryState — async, ждём пока useEffect отработает и URL обновится
    await waitFor(() => expect(url).toContain('sel=42'));
  });
  it('НЕ переписывает ?sel когда уже установлен', async () => {
    let url = '';
    let callCount = 0;
    renderHook(() => useAutoSelectBestVariant(42), {
      wrapper: wrap('?from=59.93863,30.31413&sel=99', (s) => {
        url = s.queryString;
        callCount++;
      }),
    });
    // Дать React выполнить useEffect; убедиться что onUrlUpdate НЕ вызывался
    // (раз ?sel уже задан — hook не пишет ничего, callCount остаётся 0).
    await new Promise((r) => setTimeout(r, 50));
    expect(callCount).toBe(0);
    expect(url).not.toContain('sel=42');
  });
  it('noop когда selected_zone_id=null', async () => {
    let url = '';
    let callCount = 0;
    renderHook(() => useAutoSelectBestVariant(null), {
      wrapper: wrap('?from=59.93863,30.31413', (s) => {
        url = s.queryString;
        callCount++;
      }),
    });
    await new Promise((r) => setTimeout(r, 50));
    expect(callCount).toBe(0);
    expect(url).not.toContain('sel=');
  });
});
