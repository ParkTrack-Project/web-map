import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { AppRoutes } from '@/app/routes/AppRoutes';

describe('application routing', () => {
  it('shows a not-found page for an unknown path', () => {
    render(
      <MemoryRouter initialEntries={['/missing-page']}>
        <AppRoutes />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: 'Страница не найдена' })).toBeVisible();
    expect(screen.getByRole('link', { name: 'Вернуться к карте' })).toHaveAttribute('href', '/map');
  });
});
