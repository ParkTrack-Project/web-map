import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { MobileLayout } from './MobileLayout';

vi.mock('@/app/errors', () => ({
  MapErrorBoundary: ({ children }: { children: ReactNode }) => children,
}));
vi.mock('@/widgets/map-canvas', () => ({
  MapRefContext: {
    Provider: ({ children }: { children: ReactNode }) => children,
  },
}));
vi.mock('@/widgets/map-canvas/ui/MapCanvas', () => ({ MapCanvas: () => null }));
vi.mock('@/widgets/map-canvas/ui/MapSkeleton', () => ({ MapSkeleton: () => null }));
vi.mock('@/widgets/filters-bar', () => ({
  FiltersFAB: () => null,
  MobileFiltersDrawer: () => null,
}));
vi.mock('@/widgets/zone-card', () => ({
  MobileZoneCard: ({ onBackToResults }: { onBackToResults: () => void }) => (
    <button type="button" onClick={onBackToResults}>
      back to results
    </button>
  ),
}));
vi.mock('@/features/select-zone', () => ({
  useSelectedZone: () => ({ selectedZoneId: null }),
}));
vi.mock('@/widgets/time-selector', () => ({
  TimeSelectorChip: () => null,
  MobileTimeSelectorSheet: () => null,
}));
vi.mock('@/widgets/search-bar', () => ({
  MobileSearchBar: () => null,
  DestPromptBanner: () => null,
}));
vi.mock('@/widgets/results-panel', () => ({
  RESULTS_SNAP_LOW: 0.38,
  MobileResultsButton: ({ onOpenSheet }: { onOpenSheet: () => void }) => (
    <button type="button" onClick={onOpenSheet}>
      open results
    </button>
  ),
  MobileResultsSheet: ({
    open,
    snapPoint,
    onSnapPointChange,
  }: {
    open: boolean;
    snapPoint: number;
    onSnapPointChange: (value: number) => void;
  }) => (
    <div data-testid="results-sheet-state" data-open={String(open)} data-snap={String(snapPoint)}>
      <button type="button" onClick={() => onSnapPointChange(0.61)}>
        change height
      </button>
    </div>
  ),
  MobileResultsViewportSync: () => null,
}));
vi.mock('@/widgets/route-preview-summary', () => ({ FitToRouteButton: () => null }));
vi.mock('@/widgets/account-menu', () => ({ AccountMenu: () => null }));

describe('MobileLayout result sheet height', () => {
  it('restores the last height after returning from a result card', () => {
    render(<MobileLayout />);

    fireEvent.click(screen.getByRole('button', { name: 'open results' }));
    fireEvent.click(screen.getByRole('button', { name: 'change height' }));
    fireEvent.click(screen.getByRole('button', { name: 'back to results' }));

    const sheet = screen.getByTestId('results-sheet-state');
    expect(sheet).toHaveAttribute('data-open', 'true');
    expect(sheet).toHaveAttribute('data-snap', '0.61');
  });
});
