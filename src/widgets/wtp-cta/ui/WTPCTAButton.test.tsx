// Phase 4 / WTP-01 / WTP-02 (TDD).
// - aria-label корректен
// - На mount — getCurrentPosition НЕ вызывается (WTP-02 enforcement)
// - Click → открывается PreFlightDialog с правильным текстом
//
// Phase 5 D-29 NFR-01: тест fix'нут вместе с TS strict migration. WTPCTA
// handleClick async — сперва await navigator.permissions.query(), затем
// setOpen(true). До Phase 5 sync fireEvent.click + getByText давало race.
// Phase 5: mock permissions.query → 'prompt' (гарантированно открывает dialog),
// findByText (async) ждёт state update.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import type { ReactNode } from 'react';
import { WTPCTAButton } from './WTPCTAButton';

function wrap(children: ReactNode) {
  const qc = new QueryClient();
  return (
    <QueryClientProvider client={qc}>
      <NuqsTestingAdapter>{children}</NuqsTestingAdapter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  // Mock Permissions API → 'prompt' state, иначе isGeolocationAlreadyGranted
  // в happy-dom может вернуть unknown shape и тест получит async race.
  Object.defineProperty(globalThis.navigator, 'permissions', {
    value: {
      query: vi.fn().mockResolvedValue({ state: 'prompt' }),
    },
    configurable: true,
    writable: true,
  });
});

describe('WTPCTAButton (WTP-01 / WTP-02 enforcement)', () => {
  it('renders с aria-label «Где припарковаться?»', () => {
    const getCurrentPositionMock = vi.fn();
    Object.defineProperty(globalThis.navigator, 'geolocation', {
      value: { getCurrentPosition: getCurrentPositionMock },
      configurable: true,
      writable: true,
    });
    render(wrap(<WTPCTAButton />));
    expect(screen.getByRole('button', { name: 'Где припарковаться?' })).toBeInTheDocument();
    expect(getCurrentPositionMock).not.toHaveBeenCalled(); // WTP-02: не на mount
  });

  it('click → открывает PreFlightDialog с правильным текстом', async () => {
    // WTPCTA's handleClick is async — он сперва await isGeolocationAlreadyGranted()
    // (Permissions API check), потом setOpen(true) → PreFlightDialog появляется.
    // Поэтому findByText (async) обязателен; sync getByText fail'ил до Phase 5.
    render(wrap(<WTPCTAButton />));
    fireEvent.click(screen.getByRole('button', { name: 'Где припарковаться?' }));
    expect(
      await screen.findByText(/Для поиска ближайших парковок нужен доступ/),
    ).toBeInTheDocument();
  });
});
