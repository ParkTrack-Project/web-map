import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AppPage } from './AppPage';

describe('AppPage', () => {
  it('offers Android and iOS installation options with their download links', () => {
    render(<AppPage />);

    expect(screen.getByRole('link', { name: /google play/i })).toHaveAttribute(
      'href',
      'https://play.google.com/store/apps/details?id=com.parktrack.mobile',
    );
    expect(screen.getByRole('link', { name: /скачать apk/i })).toHaveAttribute(
      'href',
      'https://github.com/ParkTrack-Project/mobile-app/releases/latest',
    );
    expect(screen.getByRole('link', { name: /открыть pwa/i })).toHaveAttribute(
      'href',
      'https://m.parktrack.live',
    );
  });
});
