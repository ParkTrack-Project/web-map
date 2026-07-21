import { render, screen } from '@testing-library/react';
import { NuqsTestingAdapter } from 'nuqs/adapters/testing';
import { describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/shared/lib/i18n';
import { MobileFiltersDrawer } from './MobileFiltersDrawer';

describe('MobileFiltersDrawer', () => {
  it('keeps the last filter inside an unsnapped scroll container', () => {
    render(
      <NuqsTestingAdapter>
        <I18nProvider>
          <MobileFiltersDrawer open onOpenChange={vi.fn()} />
        </I18nProvider>
      </NuqsTestingAdapter>,
    );

    const lastFilter = screen.getByRole('checkbox', {
      name: /Скрыть неактивные|Hide inactive/,
    });
    const scrollContainer = lastFilter.closest('[data-vaul-no-drag]');
    const drawer = lastFilter.closest('[data-vaul-drawer]');

    expect(scrollContainer).toHaveClass('overflow-y-auto', 'min-h-0', 'flex-1');
    expect(drawer).toHaveAttribute('data-vaul-snap-points', 'false');
  });
});
