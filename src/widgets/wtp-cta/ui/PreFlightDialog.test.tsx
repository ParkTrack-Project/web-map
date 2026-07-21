// Phase 4 / WTP-03 / D-10 (TDD).
// - содержит EXACT explainer text per D-10
// - единственная primary-кнопка «Разрешить геолокацию»
//   (Fix 2026-05-26: secondary «Указать вручную» удалён по запросу продукта).
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import type { ReactNode } from 'react';
import { PreFlightDialog } from './PreFlightDialog';

function wrap(children: ReactNode) {
  const qc = new QueryClient();
  return (
    <QueryClientProvider client={qc}>
      <NuqsTestingAdapter>{children}</NuqsTestingAdapter>
    </QueryClientProvider>
  );
}

describe('PreFlightDialog (WTP-03 / D-10)', () => {
  it('содержит EXACT explainer текст', () => {
    render(wrap(<PreFlightDialog open={true} onOpenChange={() => {}} onAllow={() => {}} />));
    expect(
      screen.getByText(
        'Для поиска ближайших парковок нужен доступ к вашей геолокации. Координаты используются только для запроса к серверу и не сохраняются.',
      ),
    ).toBeInTheDocument();
  });

  it('единственная кнопка — «Разрешить геолокацию»', () => {
    render(wrap(<PreFlightDialog open={true} onOpenChange={() => {}} onAllow={() => {}} />));
    expect(screen.getByRole('button', { name: 'Разрешить геолокацию' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Указать вручную' })).toBeNull();
  });
});
