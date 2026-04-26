// Phase 4 / WTP-01 / WTP-02 (TDD).
// - aria-label корректен
// - На mount — getCurrentPosition НЕ вызывается (WTP-02 enforcement)
// - Click → открывается PreFlightDialog с правильным текстом
import { describe, it, expect, vi } from 'vitest';
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

  it('click → открывает PreFlightDialog с правильным текстом', () => {
    render(wrap(<WTPCTAButton />));
    fireEvent.click(screen.getByRole('button', { name: 'Где припарковаться?' }));
    expect(screen.getByText(/Для поиска ближайших парковок нужен доступ/)).toBeInTheDocument();
  });
});
