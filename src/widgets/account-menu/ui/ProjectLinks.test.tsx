import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { usePreferences } from '@/features/preferences';
import { I18nProvider } from '@/shared/lib/i18n';
import { currentMobilePlatform } from '../model/platform';
import { ProjectLinks } from './ProjectLinks';

vi.mock('../model/platform', () => ({ currentMobilePlatform: vi.fn() }));

function renderLinks() {
  return render(
    <I18nProvider>
      <ProjectLinks />
    </I18nProvider>,
  );
}

describe('ProjectLinks', () => {
  beforeEach(() => {
    usePreferences.setState({ theme: 'light', language: 'ru' });
    vi.mocked(currentMobilePlatform).mockReturnValue('other');
    vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  it('renders safe external project links', () => {
    renderLinks();
    const privacy = screen.getByRole('link', { name: /Политика конфиденциальности/ });
    expect(privacy).toHaveAttribute('href', 'https://parktrack.live/privacy');
    expect(privacy).toHaveAttribute('target', '_blank');
    expect(privacy).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('opens a platform choice on desktop', async () => {
    renderLinks();
    await userEvent.click(screen.getByRole('button', { name: 'Мобильное приложение' }));
    expect(screen.getByRole('dialog', { name: 'Выберите приложение' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Google Play' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Веб-приложение (iOS)' })).toBeInTheDocument();
  });

  it.each([
    ['android', 'https://play.google.com/store/apps/details?id=com.parktrack.mobile'],
    ['ios', 'https://m.parktrack.live'],
  ] as const)('opens the direct %s destination', async (platform, expectedUrl) => {
    vi.mocked(currentMobilePlatform).mockReturnValue(platform);
    renderLinks();
    await userEvent.click(screen.getByRole('button', { name: 'Мобильное приложение' }));
    expect(window.open).toHaveBeenCalledWith(expectedUrl, '_blank', 'noopener,noreferrer');
  });
});
