import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MapPage } from './MapPage';

const viewport = vi.hoisted(() => ({ isMobile: false }));

vi.mock('@/shared/lib/responsive', () => ({
  useIsMobile: () => viewport.isMobile,
}));

vi.mock('./ui/DesktopLayout', () => ({
  DesktopLayout: () => <div data-testid="desktop-map" />,
}));

vi.mock('./ui/MobileLayout', () => ({
  MobileLayout: () => <div data-testid="mobile-map" />,
}));

vi.mock('@/widgets/results-panel', () => ({
  ResultsMapSync: () => null,
}));

vi.mock('@/widgets/time-selector', () => ({
  TimeModeLiveRegion: () => null,
}));

describe('MapPage', () => {
  beforeEach(() => {
    viewport.isMobile = false;
  });

  it('mounts only the desktop map on a desktop viewport', () => {
    render(<MapPage />);

    expect(screen.getByTestId('desktop-map')).toBeInTheDocument();
    expect(screen.queryByTestId('mobile-map')).not.toBeInTheDocument();
  });

  it('mounts only the mobile map on a mobile viewport', () => {
    viewport.isMobile = true;
    render(<MapPage />);

    expect(screen.getByTestId('mobile-map')).toBeInTheDocument();
    expect(screen.queryByTestId('desktop-map')).not.toBeInTheDocument();
  });
});
