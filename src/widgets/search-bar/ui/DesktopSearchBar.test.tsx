// Phase 4 / SEARCH-01..03 / D-04 (TDD).
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import type { ReactNode } from 'react';
import { DesktopSearchBar } from './DesktopSearchBar';

function wrap(children: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return (
    <QueryClientProvider client={qc}>
      <NuqsTestingAdapter>{children}</NuqsTestingAdapter>
    </QueryClientProvider>
  );
}

describe('DesktopSearchBar (SEARCH-01..03 / D-04)', () => {
  it('renders input с aria-label «Поиск адреса»', () => {
    render(wrap(<DesktopSearchBar />));
    expect(screen.getByRole('searchbox', { name: 'Поиск адреса' })).toBeInTheDocument();
  });
  it('input имеет placeholder', () => {
    render(wrap(<DesktopSearchBar />));
    expect(screen.getByPlaceholderText(/Поиск адреса/i)).toBeInTheDocument();
  });
});
