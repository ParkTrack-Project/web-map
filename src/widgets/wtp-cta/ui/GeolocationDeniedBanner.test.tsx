import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GeolocationDeniedBanner } from './GeolocationDeniedBanner';

describe('GeolocationDeniedBanner', () => {
  it('shows the retry warning while CoreLocation is still recovering', () => {
    render(
      <GeolocationDeniedBanner
        state={{
          status: 'requesting',
          position: null,
          error: 'Местоположение пока недоступно. Повторяем запрос…',
        }}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Повторяем запрос');
  });
});
